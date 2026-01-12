/*
  # Create Clinician Mobile Schema

  1. New Tables
    - `clinician_schedules` - Daily schedule view for clinicians
    - `clinician_quick_notes` - Quick notes captured during patient encounters
    - `clinician_availability` - Clinician availability management
    - `clinician_mobile_sessions` - Track mobile app sessions

  2. Security
    - Enable RLS on all tables
    - Clinicians can only view/edit their own data
    - Admins have full access
*/

-- Create clinician_schedules table (materialized view of provider schedules)
CREATE TABLE IF NOT EXISTS clinician_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES auth.users(id) NOT NULL,
  clinic_id uuid,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  schedule_type text DEFAULT 'clinical' CHECK (schedule_type IN ('clinical', 'administrative', 'break', 'meeting', 'training')),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinician_quick_notes table
CREATE TABLE IF NOT EXISTS clinician_quick_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES auth.users(id) NOT NULL,
  patient_id uuid REFERENCES patients(id),
  appointment_id uuid REFERENCES patient_appointments(id),
  note_type text DEFAULT 'clinical' CHECK (note_type IN ('clinical', 'administrative', 'follow_up', 'referral', 'other')),
  note_text text NOT NULL,
  voice_memo_url text,
  tags text[] DEFAULT '{}',
  is_draft boolean DEFAULT false,
  transcribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinician_availability table
CREATE TABLE IF NOT EXISTS clinician_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES auth.users(id) NOT NULL,
  clinic_id uuid,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  availability_type text DEFAULT 'regular' CHECK (availability_type IN ('regular', 'override', 'time_off', 'holiday')),
  effective_start_date date,
  effective_end_date date,
  recurrence_pattern jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clinician_mobile_sessions table
CREATE TABLE IF NOT EXISTS clinician_mobile_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id uuid REFERENCES auth.users(id) NOT NULL,
  device_info jsonb DEFAULT '{}',
  app_version text,
  session_started_at timestamptz DEFAULT now(),
  session_ended_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  ip_address text,
  location_data jsonb DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clinician_schedules_clinician ON clinician_schedules(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_schedules_date ON clinician_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_clinician_schedules_clinic ON clinician_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinician_schedules_status ON clinician_schedules(status);

CREATE INDEX IF NOT EXISTS idx_clinician_quick_notes_clinician ON clinician_quick_notes(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_quick_notes_patient ON clinician_quick_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinician_quick_notes_appointment ON clinician_quick_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinician_quick_notes_created ON clinician_quick_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_clinician_quick_notes_draft ON clinician_quick_notes(is_draft);

CREATE INDEX IF NOT EXISTS idx_clinician_availability_clinician ON clinician_availability(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_availability_clinic ON clinician_availability(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinician_availability_day ON clinician_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_clinician_availability_dates ON clinician_availability(effective_start_date, effective_end_date);

CREATE INDEX IF NOT EXISTS idx_clinician_mobile_sessions_clinician ON clinician_mobile_sessions(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_mobile_sessions_started ON clinician_mobile_sessions(session_started_at);

-- Enable RLS
ALTER TABLE clinician_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinician_mobile_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinician_schedules
CREATE POLICY "Clinicians can view own schedule"
  ON clinician_schedules FOR SELECT
  TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own schedule"
  ON clinician_schedules FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Admins can view all schedules"
  ON clinician_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can manage schedules"
  ON clinician_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- RLS Policies for clinician_quick_notes
CREATE POLICY "Clinicians can view own notes"
  ON clinician_quick_notes FOR SELECT
  TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can create own notes"
  ON clinician_quick_notes FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own notes"
  ON clinician_quick_notes FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can delete own notes"
  ON clinician_quick_notes FOR DELETE
  TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Admins can view all notes"
  ON clinician_quick_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- RLS Policies for clinician_availability
CREATE POLICY "Clinicians can view own availability"
  ON clinician_availability FOR SELECT
  TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can manage own availability"
  ON clinician_availability FOR ALL
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Admins can view all availability"
  ON clinician_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can manage availability"
  ON clinician_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- RLS Policies for clinician_mobile_sessions
CREATE POLICY "Clinicians can view own sessions"
  ON clinician_mobile_sessions FOR SELECT
  TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Clinicians can create sessions"
  ON clinician_mobile_sessions FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can update own sessions"
  ON clinician_mobile_sessions FOR UPDATE
  TO authenticated
  USING (clinician_id = auth.uid())
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON clinician_mobile_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );
