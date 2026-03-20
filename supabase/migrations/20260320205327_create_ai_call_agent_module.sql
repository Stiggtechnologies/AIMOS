/*
  # AI Call Agent + Booking Integration Module

  ## Summary
  Creates the full data model for a 24/7 AI-powered inbound call agent
  integrated with AIM OS booking and growth engine workflows.

  ## New Tables

  ### call_sessions
  - Stores every AI call session with full metadata
  - Captures transcript, summary, intent, routing result, escalation
  - Links to crm_leads, appointments, clinics, user_profiles

  ### ai_appointments
  - Comprehensive appointment table for AI-booked and manually-booked appointments
  - Service-specific types (physio, orthotics, assessment, follow-up)
  - Multi-source booking tracking
  - Links to practitioners, clinic_locations, crm_leads, patients

  ### ai_clinic_locations
  - AIM clinic locations for booking routing
  - Services offered, booking rules, timezone, contact info

  ### ai_practitioners
  - Practitioner profiles for scheduling
  - Service eligibility, availability rules, booking priority

  ### call_agent_config
  - Per-clinic AI agent configuration
  - Scripts, intake questions, booking rules, SMS templates
  - Business hours, after-hours behavior

  ### call_agent_events
  - Webhook/automation event log for n8n and external triggers

  ## Schema Extensions
  - Extends crm_leads with booking workflow fields

  ## Security
  - RLS enabled on all new tables
  - Authenticated access with role-aware policies
*/

-- ─── AI CLINIC LOCATIONS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_clinic_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  address text DEFAULT '',
  city text DEFAULT '',
  province text DEFAULT 'AB',
  postal_code text DEFAULT '',
  phone text DEFAULT '',
  timezone text DEFAULT 'America/Edmonton',
  active boolean DEFAULT true,
  services_offered jsonb DEFAULT '["physio","orthotics"]'::jsonb,
  booking_rules jsonb DEFAULT '{}'::jsonb,
  business_hours jsonb DEFAULT '{}'::jsonb,
  after_hours_config jsonb DEFAULT '{}'::jsonb,
  max_daily_bookings integer DEFAULT 30,
  buffer_minutes integer DEFAULT 15,
  notes text DEFAULT ''
);

ALTER TABLE ai_clinic_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ai clinic locations"
  ON ai_clinic_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert ai clinic locations"
  ON ai_clinic_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can update ai clinic locations"
  ON ai_clinic_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- ─── AI PRACTITIONERS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_practitioners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  title text DEFAULT '',
  clinic_location_id uuid REFERENCES ai_clinic_locations(id) ON DELETE SET NULL,
  services_offered jsonb DEFAULT '["physio"]'::jsonb,
  active boolean DEFAULT true,
  booking_priority integer DEFAULT 5,
  booking_availability_rules jsonb DEFAULT '{}'::jsonb,
  accepts_new_patients boolean DEFAULT true,
  accepts_wcb boolean DEFAULT true,
  accepts_mva boolean DEFAULT true,
  notes text DEFAULT ''
);

ALTER TABLE ai_practitioners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view practitioners"
  ON ai_practitioners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage practitioners"
  ON ai_practitioners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can update practitioners"
  ON ai_practitioners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- ─── AI APPOINTMENTS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  clinic_location_id uuid REFERENCES ai_clinic_locations(id) ON DELETE SET NULL,
  practitioner_id uuid REFERENCES ai_practitioners(id) ON DELETE SET NULL,
  service_type text DEFAULT 'physio' CHECK (service_type IN ('physio', 'orthotics', 'assessment', 'follow_up', 'consultation', 'employer_call', 'wcb_assessment', 'mva_assessment')),
  appointment_type text DEFAULT 'initial_assessment' CHECK (appointment_type IN ('initial_assessment', 'orthotics_assessment', 'follow_up', 'consultation', 'employer_call', 'reassessment', 'discharge')),
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'reschedule_requested')),
  booking_source text DEFAULT 'staff_manual' CHECK (booking_source IN ('ai_call_agent', 'web_form', 'staff_manual', 'messenger', 'google', 'facebook', 'instagram', 'tiktok', 'linkedin', 'patient_portal')),
  notes text DEFAULT '',
  intake_form jsonb DEFAULT '{}'::jsonb,
  confirmation_code text DEFAULT '',
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text DEFAULT '',
  no_show_at timestamptz,
  patient_name text DEFAULT '',
  patient_phone text DEFAULT '',
  patient_email text DEFAULT '',
  insurance_type text DEFAULT 'private' CHECK (insurance_type IN ('private', 'wcb', 'mva', 'employer', 'direct_billing')),
  estimated_revenue numeric(10,2) DEFAULT 0,
  is_new_patient boolean DEFAULT true,
  reminder_sent_at timestamptz,
  reschedule_requested_at timestamptz,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

ALTER TABLE ai_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ai appointments"
  ON ai_appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ai appointments"
  ON ai_appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ai appointments"
  ON ai_appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── CALL SESSIONS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  caller_phone text DEFAULT '',
  caller_name text DEFAULT '',
  transcript text DEFAULT '',
  ai_summary text DEFAULT '',
  intent_type text DEFAULT 'unknown' CHECK (intent_type IN ('physio', 'orthotics', 'wcb', 'mva', 'employer', 'existing_patient', 'unknown', 'other')),
  service_type text DEFAULT 'unknown' CHECK (service_type IN ('physio', 'orthotics', 'both', 'wcb', 'mva', 'unknown')),
  urgency_level text DEFAULT 'medium' CHECK (urgency_level IN ('high', 'medium', 'low')),
  routing_result text DEFAULT 'incomplete' CHECK (routing_result IN ('booked', 'callback_requested', 'transferred', 'voicemail', 'incomplete', 'lost', 'information_only')),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES ai_appointments(id) ON DELETE SET NULL,
  assigned_location_id uuid REFERENCES ai_clinic_locations(id) ON DELETE SET NULL,
  assigned_staff_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  escalation_required boolean DEFAULT false,
  escalation_reason text DEFAULT '',
  call_duration_seconds integer DEFAULT 0,
  recording_url text DEFAULT '',
  sentiment text DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'frustrated', 'angry')),
  outcome_notes text DEFAULT '',
  structured_data jsonb DEFAULT '{}'::jsonb,
  call_sid text DEFAULT '',
  twilio_call_sid text DEFAULT '',
  ai_provider text DEFAULT 'retell',
  ai_agent_id text DEFAULT '',
  stage_reached text DEFAULT 'greeting',
  location_preference text DEFAULT '',
  issue_summary text DEFAULT '',
  callback_needed boolean DEFAULT false,
  insurance_context text DEFAULT '',
  is_existing_patient boolean DEFAULT false,
  follow_up_sent_at timestamptz,
  staff_notes text DEFAULT '',
  reviewed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view call sessions"
  ON call_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert call sessions"
  ON call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update call sessions"
  ON call_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── CALL AGENT CONFIG ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS call_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  clinic_location_id uuid REFERENCES ai_clinic_locations(id) ON DELETE SET NULL,
  is_global boolean DEFAULT false,
  greeting_script text DEFAULT 'Thank you for calling AIM. Are you calling about physiotherapy, custom orthotics, an existing appointment, or something else?',
  physio_questions jsonb DEFAULT '[]'::jsonb,
  orthotics_questions jsonb DEFAULT '[]'::jsonb,
  wcb_questions jsonb DEFAULT '[]'::jsonb,
  mva_questions jsonb DEFAULT '[]'::jsonb,
  employer_questions jsonb DEFAULT '[]'::jsonb,
  existing_patient_questions jsonb DEFAULT '[]'::jsonb,
  booking_rules jsonb DEFAULT '{}'::jsonb,
  escalation_triggers jsonb DEFAULT '[]'::jsonb,
  sms_confirmation_template text DEFAULT 'Hi {{name}}, your appointment at AIM {{location}} is confirmed for {{date}} at {{time}}. Reply CANCEL to cancel.',
  sms_callback_template text DEFAULT 'Hi {{name}}, we missed your call. Our team will call you back within {{window}}. Reply STOP to opt out.',
  sms_followup_template text DEFAULT 'Hi {{name}}, thanks for calling AIM. We''d love to help you book an appointment. Reply YES and we''ll call you back.',
  business_hours jsonb DEFAULT '{"mon":"8:00-18:00","tue":"8:00-18:00","wed":"8:00-18:00","thu":"8:00-18:00","fri":"8:00-18:00","sat":"9:00-14:00","sun":"closed"}'::jsonb,
  after_hours_behavior text DEFAULT 'voicemail' CHECK (after_hours_behavior IN ('voicemail', 'callback_intake', 'next_available_booking', 'emergency_disclaimer')),
  max_wait_seconds integer DEFAULT 30,
  fallback_to_staff boolean DEFAULT true,
  active boolean DEFAULT true
);

ALTER TABLE call_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view call agent config"
  ON call_agent_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage call agent config"
  ON call_agent_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update call agent config"
  ON call_agent_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

-- ─── CALL AGENT EVENTS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS call_agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN (
    'inbound_call_started', 'inbound_call_completed', 'ai_booking_completed',
    'ai_booking_failed', 'callback_requested', 'appointment_confirmed',
    'appointment_reschedule_requested', 'appointment_cancelled',
    'existing_patient_support_needed', 'employer_inquiry_created',
    'staff_escalation_triggered', 'follow_up_sent'
  )),
  call_session_id uuid REFERENCES call_sessions(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES ai_appointments(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  webhook_sent_at timestamptz,
  webhook_response_code integer,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  notes text DEFAULT ''
);

ALTER TABLE call_agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view call agent events"
  ON call_agent_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert call agent events"
  ON call_agent_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── EXTEND CRM_LEADS ────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'preferred_location_id'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN preferred_location_id uuid REFERENCES ai_clinic_locations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'preferred_contact_method'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN preferred_contact_method text DEFAULT 'call' CHECK (preferred_contact_method IN ('call', 'sms', 'email'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'booking_status'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN booking_status text DEFAULT 'not_started' CHECK (booking_status IN ('not_started', 'in_progress', 'booked', 'callback_pending', 'transferred', 'lost'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'intake_source_detail'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN intake_source_detail text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'first_contact_timestamp'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN first_contact_timestamp timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'last_contact_timestamp'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN last_contact_timestamp timestamptz;
  END IF;
END $$;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_call_sessions_lead_id ON call_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_appointment_id ON call_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at ON call_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_routing_result ON call_sessions(routing_result);
CREATE INDEX IF NOT EXISTS idx_call_sessions_intent_type ON call_sessions(intent_type);
CREATE INDEX IF NOT EXISTS idx_call_sessions_escalation ON call_sessions(escalation_required) WHERE escalation_required = true;

CREATE INDEX IF NOT EXISTS idx_ai_appointments_lead_id ON ai_appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_start_time ON ai_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_status ON ai_appointments(status);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_clinic_location ON ai_appointments(clinic_location_id);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_booking_source ON ai_appointments(booking_source);

CREATE INDEX IF NOT EXISTS idx_ai_practitioners_clinic ON ai_practitioners(clinic_location_id);
CREATE INDEX IF NOT EXISTS idx_call_agent_events_type ON call_agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_call_agent_events_session ON call_agent_events(call_session_id);

-- ─── SEED DEMO DATA ──────────────────────────────────────────────────────────

INSERT INTO ai_clinic_locations (name, address, city, phone, timezone, services_offered, active) VALUES
  ('AIM South Commons', '4915 130 Ave SE', 'Calgary', '403-555-0101', 'America/Edmonton', '["physio","orthotics","wcb","mva"]'::jsonb, true),
  ('AIM Deerfoot City', '901 64 Ave NE', 'Calgary', '403-555-0102', 'America/Edmonton', '["physio","orthotics"]'::jsonb, true),
  ('AIM Sunridge', '2525 36 St NE', 'Calgary', '403-555-0103', 'America/Edmonton', '["physio","wcb","mva"]'::jsonb, true),
  ('AIM Windermere', '5540 Windermere Blvd NW', 'Edmonton', '780-555-0104', 'America/Edmonton', '["physio","orthotics","wcb"]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO ai_practitioners (name, title, services_offered, active, booking_priority, accepts_wcb, accepts_mva)
SELECT
  name, title, services, true, priority, accepts_wcb, accepts_mva
FROM (VALUES
  ('Dr. Sarah Chen', 'Physiotherapist', '["physio","wcb","mva"]'::jsonb, 1, true, true),
  ('Dr. James Patel', 'Physiotherapist', '["physio","wcb"]'::jsonb, 2, true, false),
  ('Dr. Lisa Nguyen', 'Certified Orthotist', '["orthotics"]'::jsonb, 1, false, false),
  ('Dr. Mark Thompson', 'Physiotherapist', '["physio","mva","orthotics"]'::jsonb, 2, false, true),
  ('Dr. Emily Ross', 'Physiotherapist', '["physio","wcb","mva"]'::jsonb, 1, true, true)
) AS v(name, title, services, priority, accepts_wcb, accepts_mva)
ON CONFLICT DO NOTHING;

INSERT INTO call_agent_config (is_global, active) VALUES (true, true)
ON CONFLICT DO NOTHING;

-- ─── SEED DEMO CALL SESSIONS ─────────────────────────────────────────────────

INSERT INTO call_sessions (
  caller_phone, caller_name, intent_type, service_type, urgency_level,
  routing_result, escalation_required, call_duration_seconds, sentiment,
  issue_summary, ai_summary, stage_reached
) VALUES
  ('+14035550001', 'Michael Tremblay', 'physio', 'physio', 'medium', 'booked', false, 247, 'positive',
   'Lower back pain for 3 weeks, affecting work',
   'Caller reporting lower back pain onset 3 weeks ago after lifting incident at work. Not WCB - personal. Prefers South Commons. Booked for initial assessment.',
   'confirmation'),
  ('+14035550002', 'Sandra Kowalski', 'orthotics', 'orthotics', 'low', 'callback_requested', false, 93, 'neutral',
   'Custom orthotics inquiry for foot arch pain',
   'Existing patient inquiring about custom orthotics. Had assessment before at Deerfoot. Requested callback to discuss pricing and timeline.',
   'qualification'),
  ('+14035550003', 'Raj Sharma', 'wcb', 'physio', 'high', 'booked', false, 318, 'neutral',
   'WCB workplace injury - shoulder strain from repetitive motion',
   'Injured shoulder at warehouse job last Tuesday. Has WCB claim number. Urgent as off work. Booked WCB assessment at South Commons.',
   'confirmation'),
  ('+14035550004', 'Jennifer Walsh', 'mva', 'physio', 'high', 'transferred', true, 412, 'frustrated',
   'MVA - neck and back pain, legal representation involved',
   'MVA 2 weeks ago. Caller is frustrated - lawyer involved, insurance dispute ongoing. Escalated to clinic manager for protocol handling.',
   'qualification'),
  ('+14035550005', 'David Okafor', 'employer', 'physio', 'low', 'booked', false, 189, 'positive',
   'Employer inquiry for corporate account - 45 staff',
   'HR Director from Okafor Construction. Interested in employer program for 45 staff. Booked employer consultation at South Commons.',
   'confirmation'),
  ('+14035550006', 'Anonymous', 'unknown', 'unknown', 'low', 'lost', false, 22, 'neutral',
   'Hung up during greeting',
   'Short call - caller hung up during initial greeting. No information captured.',
   'greeting'),
  ('+14035550007', 'Patricia Lemieux', 'existing_patient', 'physio', 'medium', 'callback_requested', false, 156, 'neutral',
   'Existing patient requesting reschedule',
   'Existing patient - knee rehab program. Needs to reschedule upcoming appointment. Left callback request for front desk.',
   'routing'),
  ('+14035550008', 'Kevin Park', 'physio', 'physio', 'medium', 'booked', false, 203, 'positive',
   'Knee pain - running injury, recreational athlete',
   'Runner with right knee pain developing over 6 weeks. Not WCB or MVA. Morning availability preferred. Booked initial assessment.',
   'confirmation')
ON CONFLICT DO NOTHING;
