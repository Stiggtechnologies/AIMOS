/*
  # Exit & Valuation Readiness Schema

  ## Purpose
  Maximizes business valuation through operational maturity demonstration and buyer-ready preparation.
  
  ## New Tables

  ### `kpi_normalizations`
  Financial and operational KPIs normalized for buyer analysis
  - `id` (uuid, primary key)
  - `period` (text) - month/quarter/year identifier
  - `period_start` (date)
  - `period_end` (date)
  - `reported_revenue` (numeric)
  - `normalized_revenue` (numeric)
  - `revenue_adjustments` (jsonb) - breakdown of adjustments
  - `reported_ebitda` (numeric)
  - `normalized_ebitda` (numeric)
  - `ebitda_adjustments` (jsonb) - one-time costs, non-recurring items
  - `reported_gross_margin` (numeric)
  - `normalized_gross_margin` (numeric)
  - `reported_operating_margin` (numeric)
  - `normalized_operating_margin` (numeric)
  - `customer_acquisition_cost` (numeric)
  - `lifetime_value` (numeric)
  - `ltv_cac_ratio` (numeric)
  - `rule_of_40_score` (numeric) - growth rate + profit margin
  - `notes` (text)

  ### `diligence_categories`
  Major due diligence categories
  - `id` (uuid, primary key)
  - `category_code` (text, unique)
  - `category_name` (text)
  - `description` (text)
  - `importance_level` (text) - critical, high, medium, low
  - `typical_buyer_focus` (text)
  - `display_order` (integer)

  ### `diligence_checklists`
  Specific diligence items buyers examine
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key)
  - `item_number` (text)
  - `item_name` (text)
  - `description` (text)
  - `required_for_exit` (boolean)
  - `buyer_scrutiny_level` (text) - critical, high, medium, low
  - `completion_status` (text) - complete, in_progress, not_started, not_applicable
  - `completion_percentage` (integer)
  - `assigned_owner_id` (uuid)
  - `target_completion_date` (date)
  - `actual_completion_date` (date)
  - `evidence_location` (text)
  - `notes` (text)

  ### `data_room_structure`
  Organized virtual data room for buyer access
  - `id` (uuid, primary key)
  - `folder_path` (text)
  - `folder_name` (text)
  - `parent_folder_id` (uuid, self-reference)
  - `folder_type` (text) - category, subcategory, document_set
  - `diligence_category_id` (uuid)
  - `description` (text)
  - `document_count` (integer)
  - `is_confidential` (boolean)
  - `access_level` (text) - public, phase1, phase2, final
  - `display_order` (integer)

  ### `data_room_documents`
  Documents prepared for buyer review
  - `id` (uuid, primary key)
  - `folder_id` (uuid, foreign key)
  - `document_name` (text)
  - `document_type` (text)
  - `description` (text)
  - `file_path` (text)
  - `file_size_mb` (numeric)
  - `version` (text)
  - `upload_date` (date)
  - `last_updated` (date)
  - `uploaded_by_user_id` (uuid)
  - `is_redacted` (boolean)
  - `requires_nda` (boolean)
  - `access_log_enabled` (boolean)
  - `status` (text) - draft, review, approved, published

  ### `operational_maturity_dimensions`
  Key dimensions of operational maturity
  - `id` (uuid, primary key)
  - `dimension_code` (text, unique)
  - `dimension_name` (text)
  - `description` (text)
  - `weight` (numeric) - importance in overall score
  - `max_score` (integer)
  - `evaluation_criteria` (jsonb)

  ### `maturity_assessments`
  Current maturity scoring across dimensions
  - `id` (uuid, primary key)
  - `assessment_date` (date)
  - `dimension_id` (uuid, foreign key)
  - `current_score` (integer)
  - `target_score` (integer)
  - `score_rationale` (text)
  - `strengths` (text[])
  - `weaknesses` (text[])
  - `improvement_initiatives` (text[])
  - `assessed_by_user_id` (uuid)
  - `next_assessment_date` (date)

  ### `exit_readiness_metrics`
  Overall exit readiness tracking
  - `id` (uuid, primary key)
  - `metric_date` (date)
  - `overall_readiness_score` (integer) - 0-100
  - `diligence_completion_percentage` (integer)
  - `data_room_completion_percentage` (integer)
  - `maturity_score` (integer)
  - `financial_quality_score` (integer)
  - `operational_quality_score` (integer)
  - `tech_quality_score` (integer)
  - `estimated_multiple_low` (numeric)
  - `estimated_multiple_high` (numeric)
  - `value_creation_opportunities` (jsonb)
  - `red_flags` (jsonb)
  - `competitive_advantages` (jsonb)

  ### `buyer_profiles`
  Potential buyer types and their preferences
  - `id` (uuid, primary key)
  - `buyer_type` (text) - strategic, financial_sponsor, family_office, corporate
  - `buyer_name` (text)
  - `typical_check_size_min` (numeric)
  - `typical_check_size_max` (numeric)
  - `preferred_revenue_range_min` (numeric)
  - `preferred_revenue_range_max` (numeric)
  - `key_evaluation_criteria` (text[])
  - `typical_hold_period` (text)
  - `integration_approach` (text)
  - `deal_structure_preference` (text)
  - `fit_score` (integer) - how well we match their criteria

  ### `value_drivers`
  Key factors that drive valuation multiples
  - `id` (uuid, primary key)
  - `driver_category` (text) - financial, operational, market, strategic
  - `driver_name` (text)
  - `description` (text)
  - `current_rating` (text) - strong, moderate, weak
  - `impact_on_multiple` (text) - high, medium, low
  - `supporting_evidence` (text)
  - `improvement_plan` (text)
  - `target_timeline` (date)

  ## Security
  - RLS enabled on all tables
  - Executives only access
  - Very high valuation impact
*/

-- KPI Normalizations Table
CREATE TABLE kpi_normalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  reported_revenue numeric DEFAULT 0,
  normalized_revenue numeric DEFAULT 0,
  revenue_adjustments jsonb,
  reported_ebitda numeric DEFAULT 0,
  normalized_ebitda numeric DEFAULT 0,
  ebitda_adjustments jsonb,
  reported_gross_margin numeric DEFAULT 0,
  normalized_gross_margin numeric DEFAULT 0,
  reported_operating_margin numeric DEFAULT 0,
  normalized_operating_margin numeric DEFAULT 0,
  customer_acquisition_cost numeric DEFAULT 0,
  lifetime_value numeric DEFAULT 0,
  ltv_cac_ratio numeric DEFAULT 0,
  rule_of_40_score numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kpi_normalizations_period ON kpi_normalizations(period_start, period_end);
CREATE INDEX idx_kpi_normalizations_period_text ON kpi_normalizations(period);

-- Diligence Categories Table
CREATE TABLE diligence_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text UNIQUE NOT NULL,
  category_name text NOT NULL,
  description text NOT NULL,
  importance_level text NOT NULL DEFAULT 'medium',
  typical_buyer_focus text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_diligence_categories_order ON diligence_categories(display_order);

-- Diligence Checklists Table
CREATE TABLE diligence_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES diligence_categories(id) ON DELETE CASCADE,
  item_number text NOT NULL,
  item_name text NOT NULL,
  description text NOT NULL,
  required_for_exit boolean DEFAULT false,
  buyer_scrutiny_level text NOT NULL DEFAULT 'medium',
  completion_status text NOT NULL DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0,
  assigned_owner_id uuid,
  target_completion_date date,
  actual_completion_date date,
  evidence_location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_diligence_checklists_category ON diligence_checklists(category_id);
CREATE INDEX idx_diligence_checklists_status ON diligence_checklists(completion_status);
CREATE INDEX idx_diligence_checklists_required ON diligence_checklists(required_for_exit);

-- Data Room Structure Table
CREATE TABLE data_room_structure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_path text NOT NULL,
  folder_name text NOT NULL,
  parent_folder_id uuid REFERENCES data_room_structure(id) ON DELETE CASCADE,
  folder_type text NOT NULL DEFAULT 'category',
  diligence_category_id uuid REFERENCES diligence_categories(id) ON DELETE SET NULL,
  description text,
  document_count integer DEFAULT 0,
  is_confidential boolean DEFAULT false,
  access_level text NOT NULL DEFAULT 'public',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_data_room_structure_parent ON data_room_structure(parent_folder_id);
CREATE INDEX idx_data_room_structure_category ON data_room_structure(diligence_category_id);
CREATE INDEX idx_data_room_structure_access ON data_room_structure(access_level);

-- Data Room Documents Table
CREATE TABLE data_room_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES data_room_structure(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  description text,
  file_path text,
  file_size_mb numeric DEFAULT 0,
  version text DEFAULT '1.0',
  upload_date date DEFAULT CURRENT_DATE,
  last_updated date DEFAULT CURRENT_DATE,
  uploaded_by_user_id uuid,
  is_redacted boolean DEFAULT false,
  requires_nda boolean DEFAULT false,
  access_log_enabled boolean DEFAULT true,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_data_room_documents_folder ON data_room_documents(folder_id);
CREATE INDEX idx_data_room_documents_status ON data_room_documents(status);
CREATE INDEX idx_data_room_documents_type ON data_room_documents(document_type);

-- Operational Maturity Dimensions Table
CREATE TABLE operational_maturity_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_code text UNIQUE NOT NULL,
  dimension_name text NOT NULL,
  description text NOT NULL,
  weight numeric DEFAULT 1.0,
  max_score integer DEFAULT 100,
  evaluation_criteria jsonb,
  created_at timestamptz DEFAULT now()
);

-- Maturity Assessments Table
CREATE TABLE maturity_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  dimension_id uuid REFERENCES operational_maturity_dimensions(id) ON DELETE CASCADE,
  current_score integer DEFAULT 0,
  target_score integer DEFAULT 100,
  score_rationale text,
  strengths text[],
  weaknesses text[],
  improvement_initiatives text[],
  assessed_by_user_id uuid,
  next_assessment_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maturity_assessments_dimension ON maturity_assessments(dimension_id);
CREATE INDEX idx_maturity_assessments_date ON maturity_assessments(assessment_date);

-- Exit Readiness Metrics Table
CREATE TABLE exit_readiness_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  overall_readiness_score integer DEFAULT 0,
  diligence_completion_percentage integer DEFAULT 0,
  data_room_completion_percentage integer DEFAULT 0,
  maturity_score integer DEFAULT 0,
  financial_quality_score integer DEFAULT 0,
  operational_quality_score integer DEFAULT 0,
  tech_quality_score integer DEFAULT 0,
  estimated_multiple_low numeric DEFAULT 0,
  estimated_multiple_high numeric DEFAULT 0,
  value_creation_opportunities jsonb,
  red_flags jsonb,
  competitive_advantages jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_exit_readiness_metrics_date ON exit_readiness_metrics(metric_date);

-- Buyer Profiles Table
CREATE TABLE buyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_type text NOT NULL,
  buyer_name text NOT NULL,
  typical_check_size_min numeric DEFAULT 0,
  typical_check_size_max numeric DEFAULT 0,
  preferred_revenue_range_min numeric DEFAULT 0,
  preferred_revenue_range_max numeric DEFAULT 0,
  key_evaluation_criteria text[],
  typical_hold_period text,
  integration_approach text,
  deal_structure_preference text,
  fit_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_buyer_profiles_type ON buyer_profiles(buyer_type);
CREATE INDEX idx_buyer_profiles_fit ON buyer_profiles(fit_score);

-- Value Drivers Table
CREATE TABLE value_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_category text NOT NULL,
  driver_name text NOT NULL,
  description text NOT NULL,
  current_rating text NOT NULL DEFAULT 'moderate',
  impact_on_multiple text NOT NULL DEFAULT 'medium',
  supporting_evidence text,
  improvement_plan text,
  target_timeline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_value_drivers_category ON value_drivers(driver_category);
CREATE INDEX idx_value_drivers_rating ON value_drivers(current_rating);

-- Enable RLS
ALTER TABLE kpi_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diligence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE diligence_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_maturity_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maturity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_readiness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_drivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Executives only)
CREATE POLICY "Executives can view KPI normalizations"
  ON kpi_normalizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage KPI normalizations"
  ON kpi_normalizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view diligence categories"
  ON diligence_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage diligence categories"
  ON diligence_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view diligence checklists"
  ON diligence_checklists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage diligence checklists"
  ON diligence_checklists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view data room structure"
  ON data_room_structure FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage data room structure"
  ON data_room_structure FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view data room documents"
  ON data_room_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage data room documents"
  ON data_room_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view maturity dimensions"
  ON operational_maturity_dimensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage maturity dimensions"
  ON operational_maturity_dimensions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view maturity assessments"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage maturity assessments"
  ON maturity_assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view exit readiness metrics"
  ON exit_readiness_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage exit readiness metrics"
  ON exit_readiness_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view buyer profiles"
  ON buyer_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage buyer profiles"
  ON buyer_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can view value drivers"
  ON value_drivers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage value drivers"
  ON value_drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );
