/*
  # Seed CRM Reference Data

  Seeds foundational data for the CRM automation system:
  1. Service Lines (Injury Mgmt, Sports, EPC, Massage)
  2. Payor Types (Private, WCB, Insurance)
  3. CLV Tiers (High, Medium, Low)
  4. Lead Sources (Google Ads, EPC, Referral)
  5. Sample Campaigns
  6. Capacity Rules
  7. Demo Leads and Data
*/

-- Service Lines
INSERT INTO crm_service_lines (name, slug, description, priority, target_clv) VALUES
('Injury Management', 'injury-mgmt', 'WCB and acute injury cases - highest priority', 1, 3500.00),
('Sports Rehab', 'sports-rehab', 'Athletic performance and recovery', 2, 2200.00),
('EPC (Enhanced Primary Care)', 'epc', 'Chronic pain management through EPC program', 3, 1800.00),
('Massage Therapy', 'massage', 'Wellness and therapeutic massage', 4, 800.00)
ON CONFLICT (slug) DO NOTHING;

-- Payor Types
INSERT INTO crm_payor_types (name, slug, avg_payment_days, margin_percent, priority) VALUES
('WCB', 'wcb', 45, 68.5, 1),
('Private Insurance', 'private-insurance', 35, 62.0, 2),
('Private Pay', 'private-pay', 0, 75.0, 3),
('EPC Funded', 'epc-funded', 30, 55.0, 4)
ON CONFLICT (slug) DO NOTHING;

-- CLV Tiers
INSERT INTO crm_clv_tiers (name, slug, min_value, max_value, priority, color) VALUES
('High', 'high', 3000.00, 10000.00, 1, '#22c55e'),
('Medium', 'medium', 1500.00, 2999.99, 2, '#f59e0b'),
('Low', 'low', 0.00, 1499.99, 3, '#94a3b8')
ON CONFLICT (slug) DO NOTHING;

-- Lead Sources
INSERT INTO crm_lead_sources (name, slug, type) VALUES
('Google Ads', 'google-ads', 'paid'),
('Facebook Ads', 'facebook-ads', 'paid'),
('EPC Referral', 'epc-referral', 'partner'),
('Physician Referral', 'physician-referral', 'referral'),
('Website Organic', 'website-organic', 'organic'),
('Walk-in', 'walk-in', 'organic')
ON CONFLICT (slug) DO NOTHING;

-- Sample Campaigns
INSERT INTO crm_campaigns (
  external_id, name, service_line_id, clinic_id, status, daily_budget,
  actual_spend, total_clicks, total_impressions, total_leads, total_bookings, total_revenue, auto_throttle_enabled
)
SELECT
  'GADS-001',
  'Injury Management - Calgary',
  sl.id,
  c.id,
  'active',
  250.00,
  198.45,
  156,
  8420,
  12,
  9,
  15750.00,
  true
FROM crm_service_lines sl
CROSS JOIN clinics c
WHERE sl.slug = 'injury-mgmt'
AND c.name LIKE '%Central%'
LIMIT 1
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO crm_campaigns (
  external_id, name, service_line_id, clinic_id, status, daily_budget,
  actual_spend, total_clicks, total_impressions, total_leads, total_bookings, total_revenue, auto_throttle_enabled
)
SELECT
  'GADS-002',
  'Sports Rehab - Calgary',
  sl.id,
  c.id,
  'active',
  180.00,
  165.80,
  124,
  6150,
  8,
  6,
  8400.00,
  true
FROM crm_service_lines sl
CROSS JOIN clinics c
WHERE sl.slug = 'sports-rehab'
AND c.name LIKE '%Central%'
LIMIT 1
ON CONFLICT (external_id) DO NOTHING;

-- Update campaign metrics
UPDATE crm_campaigns
SET cpa = CASE WHEN total_leads > 0 THEN actual_spend / total_leads ELSE 0 END,
    roas = CASE WHEN actual_spend > 0 THEN total_revenue / actual_spend ELSE 0 END
WHERE cpa IS NULL OR roas IS NULL;

-- Sample Keywords
INSERT INTO crm_keywords (campaign_id, keyword, match_type, clicks, impressions, spend, leads, revenue, status)
SELECT
  c.id,
  'physiotherapy calgary injury',
  'phrase',
  45,
  1250,
  78.90,
  4,
  5250.00,
  'active'
FROM crm_campaigns c
WHERE c.external_id = 'GADS-001'
ON CONFLICT DO NOTHING;

INSERT INTO crm_keywords (campaign_id, keyword, match_type, clicks, impressions, spend, leads, revenue, status)
SELECT
  c.id,
  'sports physiotherapist near me',
  'phrase',
  38,
  890,
  62.50,
  3,
  3780.00,
  'active'
FROM crm_campaigns c
WHERE c.external_id = 'GADS-002'
ON CONFLICT DO NOTHING;

-- Update keyword metrics
UPDATE crm_keywords
SET cpa = CASE WHEN leads > 0 THEN spend / leads ELSE 0 END,
    roas = CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END
WHERE cpa IS NULL OR roas IS NULL;

-- Capacity Rules
INSERT INTO crm_capacity_rules (clinic_id, rule_name, rule_type, condition_field, condition_operator, condition_value, action_target, action_value, priority, active)
SELECT
  c.id,
  'Pause Massage Ads at Low Capacity',
  'pause_ads',
  'capacity_percent',
  '<',
  15,
  'service_line',
  'massage',
  1,
  true
FROM clinics c
WHERE c.name LIKE '%Central%'
LIMIT 1;

INSERT INTO crm_capacity_rules (clinic_id, rule_name, rule_type, condition_field, condition_operator, condition_value, action_target, action_value, priority, active)
SELECT
  c.id,
  'Prioritize WCB Bookings',
  'prioritize_service',
  'capacity_percent',
  '>',
  80,
  'payor_type',
  'wcb',
  2,
  true
FROM clinics c
WHERE c.name LIKE '%Central%'
LIMIT 1;

-- Demo Leads
INSERT INTO crm_leads (
  external_id, first_name, last_name, email, phone,
  service_line_id, payor_type_id, clv_tier_id, lead_source_id, campaign_id,
  clinic_id, utm_source, utm_campaign, status, priority
)
SELECT
  'LEAD-001',
  'Sarah',
  'Johnson',
  'sarah.johnson@email.com',
  '+1-403-555-0101',
  sl.id,
  pt.id,
  ct.id,
  ls.id,
  camp.id,
  c.id,
  'google',
  'injury-mgmt-calgary',
  'new',
  'high'
FROM crm_service_lines sl
CROSS JOIN crm_payor_types pt
CROSS JOIN crm_clv_tiers ct
CROSS JOIN crm_lead_sources ls
CROSS JOIN crm_campaigns camp
CROSS JOIN clinics c
WHERE sl.slug = 'injury-mgmt'
AND pt.slug = 'wcb'
AND ct.slug = 'high'
AND ls.slug = 'google-ads'
AND camp.external_id = 'GADS-001'
AND c.name LIKE '%Central%'
LIMIT 1
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO crm_leads (
  external_id, first_name, last_name, email, phone,
  service_line_id, payor_type_id, clv_tier_id, lead_source_id, campaign_id,
  clinic_id, utm_source, utm_campaign, status, priority, contacted_at
)
SELECT
  'LEAD-002',
  'Mike',
  'Anderson',
  'mike.anderson@email.com',
  '+1-403-555-0102',
  sl.id,
  pt.id,
  ct.id,
  ls.id,
  camp.id,
  c.id,
  'google',
  'sports-rehab-calgary',
  'contacted',
  'medium',
  now() - interval '30 minutes'
FROM crm_service_lines sl
CROSS JOIN crm_payor_types pt
CROSS JOIN crm_clv_tiers ct
CROSS JOIN crm_lead_sources ls
CROSS JOIN crm_campaigns camp
CROSS JOIN clinics c
WHERE sl.slug = 'sports-rehab'
AND pt.slug = 'private-pay'
AND ct.slug = 'medium'
AND ls.slug = 'google-ads'
AND camp.external_id = 'GADS-002'
AND c.name LIKE '%Central%'
LIMIT 1
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO crm_leads (
  external_id, first_name, last_name, email, phone,
  service_line_id, payor_type_id, clv_tier_id, lead_source_id,
  clinic_id, status, priority
)
SELECT
  'LEAD-003',
  'Emma',
  'Wilson',
  'emma.wilson@email.com',
  '+1-403-555-0103',
  sl.id,
  pt.id,
  ct.id,
  ls.id,
  c.id,
  'new',
  'high'
FROM crm_service_lines sl
CROSS JOIN crm_payor_types pt
CROSS JOIN crm_clv_tiers ct
CROSS JOIN crm_lead_sources ls
CROSS JOIN clinics c
WHERE sl.slug = 'injury-mgmt'
AND pt.slug = 'wcb'
AND ct.slug = 'high'
AND ls.slug = 'physician-referral'
AND c.name LIKE '%Central%'
LIMIT 1
ON CONFLICT (external_id) DO NOTHING;

-- Create bookings for contacted lead
INSERT INTO crm_bookings (
  lead_id, clinic_id, service_line_id, scheduled_at, status
)
SELECT
  l.id,
  l.clinic_id,
  l.service_line_id,
  now() + interval '2 days',
  'scheduled'
FROM crm_leads l
WHERE l.external_id = 'LEAD-002'
ON CONFLICT DO NOTHING;

-- Demo Alerts
INSERT INTO crm_alerts (alert_type, severity, title, message, clinic_id)
SELECT
  'lead_sla',
  'critical',
  'Lead SLA Breach',
  'Lead Sarah Johnson not contacted in 5 minutes',
  c.id
FROM clinics c
WHERE c.name LIKE '%Central%'
LIMIT 1;

INSERT INTO crm_alerts (alert_type, severity, title, message)
VALUES
  ('capacity', 'warning', 'Capacity Warning', 'AIM Central approaching 90% capacity for next week'),
  ('cpa', 'warning', 'CPA Increase', 'Cost per acquisition increased 18% week-over-week')
ON CONFLICT DO NOTHING;

-- Capacity Snapshots for today and next 7 days
INSERT INTO crm_capacity_snapshots (
  clinic_id, snapshot_date, total_slots, booked_slots, available_slots, capacity_percent,
  high_clv_slots, medium_clv_slots, low_clv_slots
)
SELECT
  c.id,
  CURRENT_DATE + (n || ' days')::interval,
  64,
  CASE 
    WHEN n = 0 THEN 56
    WHEN n = 1 THEN 58
    WHEN n = 2 THEN 60
    WHEN n = 3 THEN 54
    WHEN n = 4 THEN 52
    WHEN n = 5 THEN 48
    ELSE 40
  END,
  CASE 
    WHEN n = 0 THEN 8
    WHEN n = 1 THEN 6
    WHEN n = 2 THEN 4
    WHEN n = 3 THEN 10
    WHEN n = 4 THEN 12
    WHEN n = 5 THEN 16
    ELSE 24
  END,
  CASE 
    WHEN n = 0 THEN 87.5
    WHEN n = 1 THEN 90.6
    WHEN n = 2 THEN 93.8
    WHEN n = 3 THEN 84.4
    WHEN n = 4 THEN 81.3
    WHEN n = 5 THEN 75.0
    ELSE 62.5
  END,
  CASE WHEN n <= 2 THEN 12 ELSE 8 END,
  CASE WHEN n <= 2 THEN 8 ELSE 6 END,
  CASE WHEN n <= 2 THEN 4 ELSE 2 END
FROM clinics c
CROSS JOIN generate_series(0, 13) AS n
WHERE c.name LIKE '%Central%'
ON CONFLICT (clinic_id, snapshot_date) DO NOTHING;

-- Follow-up schedules
INSERT INTO crm_follow_ups (lead_id, follow_up_type, scheduled_at, status, template_name)
SELECT
  l.id,
  'sms',
  l.created_at + interval '5 minutes',
  'pending',
  'welcome_sms'
FROM crm_leads l
WHERE l.external_id = 'LEAD-001'
ON CONFLICT DO NOTHING;

INSERT INTO crm_follow_ups (lead_id, follow_up_type, scheduled_at, status, template_name, sent_at)
SELECT
  l.id,
  'email',
  l.created_at + interval '1 hour',
  'sent',
  'welcome_email',
  l.created_at + interval '1 hour'
FROM crm_leads l
WHERE l.external_id = 'LEAD-002'
ON CONFLICT DO NOTHING;