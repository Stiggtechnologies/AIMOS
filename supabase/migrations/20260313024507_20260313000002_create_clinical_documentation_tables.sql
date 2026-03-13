/*
  # Create Clinical Documentation Tables
  
  ## New Tables
    - `soap_notes` - Clinical SOAP documentation
    - `clinical_assessments` - Standardized assessments
    - `treatment_plans` - Treatment plan management
  
  ## Security
    - RLS enabled with clinic-based isolation
    - Clinicians can only edit their own draft notes
*/

CREATE TABLE IF NOT EXISTS soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES patient_appointments(id) ON DELETE SET NULL,
  clinician_id UUID NOT NULL REFERENCES user_profiles(id),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  subjective TEXT,
  subjective_chief_complaint TEXT,
  subjective_pain_level INTEGER CHECK (subjective_pain_level >= 0 AND subjective_pain_level <= 10),
  subjective_pain_location TEXT,
  subjective_aggravating_factors TEXT,
  subjective_relieving_factors TEXT,
  
  objective TEXT,
  objective_vital_signs JSONB,
  objective_observations TEXT,
  objective_measurements JSONB,
  objective_special_tests JSONB,
  
  assessment TEXT,
  assessment_diagnosis_codes TEXT[],
  assessment_clinical_impression TEXT,
  assessment_prognosis TEXT,
  
  plan TEXT,
  plan_treatment_provided TEXT,
  plan_home_instructions TEXT,
  plan_follow_up TEXT,
  plan_referrals TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'amended', 'addendum')),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES user_profiles(id),
  amended_at TIMESTAMPTZ,
  amended_by UUID REFERENCES user_profiles(id),
  amendment_reason TEXT,
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES patient_appointments(id) ON DELETE SET NULL,
  clinician_id UUID NOT NULL REFERENCES user_profiles(id),
  
  assessment_type TEXT NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  pain_scale_type TEXT DEFAULT 'nprs',
  pain_current INTEGER CHECK (pain_current >= 0 AND pain_current <= 10),
  pain_best INTEGER CHECK (pain_best >= 0 AND pain_best <= 10),
  pain_worst INTEGER CHECK (pain_worst >= 0 AND pain_worst <= 10),
  pain_average INTEGER CHECK (pain_average >= 0 AND pain_average <= 10),
  
  outcome_measures JSONB DEFAULT '{}',
  range_of_motion JSONB DEFAULT '{}',
  strength_testing JSONB DEFAULT '{}',
  special_tests JSONB DEFAULT '{}',
  
  short_term_goals JSONB DEFAULT '[]',
  long_term_goals JSONB DEFAULT '[]',
  
  clinical_findings TEXT,
  recommendations TEXT,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'reviewed')),
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES user_profiles(id),
  
  plan_name TEXT NOT NULL,
  diagnosis TEXT,
  diagnosis_codes TEXT[],
  
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  estimated_visits INTEGER,
  completed_visits INTEGER DEFAULT 0,
  
  treatment_frequency TEXT,
  treatment_duration TEXT,
  
  goals JSONB DEFAULT '[]',
  interventions JSONB DEFAULT '[]',
  
  precautions TEXT,
  contraindications TEXT,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'discontinued')),
  
  completed_at TIMESTAMPTZ,
  discontinued_at TIMESTAMPTZ,
  discontinued_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_soap_notes_clinic ON soap_notes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_patient ON soap_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_clinician ON soap_notes(clinician_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_date ON soap_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_soap_notes_appointment ON soap_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_clinic ON clinical_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_patient ON clinical_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_type ON clinical_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic ON treatment_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);

-- RLS
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view clinic SOAP notes"
  ON soap_notes FOR SELECT TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('clinician', 'admin', 'clinic_manager', 'executive'))
  );

CREATE POLICY "Clinicians can create SOAP notes"
  ON soap_notes FOR INSERT TO authenticated
  WITH CHECK (
    clinician_id = auth.uid()
    AND clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "Authors can update draft SOAP notes"
  ON soap_notes FOR UPDATE TO authenticated
  USING (clinician_id = auth.uid() AND status = 'draft')
  WITH CHECK (clinician_id = auth.uid());

CREATE POLICY "Clinicians can view clinic assessments"
  ON clinical_assessments FOR SELECT TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('clinician', 'admin', 'clinic_manager', 'executive'))
  );

CREATE POLICY "Clinicians can manage their assessments"
  ON clinical_assessments FOR ALL TO authenticated
  USING (
    clinician_id = auth.uid()
    AND clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "Clinicians can view clinic treatment plans"
  ON treatment_plans FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL));

CREATE POLICY "Clinicians can manage treatment plans"
  ON treatment_plans FOR ALL TO authenticated
  USING (
    clinician_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'clinic_manager', 'executive'))
  );
