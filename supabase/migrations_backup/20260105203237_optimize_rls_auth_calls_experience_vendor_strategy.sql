/*
  # Optimize Auth RLS Initialization - Experience, Vendor, Strategy Tables

  1. Tables Optimized
    - satisfaction_signals (2 policies)
    - reputation_monitoring (2 policies)
    - churn_risk_indicators (2 policies)
    - experience_improvement_actions (2 policies)
    - vendors (2 policies)
    - vendor_contracts (2 policies)
    - vendor_criticality (2 policies)
    - vendor_risk_assessments (2 policies)
    - vendor_incidents (2 policies)
    - vendor_dependencies (2 policies)
    - capital_requests (2 policies)
    - capital_approvals (2 policies)
    - capital_investments (2 policies)
    - investment_reviews (2 policies)
    - clinic_reinvestments (2 policies)
    - strategic_priorities (2 policies)
    - objectives (2 policies)
    - key_results (2 policies)
    - initiatives (2 policies)
    - okr_check_ins (2 policies)
    - clinic_alignment (2 policies)
*/

-- satisfaction_signals
DROP POLICY IF EXISTS "Executives and clinic managers can manage satisfaction signals" ON satisfaction_signals;
DROP POLICY IF EXISTS "Executives and clinic managers can view satisfaction signals" ON satisfaction_signals;

CREATE POLICY "Executives and clinic managers can manage satisfaction signals"
  ON satisfaction_signals FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view satisfaction signals"
  ON satisfaction_signals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- reputation_monitoring
DROP POLICY IF EXISTS "Executives and clinic managers can manage reputation monitoring" ON reputation_monitoring;
DROP POLICY IF EXISTS "Executives and clinic managers can view reputation monitoring" ON reputation_monitoring;

CREATE POLICY "Executives and clinic managers can manage reputation monitoring"
  ON reputation_monitoring FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view reputation monitoring"
  ON reputation_monitoring FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- churn_risk_indicators
DROP POLICY IF EXISTS "Executives and clinic managers can manage churn risk indicators" ON churn_risk_indicators;
DROP POLICY IF EXISTS "Executives and clinic managers can view churn risk indicators" ON churn_risk_indicators;

CREATE POLICY "Executives and clinic managers can manage churn risk indicators"
  ON churn_risk_indicators FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view churn risk indicators"
  ON churn_risk_indicators FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- experience_improvement_actions
DROP POLICY IF EXISTS "Executives and clinic managers can manage improvement actions" ON experience_improvement_actions;
DROP POLICY IF EXISTS "Executives and clinic managers can view improvement actions" ON experience_improvement_actions;

CREATE POLICY "Executives and clinic managers can manage improvement actions"
  ON experience_improvement_actions FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view improvement actions"
  ON experience_improvement_actions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendors
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendors" ON vendors;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendors" ON vendors;

CREATE POLICY "Executives and clinic managers can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendor_contracts
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor contracts" ON vendor_contracts;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor contracts" ON vendor_contracts;

CREATE POLICY "Executives and clinic managers can manage vendor contracts"
  ON vendor_contracts FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendor contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendor_criticality
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor criticality" ON vendor_criticality;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor criticality" ON vendor_criticality;

CREATE POLICY "Executives and clinic managers can manage vendor criticality"
  ON vendor_criticality FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendor criticality"
  ON vendor_criticality FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendor_risk_assessments
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor risk assessmen" ON vendor_risk_assessments;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor risk assessments" ON vendor_risk_assessments;

CREATE POLICY "Executives and clinic managers can manage vendor risk assessmen"
  ON vendor_risk_assessments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendor risk assessments"
  ON vendor_risk_assessments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendor_incidents
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor incidents" ON vendor_incidents;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor incidents" ON vendor_incidents;

CREATE POLICY "Executives and clinic managers can manage vendor incidents"
  ON vendor_incidents FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendor incidents"
  ON vendor_incidents FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- vendor_dependencies
DROP POLICY IF EXISTS "Executives and clinic managers can manage vendor dependencies" ON vendor_dependencies;
DROP POLICY IF EXISTS "Executives and clinic managers can view vendor dependencies" ON vendor_dependencies;

CREATE POLICY "Executives and clinic managers can manage vendor dependencies"
  ON vendor_dependencies FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view vendor dependencies"
  ON vendor_dependencies FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- capital_requests
DROP POLICY IF EXISTS "Executives can manage capital requests" ON capital_requests;
DROP POLICY IF EXISTS "Executives can view capital requests" ON capital_requests;

CREATE POLICY "Executives can manage capital requests"
  ON capital_requests FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view capital requests"
  ON capital_requests FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- capital_approvals
DROP POLICY IF EXISTS "Executives can manage capital approvals" ON capital_approvals;
DROP POLICY IF EXISTS "Executives can view capital approvals" ON capital_approvals;

CREATE POLICY "Executives can manage capital approvals"
  ON capital_approvals FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view capital approvals"
  ON capital_approvals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- capital_investments
DROP POLICY IF EXISTS "Executives can manage capital investments" ON capital_investments;
DROP POLICY IF EXISTS "Executives can view capital investments" ON capital_investments;

CREATE POLICY "Executives can manage capital investments"
  ON capital_investments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view capital investments"
  ON capital_investments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- investment_reviews
DROP POLICY IF EXISTS "Executives can manage investment reviews" ON investment_reviews;
DROP POLICY IF EXISTS "Executives can view investment reviews" ON investment_reviews;

CREATE POLICY "Executives can manage investment reviews"
  ON investment_reviews FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view investment reviews"
  ON investment_reviews FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- clinic_reinvestments
DROP POLICY IF EXISTS "Executives can manage clinic reinvestments" ON clinic_reinvestments;
DROP POLICY IF EXISTS "Executives can view clinic reinvestments" ON clinic_reinvestments;

CREATE POLICY "Executives can manage clinic reinvestments"
  ON clinic_reinvestments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can view clinic reinvestments"
  ON clinic_reinvestments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- strategic_priorities
DROP POLICY IF EXISTS "Executives and managers can manage strategic priorities" ON strategic_priorities;
DROP POLICY IF EXISTS "Executives and managers can view strategic priorities" ON strategic_priorities;

CREATE POLICY "Executives and managers can manage strategic priorities"
  ON strategic_priorities FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view strategic priorities"
  ON strategic_priorities FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- objectives
DROP POLICY IF EXISTS "Executives and managers can manage objectives" ON objectives;
DROP POLICY IF EXISTS "Executives and managers can view objectives" ON objectives;

CREATE POLICY "Executives and managers can manage objectives"
  ON objectives FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view objectives"
  ON objectives FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- key_results
DROP POLICY IF EXISTS "Executives and managers can manage key results" ON key_results;
DROP POLICY IF EXISTS "Executives and managers can view key results" ON key_results;

CREATE POLICY "Executives and managers can manage key results"
  ON key_results FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view key results"
  ON key_results FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- initiatives
DROP POLICY IF EXISTS "Executives and managers can manage initiatives" ON initiatives;
DROP POLICY IF EXISTS "Executives and managers can view initiatives" ON initiatives;

CREATE POLICY "Executives and managers can manage initiatives"
  ON initiatives FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view initiatives"
  ON initiatives FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- okr_check_ins
DROP POLICY IF EXISTS "Executives and managers can manage check-ins" ON okr_check_ins;
DROP POLICY IF EXISTS "Executives and managers can view check-ins" ON okr_check_ins;

CREATE POLICY "Executives and managers can manage check-ins"
  ON okr_check_ins FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view check-ins"
  ON okr_check_ins FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- clinic_alignment
DROP POLICY IF EXISTS "Executives and managers can manage clinic alignment" ON clinic_alignment;
DROP POLICY IF EXISTS "Executives and managers can view clinic alignment" ON clinic_alignment;

CREATE POLICY "Executives and managers can manage clinic alignment"
  ON clinic_alignment FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and managers can view clinic alignment"
  ON clinic_alignment FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));