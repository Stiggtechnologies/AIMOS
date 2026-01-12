/*
  # Seed Marketing Intelligence Demo Data

  Populate Marketing Intelligence module with realistic placeholder data
  - Marketing channels, campaigns, leads, campaign metrics
  - Demonstrates CPL, conversion rates, and ROI tracking
*/

-- Marketing Channels
INSERT INTO marketing_channels (channel_name, channel_type, platform, description, is_active, monthly_budget, clinic_id)
VALUES
  ('Google Search Ads', 'paid_search', 'google', 'Google Search campaigns targeting injury-related keywords', true, 8000.00, '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid),
  ('Meta (Facebook/Instagram)', 'paid_social', 'meta', 'Facebook and Instagram ad campaigns', true, 5000.00, '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid),
  ('Local SEO', 'organic', null, 'Local search optimization and Google Business Profile', true, 1500.00, '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid),
  ('Employer Direct Outreach', 'employer', null, 'Direct outreach to employer partners', true, 2000.00, '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid),
  ('Google Display Network', 'paid_search', 'google', 'Display advertising across Google network', true, 3000.00, '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid),
  ('LinkedIn Ads', 'paid_social', 'linkedin', 'B2B campaigns targeting employers', true, 4000.00, '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid),
  ('Community Events', 'local', null, 'Local community event sponsorships', true, 2500.00, 'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid)
ON CONFLICT DO NOTHING;

-- Campaigns
WITH channels AS (
  SELECT id, channel_name FROM marketing_channels
)
INSERT INTO campaigns (campaign_name, channel_id, clinic_id, campaign_type, start_date, end_date, total_budget, spent_to_date, target_cpl, target_cpa, status)
SELECT 
  'Work Injury - Calgary North',
  (SELECT id FROM channels WHERE channel_name = 'Google Search Ads'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'conversion',
  '2026-01-01'::date,
  '2026-03-31'::date,
  15000.00,
  4250.00,
  45.00,
  180.00,
  'active'
UNION ALL
SELECT 
  'Sports Injury Awareness',
  (SELECT id FROM channels WHERE channel_name = 'Meta (Facebook/Instagram)'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'awareness',
  '2025-12-15'::date,
  '2026-02-15'::date,
  8000.00,
  5200.00,
  35.00,
  150.00,
  'active'
UNION ALL
SELECT 
  'Calgary South - MVA Recovery',
  (SELECT id FROM channels WHERE channel_name = 'Google Display Network'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'retargeting',
  '2026-01-10'::date,
  '2026-04-10'::date,
  6000.00,
  1800.00,
  50.00,
  200.00,
  'active'
UNION ALL
SELECT 
  'Employer Partnership Drive',
  (SELECT id FROM channels WHERE channel_name = 'LinkedIn Ads'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'conversion',
  '2025-11-01'::date,
  '2026-01-31'::date,
  10000.00,
  8500.00,
  60.00,
  250.00,
  'active'
ON CONFLICT DO NOTHING;

-- Leads
WITH campaigns AS (
  SELECT id, campaign_name, clinic_id FROM campaigns
)
INSERT INTO leads (
  campaign_id, clinic_id, first_name, last_name, email, phone,
  utm_source, utm_medium, utm_campaign, lead_score, injury_type,
  preferred_contact, status, created_at
)
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Work Injury - Calgary North'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'John', 'Mitchell', 'john.mitchell@email.com', '403-555-0101',
  'google', 'cpc', 'work_injury_calgary', 85, 'Back strain',
  'phone', 'converted', NOW() - INTERVAL '5 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Work Injury - Calgary North'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Sarah', 'Thompson', 'sarah.t@email.com', '403-555-0102',
  'google', 'cpc', 'work_injury_calgary', 72, 'Shoulder injury',
  'email', 'qualified', NOW() - INTERVAL '3 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Work Injury - Calgary North'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Michael', 'Chen', 'mchen@email.com', '403-555-0103',
  'google', 'cpc', 'work_injury_calgary', 90, 'Knee injury',
  'phone', 'converted', NOW() - INTERVAL '2 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Sports Injury Awareness'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Emma', 'Rodriguez', 'emma.r@email.com', '403-555-0104',
  'facebook', 'paid', 'sports_injury', 65, 'Ankle sprain',
  'text', 'new', NOW() - INTERVAL '1 day'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Sports Injury Awareness'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'David', 'Park', 'dpark@email.com', '403-555-0105',
  'instagram', 'paid', 'sports_injury', 78, 'Rotator cuff',
  'phone', 'qualified', NOW() - INTERVAL '4 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Calgary South - MVA Recovery'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Lisa', 'Anderson', 'lisa.anderson@email.com', '403-555-0106',
  'google', 'display', 'mva_recovery', 88, 'Whiplash',
  'phone', 'converted', NOW() - INTERVAL '6 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Calgary South - MVA Recovery'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Robert', 'Wilson', 'rwilson@email.com', '403-555-0107',
  'google', 'display', 'mva_recovery', 55, 'Back pain',
  'email', 'new', NOW() - INTERVAL '1 day'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Employer Partnership Drive'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Jennifer', 'Lee', 'jennifer.lee@company.com', '403-555-0108',
  'linkedin', 'cpc', 'employer_partnership', 92, 'Corporate wellness',
  'email', 'qualified', NOW() - INTERVAL '2 days'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Employer Partnership Drive'),
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Brian', 'Taylor', 'btaylor@business.com', '403-555-0109',
  'linkedin', 'cpc', 'employer_partnership', 68, 'Employee referrals',
  'phone', 'new', NOW() - INTERVAL '5 hours'
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Work Injury - Calgary North'),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Amanda', 'Brown', 'abrown@email.com', '403-555-0110',
  'google', 'cpc', 'work_injury_calgary', 45, 'Wrist pain',
  'email', 'lost', NOW() - INTERVAL '10 days'
ON CONFLICT DO NOTHING;

-- Campaign Metrics (last 30 days)
WITH campaigns AS (
  SELECT id, campaign_name FROM campaigns
),
date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    '1 day'::interval
  )::date as metric_date
)
INSERT INTO campaign_metrics (
  campaign_id, metric_date, impressions, clicks, spend, leads, conversions,
  cpl, cpa, ctr, conversion_rate, roas
)
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Work Injury - Calgary North'),
  ds.metric_date,
  (1500 + (random() * 500))::integer,
  (45 + (random() * 25))::integer,
  (140 + (random() * 60))::numeric(10,2),
  (2 + (random() * 3))::integer,
  (0 + (random() * 2))::integer,
  (40 + (random() * 30))::numeric(10,2),
  (150 + (random() * 100))::numeric(10,2),
  (2.8 + (random() * 1.5))::numeric(5,2),
  (35 + (random() * 25))::numeric(5,2),
  (2.5 + (random() * 2))::numeric(10,2)
FROM date_series ds
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Sports Injury Awareness'),
  ds.metric_date,
  (2000 + (random() * 800))::integer,
  (60 + (random() * 30))::integer,
  (160 + (random() * 80))::numeric(10,2),
  (3 + (random() * 4))::integer,
  (1 + (random() * 2))::integer,
  (30 + (random() * 25))::numeric(10,2),
  (120 + (random() * 80))::numeric(10,2),
  (3.2 + (random() * 1.2))::numeric(5,2),
  (40 + (random() * 20))::numeric(5,2),
  (3.0 + (random() * 2))::numeric(10,2)
FROM date_series ds
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Calgary South - MVA Recovery'),
  ds.metric_date,
  (1200 + (random() * 400))::integer,
  (35 + (random() * 20))::integer,
  (90 + (random() * 50))::numeric(10,2),
  (1 + (random() * 3))::integer,
  (0 + (random() * 1))::integer,
  (45 + (random() * 30))::numeric(10,2),
  (180 + (random() * 100))::numeric(10,2),
  (2.5 + (random() * 1.0))::numeric(5,2),
  (30 + (random() * 20))::numeric(5,2),
  (2.2 + (random() * 1.8))::numeric(10,2)
FROM date_series ds
UNION ALL
SELECT 
  (SELECT id FROM campaigns WHERE campaign_name = 'Employer Partnership Drive'),
  ds.metric_date,
  (800 + (random() * 300))::integer,
  (25 + (random() * 15))::integer,
  (120 + (random() * 60))::numeric(10,2),
  (1 + (random() * 2))::integer,
  (0 + (random() * 1))::integer,
  (55 + (random() * 35))::numeric(10,2),
  (220 + (random() * 120))::numeric(10,2),
  (2.0 + (random() * 1.5))::numeric(5,2),
  (25 + (random() * 20))::numeric(5,2),
  (1.8 + (random() * 1.5))::numeric(10,2)
FROM date_series ds
ON CONFLICT (campaign_id, metric_date) DO NOTHING;
