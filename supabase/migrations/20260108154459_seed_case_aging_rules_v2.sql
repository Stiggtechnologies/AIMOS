/*
  # Seed Case Aging Rules

  ## Overview
  Seeds aging rules for common case types to enable case aging monitoring

  ## Data Seeded
  1. System-wide aging rules for common case types
  2. View for monitoring case aging status
*/

-- Insert default aging rules for common case types
INSERT INTO ops_case_aging_rules (
  case_type,
  clinic_id,
  warning_threshold_days,
  escalation_threshold_days,
  critical_threshold_days,
  authorization_expiry_warning_days,
  escalation_path,
  notification_config
) VALUES
  -- System-wide rules
  ('Physical Therapy', NULL, 3, 7, 14, 7, 
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true}'::jsonb),
  
  ('Occupational Therapy', NULL, 3, 7, 14, 7,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true}'::jsonb),
  
  ('Speech Therapy', NULL, 3, 7, 14, 7,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true}'::jsonb),
  
  ('Work Conditioning', NULL, 2, 5, 10, 5,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true, "urgent_sms": true}'::jsonb),
  
  ('FCE Assessment', NULL, 1, 3, 7, 3,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true, "urgent_sms": true}'::jsonb),
  
  ('Post-Offer Testing', NULL, 1, 3, 7, 3,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true, "urgent_sms": true}'::jsonb),

  ('Ergonomic Assessment', NULL, 2, 5, 10, 7,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true}'::jsonb),

  ('Injury Prevention', NULL, 3, 7, 14, 7,
   '[{"manager_id": null, "level": 1, "title": "Clinic Manager"}, {"manager_id": null, "level": 2, "title": "Regional Director"}]'::jsonb,
   '{"send_email": true, "send_in_app": true, "daily_digest": true}'::jsonb)
ON CONFLICT (case_type, clinic_id) DO NOTHING;

-- Create a view for easy monitoring of case aging status
CREATE OR REPLACE VIEW ops_case_aging_status AS
SELECT 
  c.id,
  c.case_number,
  c.case_type,
  c.status,
  c.priority,
  c.opened_at,
  c.closed_at,
  calculate_case_age(c.opened_at, c.closed_at) as age_days,
  c.authorization_expiry,
  CASE 
    WHEN c.authorization_expiry IS NOT NULL 
    THEN (c.authorization_expiry - CURRENT_DATE)
    ELSE NULL 
  END as auth_days_remaining,
  r.warning_threshold_days,
  r.escalation_threshold_days,
  r.critical_threshold_days,
  r.authorization_expiry_warning_days,
  CASE 
    WHEN calculate_case_age(c.opened_at, c.closed_at) >= r.critical_threshold_days THEN 'critical'
    WHEN calculate_case_age(c.opened_at, c.closed_at) >= r.escalation_threshold_days THEN 'escalation'
    WHEN calculate_case_age(c.opened_at, c.closed_at) >= r.warning_threshold_days THEN 'warning'
    ELSE 'normal'
  END as aging_status,
  (
    SELECT COUNT(*) 
    FROM ops_case_aging_alerts a 
    WHERE a.case_id = c.id 
      AND a.notification_status != 'acknowledged'
      AND a.triggered_at > now() - interval '7 days'
  ) as unack_alerts_count,
  (
    SELECT COUNT(*) 
    FROM ops_case_escalations e 
    WHERE e.case_id = c.id 
      AND e.resolved_at IS NULL
  ) as active_escalations_count,
  (
    SELECT MAX(a.triggered_at)
    FROM ops_case_aging_alerts a
    WHERE a.case_id = c.id
  ) as last_alert_at,
  (
    SELECT MAX(e.escalated_at)
    FROM ops_case_escalations e
    WHERE e.case_id = c.id
  ) as last_escalation_at,
  cl.name as clinic_name,
  up.display_name as primary_clinician_name,
  c.primary_clinician_id,
  c.clinic_id,
  c.assigned_team_ids,
  c.target_completion_date
FROM ops_cases c
LEFT JOIN ops_case_aging_rules r ON r.case_type = c.case_type 
  AND (r.clinic_id = c.clinic_id OR r.clinic_id IS NULL)
  AND r.is_active = true
LEFT JOIN clinics cl ON cl.id = c.clinic_id
LEFT JOIN user_profiles up ON up.id = c.primary_clinician_id
WHERE c.status NOT IN ('completed', 'cancelled', 'archived')
ORDER BY age_days DESC NULLS LAST;

-- Grant access to the view
GRANT SELECT ON ops_case_aging_status TO authenticated;

-- Create index on ops_cases for aging queries
CREATE INDEX IF NOT EXISTS idx_ops_cases_aging_query 
  ON ops_cases(status, opened_at DESC) 
  WHERE status NOT IN ('completed', 'cancelled', 'archived');
