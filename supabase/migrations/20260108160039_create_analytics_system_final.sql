/*
  # Analytics & Reporting System - Final

  Creates comprehensive analytics with executive dashboards, cross-module analytics,
  and custom reporting capabilities.
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE analytics_report_type AS ENUM ('executive', 'operational', 'compliance', 'financial', 'growth', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE analytics_delivery_method AS ENUM ('email', 'download', 'dashboard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE analytics_export_format AS ENUM ('pdf', 'excel', 'csv', 'json');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE analytics_execution_status AS ENUM ('queued', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report Definitions table
CREATE TABLE IF NOT EXISTS analytics_report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type analytics_report_type NOT NULL DEFAULT 'custom',
  data_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb DEFAULT '{}'::jsonb,
  grouping jsonb DEFAULT '[]'::jsonb,
  visualization_config jsonb DEFAULT '{"type": "table", "chartType": "line", "showTotals": true}'::jsonb,
  is_system boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scheduled Reports table
CREATE TABLE IF NOT EXISTS analytics_scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id uuid NOT NULL REFERENCES analytics_report_definitions(id) ON DELETE CASCADE,
  schedule_cron text NOT NULL,
  delivery_method analytics_delivery_method NOT NULL DEFAULT 'email',
  recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
  format analytics_export_format NOT NULL DEFAULT 'pdf',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Report Executions table
CREATE TABLE IF NOT EXISTS analytics_report_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id uuid NOT NULL REFERENCES analytics_report_definitions(id) ON DELETE CASCADE,
  scheduled_report_id uuid REFERENCES analytics_scheduled_reports(id) ON DELETE SET NULL,
  executed_by uuid REFERENCES auth.users(id),
  execution_started_at timestamptz DEFAULT now(),
  execution_completed_at timestamptz,
  status analytics_execution_status DEFAULT 'queued',
  row_count integer DEFAULT 0,
  file_path text,
  error_message text,
  execution_params jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_definitions_type ON analytics_report_definitions(report_type);
CREATE INDEX IF NOT EXISTS idx_report_definitions_clinic ON analytics_report_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_report_definitions_public ON analytics_report_definitions(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_report_definitions_creator ON analytics_report_definitions(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON analytics_scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_definition ON analytics_scheduled_reports(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_definition ON analytics_report_executions(report_definition_id, execution_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON analytics_report_executions(status, execution_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_executions_user ON analytics_report_executions(executed_by, execution_started_at DESC);

-- Analytics View: Operational Health
CREATE OR REPLACE VIEW analytics_operational_health AS
SELECT 
  c.id as clinic_id,
  c.name as clinic_name,
  COUNT(DISTINCT sp.id) as total_staff,
  COUNT(DISTINCT CASE WHEN sp.termination_date IS NULL THEN sp.id END) as active_staff,
  COUNT(DISTINCT cred.id) as total_credentials,
  COUNT(DISTINCT CASE WHEN cred.status = 'expired' THEN cred.id END) as expired_credentials,
  COUNT(DISTINCT CASE WHEN cred.status = 'active' AND cred.expiry_date <= CURRENT_DATE + 30 THEN cred.id END) as expiring_soon_credentials,
  COUNT(DISTINCT tr.id) as total_rooms,
  COUNT(DISTINCT CASE WHEN tr.is_active = true THEN tr.id END) as active_rooms,
  COUNT(DISTINCT oc.id) FILTER (WHERE oc.status NOT IN ('completed', 'cancelled', 'archived')) as open_cases,
  COUNT(DISTINCT oc.id) FILTER (WHERE oc.priority IN ('urgent', 'critical')) as critical_cases,
  AVG(CASE WHEN oc.status NOT IN ('completed', 'cancelled', 'archived') THEN EXTRACT(DAY FROM (now() - oc.opened_at)) END) as avg_case_age_days,
  COUNT(DISTINCT oca.id) FILTER (WHERE oca.notification_status != 'acknowledged') as unack_aging_alerts,
  ROUND(
    (
      (COUNT(DISTINCT CASE WHEN sp.termination_date IS NULL THEN sp.id END)::numeric / NULLIF(COUNT(DISTINCT sp.id), 0) * 25) +
      (COUNT(DISTINCT CASE WHEN cred.status = 'active' THEN cred.id END)::numeric / NULLIF(COUNT(DISTINCT cred.id), 0) * 25) +
      (COUNT(DISTINCT CASE WHEN tr.is_active = true THEN tr.id END)::numeric / NULLIF(COUNT(DISTINCT tr.id), 0) * 25) +
      (CASE WHEN COUNT(DISTINCT oc.id) FILTER (WHERE oc.priority IN ('urgent', 'critical')) = 0 THEN 25
       ELSE GREATEST(0, 25 - COUNT(DISTINCT oc.id) FILTER (WHERE oc.priority IN ('urgent', 'critical')) * 5) END)
    )::numeric, 2
  ) as health_score,
  now() as calculated_at
FROM clinics c
LEFT JOIN staff_profiles sp ON sp.primary_clinic_id = c.id
LEFT JOIN ops_credentials cred ON cred.staff_id = sp.id
LEFT JOIN ops_treatment_rooms tr ON tr.clinic_id = c.id
LEFT JOIN ops_cases oc ON oc.clinic_id = c.id
LEFT JOIN ops_case_aging_alerts oca ON oca.case_id = oc.id AND oca.triggered_at > now() - interval '7 days'
GROUP BY c.id, c.name;

-- Analytics View: Credential Impact
CREATE OR REPLACE VIEW analytics_credential_impact AS
SELECT 
  c.id as clinic_id,
  c.name as clinic_name,
  sp.id as staff_id,
  up.display_name as staff_name,
  sp.employment_type,
  COUNT(DISTINCT cred.id) as total_credentials,
  COUNT(DISTINCT CASE WHEN cred.status = 'active' THEN cred.id END) as active_credentials,
  COUNT(DISTINCT CASE WHEN cred.status = 'expired' THEN cred.id END) as expired_credentials,
  MIN(CASE WHEN cred.status = 'active' THEN cred.expiry_date END) as next_expiry_date,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cred.status = 'expired' THEN cred.id END) > 0 THEN 'at_risk'
    WHEN COUNT(DISTINCT CASE WHEN cred.status = 'active' AND cred.expiry_date <= CURRENT_DATE + 30 THEN cred.id END) > 0 THEN 'warning'
    ELSE 'compliant'
  END as compliance_status,
  COUNT(DISTINCT oc.id) FILTER (WHERE oc.status NOT IN ('completed', 'cancelled', 'archived')) as active_cases,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cred.status = 'expired' THEN cred.id END) > 0 
      AND COUNT(DISTINCT oc.id) FILTER (WHERE oc.status NOT IN ('completed', 'cancelled', 'archived')) > 0
    THEN 'high_risk'
    WHEN COUNT(DISTINCT CASE WHEN cred.status = 'expired' THEN cred.id END) > 0 THEN 'medium_risk'
    WHEN COUNT(DISTINCT CASE WHEN cred.status = 'active' AND cred.expiry_date <= CURRENT_DATE + 30 THEN cred.id END) > 0 THEN 'low_risk'
    ELSE 'no_risk'
  END as risk_level
FROM clinics c
INNER JOIN staff_profiles sp ON sp.primary_clinic_id = c.id
INNER JOIN user_profiles up ON up.id = sp.user_id
LEFT JOIN ops_credentials cred ON cred.staff_id = sp.id
LEFT JOIN ops_cases oc ON oc.primary_clinician_id = sp.id
WHERE sp.termination_date IS NULL
GROUP BY c.id, c.name, sp.id, up.display_name, sp.employment_type;

-- Analytics View: Executive Summary
CREATE OR REPLACE VIEW analytics_executive_summary AS
SELECT 
  (SELECT COUNT(*) FROM clinics WHERE is_active = true) as total_active_clinics,
  (SELECT COUNT(*) FROM staff_profiles WHERE termination_date IS NULL) as total_active_staff,
  (SELECT COUNT(*) FROM ops_cases WHERE status NOT IN ('completed', 'cancelled', 'archived')) as total_open_cases,
  (SELECT COALESCE(AVG(health_score), 0) FROM analytics_operational_health) as avg_operational_health,
  (SELECT COUNT(*) FROM ops_credentials WHERE status = 'expired') as total_expired_credentials,
  (SELECT COUNT(*) FROM ops_credentials WHERE status = 'active' AND expiry_date <= CURRENT_DATE + 30) as credentials_expiring_soon,
  (SELECT COUNT(*) FROM ops_cases WHERE priority IN ('urgent', 'critical') AND status NOT IN ('completed', 'cancelled', 'archived')) as critical_cases,
  (SELECT COALESCE(AVG(EXTRACT(DAY FROM (now() - opened_at))), 0) FROM ops_cases WHERE status NOT IN ('completed', 'cancelled', 'archived')) as avg_case_age_days,
  (SELECT COALESCE(ROUND((COUNT(*) FILTER (WHERE is_active = false)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 2), 0) FROM ops_treatment_rooms) as capacity_utilization_pct,
  (SELECT COUNT(*) FROM ops_case_aging_alerts WHERE notification_status != 'acknowledged' AND triggered_at > now() - interval '7 days') as unacknowledged_alerts,
  (SELECT COUNT(*) FROM ops_case_escalations WHERE resolved_at IS NULL) as active_escalations,
  (SELECT COUNT(DISTINCT staff_id) FROM ops_credentials WHERE status = 'expired' OR (status = 'active' AND expiry_date <= CURRENT_DATE + 30)) as staff_at_risk,
  now() as snapshot_time;

-- Function: Get clinic performance comparison
CREATE OR REPLACE FUNCTION get_clinic_performance_comparison(
  p_start_date date DEFAULT CURRENT_DATE - 30,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  clinic_id uuid,
  clinic_name text,
  total_cases integer,
  completed_cases integer,
  avg_case_duration_days numeric,
  credential_compliance_rate numeric,
  staff_count integer,
  staff_productivity_score numeric,
  overall_performance_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT oc.id)::integer,
    COUNT(DISTINCT oc.id) FILTER (WHERE oc.status = 'completed')::integer,
    COALESCE(AVG(CASE WHEN oc.closed_at IS NOT NULL THEN EXTRACT(DAY FROM (oc.closed_at - oc.opened_at)) END), 0),
    COALESCE(ROUND((COUNT(DISTINCT cred.id) FILTER (WHERE cred.status = 'active')::numeric / NULLIF(COUNT(DISTINCT cred.id), 0) * 100)::numeric, 2), 0),
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.termination_date IS NULL)::integer,
    COALESCE(ROUND((COUNT(DISTINCT oc.id) FILTER (WHERE oc.status = 'completed')::numeric / NULLIF(COUNT(DISTINCT sp.id) FILTER (WHERE sp.termination_date IS NULL), 0))::numeric, 2), 0),
    COALESCE(ROUND(((COALESCE((COUNT(DISTINCT oc.id) FILTER (WHERE oc.status = 'completed')::numeric / NULLIF(COUNT(DISTINCT oc.id), 0) * 30), 0)) + (COALESCE((COUNT(DISTINCT cred.id) FILTER (WHERE cred.status = 'active')::numeric / NULLIF(COUNT(DISTINCT cred.id), 0) * 30), 0)) + (COALESCE((SELECT health_score * 0.4 FROM analytics_operational_health WHERE clinic_id = c.id), 0)))::numeric, 2), 0)
  FROM clinics c
  LEFT JOIN ops_cases oc ON oc.clinic_id = c.id AND oc.opened_at::date BETWEEN p_start_date AND p_end_date
  LEFT JOIN staff_profiles sp ON sp.primary_clinic_id = c.id
  LEFT JOIN ops_credentials cred ON cred.staff_id = sp.id
  WHERE c.is_active = true
  GROUP BY c.id, c.name;
END;
$$;

-- Function: Get metric trend
CREATE OR REPLACE FUNCTION get_metric_trend(
  p_metric_name text,
  p_clinic_id uuid DEFAULT NULL,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (date date, value numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  CASE p_metric_name
    WHEN 'open_cases' THEN
      RETURN QUERY
      SELECT d.date, COUNT(DISTINCT oc.id)::numeric
      FROM generate_series(CURRENT_DATE - p_days_back, CURRENT_DATE, '1 day'::interval) d(date)
      LEFT JOIN ops_cases oc ON oc.opened_at::date <= d.date AND (oc.closed_at IS NULL OR oc.closed_at::date > d.date) AND (p_clinic_id IS NULL OR oc.clinic_id = p_clinic_id)
      GROUP BY d.date ORDER BY d.date;
    WHEN 'expired_credentials' THEN
      RETURN QUERY
      SELECT d.date, COUNT(DISTINCT cred.id)::numeric
      FROM generate_series(CURRENT_DATE - p_days_back, CURRENT_DATE, '1 day'::interval) d(date)
      LEFT JOIN ops_credentials cred ON cred.expiry_date <= d.date AND cred.status = 'expired'
      LEFT JOIN staff_profiles sp ON sp.id = cred.staff_id
      WHERE p_clinic_id IS NULL OR sp.primary_clinic_id = p_clinic_id
      GROUP BY d.date ORDER BY d.date;
    WHEN 'active_staff' THEN
      RETURN QUERY
      SELECT d.date, COUNT(DISTINCT sp.id)::numeric
      FROM generate_series(CURRENT_DATE - p_days_back, CURRENT_DATE, '1 day'::interval) d(date)
      LEFT JOIN staff_profiles sp ON sp.hire_date <= d.date AND (sp.termination_date IS NULL OR sp.termination_date > d.date) AND (p_clinic_id IS NULL OR sp.primary_clinic_id = p_clinic_id)
      GROUP BY d.date ORDER BY d.date;
    ELSE
      RETURN QUERY SELECT CURRENT_DATE, 0::numeric WHERE false;
  END CASE;
END;
$$;

-- Enable RLS
ALTER TABLE analytics_report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public and own reports" ON analytics_report_definitions FOR SELECT TO authenticated
  USING (is_public = true OR created_by = auth.uid() OR is_system = true OR EXISTS (SELECT 1 FROM clinic_access ca WHERE ca.clinic_id = analytics_report_definitions.clinic_id AND ca.user_id = auth.uid()));

CREATE POLICY "Users can create reports" ON analytics_report_definitions FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own reports" ON analytics_report_definitions FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can delete own reports" ON analytics_report_definitions FOR DELETE TO authenticated USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can view own scheduled reports" ON analytics_scheduled_reports FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM analytics_report_definitions rd WHERE rd.id = analytics_scheduled_reports.report_definition_id AND (rd.created_by = auth.uid() OR rd.is_public = true)));

CREATE POLICY "Users can create scheduled reports" ON analytics_scheduled_reports FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own schedules" ON analytics_scheduled_reports FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can delete own schedules" ON analytics_scheduled_reports FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can view own executions" ON analytics_report_executions FOR SELECT TO authenticated
  USING (executed_by = auth.uid() OR EXISTS (SELECT 1 FROM analytics_report_definitions rd WHERE rd.id = analytics_report_executions.report_definition_id AND (rd.created_by = auth.uid() OR rd.is_public = true)));

CREATE POLICY "System can insert executions" ON analytics_report_executions FOR INSERT TO authenticated WITH CHECK (true);

-- Grant access to views
GRANT SELECT ON analytics_operational_health TO authenticated;
GRANT SELECT ON analytics_credential_impact TO authenticated;
GRANT SELECT ON analytics_executive_summary TO authenticated;
