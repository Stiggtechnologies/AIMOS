/*
  # AIM Automation Control System - Seed Data

  Seeds 3 AIM Alberta clinic locations with realistic demo data including:
  - Social accounts per location
  - Content posts in various lifecycle states
  - Review triage items with risk flags
  - Campaign health snapshots
  - Campaign alerts
  - Policy rules
  - Integration configs
  - KPI snapshots
  - Response templates
*/

-- ============================================================
-- LOCATIONS
-- ============================================================
INSERT INTO aim_locations (id, name, slug, city, province, address, phone, email, google_place_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'AIM South Commons', 'aim-south-commons', 'Edmonton', 'AB', '2020 111 St NW, Edmonton, AB T6J 4X2', '780-434-9111', 'southcommons@aimclinics.ca', 'ChIJ_aim_south_commons'),
  ('11111111-0000-0000-0000-000000000002', 'AIM West Edmonton', 'aim-west-edmonton', 'Edmonton', 'AB', '17504 100 Ave NW, Edmonton, AB T5S 1L3', '780-489-2626', 'westedmonton@aimclinics.ca', 'ChIJ_aim_west_edmonton'),
  ('11111111-0000-0000-0000-000000000003', 'AIM Leduc', 'aim-leduc', 'Leduc', 'AB', '4809 49 Ave, Leduc, AB T9E 6Z5', '780-980-7676', 'leduc@aimclinics.ca', 'ChIJ_aim_leduc')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================
INSERT INTO aim_social_accounts (location_id, platform, account_id, account_name, status, last_synced_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'facebook', 'fb_aim_south', 'AIM South Commons', 'active', now() - interval '2 hours'),
  ('11111111-0000-0000-0000-000000000001', 'instagram', 'ig_aim_south', 'aim_south_commons', 'active', now() - interval '2 hours'),
  ('11111111-0000-0000-0000-000000000001', 'google_business', 'gbp_aim_south', 'AIM South Commons - Google', 'active', now() - interval '4 hours'),
  ('11111111-0000-0000-0000-000000000002', 'facebook', 'fb_aim_west', 'AIM West Edmonton', 'active', now() - interval '1 hour'),
  ('11111111-0000-0000-0000-000000000002', 'instagram', 'ig_aim_west', 'aim_westedmonton', 'active', now() - interval '1 hour'),
  ('11111111-0000-0000-0000-000000000002', 'google_business', 'gbp_aim_west', 'AIM West Edmonton - Google', 'active', now() - interval '3 hours'),
  ('11111111-0000-0000-0000-000000000002', 'linkedin', 'li_aim_corp', 'Alberta Injury Management', 'active', now() - interval '6 hours'),
  ('11111111-0000-0000-0000-000000000003', 'facebook', 'fb_aim_leduc', 'AIM Leduc', 'active', now() - interval '3 hours'),
  ('11111111-0000-0000-0000-000000000003', 'google_business', 'gbp_aim_leduc', 'AIM Leduc - Google', 'error', now() - interval '12 hours')
ON CONFLICT (location_id, platform) DO NOTHING;

-- ============================================================
-- CONTENT POSTS
-- ============================================================
INSERT INTO aim_content_posts (location_id, platform, content_type, status, title, body, hashtags, scheduled_at, published_at, campaign_tag) VALUES
  ('11111111-0000-0000-0000-000000000001', 'facebook', 'post', 'published', 'Back Pain Awareness Week', 'Did you know 80% of Canadians experience back pain at some point? Our physiotherapy team at AIM South Commons is here to help you move without limits. Book a free assessment today! 🏃‍♂️', ARRAY['#backpain','#physiotherapy','#Edmonton','#AIMSouthCommons','#movewithoutlimits'], now() - interval '3 days', now() - interval '3 days', 'awareness_q1'),
  ('11111111-0000-0000-0000-000000000001', 'instagram', 'post', 'published', 'Exercise Tips for Office Workers', 'Sitting at a desk all day? Try these 5 stretches every hour to prevent neck and shoulder tension. Your future self will thank you! Tag a colleague who needs this 💪', ARRAY['#officeworker','#neckpain','#stretches','#Edmonton','#AIM'], now() - interval '5 days', now() - interval '5 days', 'education_q1'),
  ('11111111-0000-0000-0000-000000000001', 'facebook', 'post', 'awaiting_approval', 'Spring Active Recovery Campaign', 'Spring is here and so is your chance to reclaim your mobility! AIM South Commons is offering complimentary movement screens throughout April. Limited spots — call or book online today.', ARRAY['#springhealth','#Edmonton','#physiotherapy','#AIMClinics'], now() + interval '2 days', null, 'spring_promo'),
  ('11111111-0000-0000-0000-000000000001', 'instagram', 'reel', 'awaiting_approval', 'Clinic Tour Reel', 'Take a tour of our brand new AIM South Commons facility! State-of-the-art equipment, private treatment rooms, and a team that truly cares about your recovery.', ARRAY['#clinictour','#AIMSouthCommons','#Edmonton'], now() + interval '1 day', null, 'brand_q1'),
  ('11111111-0000-0000-0000-000000000002', 'facebook', 'post', 'scheduled', 'WCB & MVA Specialists', 'Injured at work or in a motor vehicle accident? AIM West Edmonton works directly with WCB and all major insurers. No referral needed — just call us.', ARRAY['#WCB','#MVA','#injuryrehab','#Edmonton','#AIM'], now() + interval '12 hours', null, 'wcb_mva_q1'),
  ('11111111-0000-0000-0000-000000000002', 'linkedin', 'post', 'approved', 'Employer Partnership Program', 'AIM is proud to partner with over 50 Alberta employers to support workplace wellness and rapid injury recovery. Our return-to-work specialists reduce lost time by an average of 40%. Connect with our employer programs team.', ARRAY['#workplacewellness','#employerhealth','#Alberta','#returntowork'], now() + interval '1 day', null, 'b2b_employer'),
  ('11111111-0000-0000-0000-000000000002', 'instagram', 'post', 'draft', 'Patient Success Story', 'From 6 months of chronic knee pain to running a 10K — meet [PATIENT NAME] and their incredible recovery journey with our knee rehab program.', ARRAY['#kneerehab','#patientstory','#Edmonton'], null, null, null),
  ('11111111-0000-0000-0000-000000000003', 'facebook', 'post', 'published', 'Grand Opening Leduc', 'Leduc, your new physiotherapy clinic is open! AIM Leduc is now accepting new patients. Same great care, now closer to home. Book your first visit today — $0 assessment for new patients this month!', ARRAY['#Leduc','#physiotherapy','#grandopening','#AIM'], now() - interval '10 days', now() - interval '10 days', 'grand_opening'),
  ('11111111-0000-0000-0000-000000000003', 'facebook', 'post', 'failed', 'Spring Newsletter Post', 'Check out our spring newsletter for health tips, staff spotlights, and what''s new at AIM Leduc this season!', ARRAY['#newsletter','#Leduc','#AIM'], now() - interval '1 day', null, null),
  ('11111111-0000-0000-0000-000000000001', 'google_business', 'offer', 'held', 'April Promo - 20% Off Massage', 'Book any registered massage therapy appointment in April and receive 20% off. Valid for new and existing patients. Call 780-434-9111.', ARRAY[]::text[], now() + interval '3 days', null, 'massage_promo')
ON CONFLICT DO NOTHING;

-- Update failure reason for failed post
UPDATE aim_content_posts SET failure_reason = 'Facebook API error: Page access token expired. Please reconnect the Facebook account in Integrations.' WHERE status = 'failed' AND location_id = '11111111-0000-0000-0000-000000000003';
UPDATE aim_content_posts SET failure_reason = 'Post held pending legal review: contains promotional pricing language that requires compliance sign-off.' WHERE status = 'held' AND location_id = '11111111-0000-0000-0000-000000000001';

-- ============================================================
-- REVIEW TRIAGE
-- ============================================================
INSERT INTO aim_review_triage (location_id, platform, external_review_id, reviewer_name, rating, review_body, review_date, priority, risk_flags, status, sentiment) VALUES
  ('11111111-0000-0000-0000-000000000001', 'google', 'grev_001', 'Sarah M.', 5, 'Absolutely amazing team! Jason worked with me for 8 weeks after my car accident and I am completely pain-free. The front desk is so friendly and the facility is spotless. Highly recommend to anyone needing physiotherapy in Edmonton.', now() - interval '2 days', 'normal', ARRAY[]::text[], 'responded', 'positive'),
  ('11111111-0000-0000-0000-000000000001', 'google', 'grev_002', 'R. Thornton', 2, 'I was overcharged for my last session. I had insurance coverage confirmed but was still billed the full amount. When I called to dispute, the billing department was unhelpful and I had to call three times to get a resolution. Very disappointed in the billing process.', now() - interval '1 day', 'critical', ARRAY['billing_complaint'], 'in_progress', 'negative'),
  ('11111111-0000-0000-0000-000000000001', 'google', 'grev_003', 'James K.', 1, 'I am considering filing a formal complaint. The treatment I received caused additional pain and I believe my therapist was not adequately qualified for my condition. I have spoken with a lawyer about my options.', now() - interval '6 hours', 'critical', ARRAY['legal_threat','escalation_required'], 'escalated', 'negative'),
  ('11111111-0000-0000-0000-000000000002', 'google', 'grev_004', 'Linda P.', 4, 'Great experience overall. My physiotherapist was knowledgeable and the exercises helped a lot. Only minor thing — the parking can be tricky during peak hours.', now() - interval '3 days', 'normal', ARRAY[]::text[], 'responded', 'positive'),
  ('11111111-0000-0000-0000-000000000002', 'google', 'grev_005', 'Anonymous', 3, 'Average experience. The treatment was fine but I felt rushed during my appointments. The 30-minute sessions don''t feel long enough for complex issues.', now() - interval '4 days', 'normal', ARRAY[]::text[], 'new', 'neutral'),
  ('11111111-0000-0000-0000-000000000002', 'facebook', 'frev_001', 'Mike D.', 1, 'Do NOT go here. My personal health information was shared with my employer without my consent. I am a truck driver and my employer found out about my injury before I told them. This is a PRIVACY VIOLATION.', now() - interval '8 hours', 'critical', ARRAY['privacy_concern','legal_threat','escalation_required'], 'escalated', 'negative'),
  ('11111111-0000-0000-0000-000000000003', 'google', 'grev_006', 'Brenda F.', 5, 'Best physio clinic I have been to in Leduc! The staff remembered my name from day one, the facility is brand new, and my back is so much better after just 4 visits. Will be recommending to everyone!', now() - interval '7 days', 'low', ARRAY[]::text[], 'responded', 'positive'),
  ('11111111-0000-0000-0000-000000000003', 'google', 'grev_007', 'Tom A.', 2, 'Waited 25 minutes past my appointment time with no explanation. When I asked, I was told the therapist was running late. My time is valuable too. Will give them another chance but this needs to improve.', now() - interval '1 day', 'high', ARRAY[]::text[], 'new', 'negative'),
  ('11111111-0000-0000-0000-000000000001', 'google', 'grev_008', 'Priya S.', 5, 'I have been coming to AIM South Commons for 3 months for my shoulder injury and the progress has been incredible. Dr. Thompson is so thorough and explains everything clearly. The online booking is also super convenient!', now() - interval '5 days', 'low', ARRAY[]::text[], 'new', 'positive'),
  ('11111111-0000-0000-0000-000000000002', 'google', 'grev_009', 'C. Rawlings', 4, 'Solid physiotherapy clinic. Staff is professional and the treatment has been effective for my WCB claim. Would be 5 stars if they had later evening hours available.', now() - interval '2 days', 'normal', ARRAY[]::text[], 'new', 'positive')
ON CONFLICT (platform, external_review_id) DO NOTHING;

-- ============================================================
-- RESPONSE TEMPLATES
-- ============================================================
INSERT INTO aim_response_templates (location_id, name, category, template_text, platform) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Positive Review Thanks', 'positive', 'Thank you so much for your kind words, {{reviewer_name}}! We are thrilled to hear about your positive experience at AIM South Commons. Our team works hard to provide the best possible care and your feedback truly motivates us. We look forward to continuing to support your recovery journey!', 'google'),
  ('11111111-0000-0000-0000-000000000001', 'Billing Dispute Response', 'billing', 'Thank you for bringing this to our attention, {{reviewer_name}}. We sincerely apologize for any confusion or frustration with your billing. We take these concerns very seriously. Our billing manager will be reaching out to you directly within 1 business day to resolve this immediately. You can also call us directly at 780-434-9111.', 'google'),
  ('11111111-0000-0000-0000-000000000001', 'Wait Time Apology', 'negative', 'We are very sorry about the wait, {{reviewer_name}}. Your time is valuable and you deserve punctual service. We have shared your feedback with our scheduling team. As a goodwill gesture, we would like to offer you a complimentary session upgrade on your next visit. Please call us at 780-434-9111.', 'all'),
  ('11111111-0000-0000-0000-000000000002', 'Positive Review Thanks', 'positive', 'Thank you so much for sharing your experience, {{reviewer_name}}! We are so glad to hear your treatment at AIM West Edmonton has been effective. Our entire team is dedicated to helping you reach your recovery goals. See you at your next appointment!', 'google'),
  ('11111111-0000-0000-0000-000000000003', 'Grand Opening Welcome', 'positive', 'Welcome to the AIM Leduc family, {{reviewer_name}}! We are so excited to serve the Leduc community and thrilled you had a great first experience. We look forward to being your go-to physiotherapy clinic for years to come!', 'google')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CAMPAIGN HEALTH
-- ============================================================
INSERT INTO aim_campaign_health (location_id, platform, campaign_id, campaign_name, snapshot_date, impressions, clicks, spend_cents, leads, conversions, ctr_pct, cpl_cents, roas, health_score, status) VALUES
  ('11111111-0000-0000-0000-000000000001', 'facebook', 'fb_camp_001', 'Spring Active Recovery - South Commons', CURRENT_DATE, 18420, 412, 85000, 28, 14, 2.237, 303571, 3.820, 87, 'active'),
  ('11111111-0000-0000-0000-000000000001', 'facebook', 'fb_camp_002', 'WCB/MVA Awareness - South Commons', CURRENT_DATE, 9100, 183, 42000, 12, 7, 2.011, 350000, 2.950, 72, 'active'),
  ('11111111-0000-0000-0000-000000000001', 'google_ads', 'ga_camp_001', 'Physiotherapy Edmonton - South', CURRENT_DATE, 5600, 298, 63000, 31, 18, 5.321, 203225, 4.920, 92, 'active'),
  ('11111111-0000-0000-0000-000000000002', 'facebook', 'fb_camp_003', 'West Edmonton Employer Wellness', CURRENT_DATE, 12300, 245, 55000, 19, 11, 1.991, 289473, 3.450, 80, 'active'),
  ('11111111-0000-0000-0000-000000000002', 'facebook', 'fb_camp_004', 'Back Pain Solutions - West', CURRENT_DATE, 7800, 102, 38000, 6, 2, 1.307, 633333, 1.420, 34, 'limited'),
  ('11111111-0000-0000-0000-000000000002', 'google_ads', 'ga_camp_002', 'Physiotherapy West Edmonton', CURRENT_DATE, 4200, 251, 48000, 22, 13, 5.976, 218181, 4.680, 88, 'active'),
  ('11111111-0000-0000-0000-000000000003', 'facebook', 'fb_camp_005', 'Grand Opening Leduc - New Patients', CURRENT_DATE, 22100, 534, 72000, 41, 23, 2.416, 175609, 5.210, 95, 'active'),
  ('11111111-0000-0000-0000-000000000003', 'facebook', 'fb_camp_006', 'Leduc Community Awareness', CURRENT_DATE, 8900, 89, 28000, 5, 2, 1.000, 560000, 1.180, 28, 'learning')
ON CONFLICT (location_id, platform, campaign_id, snapshot_date) DO NOTHING;

-- ============================================================
-- CAMPAIGN ALERTS
-- ============================================================
DO $$
DECLARE
  ch_id_low_roas uuid;
  ch_id_learning uuid;
BEGIN
  SELECT id INTO ch_id_low_roas FROM aim_campaign_health WHERE campaign_id = 'fb_camp_004';
  SELECT id INTO ch_id_learning FROM aim_campaign_health WHERE campaign_id = 'fb_camp_006';

  IF ch_id_low_roas IS NOT NULL THEN
    INSERT INTO aim_campaign_alerts (location_id, campaign_health_id, alert_type, severity, message)
    VALUES
      ('11111111-0000-0000-0000-000000000002', ch_id_low_roas, 'low_roas', 'critical', 'Back Pain Solutions - West: ROAS of 1.42x is below minimum threshold of 2.0x. Campaign is spending $380/day with insufficient return. Recommend pausing and refreshing creative.'),
      ('11111111-0000-0000-0000-000000000002', ch_id_low_roas, 'high_cpl', 'warning', 'Back Pain Solutions - West: CPL of $63.33 is 2.1x above target of $30. Consider narrowing audience targeting or pausing underperforming ad sets.')
    ON CONFLICT DO NOTHING;
  END IF;

  IF ch_id_learning IS NOT NULL THEN
    INSERT INTO aim_campaign_alerts (location_id, campaign_health_id, alert_type, severity, message)
    VALUES
      ('11111111-0000-0000-0000-000000000003', ch_id_learning, 'learning_phase', 'info', 'Leduc Community Awareness: Campaign is in learning phase. Avoid making significant changes for at least 48 hours to allow the algorithm to optimize delivery.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- INTEGRATION CONFIGS
-- ============================================================
INSERT INTO aim_integration_configs (location_id, integration_name, status, config, last_verified_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'facebook_ads', 'connected', '{"ad_account_id": "act_aim_south_001", "pixel_id": "pxl_aim_south"}', now() - interval '2 hours'),
  ('11111111-0000-0000-0000-000000000001', 'instagram', 'connected', '{"business_account_id": "ig_biz_aim_south"}', now() - interval '2 hours'),
  ('11111111-0000-0000-0000-000000000001', 'google_business', 'connected', '{"location_name": "AIM South Commons", "place_id": "ChIJ_aim_south_commons"}', now() - interval '4 hours'),
  ('11111111-0000-0000-0000-000000000001', 'google_ads', 'connected', '{"customer_id": "123-456-7890", "conversion_action": "book_appointment"}', now() - interval '4 hours'),
  ('11111111-0000-0000-0000-000000000002', 'facebook_ads', 'connected', '{"ad_account_id": "act_aim_west_001", "pixel_id": "pxl_aim_west"}', now() - interval '1 hour'),
  ('11111111-0000-0000-0000-000000000002', 'instagram', 'connected', '{"business_account_id": "ig_biz_aim_west"}', now() - interval '1 hour'),
  ('11111111-0000-0000-0000-000000000002', 'google_business', 'connected', '{"location_name": "AIM West Edmonton", "place_id": "ChIJ_aim_west_edmonton"}', now() - interval '3 hours'),
  ('11111111-0000-0000-0000-000000000002', 'google_ads', 'connected', '{"customer_id": "234-567-8901", "conversion_action": "book_appointment"}', now() - interval '3 hours'),
  ('11111111-0000-0000-0000-000000000002', 'linkedin', 'connected', '{"company_id": "li_aim_corp_001", "page_name": "Alberta Injury Management"}', now() - interval '6 hours'),
  ('11111111-0000-0000-0000-000000000003', 'facebook_ads', 'error', '{"ad_account_id": "act_aim_leduc_001"}', now() - interval '12 hours'),
  ('11111111-0000-0000-0000-000000000003', 'google_business', 'error', '{"location_name": "AIM Leduc", "place_id": "ChIJ_aim_leduc"}', now() - interval '12 hours'),
  ('11111111-0000-0000-0000-000000000001', 'n8n', 'connected', '{"webhook_url": "https://n8n.aimclinics.ca/webhook/aim-automation", "workflow_id": "wf_001"}', now() - interval '1 day'),
  ('11111111-0000-0000-0000-000000000001', 'openai', 'connected', '{"model": "gpt-4o", "purpose": "content_generation"}', now() - interval '1 day')
ON CONFLICT (location_id, integration_name) DO NOTHING;

UPDATE aim_integration_configs SET error_message = 'Facebook page access token has expired. Please reconnect the Facebook account.' WHERE location_id = '11111111-0000-0000-0000-000000000003' AND integration_name = 'facebook_ads';
UPDATE aim_integration_configs SET error_message = 'Google Business Profile API: Location verification required. Please complete Google verification process.' WHERE location_id = '11111111-0000-0000-0000-000000000003' AND integration_name = 'google_business';

-- ============================================================
-- POLICY RULES
-- ============================================================
INSERT INTO aim_policy_rules (location_id, name, rule_type, platform, conditions, actions, priority, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Require approval for promotional pricing', 'approval_gate', 'all', '{"triggers": ["contains_price", "contains_discount", "contains_percentage_off"]}', '{"action": "block_and_require_approval", "approver_role": "admin", "notify_slack": true}', 10, true),
  ('11111111-0000-0000-0000-000000000001', 'Block medical claims language', 'content_filter', 'all', '{"blocked_phrases": ["cures", "guarantees", "eliminates pain permanently", "100% effective"]}', '{"action": "block_post", "reason": "Blocked medical claims language", "notify_author": true}', 5, true),
  ('11111111-0000-0000-0000-000000000001', 'No posting between 10pm-6am', 'schedule_restriction', 'all', '{"blocked_hours": {"start": 22, "end": 6}, "timezone": "America/Edmonton"}', '{"action": "reschedule_to_next_window", "notify_author": true}', 20, true),
  ('11111111-0000-0000-0000-000000000001', 'Auto-escalate 1-star reviews', 'review_escalation', 'all', '{"conditions": {"rating_lte": 1}}', '{"action": "escalate_to_manager", "priority": "critical", "notify_slack": true}', 15, true),
  ('11111111-0000-0000-0000-000000000002', 'Pause campaigns when CPL exceeds $75', 'auto_pause', 'facebook', '{"conditions": {"cpl_cents_gte": 7500, "evaluation_window_days": 3}}', '{"action": "pause_campaign", "notify_team": true, "create_alert": true}', 10, true),
  ('11111111-0000-0000-0000-000000000002', 'Require approval for competitor mentions', 'approval_gate', 'all', '{"triggers": ["mentions_competitor"]}', '{"action": "block_and_require_approval", "approver_role": "executive", "notify_slack": true}', 8, true),
  ('11111111-0000-0000-0000-000000000003', 'Auto-escalate legal risk reviews', 'review_escalation', 'all', '{"conditions": {"risk_flags_contains": ["legal_threat", "privacy_concern"]}}', '{"action": "escalate_to_executive", "priority": "critical", "notify_slack": true, "create_task": true}', 5, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- KPI SNAPSHOTS (last 7 days)
-- ============================================================
INSERT INTO aim_kpi_snapshots (location_id, snapshot_date, total_posts_published, total_posts_pending, avg_response_time_hours, total_reviews_received, total_reviews_responded, avg_rating, total_ad_spend_cents, total_leads, total_conversions, avg_health_score, open_alerts) VALUES
  ('11111111-0000-0000-0000-000000000001', CURRENT_DATE, 2, 3, 6.2, 4, 3, 4.2, 127000, 59, 32, 84, 0),
  ('11111111-0000-0000-0000-000000000002', CURRENT_DATE, 1, 2, 4.8, 4, 2, 3.8, 141000, 47, 26, 70, 2),
  ('11111111-0000-0000-0000-000000000003', CURRENT_DATE, 1, 0, 8.1, 2, 1, 3.5, 100000, 46, 25, 62, 1),
  ('11111111-0000-0000-0000-000000000001', CURRENT_DATE - 1, 3, 2, 5.4, 3, 3, 4.5, 118000, 51, 28, 86, 1),
  ('11111111-0000-0000-0000-000000000002', CURRENT_DATE - 1, 2, 3, 3.9, 2, 2, 4.0, 135000, 43, 24, 75, 1),
  ('11111111-0000-0000-0000-000000000003', CURRENT_DATE - 1, 2, 1, 7.2, 3, 2, 4.2, 98000, 44, 22, 68, 2),
  ('11111111-0000-0000-0000-000000000001', CURRENT_DATE - 2, 4, 1, 4.8, 5, 4, 4.4, 122000, 55, 30, 88, 0),
  ('11111111-0000-0000-0000-000000000002', CURRENT_DATE - 2, 2, 2, 5.1, 1, 1, 4.0, 128000, 39, 21, 78, 0),
  ('11111111-0000-0000-0000-000000000003', CURRENT_DATE - 2, 3, 0, 6.8, 2, 2, 4.8, 95000, 38, 19, 71, 1)
ON CONFLICT (location_id, snapshot_date) DO NOTHING;
