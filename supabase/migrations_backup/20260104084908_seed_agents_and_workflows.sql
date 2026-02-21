/*
  # Seed Agents and Workflows
  
  ## Summary
  Seeds the database with initial agent configurations and workflow definitions
  for the autonomous talent acquisition system.
  
  ## Changes
    - Insert 7 core agents into agents table
    - Insert initial workflows for common hiring scenarios
    - Insert sourcing channels configuration
*/

-- Insert Core Agents
INSERT INTO agents (name, display_name, description, capabilities, status, config) VALUES
(
  'strategy-agent',
  'Strategy Agent',
  'Workforce planning, forecasting, and hiring strategy optimization',
  '["workforce_forecasting", "headcount_planning", "job_creation", "compensation_calibration", "market_analysis"]',
  'active',
  '{"execution_interval_minutes": 60, "forecasting_horizon_days": 90}'
),
(
  'sourcing-agent',
  'Sourcing Agent',
  'Multi-channel candidate acquisition and outreach',
  '["job_posting", "boolean_search", "passive_sourcing", "candidate_outreach", "channel_optimization"]',
  'active',
  '{"channels": ["indeed", "linkedin", "ziprecruiter"], "outreach_limit_per_day": 50}'
),
(
  'screening-agent',
  'Screening Agent',
  'Automated candidate evaluation and shortlisting',
  '["resume_parsing", "candidate_scoring", "screening_interviews", "qualification_matching", "red_flag_detection"]',
  'active',
  '{"passing_score_threshold": 70, "auto_reject_threshold": 40}'
),
(
  'interview-coordinator',
  'Interview Coordinator',
  'Automated interview scheduling and logistics',
  '["calendar_management", "multi_party_scheduling", "interview_reminders", "feedback_collection", "reschedule_handling"]',
  'active',
  '{"default_duration_minutes": 60, "reminder_hours_before": 24}'
),
(
  'offer-onboarding-agent',
  'Offer & Onboarding Agent',
  'Offer generation, negotiation, and onboarding automation',
  '["offer_generation", "salary_negotiation", "onboarding_workflow", "compliance_checks", "document_management"]',
  'active',
  '{"negotiation_flex_percent": 5, "offer_expiry_days": 7}'
),
(
  'compliance-agent',
  'Compliance Agent',
  'Legal, regulatory, and policy compliance monitoring',
  '["credential_verification", "license_validation", "bias_detection", "employment_law_compliance", "audit_reporting"]',
  'active',
  '{"jurisdiction": "Alberta, Canada", "auto_block_violations": true}'
),
(
  'analytics-agent',
  'Analytics Agent',
  'KPI tracking, reporting, and optimization',
  '["kpi_calculation", "dashboard_generation", "performance_analysis", "anomaly_detection", "trend_forecasting"]',
  'active',
  '{"update_frequency_minutes": 15, "alert_thresholds": {"time_to_fill_days": 30, "cost_per_hire": 5000}}'
)
ON CONFLICT (name) DO NOTHING;

-- Insert Initial Workflows
INSERT INTO workflows (name, description, trigger_type, trigger_conditions, actions, is_active) VALUES
(
  'new-application-workflow',
  'Automatically process new applications through screening',
  'event',
  '{"event_type": "application.created"}',
  '[
    {"agent": "screening-agent", "action": "parse_resume", "priority": "high"},
    {"agent": "screening-agent", "action": "score_candidate", "priority": "high"},
    {"agent": "screening-agent", "action": "determine_next_step", "priority": "high"}
  ]',
  true
),
(
  'high-score-candidate-workflow',
  'Fast-track high-scoring candidates to interviews',
  'event',
  '{"event_type": "screening.completed", "conditions": {"screening_score": {"gte": 85}}}',
  '[
    {"agent": "interview-coordinator", "action": "schedule_interview", "interview_type": "screening", "priority": "high"},
    {"agent": "sourcing-agent", "action": "send_notification", "template": "high_priority_candidate"}
  ]',
  true
),
(
  'interview-completed-workflow',
  'Process interview feedback and determine next steps',
  'event',
  '{"event_type": "interview.completed"}',
  '[
    {"agent": "screening-agent", "action": "aggregate_feedback", "priority": "medium"},
    {"agent": "screening-agent", "action": "calculate_overall_score", "priority": "medium"},
    {"agent": "interview-coordinator", "action": "determine_next_interview_or_offer", "priority": "medium"}
  ]',
  true
),
(
  'offer-generation-workflow',
  'Generate and send offer after all interviews passed',
  'event',
  '{"event_type": "all_interviews.passed"}',
  '[
    {"agent": "compliance-agent", "action": "verify_credentials", "priority": "high"},
    {"agent": "compliance-agent", "action": "compliance_check", "priority": "high"},
    {"agent": "offer-onboarding-agent", "action": "request_references", "priority": "high"},
    {"agent": "offer-onboarding-agent", "action": "generate_offer", "priority": "medium", "wait_for": "references.cleared"}
  ]',
  true
),
(
  'offer-accepted-workflow',
  'Initiate onboarding process when offer is accepted',
  'event',
  '{"event_type": "offer.accepted"}',
  '[
    {"agent": "offer-onboarding-agent", "action": "create_onboarding_checklist", "priority": "high"},
    {"agent": "offer-onboarding-agent", "action": "send_welcome_package", "priority": "high"},
    {"agent": "offer-onboarding-agent", "action": "schedule_first_day", "priority": "medium"},
    {"agent": "analytics-agent", "action": "update_hire_kpis", "priority": "low"}
  ]',
  true
),
(
  'daily-forecast-workflow',
  'Daily workforce forecasting and gap analysis',
  'schedule',
  '{"cron": "0 6 * * *"}',
  '[
    {"agent": "strategy-agent", "action": "analyze_staffing_levels", "priority": "medium"},
    {"agent": "strategy-agent", "action": "forecast_demand", "priority": "medium"},
    {"agent": "strategy-agent", "action": "identify_gaps", "priority": "medium"},
    {"agent": "strategy-agent", "action": "create_job_requisitions_if_needed", "priority": "high"}
  ]',
  true
),
(
  'weekly-analytics-workflow',
  'Generate weekly performance reports',
  'schedule',
  '{"cron": "0 8 * * 1"}',
  '[
    {"agent": "analytics-agent", "action": "calculate_weekly_kpis", "priority": "medium"},
    {"agent": "analytics-agent", "action": "generate_performance_report", "priority": "medium"},
    {"agent": "analytics-agent", "action": "identify_optimization_opportunities", "priority": "low"}
  ]',
  true
),
(
  'job-created-workflow',
  'Automatically post new jobs to all channels',
  'event',
  '{"event_type": "job.created", "conditions": {"status": "active"}}',
  '[
    {"agent": "sourcing-agent", "action": "post_to_indeed", "priority": "high"},
    {"agent": "sourcing-agent", "action": "post_to_linkedin", "priority": "high"},
    {"agent": "sourcing-agent", "action": "post_to_ziprecruiter", "priority": "high"},
    {"agent": "sourcing-agent", "action": "initiate_passive_search", "priority": "medium"}
  ]',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Insert Sourcing Channels
INSERT INTO sourcing_channels (channel_name, channel_type, is_active, config) VALUES
('Indeed', 'job_board', true, '{"api_key_required": true, "posting_cost_per_day": 5.0}'),
('LinkedIn', 'professional_network', true, '{"api_key_required": true, "inmail_credits_per_month": 150}'),
('ZipRecruiter', 'job_board', true, '{"api_key_required": true, "posting_duration_days": 30}'),
('Direct Application', 'company_website', true, '{}'),
('Employee Referral', 'referral', true, '{"referral_bonus": 1000}'),
('Facebook Groups', 'social_media', true, '{"target_groups": ["Alberta Healthcare Jobs", "Physiotherapy Careers Canada"]}'),
('University Partnerships', 'education', true, '{"partner_universities": ["University of Alberta", "University of Calgary"]}')
ON CONFLICT (channel_name) DO NOTHING;
