/*
  # Extend Patient Portal Schema

  1. Modifications
    - Add user_id to patients table for portal login
    - Add assigned_provider_id and insurance_info to patients
    
  2. New Tables
    - `patient_documents` - Patient documents and records
    - `patient_messages` - Secure messaging between patients and care team
    - `patient_treatment_plans` - Treatment plans and progress
    - `patient_access_logs` - Audit log of patient portal access

  3. Security
    - Enable RLS on all new tables
    - Patients can only view their own data
    - Clinicians can view their assigned patients
*/

-- Add user_id column to patients table for portal access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN user_id uuid REFERENCES auth.users(id) UNIQUE;
  END IF;
END $$;

-- Add additional fields to patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'assigned_provider_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN assigned_provider_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'insurance_info'
  ) THEN
    ALTER TABLE patients ADD COLUMN insurance_info jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create patient_documents table
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('treatment_plan', 'lab_result', 'imaging', 'consent_form', 'report', 'discharge_summary', 'prescription', 'other')),
  title text NOT NULL,
  description text,
  file_url text,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  appointment_id uuid REFERENCES patient_appointments(id),
  is_visible_to_patient boolean DEFAULT true,
  viewed_by_patient_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_messages table
CREATE TABLE IF NOT EXISTS patient_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('patient', 'clinician', 'admin')),
  recipient_id uuid REFERENCES auth.users(id) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  thread_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_treatment_plans table
CREATE TABLE IF NOT EXISTS patient_treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid,
  diagnosis text NOT NULL,
  treatment_goals text,
  plan_details jsonb DEFAULT '{}',
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'discontinued')),
  progress_notes jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_access_logs table
CREATE TABLE IF NOT EXISTS patient_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_provider ON patients(assigned_provider_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_visible ON patient_documents(is_visible_to_patient);

CREATE INDEX IF NOT EXISTS idx_patient_messages_patient ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_sender ON patient_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_recipient ON patient_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_thread ON patient_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_read ON patient_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_patient_treatment_plans_patient ON patient_treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_treatment_plans_status ON patient_treatment_plans(status);

CREATE INDEX IF NOT EXISTS idx_patient_access_logs_patient ON patient_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_logs_created ON patient_access_logs(created_at);

-- Enable RLS
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_documents
CREATE POLICY "Patients can view visible documents"
  ON patient_documents FOR SELECT
  TO authenticated
  USING (
    is_visible_to_patient = true
    AND patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all documents"
  ON patient_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

CREATE POLICY "Staff can manage documents"
  ON patient_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

-- RLS Policies for patient_messages
CREATE POLICY "Users can view their messages"
  ON patient_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON patient_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages"
  ON patient_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR recipient_id = auth.uid());

-- RLS Policies for patient_treatment_plans
CREATE POLICY "Patients can view treatment plans"
  ON patient_treatment_plans FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view treatment plans"
  ON patient_treatment_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

CREATE POLICY "Staff can manage treatment plans"
  ON patient_treatment_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

-- RLS Policies for patient_access_logs
CREATE POLICY "Patients can view access logs"
  ON patient_access_logs FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create access logs"
  ON patient_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view access logs"
  ON patient_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );
