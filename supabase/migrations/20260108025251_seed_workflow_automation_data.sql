/*
  # Seed Workflow Automation Data

  ## Summary
  Seeds initial notification templates, scheduled tasks, and workflow definitions
  to enable automated credential alerts and other operational workflows.

  ## Seeded Data
    - 5 notification email templates
    - 2 scheduled tasks for daily automation
    - 3 workflow definitions for common scenarios
*/

-- =====================================================
-- NOTIFICATION TEMPLATES
-- =====================================================

INSERT INTO notification_templates (name, description, channel, subject_template, body_template, variables, default_priority, is_active)
VALUES
  (
    'credential_expiring_30_days',
    'Alert sent when credential expires within 30 days',
    'email',
    'Credential Expiring Soon: {{credential_type}}',
    E'Hello {{staff_first_name}},\n\nThis is an automated alert regarding your {{credential_type}}.\n\n**Status**: Expires in {{days_until_expiry}} days\n**Expiry Date**: {{expiry_date}}\n**Credential Number**: {{credential_number}}\n\n**Action Required**: Please begin the renewal process immediately to maintain your compliance status.\n\n**Recommended Actions**:\n{{#each recommended_actions}}\n- {{this}}\n{{/each}}\n\nIf you have already renewed this credential, please upload the updated documentation to your profile.\n\nThank you,\nAIM OS Operations Team',
    '["staff_first_name", "credential_type", "days_until_expiry", "expiry_date", "credential_number", "recommended_actions"]'::jsonb,
    'high',
    true
  ),
  (
    'credential_expired',
    'Urgent alert when credential has expired',
    'email',
    'URGENT: Credential Expired - {{credential_type}}',
    E'Hello {{staff_first_name}},\n\n**URGENT COMPLIANCE ALERT**\n\nYour {{credential_type}} has expired as of {{expiry_date}}.\n\n**Days Overdue**: {{days_overdue}}\n**Risk Level**: CRITICAL\n\n**Immediate Action Required**:\n1. Contact the issuing authority immediately for renewal\n2. Upload renewed documentation as soon as available\n3. Your clinical privileges may be suspended until compliance is restored\n\nPlease contact your clinic manager or the operations team if you need assistance.\n\nThank you,\nAIM OS Operations Team',
    '["staff_first_name", "credential_type", "expiry_date", "days_overdue"]'::jsonb,
    'urgent',
    true
  ),
  (
    'credential_renewal_reminder_60_days',
    'Reminder sent when credential expires within 60 days',
    'email',
    'Reminder: Credential Renewal Due Soon - {{credential_type}}',
    E'Hello {{staff_first_name}},\n\nThis is a friendly reminder that your {{credential_type}} will expire in {{days_until_expiry}} days.\n\n**Expiry Date**: {{expiry_date}}\n**Credential Number**: {{credential_number}}\n\n**Next Steps**:\n- Review renewal requirements with the issuing authority\n- Gather any required documentation\n- Begin the renewal application process\n\nWe recommend starting the renewal process early to avoid any lapses in compliance.\n\nThank you,\nAIM OS Operations Team',
    '["staff_first_name", "credential_type", "days_until_expiry", "expiry_date", "credential_number"]'::jsonb,
    'normal',
    true
  ),
  (
    'staffing_shortage_alert',
    'Alert when clinic staffing falls below threshold',
    'email',
    'Staffing Alert: {{clinic_name}} - Low Coverage',
    E'Hello {{manager_name}},\n\nThis is an automated staffing alert for {{clinic_name}}.\n\n**Current Status**:\n- Available Staff: {{available_staff}}\n- Required Coverage: {{required_coverage}}\n- Coverage Gap: {{coverage_gap}} staff members\n\n**Affected Date**: {{date}}\n\n**Recommended Actions**:\n- Review schedule for potential adjustments\n- Contact per-diem staff for coverage\n- Consider shift modifications\n\nPlease review and address this staffing gap as soon as possible.\n\nThank you,\nAIM OS Operations Team',
    '["manager_name", "clinic_name", "available_staff", "required_coverage", "coverage_gap", "date"]'::jsonb,
    'high',
    true
  ),
  (
    'weekly_operations_digest',
    'Weekly summary of operational metrics',
    'email',
    'Weekly Operations Digest - Week of {{week_start}}',
    E'Hello {{recipient_name}},\n\nHere is your weekly operations summary:\n\n**Credentials**:\n- Active: {{credentials_active}}\n- Expiring Next 30 Days: {{credentials_expiring}}\n- Alerts Generated: {{new_alerts}}\n\n**Staffing**:\n- Average Utilization: {{utilization_rate}}%\n- Coverage Gaps: {{coverage_gaps}}\n\n**Compliance**:\n- Compliance Rate: {{compliance_rate}}%\n- Critical Issues: {{critical_issues}}\n\n**Action Items**:\n{{#each action_items}}\n- {{this}}\n{{/each}}\n\nView full details in the Operations Dashboard.\n\nThank you,\nAIM OS',
    '["recipient_name", "week_start", "credentials_active", "credentials_expiring", "new_alerts", "utilization_rate", "coverage_gaps", "compliance_rate", "critical_issues", "action_items"]'::jsonb,
    'low',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SCHEDULED TASKS
-- =====================================================

INSERT INTO scheduled_tasks (
  name,
  description,
  schedule_cron,
  function_name,
  function_params,
  is_active,
  next_run_at
)
VALUES
  (
    'daily_credential_alert_generation',
    'Generate credential expiry alerts daily at 6 AM',
    '0 6 * * *',
    'generate_credential_alerts',
    '{}',
    true,
    date_trunc('day', now()) + interval '1 day' + interval '6 hours'
  ),
  (
    'hourly_notification_processing',
    'Process pending notifications every hour',
    '0 * * * *',
    'process_notifications',
    '{}',
    true,
    date_trunc('hour', now()) + interval '1 hour'
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  schedule_cron = EXCLUDED.schedule_cron,
  function_name = EXCLUDED.function_name,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- WORKFLOW DEFINITIONS
-- =====================================================

INSERT INTO workflow_definitions (
  name,
  description,
  category,
  trigger_type,
  trigger_config,
  is_active,
  is_system
)
VALUES
  (
    'Credential Expiry Notification',
    'Automatically send email notifications when credentials are expiring',
    'compliance',
    'scheduled',
    '{"schedule": "daily", "time": "06:00"}',
    true,
    true
  ),
  (
    'Staffing Shortage Alert',
    'Alert managers when scheduled staff falls below required coverage',
    'operations',
    'event_based',
    '{"event": "schedule.updated", "condition": "coverage_below_threshold"}',
    true,
    true
  ),
  (
    'Weekly Operations Digest',
    'Send weekly summary of operational metrics to managers',
    'reporting',
    'scheduled',
    '{"schedule": "weekly", "day": "monday", "time": "08:00"}',
    false,
    true
  )
ON CONFLICT DO NOTHING;
