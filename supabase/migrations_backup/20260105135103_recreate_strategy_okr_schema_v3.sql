/*
  # Strategy Deployment & OKR Schema v3

  ## Purpose
  Prevents execution drift at scale through structured goal-setting and progress tracking.
  Recreates tables with correct schema.
  
  ## Changes
  - Drop existing strategic_priorities, objectives, key_results, initiatives tables
  - Recreate with proper schema and relationships
  - Add okr_check_ins and clinic_alignment tables
  - Fix role checks to use 'clinic_manager' instead of 'manager'
  
  ## Security
  - RLS enabled on all tables
  - Executives and clinic managers have access
*/

-- Drop existing tables
DROP TABLE IF EXISTS clinic_alignment CASCADE;
DROP TABLE IF EXISTS okr_check_ins CASCADE;
DROP TABLE IF EXISTS initiatives CASCADE;
DROP TABLE IF EXISTS key_results CASCADE;
DROP TABLE IF EXISTS objectives CASCADE;
DROP TABLE IF EXISTS strategic_priorities CASCADE;

-- Strategic Priorities Table
CREATE TABLE strategic_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority_number text UNIQUE NOT NULL,
  fiscal_year integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  owner_user_id uuid,
  priority_level text NOT NULL DEFAULT 'p2_medium',
  status text NOT NULL DEFAULT 'planning',
  target_impact text,
  success_metrics jsonb,
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  percent_complete integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_strategic_priorities_year ON strategic_priorities(fiscal_year);
CREATE INDEX idx_strategic_priorities_status ON strategic_priorities(status);
CREATE INDEX idx_strategic_priorities_owner ON strategic_priorities(owner_user_id);
CREATE INDEX idx_strategic_priorities_category ON strategic_priorities(category);

-- Objectives Table
CREATE TABLE objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_number text UNIQUE NOT NULL,
  strategic_priority_id uuid REFERENCES strategic_priorities(id) ON DELETE SET NULL,
  fiscal_year integer NOT NULL,
  fiscal_quarter integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  owner_user_id uuid,
  clinic_id uuid,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  confidence_level integer DEFAULT 5,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_objectives_year_quarter ON objectives(fiscal_year, fiscal_quarter);
CREATE INDEX idx_objectives_priority ON objectives(strategic_priority_id);
CREATE INDEX idx_objectives_clinic ON objectives(clinic_id);
CREATE INDEX idx_objectives_status ON objectives(status);
CREATE INDEX idx_objectives_owner ON objectives(owner_user_id);

-- Key Results Table
CREATE TABLE key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  key_result_number text NOT NULL,
  title text NOT NULL,
  description text,
  metric_type text NOT NULL DEFAULT 'number',
  baseline_value numeric DEFAULT 0,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text,
  owner_user_id uuid,
  status text NOT NULL DEFAULT 'not_started',
  progress_percent numeric DEFAULT 0,
  last_updated date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_key_results_objective ON key_results(objective_id);
CREATE INDEX idx_key_results_status ON key_results(status);
CREATE INDEX idx_key_results_owner ON key_results(owner_user_id);

-- Initiatives Table
CREATE TABLE initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  key_result_id uuid REFERENCES key_results(id) ON DELETE SET NULL,
  initiative_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  owner_user_id uuid,
  status text NOT NULL DEFAULT 'not_started',
  priority text NOT NULL DEFAULT 'medium',
  effort_estimate text,
  start_date date,
  due_date date,
  completion_date date,
  percent_complete integer DEFAULT 0,
  blockers text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_initiatives_objective ON initiatives(objective_id);
CREATE INDEX idx_initiatives_key_result ON initiatives(key_result_id);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_owner ON initiatives(owner_user_id);
CREATE INDEX idx_initiatives_due_date ON initiatives(due_date);

-- OKR Check-ins Table
CREATE TABLE okr_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  submitted_by_user_id uuid,
  confidence_level integer DEFAULT 5,
  overall_status text NOT NULL DEFAULT 'on_track',
  accomplishments text,
  challenges text,
  next_steps text,
  support_needed text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_okr_check_ins_objective ON okr_check_ins(objective_id);
CREATE INDEX idx_okr_check_ins_date ON okr_check_ins(check_in_date);
CREATE INDEX idx_okr_check_ins_status ON okr_check_ins(overall_status);

-- Clinic Alignment Table
CREATE TABLE clinic_alignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  strategic_priority_id uuid REFERENCES strategic_priorities(id) ON DELETE CASCADE,
  objective_id uuid REFERENCES objectives(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  fiscal_quarter integer NOT NULL,
  alignment_strength text NOT NULL DEFAULT 'moderate',
  contribution_description text,
  local_initiatives_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_clinic_alignment_clinic ON clinic_alignment(clinic_id);
CREATE INDEX idx_clinic_alignment_priority ON clinic_alignment(strategic_priority_id);
CREATE INDEX idx_clinic_alignment_objective ON clinic_alignment(objective_id);
CREATE INDEX idx_clinic_alignment_year_quarter ON clinic_alignment(fiscal_year, fiscal_quarter);

-- Enable RLS
ALTER TABLE strategic_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_alignment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategic_priorities
CREATE POLICY "Executives and managers can view strategic priorities"
  ON strategic_priorities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage strategic priorities"
  ON strategic_priorities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for objectives
CREATE POLICY "Executives and managers can view objectives"
  ON objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage objectives"
  ON objectives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for key_results
CREATE POLICY "Executives and managers can view key results"
  ON key_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage key results"
  ON key_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for initiatives
CREATE POLICY "Executives and managers can view initiatives"
  ON initiatives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage initiatives"
  ON initiatives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for okr_check_ins
CREATE POLICY "Executives and managers can view check-ins"
  ON okr_check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage check-ins"
  ON okr_check_ins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for clinic_alignment
CREATE POLICY "Executives and managers can view clinic alignment"
  ON clinic_alignment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and managers can manage clinic alignment"
  ON clinic_alignment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );
