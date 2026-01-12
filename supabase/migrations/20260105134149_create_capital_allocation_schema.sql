/*
  # Capital Allocation & Investment Governance Schema

  ## Purpose
  Turns growth spending into disciplined capital deployment with PE-grade discipline.
  
  ## New Tables

  ### `capital_requests`
  Capex requests with ROI justification
  - `id` (uuid, primary key)
  - `request_number` (text, unique)
  - `clinic_id` (uuid, nullable) - null means enterprise-wide
  - `requested_by_user_id` (uuid)
  - `request_date` (date)
  - `project_title` (text)
  - `project_description` (text)
  - `investment_category` (text) - facility, equipment, technology, staff, marketing, operations, other
  - `requested_amount` (numeric)
  - `investment_timeline_months` (integer)
  - `strategic_priority` (text) - critical, high, medium, low
  - `business_case` (text)
  - `expected_annual_roi_percent` (numeric)
  - `payback_period_months` (integer)
  - `revenue_impact_year1` (numeric)
  - `revenue_impact_year2` (numeric)
  - `revenue_impact_year3` (numeric)
  - `cost_savings_year1` (numeric)
  - `cost_savings_year2` (numeric)
  - `cost_savings_year3` (numeric)
  - `risk_assessment` (text)
  - `alternative_options_considered` (text)
  - `status` (text) - draft, submitted, under_review, approved, rejected, funded, cancelled
  - `submitted_date` (timestamptz)
  - `decision_date` (timestamptz)
  - `decision_notes` (text)

  ### `capital_approvals`
  Approval workflow tracking
  - `id` (uuid, primary key)
  - `request_id` (uuid, foreign key)
  - `approver_user_id` (uuid)
  - `approval_level` (text) - manager, director, cfo, ceo
  - `review_date` (timestamptz)
  - `decision` (text) - pending, approved, rejected, needs_revision
  - `comments` (text)
  - `conditions` (text[])

  ### `capital_investments`
  Approved and funded investments
  - `id` (uuid, primary key)
  - `request_id` (uuid, foreign key)
  - `investment_number` (text, unique)
  - `clinic_id` (uuid, nullable)
  - `approved_amount` (numeric)
  - `actual_spent` (numeric)
  - `funding_date` (date)
  - `expected_completion_date` (date)
  - `actual_completion_date` (date)
  - `project_status` (text) - planning, in_progress, completed, on_hold, cancelled
  - `percent_complete` (integer)
  - `budget_variance_percent` (numeric)
  - `timeline_variance_days` (integer)
  - `project_manager_user_id` (uuid)
  - `milestones` (jsonb)
  - `issues` (text[])

  ### `investment_reviews`
  Post-investment performance reviews
  - `id` (uuid, primary key)
  - `investment_id` (uuid, foreign key)
  - `review_date` (date)
  - `review_period` (text) - 6_month, 12_month, 24_month, 36_month
  - `reviewed_by_user_id` (uuid)
  - `actual_roi_percent` (numeric)
  - `actual_revenue_impact` (numeric)
  - `actual_cost_savings` (numeric)
  - `performance_vs_projection` (text) - exceeding, meeting, below, significantly_below
  - `success_metrics` (jsonb)
  - `lessons_learned` (text)
  - `recommendations` (text)
  - `overall_rating` (integer) - 1-5 stars

  ### `clinic_reinvestments`
  Track reinvestment by clinic
  - `id` (uuid, primary key)
  - `clinic_id` (uuid)
  - `fiscal_year` (integer)
  - `fiscal_quarter` (integer)
  - `total_revenue` (numeric)
  - `total_investments` (numeric)
  - `reinvestment_rate_percent` (numeric)
  - `investment_categories` (jsonb)
  - `roi_performance` (numeric)
  - `benchmark_comparison` (text)

  ## Security
  - RLS enabled on all tables
  - Executives only access
  - Investment governance and tracking
*/

-- Capital Requests Table
CREATE TABLE IF NOT EXISTS capital_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  clinic_id uuid,
  requested_by_user_id uuid,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  project_title text NOT NULL,
  project_description text NOT NULL,
  investment_category text NOT NULL,
  requested_amount numeric NOT NULL DEFAULT 0,
  investment_timeline_months integer DEFAULT 12,
  strategic_priority text NOT NULL DEFAULT 'medium',
  business_case text,
  expected_annual_roi_percent numeric DEFAULT 0,
  payback_period_months integer,
  revenue_impact_year1 numeric DEFAULT 0,
  revenue_impact_year2 numeric DEFAULT 0,
  revenue_impact_year3 numeric DEFAULT 0,
  cost_savings_year1 numeric DEFAULT 0,
  cost_savings_year2 numeric DEFAULT 0,
  cost_savings_year3 numeric DEFAULT 0,
  risk_assessment text,
  alternative_options_considered text,
  status text NOT NULL DEFAULT 'draft',
  submitted_date timestamptz,
  decision_date timestamptz,
  decision_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_requests_status ON capital_requests(status);
CREATE INDEX IF NOT EXISTS idx_capital_requests_clinic ON capital_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capital_requests_category ON capital_requests(investment_category);
CREATE INDEX IF NOT EXISTS idx_capital_requests_submitted ON capital_requests(submitted_date);
CREATE INDEX IF NOT EXISTS idx_capital_requests_priority ON capital_requests(strategic_priority);

-- Capital Approvals Table
CREATE TABLE IF NOT EXISTS capital_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES capital_requests(id) ON DELETE CASCADE,
  approver_user_id uuid,
  approval_level text NOT NULL,
  review_date timestamptz DEFAULT now(),
  decision text NOT NULL DEFAULT 'pending',
  comments text,
  conditions text[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_approvals_request ON capital_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_capital_approvals_decision ON capital_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_capital_approvals_level ON capital_approvals(approval_level);

-- Capital Investments Table
CREATE TABLE IF NOT EXISTS capital_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES capital_requests(id) ON DELETE CASCADE,
  investment_number text UNIQUE NOT NULL,
  clinic_id uuid,
  approved_amount numeric NOT NULL DEFAULT 0,
  actual_spent numeric DEFAULT 0,
  funding_date date NOT NULL,
  expected_completion_date date,
  actual_completion_date date,
  project_status text NOT NULL DEFAULT 'planning',
  percent_complete integer DEFAULT 0,
  budget_variance_percent numeric DEFAULT 0,
  timeline_variance_days integer DEFAULT 0,
  project_manager_user_id uuid,
  milestones jsonb,
  issues text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_investments_status ON capital_investments(project_status);
CREATE INDEX IF NOT EXISTS idx_capital_investments_clinic ON capital_investments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capital_investments_completion ON capital_investments(expected_completion_date);

-- Investment Reviews Table
CREATE TABLE IF NOT EXISTS investment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES capital_investments(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  review_period text NOT NULL,
  reviewed_by_user_id uuid,
  actual_roi_percent numeric DEFAULT 0,
  actual_revenue_impact numeric DEFAULT 0,
  actual_cost_savings numeric DEFAULT 0,
  performance_vs_projection text,
  success_metrics jsonb,
  lessons_learned text,
  recommendations text,
  overall_rating integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_reviews_investment ON investment_reviews(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_reviews_period ON investment_reviews(review_period);
CREATE INDEX IF NOT EXISTS idx_investment_reviews_date ON investment_reviews(review_date);

-- Clinic Reinvestments Table
CREATE TABLE IF NOT EXISTS clinic_reinvestments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  fiscal_year integer NOT NULL,
  fiscal_quarter integer NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_investments numeric DEFAULT 0,
  reinvestment_rate_percent numeric DEFAULT 0,
  investment_categories jsonb,
  roi_performance numeric DEFAULT 0,
  benchmark_comparison text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, fiscal_year, fiscal_quarter)
);

CREATE INDEX IF NOT EXISTS idx_clinic_reinvestments_clinic ON clinic_reinvestments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_reinvestments_year ON clinic_reinvestments(fiscal_year, fiscal_quarter);

-- Enable RLS
ALTER TABLE capital_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_reinvestments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives can view capital requests" ON capital_requests;
DROP POLICY IF EXISTS "Executives can manage capital requests" ON capital_requests;
DROP POLICY IF EXISTS "Executives can view capital approvals" ON capital_approvals;
DROP POLICY IF EXISTS "Executives can manage capital approvals" ON capital_approvals;
DROP POLICY IF EXISTS "Executives can view capital investments" ON capital_investments;
DROP POLICY IF EXISTS "Executives can manage capital investments" ON capital_investments;
DROP POLICY IF EXISTS "Executives can view investment reviews" ON investment_reviews;
DROP POLICY IF EXISTS "Executives can manage investment reviews" ON investment_reviews;
DROP POLICY IF EXISTS "Executives can view clinic reinvestments" ON clinic_reinvestments;
DROP POLICY IF EXISTS "Executives can manage clinic reinvestments" ON clinic_reinvestments;

-- RLS Policies for capital_requests
CREATE POLICY "Executives can view capital requests"
  ON capital_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage capital requests"
  ON capital_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for capital_approvals
CREATE POLICY "Executives can view capital approvals"
  ON capital_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage capital approvals"
  ON capital_approvals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for capital_investments
CREATE POLICY "Executives can view capital investments"
  ON capital_investments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage capital investments"
  ON capital_investments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for investment_reviews
CREATE POLICY "Executives can view investment reviews"
  ON investment_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage investment reviews"
  ON investment_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for clinic_reinvestments
CREATE POLICY "Executives can view clinic reinvestments"
  ON clinic_reinvestments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage clinic reinvestments"
  ON clinic_reinvestments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );
