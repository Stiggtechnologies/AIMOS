-- Migration: Create After-Hours Module for AIMOS
-- Created: 2026-02-12
-- Purpose: Integrate after-hours call handling as native AIMOS module

-- =============================================================================
-- 1. AFTER HOURS CALLS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS after_hours_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Call metadata from Twilio
  twilio_call_sid TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  call_started_at TIMESTAMPTZ NOT NULL,
  call_ended_at TIMESTAMPTZ,
  call_duration_seconds INTEGER,
  call_status TEXT DEFAULT 'initiated',
  
  -- AI transcription & analysis
  recording_url TEXT,
  transcription TEXT,
  ai_summary TEXT,
  ai_extracted_data JSONB, -- Structured data extracted by AI
  
  -- Patient information (extracted from call)
  patient_name TEXT,
  patient_phone TEXT, -- Normalized E.164 format
  patient_email TEXT,
  injury_description TEXT,
  pain_level TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  callback_preferences JSONB, -- { preferred_time, preferred_method, notes }
  
  -- AIMOS integration
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES comm_conversations(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  assigned_to_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Follow-up workflow
  follow_up_scheduled_at TIMESTAMPTZ,
  follow_up_completed_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  outcome TEXT CHECK (outcome IN ('booked', 'not_interested', 'no_answer', 'wrong_number', 'spam')) DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_after_hours_calls_lead ON after_hours_calls(lead_id);
CREATE INDEX idx_after_hours_calls_conversation ON after_hours_calls(conversation_id);
CREATE INDEX idx_after_hours_calls_assigned ON after_hours_calls(assigned_to_user_id);
CREATE INDEX idx_after_hours_calls_created ON after_hours_calls(created_at DESC);
CREATE INDEX idx_after_hours_calls_status ON after_hours_calls(call_status);
CREATE INDEX idx_after_hours_calls_urgency ON after_hours_calls(urgency_level);
CREATE INDEX idx_after_hours_calls_from_number ON after_hours_calls(from_number);
CREATE INDEX idx_after_hours_calls_outcome ON after_hours_calls(outcome) WHERE outcome IS NOT NULL;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE TRIGGER update_after_hours_calls_updated_at
  BEFORE UPDATE ON after_hours_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. ADD "AFTER HOURS CALL" LEAD SOURCE
-- =============================================================================

INSERT INTO crm_lead_sources (slug, name, type, active, created_at)
VALUES (
  'after-hours-call',
  'After Hours Call',
  'organic',
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  active = EXCLUDED.active;

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE after_hours_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all after-hours calls
CREATE POLICY "after_hours_calls_select" ON after_hours_calls
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert after-hours calls (for webhook)
CREATE POLICY "after_hours_calls_insert" ON after_hours_calls
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Users can update calls assigned to them or if they're admin/executive
CREATE POLICY "after_hours_calls_update" ON after_hours_calls
  FOR UPDATE
  USING (
    auth.uid() = assigned_to_user_id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Policy: Only executives and admins can delete
CREATE POLICY "after_hours_calls_delete" ON after_hours_calls
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- =============================================================================
-- 4. HELPER FUNCTIONS
-- =============================================================================

-- Function: Get after-hours calls stats
CREATE OR REPLACE FUNCTION get_after_hours_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
  total_calls INTEGER,
  pending_follow_ups INTEGER,
  completed_follow_ups INTEGER,
  booked_appointments INTEGER,
  avg_response_time_minutes NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_calls,
    COUNT(*) FILTER (WHERE follow_up_scheduled_at IS NOT NULL AND follow_up_completed_at IS NULL)::INTEGER AS pending_follow_ups,
    COUNT(*) FILTER (WHERE follow_up_completed_at IS NOT NULL)::INTEGER AS completed_follow_ups,
    COUNT(*) FILTER (WHERE outcome = 'booked')::INTEGER AS booked_appointments,
    AVG(
      EXTRACT(EPOCH FROM (follow_up_completed_at - call_started_at)) / 60
    ) FILTER (WHERE follow_up_completed_at IS NOT NULL) AS avg_response_time_minutes,
    CASE 
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE outcome = 'booked')::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END AS conversion_rate
  FROM after_hours_calls
  WHERE call_started_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create CRM lead from after-hours call
CREATE OR REPLACE FUNCTION create_lead_from_after_hours_call(call_id UUID)
RETURNS UUID AS $$
DECLARE
  v_call after_hours_calls;
  v_lead_source_id UUID;
  v_lead_id UUID;
  v_priority TEXT;
BEGIN
  -- Get call data
  SELECT * INTO v_call FROM after_hours_calls WHERE id = call_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'After-hours call not found: %', call_id;
  END IF;
  
  -- Skip if lead already exists
  IF v_call.lead_id IS NOT NULL THEN
    RETURN v_call.lead_id;
  END IF;
  
  -- Get after-hours lead source ID
  SELECT id INTO v_lead_source_id
  FROM crm_lead_sources
  WHERE slug = 'after-hours-call'
  LIMIT 1;
  
  -- Determine priority based on urgency
  v_priority := CASE v_call.urgency_level
    WHEN 'emergency' THEN 'critical'
    WHEN 'high' THEN 'high'
    WHEN 'medium' THEN 'medium'
    ELSE 'low'
  END;
  
  -- Create CRM lead
  INSERT INTO crm_leads (
    first_name,
    last_name,
    phone,
    email,
    lead_source_id,
    clinic_id,
    status,
    priority,
    notes,
    external_id
  ) VALUES (
    SPLIT_PART(v_call.patient_name, ' ', 1), -- First name
    COALESCE(SPLIT_PART(v_call.patient_name, ' ', 2), SPLIT_PART(v_call.patient_name, ' ', 1)), -- Last name
    v_call.patient_phone,
    v_call.patient_email,
    v_lead_source_id,
    v_call.clinic_id,
    'new',
    v_priority,
    CONCAT(
      'After-Hours Call: ', v_call.injury_description, E'\n',
      'Pain Level: ', COALESCE(v_call.pain_level, 'Not specified'), E'\n',
      'Urgency: ', v_call.urgency_level, E'\n',
      'Call Time: ', v_call.call_started_at, E'\n',
      COALESCE('AI Summary: ' || v_call.ai_summary, '')
    ),
    v_call.twilio_call_sid
  )
  RETURNING id INTO v_lead_id;
  
  -- Link lead back to call
  UPDATE after_hours_calls
  SET lead_id = v_lead_id, updated_at = NOW()
  WHERE id = call_id;
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. COMMENTS
-- =============================================================================

COMMENT ON TABLE after_hours_calls IS 'After-hours phone calls captured via Twilio, integrated with AIMOS CRM and Communications modules';
COMMENT ON FUNCTION get_after_hours_stats IS 'Calculate after-hours call statistics for reporting dashboards';
COMMENT ON FUNCTION create_lead_from_after_hours_call IS 'Automatically create a CRM lead from an after-hours call record';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  v_lead_source_exists BOOLEAN;
  v_table_exists BOOLEAN;
BEGIN
  -- Check after-hours lead source exists
  SELECT EXISTS(SELECT 1 FROM crm_lead_sources WHERE slug = 'after-hours-call')
  INTO v_lead_source_exists;
  
  -- Check table exists
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'after_hours_calls')
  INTO v_table_exists;
  
  IF v_lead_source_exists AND v_table_exists THEN
    RAISE NOTICE '✅ After-Hours module created successfully';
    RAISE NOTICE '   - after_hours_calls table created';
    RAISE NOTICE '   - Lead source "after-hours-call" added';
    RAISE NOTICE '   - RLS policies enabled';
    RAISE NOTICE '   - Helper functions created';
  ELSE
    RAISE WARNING '⚠️  After-Hours module may not be fully created';
  END IF;
END $$;
