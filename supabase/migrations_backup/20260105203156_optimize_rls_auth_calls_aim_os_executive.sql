/*
  # Optimize Auth RLS Initialization - AIM OS and Executive Tables

  1. Performance Issue
    - Continuing optimization of RLS policies for executive and operational tables

  2. Tables Optimized
    - service_pricing_matrix (2 policies)
    - payer_contracts
    - patient_satisfaction_signals
    - vendor_registry
    - capex_requests (2 policies)
    - complaint_themes (2 policies)
    - referral_partner_satisfaction (2 policies)
    - okrs (2 policies)
    - segregation_of_duties
    - anomaly_detections
    - data_quality_alerts
    - knowledge_gaps
    - valuation_kpis
    - service_lines (3 policies)
    - service_demand (2 policies)
    - service_capacity (2 policies)
    - service_performance (2 policies)
    - service_lifecycle_events (2 policies)
    - service_dependencies (2 policies)
*/

-- service_pricing_matrix
DROP POLICY IF EXISTS "Executives can manage pricing" ON service_pricing_matrix;
DROP POLICY IF EXISTS "Executives can view pricing data" ON service_pricing_matrix;

CREATE POLICY "Executives can manage pricing"
  ON service_pricing_matrix FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view pricing data"
  ON service_pricing_matrix FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- payer_contracts
DROP POLICY IF EXISTS "Executives can view payer contracts" ON payer_contracts;
CREATE POLICY "Executives can view payer contracts"
  ON payer_contracts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- patient_satisfaction_signals
DROP POLICY IF EXISTS "Executives can view satisfaction signals" ON patient_satisfaction_signals;
CREATE POLICY "Executives can view satisfaction signals"
  ON patient_satisfaction_signals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- vendor_registry
DROP POLICY IF EXISTS "Executives can view vendor registry" ON vendor_registry;
CREATE POLICY "Executives can view vendor registry"
  ON vendor_registry FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- capex_requests
DROP POLICY IF EXISTS "Executives can manage capex" ON capex_requests;
DROP POLICY IF EXISTS "Executives can view capex requests" ON capex_requests;

CREATE POLICY "Executives can manage capex"
  ON capex_requests FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view capex requests"
  ON capex_requests FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- complaint_themes
DROP POLICY IF EXISTS "Executives and clinic managers can manage complaint themes" ON complaint_themes;
DROP POLICY IF EXISTS "Executives and clinic managers can view complaint themes" ON complaint_themes;

CREATE POLICY "Executives and clinic managers can manage complaint themes"
  ON complaint_themes FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view complaint themes"
  ON complaint_themes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- referral_partner_satisfaction
DROP POLICY IF EXISTS "Executives and clinic managers can manage referral partner sati" ON referral_partner_satisfaction;
DROP POLICY IF EXISTS "Executives and clinic managers can view referral partner satisf" ON referral_partner_satisfaction;

CREATE POLICY "Executives and clinic managers can manage referral partner sati"
  ON referral_partner_satisfaction FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view referral partner satisf"
  ON referral_partner_satisfaction FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- okrs
DROP POLICY IF EXISTS "Executives can manage OKRs" ON okrs;
DROP POLICY IF EXISTS "Executives can view OKRs" ON okrs;

CREATE POLICY "Executives can manage OKRs"
  ON okrs FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view OKRs"
  ON okrs FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- segregation_of_duties
DROP POLICY IF EXISTS "Executives can view internal controls" ON segregation_of_duties;
CREATE POLICY "Executives can view internal controls"
  ON segregation_of_duties FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- anomaly_detections
DROP POLICY IF EXISTS "Executives can view anomaly detections" ON anomaly_detections;
CREATE POLICY "Executives can view anomaly detections"
  ON anomaly_detections FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- data_quality_alerts
DROP POLICY IF EXISTS "Executives can view data quality" ON data_quality_alerts;
CREATE POLICY "Executives can view data quality"
  ON data_quality_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- knowledge_gaps
DROP POLICY IF EXISTS "Executives can view knowledge gaps" ON knowledge_gaps;
CREATE POLICY "Executives can view knowledge gaps"
  ON knowledge_gaps FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- valuation_kpis
DROP POLICY IF EXISTS "Executives can view valuation KPIs" ON valuation_kpis;
CREATE POLICY "Executives can view valuation KPIs"
  ON valuation_kpis FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- service_lines
DROP POLICY IF EXISTS "Executives and managers can manage service lines" ON service_lines;
DROP POLICY IF EXISTS "Executives and managers can view service lines" ON service_lines;
DROP POLICY IF EXISTS "Executives can view service lines" ON service_lines;

CREATE POLICY "Executives and managers can manage service lines"
  ON service_lines FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view service lines"
  ON service_lines FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- service_demand
DROP POLICY IF EXISTS "Executives and managers can manage service demand" ON service_demand;
DROP POLICY IF EXISTS "Executives and managers can view service demand" ON service_demand;

CREATE POLICY "Executives and managers can manage service demand"
  ON service_demand FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view service demand"
  ON service_demand FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- service_capacity
DROP POLICY IF EXISTS "Executives and managers can manage service capacity" ON service_capacity;
DROP POLICY IF EXISTS "Executives and managers can view service capacity" ON service_capacity;

CREATE POLICY "Executives and managers can manage service capacity"
  ON service_capacity FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view service capacity"
  ON service_capacity FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- service_performance
DROP POLICY IF EXISTS "Executives and managers can manage service performance" ON service_performance;
DROP POLICY IF EXISTS "Executives and managers can view service performance" ON service_performance;

CREATE POLICY "Executives and managers can manage service performance"
  ON service_performance FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view service performance"
  ON service_performance FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- service_lifecycle_events
DROP POLICY IF EXISTS "Executives and managers can manage lifecycle events" ON service_lifecycle_events;
DROP POLICY IF EXISTS "Executives and managers can view lifecycle events" ON service_lifecycle_events;

CREATE POLICY "Executives and managers can manage lifecycle events"
  ON service_lifecycle_events FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view lifecycle events"
  ON service_lifecycle_events FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- service_dependencies
DROP POLICY IF EXISTS "Executives and managers can manage service dependencies" ON service_dependencies;
DROP POLICY IF EXISTS "Executives and managers can view service dependencies" ON service_dependencies;

CREATE POLICY "Executives and managers can manage service dependencies"
  ON service_dependencies FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view service dependencies"
  ON service_dependencies FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));