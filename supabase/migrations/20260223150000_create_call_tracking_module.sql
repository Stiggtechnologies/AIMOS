-- Migration: Create Business-Hours Call Tracking Module for AIMOS
-- Created: 2026-02-23
-- Purpose: In-house call tracking (Dynamic Number Insertion + Twilio forwarding) with attribution into CRM

-- =============================================================================
-- 1) ENUM-LIKE CHECK CONSTRAINT DOMAINS
-- =============================================================================

-- NOTE: We use TEXT + CHECK (not Postgres enums) to keep migrations simple.

-- =============================================================================
-- 2) TRACKING NUMBER POOL (TWILIO NUMBERS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS call_tracking_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- E.164 format required (e.g. +17802501234)
  e164 text NOT NULL UNIQUE,
  friendly_name text,
  -- Default attribution for this number (useful when no session context exists)
  default_source_type text CHECK (default_source_type IN (
    'google_ads','meta_ads','bing_ads','organic','referral','direct','other'
  )) NOT NULL DEFAULT 'direct',
  default_source_detail text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_tracking_numbers_active ON call_tracking_numbers(active);
CREATE INDEX IF NOT EXISTS idx_call_tracking_numbers_source ON call_tracking_numbers(default_source_type);

ALTER TABLE call_tracking_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_tracking_numbers_select" ON call_tracking_numbers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "call_tracking_numbers_manage" ON call_tracking_numbers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- =============================================================================
-- 3) WEBSITE SESSION ATTRIBUTION (DNI)
-- =============================================================================

CREATE TABLE IF NOT EXISTS call_tracking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  tracking_number_id uuid REFERENCES call_tracking_numbers(id) ON DELETE SET NULL,
  -- Attribution captured at visit time
  source_type text CHECK (source_type IN (
    'google_ads','meta_ads','bing_ads','organic','referral','direct','other'
  )) NOT NULL,
  source_detail text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  referrer text,
  landing_page_url text,
  last_page_url text,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_tracking_sessions_expires ON call_tracking_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_call_tracking_sessions_number ON call_tracking_sessions(tracking_number_id);
CREATE INDEX IF NOT EXISTS idx_call_tracking_sessions_source ON call_tracking_sessions(source_type);

ALTER TABLE call_tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions are typically written by service_role (Edge Function). Staff can view for analytics.
CREATE POLICY "call_tracking_sessions_select" ON call_tracking_sessions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "call_tracking_sessions_insert" ON call_tracking_sessions
  FOR INSERT
  WITH CHECK (auth.role() IN ('service_role', 'authenticated'));

CREATE POLICY "call_tracking_sessions_update" ON call_tracking_sessions
  FOR UPDATE
  USING (auth.role() IN ('service_role', 'authenticated'))
  WITH CHECK (auth.role() IN ('service_role', 'authenticated'));

-- =============================================================================
-- 4) CALL LOG (TWILIO → CRM)
-- =============================================================================

CREATE TABLE IF NOT EXISTS call_tracking_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Twilio identifiers
  twilio_call_sid text UNIQUE NOT NULL,
  from_number text,
  to_number text NOT NULL,

  -- Link back to web session when we can infer it
  session_id text REFERENCES call_tracking_sessions(session_id) ON DELETE SET NULL,
  tracking_number_id uuid REFERENCES call_tracking_numbers(id) ON DELETE SET NULL,

  -- Denormalized attribution snapshot (immutable for reporting)
  source_type text CHECK (source_type IN (
    'google_ads','meta_ads','bing_ads','organic','referral','direct','other'
  )),
  source_detail text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  referrer text,
  landing_page_url text,

  -- Call lifecycle
  call_started_at timestamptz NOT NULL,
  call_ended_at timestamptz,
  call_duration_seconds integer,
  call_status text CHECK (call_status IN ('initiated','ringing','in_progress','completed','missed','voicemail')) DEFAULT 'initiated',
  recording_url text,

  -- Staff outcome tagging
  outcome text CHECK (outcome IN ('booked','callback','no_answer','not_qualified','price_objection','already_booked','spam')),
  outcome_notes text,
  outcome_tagged_at timestamptz,
  outcome_tagged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- CRM linkage
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_started ON call_tracking_calls(call_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_source ON call_tracking_calls(source_type);
CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_outcome ON call_tracking_calls(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_lead ON call_tracking_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_to_number ON call_tracking_calls(to_number);

ALTER TABLE call_tracking_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_tracking_calls_select" ON call_tracking_calls
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role inserts/updates via webhook; staff can update outcome fields.
CREATE POLICY "call_tracking_calls_insert" ON call_tracking_calls
  FOR INSERT
  WITH CHECK (auth.role() IN ('service_role', 'authenticated'));

CREATE POLICY "call_tracking_calls_update" ON call_tracking_calls
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =============================================================================
-- 5) TIMESTAMP TRIGGERS
-- =============================================================================

-- Reuse update_updated_at_column() from earlier migrations (create if missing)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_call_tracking_numbers_updated_at ON call_tracking_numbers;
CREATE TRIGGER trg_call_tracking_numbers_updated_at
  BEFORE UPDATE ON call_tracking_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_call_tracking_sessions_updated_at ON call_tracking_sessions;
CREATE TRIGGER trg_call_tracking_sessions_updated_at
  BEFORE UPDATE ON call_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_call_tracking_calls_updated_at ON call_tracking_calls;
CREATE TRIGGER trg_call_tracking_calls_updated_at
  BEFORE UPDATE ON call_tracking_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6) LEAD SOURCES (FOR REPORTING)
-- =============================================================================

INSERT INTO crm_lead_sources (slug, name, type, active, created_at)
VALUES
  ('google-ads-call', 'Google Ads Call', 'paid', true, now()),
  ('meta-ads-call', 'Meta Ads Call', 'paid', true, now()),
  ('bing-ads-call', 'Bing Ads Call', 'paid', true, now()),
  ('organic-call', 'Organic Call', 'organic', true, now()),
  ('referral-call', 'Referral Call', 'referral', true, now()),
  ('direct-call', 'Direct Call', 'organic', true, now()),
  ('other-call', 'Other Call', 'organic', true, now())
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    active = EXCLUDED.active;

-- =============================================================================
-- 7) REPORTING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_call_tracking_stats(
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  total_calls integer,
  answered_calls integer,
  missed_calls integer,
  booked_calls integer,
  avg_duration_seconds numeric,
  booking_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::int AS total_calls,
    COUNT(*) FILTER (WHERE call_status IN ('in_progress','completed','voicemail'))::int AS answered_calls,
    COUNT(*) FILTER (WHERE call_status = 'missed')::int AS missed_calls,
    COUNT(*) FILTER (WHERE outcome = 'booked')::int AS booked_calls,
    AVG(call_duration_seconds)::numeric AS avg_duration_seconds,
    CASE WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE outcome = 'booked')::numeric / COUNT(*)::numeric) * 100
      ELSE 0
    END AS booking_rate
  FROM call_tracking_calls
  WHERE call_started_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE call_tracking_numbers IS 'Twilio tracking numbers used for dynamic number insertion and source attribution';
COMMENT ON TABLE call_tracking_sessions IS 'Website visit attribution sessions mapped to a tracking number (DNI)';
COMMENT ON TABLE call_tracking_calls IS 'Inbound calls to tracking numbers with attribution snapshot + CRM linkage';
COMMENT ON FUNCTION get_call_tracking_stats IS 'Aggregate call tracking stats for dashboards';
