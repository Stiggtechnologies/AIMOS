/*
  # Growth Playbooks Schema

  ## Purpose
  Provide actionable, templated playbooks for local clinic growth including
  campaign templates, outreach scripts, engagement checklists, and seasonal planning

  ## New Tables Created
  
  1. **growth_playbook_templates**
     - Master playbook library (campaigns, outreach, events)
     - Category, difficulty, expected outcomes
     - Reusable templates for all clinics
  
  2. **growth_campaign_templates**
     - Detailed campaign execution plans
     - Objectives, tactics, timelines, budgets
     - Success metrics and KPIs
  
  3. **growth_outreach_scripts**
     - Pre-written scripts for various scenarios
     - Employer outreach, referral partner contact, community engagement
     - Customizable with merge fields
  
  4. **growth_engagement_checklists**
     - Step-by-step task lists for initiatives
     - Progress tracking per checklist
     - Best practice guidance
  
  5. **seasonal_demand_plans**
     - Quarterly demand forecasting
     - Seasonal campaign recommendations
     - Resource planning guidance
  
  6. **playbook_executions**
     - Track playbook implementation by clinic
     - Results measurement
     - Lessons learned

  ## Security
  - RLS enabled on all tables
  - Clinic managers and executives can access
  - Playbook executions scoped to clinic
*/

-- Master Playbook Templates
CREATE TABLE IF NOT EXISTS growth_playbook_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Details
  playbook_name text NOT NULL,
  playbook_type text NOT NULL CHECK (playbook_type IN ('campaign', 'outreach', 'event', 'partnership', 'digital', 'community')),
  category text NOT NULL, -- e.g., "Employer Engagement", "Referral Growth", "Community Presence"
  
  -- Description
  short_description text NOT NULL,
  long_description text,
  objectives text[],
  
  -- Difficulty & Resources
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time_hours integer, -- Time to execute
  estimated_budget numeric(10,2),
  required_resources text[],
  
  -- Expected Outcomes
  expected_leads integer,
  expected_conversion_rate numeric(5,2),
  expected_revenue numeric(12,2),
  expected_roi numeric(6,2),
  
  -- Timing
  best_timing text, -- e.g., "Q1, Back to School, Year-round"
  duration_weeks integer,
  
  -- Popularity
  times_used integer DEFAULT 0,
  avg_success_rating numeric(3,2), -- Out of 5.00
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaign Templates
CREATE TABLE IF NOT EXISTS growth_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_template_id uuid REFERENCES growth_playbook_templates(id) ON DELETE CASCADE,
  
  -- Campaign Structure
  campaign_name text NOT NULL,
  campaign_goal text NOT NULL,
  target_audience text NOT NULL,
  
  -- Execution Plan
  phase_1_description text,
  phase_1_duration_weeks integer,
  phase_1_tasks text[],
  
  phase_2_description text,
  phase_2_duration_weeks integer,
  phase_2_tasks text[],
  
  phase_3_description text,
  phase_3_duration_weeks integer,
  phase_3_tasks text[],
  
  -- Tactics
  marketing_channels text[], -- e.g., ["Email", "Social Media", "Direct Mail", "Events"]
  key_messages text[],
  call_to_action text,
  
  -- Resources
  materials_needed text[],
  budget_breakdown jsonb, -- {"print": 500, "digital": 300, "events": 1200}
  
  -- Measurement
  success_metrics text[],
  kpis jsonb, -- {"leads": 50, "appointments": 30, "conversion_rate": 60}
  
  -- Templates & Assets
  email_templates text[],
  social_media_posts text[],
  flyer_template_url text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Outreach Scripts
CREATE TABLE IF NOT EXISTS growth_outreach_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Script Details
  script_name text NOT NULL,
  script_type text NOT NULL CHECK (script_type IN ('employer_cold', 'employer_warm', 'referral_partner', 'community_leader', 'event_invite', 'follow_up')),
  use_case text NOT NULL,
  
  -- Script Content
  opening text NOT NULL,
  body text NOT NULL,
  closing text NOT NULL,
  full_script text NOT NULL, -- Complete compiled script
  
  -- Customization
  merge_fields jsonb, -- {"clinic_name": "", "contact_name": "", "offer": ""}
  talking_points text[],
  objection_handlers jsonb, -- {"too_expensive": "response", "no_time": "response"}
  
  -- Call to Action
  primary_cta text,
  secondary_cta text,
  
  -- Guidance
  tone text, -- e.g., "Professional", "Friendly", "Urgent"
  best_time_to_use text,
  tips text[],
  
  -- Effectiveness
  times_used integer DEFAULT 0,
  avg_success_rate numeric(5,2),
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Engagement Checklists
CREATE TABLE IF NOT EXISTS growth_engagement_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Checklist Details
  checklist_name text NOT NULL,
  checklist_type text NOT NULL CHECK (checklist_type IN ('event_planning', 'employer_meeting', 'community_partnership', 'launch', 'quarterly_review')),
  description text,
  
  -- Timeline
  recommended_start_timing text, -- e.g., "8 weeks before event"
  total_duration_weeks integer,
  
  -- Tasks (as JSON array for flexibility)
  tasks jsonb NOT NULL, -- [{"task": "...", "week": 1, "owner": "...", "critical": true}]
  
  -- Guidance
  success_criteria text[],
  common_pitfalls text[],
  best_practices text[],
  
  -- Resources
  required_materials text[],
  helpful_links text[],
  
  -- Usage Stats
  times_used integer DEFAULT 0,
  avg_completion_rate numeric(5,2),
  
  -- Metadata
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seasonal Demand Plans
CREATE TABLE IF NOT EXISTS seasonal_demand_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Season Details
  season text NOT NULL CHECK (season IN ('Q1_winter', 'Q2_spring', 'Q3_summer', 'Q4_fall')),
  year integer NOT NULL,
  
  -- Demand Forecast
  expected_demand_trend text CHECK (expected_demand_trend IN ('low', 'moderate', 'high', 'peak')),
  demand_drivers text[], -- e.g., ["Sports injuries increase", "Holiday prep", "New Year resolutions"]
  
  -- Recommended Campaigns
  recommended_playbooks text[], -- Names of playbooks to run
  priority_initiatives text[],
  
  -- Capacity Planning
  recommended_clinician_hours integer,
  recommended_marketing_budget numeric(12,2),
  recommended_inventory_levels jsonb,
  
  -- Timing Guidance
  key_dates jsonb, -- {"back_to_school": "2024-08-15", "thanksgiving": "2024-11-28"}
  campaign_windows jsonb, -- {"employer_benefits": {"start": "2024-01-01", "end": "2024-02-28"}}
  
  -- Historical Performance
  last_year_leads integer,
  last_year_conversion_rate numeric(5,2),
  last_year_revenue numeric(12,2),
  
  -- Adjustments
  market_conditions text,
  competitive_landscape text,
  regulatory_changes text,
  
  -- Metadata
  is_template boolean DEFAULT true, -- Can be copied for specific clinics
  created_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Playbook Executions (Clinic-Specific)
CREATE TABLE IF NOT EXISTS playbook_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  playbook_template_id uuid REFERENCES growth_playbook_templates(id) ON DELETE SET NULL,
  
  -- Execution Details
  execution_name text NOT NULL,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'cancelled')),
  
  -- Timeline
  start_date date NOT NULL,
  planned_end_date date NOT NULL,
  actual_end_date date,
  
  -- Ownership
  owner_id uuid REFERENCES user_profiles(id),
  team_members uuid[],
  
  -- Customization
  custom_objectives text[],
  custom_budget numeric(12,2),
  notes text,
  
  -- Progress Tracking
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  tasks_completed integer DEFAULT 0,
  tasks_total integer DEFAULT 0,
  
  -- Results
  leads_generated integer DEFAULT 0,
  appointments_booked integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0.00,
  roi_achieved numeric(6,2),
  
  -- Learning
  what_worked_well text,
  what_needs_improvement text,
  would_recommend boolean,
  success_rating integer CHECK (success_rating BETWEEN 1 AND 5),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_playbook_templates_type ON growth_playbook_templates(playbook_type);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_category ON growth_playbook_templates(category);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_active ON growth_playbook_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_campaign_templates_playbook ON growth_campaign_templates(playbook_template_id);

CREATE INDEX IF NOT EXISTS idx_outreach_scripts_type ON growth_outreach_scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_outreach_scripts_active ON growth_outreach_scripts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_engagement_checklists_type ON growth_engagement_checklists(checklist_type);
CREATE INDEX IF NOT EXISTS idx_engagement_checklists_active ON growth_engagement_checklists(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_seasonal_plans_season ON seasonal_demand_plans(season, year);
CREATE INDEX IF NOT EXISTS idx_seasonal_plans_template ON seasonal_demand_plans(is_template) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_playbook_executions_clinic ON playbook_executions(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_owner ON playbook_executions(owner_id);
CREATE INDEX IF NOT EXISTS idx_playbook_executions_dates ON playbook_executions(start_date, planned_end_date);

-- Enable RLS
ALTER TABLE growth_playbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_outreach_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_engagement_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_demand_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Clinic Managers and Executives
CREATE POLICY "Clinic managers and executives can view playbook templates"
  ON growth_playbook_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage playbook templates"
  ON growth_playbook_templates FOR ALL
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

CREATE POLICY "Clinic managers and executives can view campaign templates"
  ON growth_campaign_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage campaign templates"
  ON growth_campaign_templates FOR ALL
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

CREATE POLICY "Clinic managers and executives can view outreach scripts"
  ON growth_outreach_scripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage outreach scripts"
  ON growth_outreach_scripts FOR ALL
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

CREATE POLICY "Clinic managers and executives can view engagement checklists"
  ON growth_engagement_checklists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage engagement checklists"
  ON growth_engagement_checklists FOR ALL
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

CREATE POLICY "Clinic managers and executives can view seasonal plans"
  ON seasonal_demand_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage seasonal plans"
  ON seasonal_demand_plans FOR ALL
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

CREATE POLICY "Clinic managers and executives can view playbook executions"
  ON playbook_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage playbook executions"
  ON playbook_executions FOR ALL
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
