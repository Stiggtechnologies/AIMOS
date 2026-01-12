/*
  # Optimize Auth RLS Initialization - Internal Controls and Valuation Tables

  1. Tables Optimized
    - segregation_of_duties_rules (2 policies)
    - approval_thresholds (2 policies)
    - duty_violations (2 policies)
    - override_tracking (2 policies)
    - manual_anomaly_flags (2 policies)
    - audit_alerts (2 policies)
    - approval_workflows (2 policies)
    - approval_workflow_steps (2 policies)
    - kpi_normalizations (2 policies)
    - diligence_categories (2 policies)
    - diligence_checklists (2 policies)
    - data_room_structure (2 policies)
    - data_room_documents (2 policies)
    - operational_maturity_dimensions (2 policies)
    - maturity_assessments (2 policies)
    - exit_readiness_metrics (2 policies)
    - buyer_profiles (2 policies)
    - value_drivers (2 policies)
*/

-- segregation_of_duties_rules
DROP POLICY IF EXISTS "Executives can manage SOD rules" ON segregation_of_duties_rules;
DROP POLICY IF EXISTS "Executives can view SOD rules" ON segregation_of_duties_rules;

CREATE POLICY "Executives can manage SOD rules"
  ON segregation_of_duties_rules FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view SOD rules"
  ON segregation_of_duties_rules FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- approval_thresholds (duplicated, kept first set)

-- duty_violations (duplicated, kept first set)

-- override_tracking (duplicated, kept first set)

-- manual_anomaly_flags (duplicated, kept first set)

-- audit_alerts (duplicated, kept first set)

-- approval_workflows (duplicated, kept first set)

-- approval_workflow_steps (duplicated, kept first set)

-- kpi_normalizations
DROP POLICY IF EXISTS "Executives can manage KPI normalizations" ON kpi_normalizations;
DROP POLICY IF EXISTS "Executives can view KPI normalizations" ON kpi_normalizations;

CREATE POLICY "Executives can manage KPI normalizations"
  ON kpi_normalizations FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view KPI normalizations"
  ON kpi_normalizations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- diligence_categories
DROP POLICY IF EXISTS "Executives can manage diligence categories" ON diligence_categories;
DROP POLICY IF EXISTS "Executives can view diligence categories" ON diligence_categories;

CREATE POLICY "Executives can manage diligence categories"
  ON diligence_categories FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view diligence categories"
  ON diligence_categories FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- diligence_checklists
DROP POLICY IF EXISTS "Executives can manage diligence checklists" ON diligence_checklists;
DROP POLICY IF EXISTS "Executives can view diligence checklists" ON diligence_checklists;

CREATE POLICY "Executives can manage diligence checklists"
  ON diligence_checklists FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view diligence checklists"
  ON diligence_checklists FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- data_room_structure
DROP POLICY IF EXISTS "Executives can manage data room structure" ON data_room_structure;
DROP POLICY IF EXISTS "Executives can view data room structure" ON data_room_structure;

CREATE POLICY "Executives can manage data room structure"
  ON data_room_structure FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view data room structure"
  ON data_room_structure FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- data_room_documents
DROP POLICY IF EXISTS "Executives can manage data room documents" ON data_room_documents;
DROP POLICY IF EXISTS "Executives can view data room documents" ON data_room_documents;

CREATE POLICY "Executives can manage data room documents"
  ON data_room_documents FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view data room documents"
  ON data_room_documents FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- operational_maturity_dimensions
DROP POLICY IF EXISTS "Executives can manage maturity dimensions" ON operational_maturity_dimensions;
DROP POLICY IF EXISTS "Executives can view maturity dimensions" ON operational_maturity_dimensions;

CREATE POLICY "Executives can manage maturity dimensions"
  ON operational_maturity_dimensions FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view maturity dimensions"
  ON operational_maturity_dimensions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- maturity_assessments
DROP POLICY IF EXISTS "Executives can manage maturity assessments" ON maturity_assessments;
DROP POLICY IF EXISTS "Executives can view maturity assessments" ON maturity_assessments;

CREATE POLICY "Executives can manage maturity assessments"
  ON maturity_assessments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view maturity assessments"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- exit_readiness_metrics
DROP POLICY IF EXISTS "Executives can manage exit readiness metrics" ON exit_readiness_metrics;
DROP POLICY IF EXISTS "Executives can view exit readiness metrics" ON exit_readiness_metrics;

CREATE POLICY "Executives can manage exit readiness metrics"
  ON exit_readiness_metrics FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view exit readiness metrics"
  ON exit_readiness_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- buyer_profiles
DROP POLICY IF EXISTS "Executives can manage buyer profiles" ON buyer_profiles;
DROP POLICY IF EXISTS "Executives can view buyer profiles" ON buyer_profiles;

CREATE POLICY "Executives can manage buyer profiles"
  ON buyer_profiles FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view buyer profiles"
  ON buyer_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- value_drivers
DROP POLICY IF EXISTS "Executives can manage value drivers" ON value_drivers;
DROP POLICY IF EXISTS "Executives can view value drivers" ON value_drivers;

CREATE POLICY "Executives can manage value drivers"
  ON value_drivers FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view value drivers"
  ON value_drivers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));