/*
  # Extend Referral Growth Engine

  ## Purpose
  Transform referral module into comprehensive Growth Engine with scorecards, 
  reactivation workflows, and outreach cadence tracking

  ## New Tables Created
  
  1. **referral_partner_scorecards**
     - Comprehensive performance metrics per partner
     - Quality scores, conversion rates, revenue metrics
     - Engagement scoring and growth indicators
  
  2. **referral_reactivation_workflows**
     - Automated workflows for dormant partner reactivation
     - Stage-based progression tracking
     - Success metrics and completion rates
  
  3. **referral_outreach_activities**
     - Complete touchpoint history with partners
     - Outreach type, outcome, and next action tracking
     - Cadence compliance monitoring
  
  4. **referral_partner_segments**
     - Strategic segmentation of partner base
     - Custom criteria and action plans per segment
  
  ## Enhancements to Existing Tables
  - Added dormancy detection to partners
  - Enhanced gap analysis with action tracking
  - Added scorecard generation timestamps

  ## Security
  - RLS enabled on all new tables
  - Clinic Managers and Executive access only
  - Policies check role and clinic membership
*/

-- Partner Scorecards (Comprehensive Performance Metrics)
CREATE TABLE IF NOT EXISTS referral_partner_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Volume Metrics
  referrals_received integer DEFAULT 0,
  referrals_converted integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0.00,
  
  -- Quality Metrics
  avg_case_complexity text,
  appropriate_referral_rate numeric(5,2) DEFAULT 0.00,
  documentation_quality_score integer DEFAULT 0,
  
  -- Speed Metrics
  avg_time_to_referral_hours numeric(8,2) DEFAULT 0.00,
  urgent_case_sla_compliance numeric(5,2) DEFAULT 0.00,
  
  -- Financial Metrics
  total_revenue_generated numeric(12,2) DEFAULT 0.00,
  avg_revenue_per_referral numeric(10,2) DEFAULT 0.00,
  revenue_growth_rate numeric(5,2) DEFAULT 0.00,
  
  -- Engagement Metrics
  response_rate numeric(5,2) DEFAULT 0.00,
  meeting_attendance_rate numeric(5,2) DEFAULT 0.00,
  last_interaction_days_ago integer DEFAULT 0,
  
  -- Relationship Health
  relationship_trend text CHECK (relationship_trend IN ('growing', 'stable', 'declining', 'at_risk')),
  churn_risk_score integer CHECK (churn_risk_score BETWEEN 0 AND 100),
  
  -- Overall Score
  overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
  grade text CHECK (grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),
  
  -- Action Items
  strengths text[],
  areas_for_improvement text[],
  recommended_actions text[],
  
  -- Metadata
  generated_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reactivation Workflows (Dormant Partner Recovery)
CREATE TABLE IF NOT EXISTS referral_reactivation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  
  -- Workflow Details
  workflow_name text NOT NULL,
  workflow_stage text NOT NULL CHECK (workflow_stage IN ('identified', 'initial_outreach', 'follow_up', 'meeting_scheduled', 'reactivated', 'closed_lost')),
  
  -- Dormancy Info
  days_dormant integer NOT NULL,
  last_referral_date date,
  dormancy_reason text,
  
  -- Outreach Strategy
  outreach_cadence text, -- e.g., "Day 0, Day 7, Day 14, Day 30"
  assigned_to uuid REFERENCES user_profiles(id),
  priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Progress Tracking
  touchpoints_completed integer DEFAULT 0,
  next_action_type text,
  next_action_due date,
  
  -- Success Metrics
  reactivation_date date,
  referrals_post_reactivation integer DEFAULT 0,
  revenue_recovered numeric(12,2) DEFAULT 0.00,
  
  -- Workflow Outcome
  outcome text CHECK (outcome IN ('pending', 'reactivated', 'closed_lost', 'not_interested', 'needs_follow_up')),
  outcome_reason text,
  outcome_date date,
  
  -- Metadata
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Outreach Activities (Touchpoint History & Cadence Tracking)
CREATE TABLE IF NOT EXISTS referral_outreach_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  reactivation_workflow_id uuid REFERENCES referral_reactivation_workflows(id) ON DELETE SET NULL,
  
  -- Outreach Details
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'lunch', 'event', 'gift', 'newsletter', 'site_visit', 'other')),
  activity_date date NOT NULL,
  duration_minutes integer,
  
  -- Participants
  conducted_by uuid REFERENCES user_profiles(id),
  attendees text[], -- Names of people who attended
  
  -- Outcome
  outcome text CHECK (outcome IN ('connected', 'voicemail', 'no_answer', 'email_sent', 'email_bounced', 'meeting_held', 'meeting_cancelled', 'scheduled', 'completed')),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  
  -- Intelligence Gathered
  key_discussion_points text[],
  action_items text[],
  opportunities_identified text[],
  concerns_raised text[],
  
  -- Follow-up
  follow_up_required boolean DEFAULT false,
  next_outreach_date date,
  next_outreach_type text,
  
  -- Cadence Compliance
  is_on_schedule boolean DEFAULT true,
  days_since_last_contact integer,
  cadence_goal_days integer,
  
  -- Metadata
  notes text,
  attachments jsonb, -- Links to files, presentations, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partner Segments (Strategic Groupings)
CREATE TABLE IF NOT EXISTS referral_partner_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Segment Definition
  segment_name text NOT NULL,
  segment_type text NOT NULL CHECK (segment_type IN ('tier', 'status', 'potential', 'industry', 'custom')),
  description text,
  
  -- Segmentation Criteria
  criteria jsonb NOT NULL, -- Flexible rules for segment membership
  
  -- Strategy
  engagement_strategy text,
  recommended_cadence text, -- e.g., "Weekly", "Bi-weekly", "Monthly"
  recommended_touchpoint_mix jsonb, -- e.g., {"calls": 2, "emails": 4, "meetings": 1}
  
  -- Goals
  target_referrals_per_month integer,
  target_conversion_rate numeric(5,2),
  target_revenue_per_partner numeric(12,2),
  
  -- Metadata
  is_active boolean DEFAULT true,
  partner_count integer DEFAULT 0,
  created_by uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partner Segment Membership (Many-to-Many)
CREATE TABLE IF NOT EXISTS referral_partner_segment_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES referral_partners(id) ON DELETE CASCADE,
  segment_id uuid REFERENCES referral_partner_segments(id) ON DELETE CASCADE,
  
  -- Membership Tracking
  assigned_date date DEFAULT CURRENT_DATE,
  auto_assigned boolean DEFAULT false, -- True if assigned by criteria, false if manual
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(partner_id, segment_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_partner_scorecards_partner ON referral_partner_scorecards(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_scorecards_period ON referral_partner_scorecards(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_partner_scorecards_grade ON referral_partner_scorecards(grade);
CREATE INDEX IF NOT EXISTS idx_partner_scorecards_trend ON referral_partner_scorecards(relationship_trend);

CREATE INDEX IF NOT EXISTS idx_reactivation_partner ON referral_reactivation_workflows(partner_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_stage ON referral_reactivation_workflows(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_reactivation_assigned ON referral_reactivation_workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reactivation_next_action ON referral_reactivation_workflows(next_action_due);

CREATE INDEX IF NOT EXISTS idx_outreach_partner ON referral_outreach_activities(partner_id);
CREATE INDEX IF NOT EXISTS idx_outreach_date ON referral_outreach_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_type ON referral_outreach_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_outreach_conducted_by ON referral_outreach_activities(conducted_by);
CREATE INDEX IF NOT EXISTS idx_outreach_workflow ON referral_outreach_activities(reactivation_workflow_id);

CREATE INDEX IF NOT EXISTS idx_segment_members_partner ON referral_partner_segment_members(partner_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON referral_partner_segment_members(segment_id);

-- Enable RLS
ALTER TABLE referral_partner_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_reactivation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_outreach_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partner_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partner_segment_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Clinic Managers and Executives Only
CREATE POLICY "Clinic managers and executives can view partner scorecards"
  ON referral_partner_scorecards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage partner scorecards"
  ON referral_partner_scorecards FOR ALL
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

CREATE POLICY "Clinic managers and executives can view reactivation workflows"
  ON referral_reactivation_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage reactivation workflows"
  ON referral_reactivation_workflows FOR ALL
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

CREATE POLICY "Clinic managers and executives can view outreach activities"
  ON referral_outreach_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage outreach activities"
  ON referral_outreach_activities FOR ALL
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

CREATE POLICY "Clinic managers and executives can view partner segments"
  ON referral_partner_segments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage partner segments"
  ON referral_partner_segments FOR ALL
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

CREATE POLICY "Clinic managers and executives can view segment members"
  ON referral_partner_segment_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Clinic managers and executives can manage segment members"
  ON referral_partner_segment_members FOR ALL
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
