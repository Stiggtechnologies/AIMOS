/*
  # Patient Experience Module

  ## Summary
  Creates all tables needed to power a client-facing patient app inside AIM OS.
  Supplements existing `patients`, `patient_appointments`, and `patient_documents`
  tables with exercise tracking, progress scores, secure messaging, and billing summaries.

  ## New Tables

  ### patient_exercise_programs
  Links patients to assigned exercise programs with completion tracking.

  ### patient_exercise_logs
  Records each time a patient completes an exercise, capturing pain before/after and reps.

  ### patient_progress_scores
  Patient-reported daily outcome measures: pain, function, mood, sleep.

  ### patient_secure_messages
  Secure two-way messages between patients and clinic staff.

  ### patient_billing_summaries
  Patient-facing financial summaries (invoice amount, payment status, insurance status).

  ## Security
  - RLS enabled on all tables
  - Patients can only access their own records via sub-select on patients.user_id = auth.uid()
  - Staff (admin, executive, clinician, clinic_manager) can read all records
  - Valid roles from user_role enum: executive, clinic_manager, clinician, admin, contractor, partner_read_only
*/

-- ─────────────────────────────────────────
-- patient_exercise_programs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_exercise_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  program_name text NOT NULL DEFAULT '',
  assigned_by_name text DEFAULT '',
  assigned_date date DEFAULT CURRENT_DATE,
  target_sessions int DEFAULT 12,
  completed_sessions int DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_exercise_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own exercise programs"
  ON patient_exercise_programs FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff read all exercise programs"
  ON patient_exercise_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

CREATE POLICY "Staff insert exercise programs"
  ON patient_exercise_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

CREATE POLICY "Staff update exercise programs"
  ON patient_exercise_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

-- ─────────────────────────────────────────
-- patient_exercise_logs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  exercise_program_id uuid REFERENCES patient_exercise_programs(id) ON DELETE SET NULL,
  exercise_name text NOT NULL DEFAULT '',
  completed_at timestamptz DEFAULT now(),
  sets_completed int DEFAULT 0,
  reps_completed int DEFAULT 0,
  duration_minutes int DEFAULT 0,
  pain_before int DEFAULT 0 CHECK (pain_before >= 0 AND pain_before <= 10),
  pain_after int DEFAULT 0 CHECK (pain_after >= 0 AND pain_after <= 10),
  difficulty_rating int DEFAULT 5 CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own exercise logs"
  ON patient_exercise_logs FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients insert own exercise logs"
  ON patient_exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff read all exercise logs"
  ON patient_exercise_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

-- ─────────────────────────────────────────
-- patient_progress_scores
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_progress_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  score_date date DEFAULT CURRENT_DATE,
  pain_score int DEFAULT 0 CHECK (pain_score >= 0 AND pain_score <= 10),
  function_score int DEFAULT 0 CHECK (function_score >= 0 AND function_score <= 100),
  mood_score int DEFAULT 5 CHECK (mood_score >= 1 AND mood_score <= 10),
  activity_level text DEFAULT 'moderate',
  sleep_quality int DEFAULT 5 CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_progress_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own progress scores"
  ON patient_progress_scores FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients insert own progress scores"
  ON patient_progress_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients update own progress scores"
  ON patient_progress_scores FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  )
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff read all progress scores"
  ON patient_progress_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

-- ─────────────────────────────────────────
-- patient_secure_messages
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_secure_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL DEFAULT 'staff' CHECK (sender_type IN ('patient', 'staff')),
  sender_name text DEFAULT '',
  thread_id uuid DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'low')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_secure_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own messages"
  ON patient_secure_messages FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients send messages"
  ON patient_secure_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    AND sender_type = 'patient'
  );

CREATE POLICY "Patients mark messages read"
  ON patient_secure_messages FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  )
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff read all patient messages"
  ON patient_secure_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

CREATE POLICY "Staff send messages to patients"
  ON patient_secure_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
    AND sender_type = 'staff'
  );

-- ─────────────────────────────────────────
-- patient_billing_summaries
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_billing_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  invoice_date date DEFAULT CURRENT_DATE,
  description text DEFAULT '',
  amount_billed numeric(10, 2) DEFAULT 0,
  amount_paid numeric(10, 2) DEFAULT 0,
  amount_outstanding numeric(10, 2) DEFAULT 0,
  insurance_status text DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'submitted', 'approved', 'denied', 'partial', 'not_applicable')),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'waived', 'in_collections')),
  payment_due_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patient_billing_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients read own billing summaries"
  ON patient_billing_summaries FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff read all billing summaries"
  ON patient_billing_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinician', 'clinic_manager')
    )
  );

CREATE POLICY "Staff insert billing summaries"
  ON patient_billing_summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Staff update billing summaries"
  ON patient_billing_summaries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patient_exercise_programs_patient_id ON patient_exercise_programs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercise_programs_is_active ON patient_exercise_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_exercise_logs_patient_id ON patient_exercise_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercise_logs_program_id ON patient_exercise_logs(exercise_program_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercise_logs_completed_at ON patient_exercise_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_progress_scores_patient_id ON patient_progress_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_progress_scores_score_date ON patient_progress_scores(score_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_secure_messages_patient_id ON patient_secure_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_secure_messages_thread_id ON patient_secure_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_patient_secure_messages_created_at ON patient_secure_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_billing_summaries_patient_id ON patient_billing_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_billing_summaries_payment_status ON patient_billing_summaries(payment_status);
