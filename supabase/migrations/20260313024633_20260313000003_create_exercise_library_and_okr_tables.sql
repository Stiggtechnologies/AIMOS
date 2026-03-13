/*
  # Create Exercise Library and OKR Tables
  
  ## New Tables
    - `exercise_library` - Exercise database for prescriptions
    - `patient_exercises` - Prescribed exercises linked to treatment plans
    - `okr_objectives` - OKR objective tracking
    - `okr_key_results` - Key results for objectives
  
  ## Security
    - RLS enabled with proper access control
*/

-- Exercise Library
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exercise_category TEXT NOT NULL,
  body_region TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'moderate' CHECK (difficulty IN ('beginner', 'moderate', 'advanced')),
  description TEXT,
  instructions TEXT[],
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_hold_seconds INTEGER,
  default_frequency TEXT DEFAULT 'daily',
  equipment_needed TEXT[],
  contraindications TEXT[],
  video_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Exercises
CREATE TABLE IF NOT EXISTS patient_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES user_profiles(id),
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  hold_seconds INTEGER,
  frequency TEXT NOT NULL DEFAULT 'daily',
  special_instructions TEXT,
  modifications TEXT,
  progression_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'modified', 'discontinued', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OKR Objectives
CREATE TABLE IF NOT EXISTS okr_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES user_profiles(id),
  time_period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  objective_category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('not_started', 'on_track', 'at_risk', 'behind', 'achieved', 'cancelled')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  parent_objective_id UUID REFERENCES okr_objectives(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OKR Key Results
CREATE TABLE IF NOT EXISTS okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES okr_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES user_profiles(id),
  metric_type TEXT NOT NULL,
  start_value NUMERIC(15,2) DEFAULT 0,
  current_value NUMERIC(15,2) DEFAULT 0,
  target_value NUMERIC(15,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('not_started', 'on_track', 'at_risk', 'behind', 'achieved')),
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_body_region ON exercise_library(body_region);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_patient ON patient_exercises(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_treatment_plan ON patient_exercises(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_clinic ON okr_objectives(clinic_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_owner ON okr_objectives(owner_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_period ON okr_objectives(time_period);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_status ON okr_objectives(status);
CREATE INDEX IF NOT EXISTS idx_okr_key_results_objective ON okr_key_results(objective_id);

-- RLS
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise library"
  ON exercise_library FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage exercise library"
  ON exercise_library FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive')));

CREATE POLICY "Clinicians can view patient exercises"
  ON patient_exercises FOR SELECT TO authenticated
  USING (patient_id IN (
    SELECT id FROM patients WHERE clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL
    )
  ));

CREATE POLICY "Clinicians can manage patient exercises"
  ON patient_exercises FOR ALL TO authenticated
  USING (clinician_id = auth.uid());

CREATE POLICY "Staff can view objectives"
  ON okr_objectives FOR SELECT TO authenticated
  USING (
    clinic_id IS NULL
    OR clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
  );

CREATE POLICY "Managers can manage objectives"
  ON okr_objectives FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'clinic_manager', 'executive'))
  );

CREATE POLICY "Staff can view key results"
  ON okr_key_results FOR SELECT TO authenticated
  USING (objective_id IN (
    SELECT id FROM okr_objectives WHERE
    clinic_id IS NULL
    OR clinic_id IN (SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid() AND revoked_at IS NULL)
  ));

CREATE POLICY "Owners can manage key results"
  ON okr_key_results FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR objective_id IN (SELECT id FROM okr_objectives WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive'))
  );

-- Seed exercise library
INSERT INTO exercise_library (name, exercise_category, body_region, difficulty, description, instructions, default_sets, default_reps, equipment_needed)
VALUES
  ('Chin Tucks', 'mobility', 'cervical', 'beginner', 'Cervical retraction exercise to improve posture', 
   ARRAY['Sit or stand with good posture', 'Gently draw chin back', 'Hold for 5 seconds', 'Repeat'], 3, 10, ARRAY[]::text[]),
  ('Cat-Cow Stretch', 'mobility', 'thoracic', 'beginner', 'Spinal mobility exercise',
   ARRAY['Start on hands and knees', 'Arch back up (exhale)', 'Arch back down (inhale)'], 3, 10, ARRAY[]::text[]),
  ('Bird Dog', 'strengthening', 'lumbar', 'moderate', 'Core stabilization exercise',
   ARRAY['Start on hands and knees', 'Extend opposite arm and leg', 'Keep core engaged'], 3, 10, ARRAY[]::text[]),
  ('Glute Bridge', 'strengthening', 'hip', 'beginner', 'Hip and gluteal strengthening',
   ARRAY['Lie on back with knees bent', 'Squeeze glutes and lift hips', 'Hold at top'], 3, 15, ARRAY[]::text[]),
  ('Clamshells', 'strengthening', 'hip', 'beginner', 'Hip abductor strengthening',
   ARRAY['Lie on side with knees bent', 'Keep feet together', 'Lift top knee up'], 3, 15, ARRAY['resistance band']),
  ('Wall Slides', 'strengthening', 'shoulder', 'beginner', 'Scapular stability exercise',
   ARRAY['Stand with back against wall', 'Arms at 90 degrees', 'Slide arms up the wall'], 3, 10, ARRAY[]::text[]),
  ('Hip Flexor Stretch', 'stretching', 'hip', 'beginner', 'Hip flexor flexibility',
   ARRAY['Step one foot forward into lunge', 'Tuck pelvis under', 'Hold 30 seconds'], 3, 30, ARRAY[]::text[]),
  ('Piriformis Stretch', 'stretching', 'hip', 'beginner', 'Piriformis and deep hip rotator stretch',
   ARRAY['Lie on back', 'Cross ankle over opposite knee', 'Pull knee toward chest'], 3, 30, ARRAY[]::text[]),
  ('Single Leg Balance', 'balance', 'knee', 'moderate', 'Proprioceptive training',
   ARRAY['Stand on one leg', 'Keep knee slightly bent', 'Hold for 30 seconds'], 3, 30, ARRAY[]::text[])
ON CONFLICT DO NOTHING;
