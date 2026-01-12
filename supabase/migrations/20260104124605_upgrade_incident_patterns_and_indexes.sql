/*
  # Upgrade Incident Resolution System - Patterns & Indexes

  ## Purpose
  Add pattern detection capabilities and enhance existing incident resolution tables.

  ## New Tables
  
  ### `incident_patterns`
    - Cross-clinic pattern detection
    - Risk trending and analysis
    - Recommended actions

  ## Changes to Existing Tables
  
  ### `corrective_plans`
    - Add missing columns for enhanced tracking
    - Update for better legal defensibility

  ### `incident_actions`
    - Add verification_notes column
    - Already has most needed fields

  ## Security
    - Enable RLS on patterns table
    - Executives/admins only access

  ## Indexes
    - Performance indexes for pattern detection
    - Enhanced filtering capabilities
*/

-- Add missing columns to corrective_plans if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_plans' AND column_name = 'plan_summary') THEN
    ALTER TABLE corrective_plans ADD COLUMN plan_summary TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_plans' AND column_name = 'owner_id') THEN
    ALTER TABLE corrective_plans ADD COLUMN owner_id UUID REFERENCES user_profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_plans' AND column_name = 'due_date') THEN
    ALTER TABLE corrective_plans ADD COLUMN due_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_plans' AND column_name = 'plan_status') THEN
    ALTER TABLE corrective_plans ADD COLUMN plan_status TEXT DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_plans' AND column_name = 'completion_date') THEN
    ALTER TABLE corrective_plans ADD COLUMN completion_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add missing columns to incident_actions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_actions' AND column_name = 'verification_notes') THEN
    ALTER TABLE incident_actions ADD COLUMN verification_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_actions' AND column_name = 'action_status') THEN
    ALTER TABLE incident_actions ADD COLUMN action_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Incident Patterns table for cross-clinic pattern detection
CREATE TABLE IF NOT EXISTS incident_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  pattern_category TEXT,
  incident_ids JSONB DEFAULT '[]'::jsonb,
  severity_trend TEXT,
  frequency INTEGER DEFAULT 1,
  affected_clinics JSONB DEFAULT '[]'::jsonb,
  first_occurrence TIMESTAMPTZ,
  last_occurrence TIMESTAMPTZ,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  recommended_actions TEXT,
  systemic_root_cause TEXT,
  executive_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for corrective_plans
CREATE INDEX IF NOT EXISTS idx_corrective_plans_incident 
  ON corrective_plans(incident_id);

CREATE INDEX IF NOT EXISTS idx_corrective_plans_owner 
  ON corrective_plans(owner_id);

CREATE INDEX IF NOT EXISTS idx_corrective_plans_status 
  ON corrective_plans(plan_status);

CREATE INDEX IF NOT EXISTS idx_corrective_plans_due_date 
  ON corrective_plans(due_date);

-- Create indexes for incident_actions (already existing ones)
CREATE INDEX IF NOT EXISTS idx_incident_actions_plan 
  ON incident_actions(corrective_plan_id);

CREATE INDEX IF NOT EXISTS idx_incident_actions_assigned 
  ON incident_actions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_incident_actions_status 
  ON incident_actions(status);

CREATE INDEX IF NOT EXISTS idx_incident_actions_due_date 
  ON incident_actions(due_date);

-- Create indexes for incident_patterns
CREATE INDEX IF NOT EXISTS idx_incident_patterns_risk 
  ON incident_patterns(risk_level);

CREATE INDEX IF NOT EXISTS idx_incident_patterns_frequency 
  ON incident_patterns(frequency DESC);

CREATE INDEX IF NOT EXISTS idx_incident_patterns_category 
  ON incident_patterns(pattern_category);

CREATE INDEX IF NOT EXISTS idx_incident_patterns_first_occurrence 
  ON incident_patterns(first_occurrence);

CREATE INDEX IF NOT EXISTS idx_incident_patterns_last_occurrence 
  ON incident_patterns(last_occurrence DESC);

-- Add updated_at trigger for incident_patterns
DO $$
BEGIN
  DROP TRIGGER IF EXISTS incident_patterns_updated_at ON incident_patterns;
  CREATE TRIGGER incident_patterns_updated_at 
    BEFORE UPDATE ON incident_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on patterns table
ALTER TABLE incident_patterns ENABLE ROW LEVEL SECURITY;

-- Incident Patterns: Executives and admins only
CREATE POLICY "Executives can view patterns" 
  ON incident_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Executives can manage patterns" 
  ON incident_patterns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );
