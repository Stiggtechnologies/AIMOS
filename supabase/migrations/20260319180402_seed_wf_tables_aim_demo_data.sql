
/*
  # Seed wf_* Tables with AIM Demo Data

  Seeds all workflow-layer tables with realistic AIM Automation demo data.

  ## Tables seeded:
  - wf_content_items: 12 content pieces across 3 locations/5 channels
  - wf_reviews: 15 reviews (Google + Facebook) across locations
  - wf_publish_jobs: 14 publish jobs referencing content items
  - wf_workflow_runs: 10 workflow execution records
  - wf_workflow_exceptions: 6 exception records
  - wf_kpi_daily_snapshots: rows for last 7 days, 3 locations, 6 metrics
  - wf_integration_accounts: 9 integration account rows
  - wf_idempotency_keys: 8 idempotency key records
  - wf_alerts: 6 alert records
  - wf_notification_events: 8 notification event records
  - wf_audit_events: 10 audit event records

  ## Notes:
  - wf_idempotency_keys.status: available|consumed|failed|expired
  - wf_workflow_runs.output_payload_json is NOT NULL (use '{}' for in-progress runs)
  - wf_reviews unique constraint is composite: (source, external_review_id)
  - wf_alerts.severity: info|warning|error|critical (not 'high')
*/

DO $$
DECLARE
  loc_sc   uuid := 'ada24372-6212-4c44-b731-e2d73f6a1741';
  loc_dt   uuid := '623c41ff-2890-4e4f-8768-bae9fcfd3668';
  loc_we   uuid := '918be1ac-f4fe-4eaa-b539-ce2e16f83916';

  ch_fb    uuid := 'ad99c1f1-6d42-4678-90b4-30e692812697';
  ch_ig    uuid := '229a23db-84bb-4e08-a4e2-a961cb1c9176';
  ch_li    uuid := 'c2049977-7e04-4189-8c70-e015d7fa6d3f';
  ch_gbp   uuid := '3fb44205-7dd1-4a98-a1ac-60ac50956f9d';
  ch_tt    uuid := '611c39ff-8175-4215-8b9a-ea250185721b';

  ci1  uuid := gen_random_uuid();
  ci2  uuid := gen_random_uuid();
  ci3  uuid := gen_random_uuid();
  ci4  uuid := gen_random_uuid();
  ci5  uuid := gen_random_uuid();
  ci6  uuid := gen_random_uuid();
  ci7  uuid := gen_random_uuid();
  ci8  uuid := gen_random_uuid();
  ci9  uuid := gen_random_uuid();
  ci10 uuid := gen_random_uuid();
  ci11 uuid := gen_random_uuid();
  ci12 uuid := gen_random_uuid();

  ik1  uuid := gen_random_uuid();
  ik2  uuid := gen_random_uuid();
  ik3  uuid := gen_random_uuid();
  ik4  uuid := gen_random_uuid();
  ik5  uuid := gen_random_uuid();
  ik6  uuid := gen_random_uuid();
  ik7  uuid := gen_random_uuid();
  ik8  uuid := gen_random_uuid();

  wr1  uuid := gen_random_uuid();
  wr2  uuid := gen_random_uuid();
  wr3  uuid := gen_random_uuid();
  wr4  uuid := gen_random_uuid();
  wr5  uuid := gen_random_uuid();
  wr6  uuid := gen_random_uuid();
  wr7  uuid := gen_random_uuid();
  wr8  uuid := gen_random_uuid();
  wr9  uuid := gen_random_uuid();
  wr10 uuid := gen_random_uuid();

BEGIN

-- wf_idempotency_keys
INSERT INTO wf_idempotency_keys (id, scope, unique_key, status, created_at) VALUES
  (ik1, 'publish_job', 'publish_sc_fb_backpain_20260315',   'consumed',  now() - interval '4 days'),
  (ik2, 'publish_job', 'publish_sc_ig_exercise_20260316',  'consumed',  now() - interval '3 days'),
  (ik3, 'publish_job', 'publish_dt_fb_newpatient_20260316','consumed',  now() - interval '3 days'),
  (ik4, 'publish_job', 'publish_we_li_employer_20260317',  'consumed',  now() - interval '2 days'),
  (ik5, 'publish_job', 'publish_sc_gbp_review_20260317',   'available', now() - interval '2 days'),
  (ik6, 'publish_job', 'publish_dt_ig_staff_20260318',     'failed',    now() - interval '1 day'),
  (ik7, 'publish_job', 'publish_we_tt_stretch_20260318',   'available', now() - interval '1 day'),
  (ik8, 'publish_job', 'publish_sc_fb_morning_20260319',   'available', now())
ON CONFLICT (unique_key) DO NOTHING;

-- wf_content_items
INSERT INTO wf_content_items (id, title, description, location_id, content_pillar, primary_channel_id, status, risk_score, scheduled_for, created_at, updated_at) VALUES
  (ci1,  'Back Pain Prevention Tips',          'Five evidence-based tips for preventing lower back pain at work',              loc_sc, 'education',    ch_fb,  'published',         0.10, now() - interval '4 days', now() - interval '6 days', now() - interval '4 days'),
  (ci2,  'Morning Stretch Routine',            '3-minute morning mobility sequence for office workers',                       loc_sc, 'education',    ch_ig,  'published',         0.15, now() - interval '3 days', now() - interval '5 days', now() - interval '3 days'),
  (ci3,  'New Patient Welcome',                'Welcome message for new patients starting physiotherapy',                     loc_dt, 'community',    ch_fb,  'published',         0.05, now() - interval '3 days', now() - interval '4 days', now() - interval '3 days'),
  (ci4,  'Employer Wellness Programs',         'How AIM partners with Edmonton employers for workplace health',               loc_we, 'education',    ch_li,  'published',         0.20, now() - interval '2 days', now() - interval '3 days', now() - interval '2 days'),
  (ci5,  'Sports Recovery Spotlight',          'Highlighting athlete recovery success story at South Commons',                loc_sc, 'social_proof', ch_gbp, 'scheduled',         0.30, now() + interval '1 day',  now() - interval '1 day',  now() - interval '1 day'),
  (ci6,  'Staff Introduction - Dr. Sarah Kim', 'Meet our new physiotherapist joining the Downtown team',                     loc_dt, 'community',    ch_ig,  'awaiting_approval', 0.25, now() + interval '2 days', now() - interval '1 day',  now() - interval '1 day'),
  (ci7,  'TikTok Stretch Series #1',           'Quick hip flexor stretch for desk workers',                                  loc_we, 'education',    ch_tt,  'scheduled',         0.40, now() + interval '1 day',  now() - interval '2 days', now() - interval '2 days'),
  (ci8,  'Concussion Recovery Guide',          'Return-to-activity protocol overview for concussion patients',               loc_sc, 'education',    ch_fb,  'approved',          0.35, now() + interval '3 days', now() - interval '1 day',  now()),
  (ci9,  'Google Review Thank You',            'Response template for 5-star Google reviews',                                loc_dt, 'reputation',   ch_gbp, 'draft',             0.10, null,                      now(),                     now()),
  (ci10, 'Holiday Hours Announcement',         'Statutory holiday schedule for all AIM locations',                           loc_sc, 'community',    ch_fb,  'held',              0.15, null,                      now() - interval '3 days', now() - interval '3 days'),
  (ci11, 'Pelvic Floor Awareness Post',        'Education post for pelvic floor physiotherapy services',                     loc_we, 'education',    ch_ig,  'generated',         0.45, now() + interval '4 days', now(),                     now()),
  (ci12, 'Chiro Adjustment Explainer',         'What to expect during your first chiropractic adjustment',                   loc_dt, 'education',    ch_fb,  'failed',            0.60, now() - interval '1 day',  now() - interval '2 days', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- wf_publish_jobs
INSERT INTO wf_publish_jobs (id, content_item_id, channel_id, location_id, scheduled_for, status, retry_count, max_retries, idempotency_key_id, external_job_ref, failure_reason, created_at, updated_at) VALUES
  (gen_random_uuid(), ci1,  ch_fb,  loc_sc, now() - interval '4 days', 'published',  0, 3, ik1,  'n8n-exec-fb-001', null,                                                        now() - interval '5 days', now() - interval '4 days'),
  (gen_random_uuid(), ci2,  ch_ig,  loc_sc, now() - interval '3 days', 'published',  0, 3, ik2,  'n8n-exec-ig-002', null,                                                        now() - interval '4 days', now() - interval '3 days'),
  (gen_random_uuid(), ci3,  ch_fb,  loc_dt, now() - interval '3 days', 'published',  1, 3, ik3,  'n8n-exec-fb-003', null,                                                        now() - interval '4 days', now() - interval '3 days'),
  (gen_random_uuid(), ci4,  ch_li,  loc_we, now() - interval '2 days', 'published',  0, 3, ik4,  'n8n-exec-li-004', null,                                                        now() - interval '3 days', now() - interval '2 days'),
  (gen_random_uuid(), ci5,  ch_gbp, loc_sc, now() + interval '1 day',  'queued',     0, 3, ik5,  null,              null,                                                        now() - interval '1 day',  now()),
  (gen_random_uuid(), ci6,  ch_ig,  loc_dt, now() + interval '2 days', 'held',       0, 3, null, null,              'Awaiting content approval before scheduling',               now() - interval '1 day',  now()),
  (gen_random_uuid(), ci7,  ch_tt,  loc_we, now() + interval '1 day',  'queued',     0, 3, ik7,  null,              null,                                                        now() - interval '2 days', now()),
  (gen_random_uuid(), ci8,  ch_fb,  loc_sc, now() + interval '3 days', 'queued',     0, 3, null, null,              null,                                                        now() - interval '1 day',  now()),
  (gen_random_uuid(), ci12, ch_fb,  loc_dt, now() - interval '1 day',  'failed',     3, 3, null, 'n8n-exec-fb-009', 'Facebook API rate limit exceeded after 3 retries',         now() - interval '2 days', now() - interval '1 day'),
  (gen_random_uuid(), ci10, ch_fb,  loc_sc, now() - interval '2 days', 'cancelled',  0, 3, null, null,              'Content held pending legal review of holiday messaging',   now() - interval '3 days', now() - interval '2 days'),
  (gen_random_uuid(), ci1,  ch_ig,  loc_sc, now() - interval '4 days', 'published',  0, 3, null, 'n8n-exec-ig-011', null,                                                        now() - interval '5 days', now() - interval '4 days'),
  (gen_random_uuid(), ci3,  ch_ig,  loc_dt, now() - interval '2 days', 'published',  0, 3, null, 'n8n-exec-ig-012', null,                                                        now() - interval '3 days', now() - interval '2 days'),
  (gen_random_uuid(), ci4,  ch_fb,  loc_we, now() - interval '1 day',  'publishing', 0, 3, null, 'n8n-exec-fb-013', null,                                                        now() - interval '2 days', now()),
  (gen_random_uuid(), ci11, ch_ig,  loc_we, now() + interval '4 days', 'due',        0, 3, null, null,              null,                                                        now(),                     now())
ON CONFLICT DO NOTHING;

-- wf_workflow_runs
INSERT INTO wf_workflow_runs (id, workflow_name, source_system, correlation_id, environment, status, input_payload_json, output_payload_json, started_at, completed_at) VALUES
  (wr1,  'content-publish-facebook',       'n8n', 'corr-001-fb-sc',   'production', 'completed', '{"location":"South Commons","channel":"facebook"}',              '{"post_id":"fb_post_sc_001","reach":842}',          now() - interval '4 days',    now() - interval '4 days'    + interval '45 seconds'),
  (wr2,  'content-publish-instagram',      'n8n', 'corr-002-ig-sc',   'production', 'completed', '{"location":"South Commons","channel":"instagram"}',             '{"post_id":"ig_post_sc_001","impressions":1204}',   now() - interval '3 days',    now() - interval '3 days'    + interval '38 seconds'),
  (wr3,  'content-publish-facebook',       'n8n', 'corr-003-fb-dt',   'production', 'completed', '{"location":"Downtown Edmonton","channel":"facebook","retry":1}', '{"post_id":"fb_post_dt_001"}',                     now() - interval '3 days',    now() - interval '3 days'    + interval '62 seconds'),
  (wr4,  'review-response-sync',           'n8n', 'corr-004-rv-sc',   'production', 'completed', '{"source":"google","location":"South Commons"}',                 '{"reviews_synced":4,"new_reviews":2}',              now() - interval '2 days',    now() - interval '2 days'    + interval '12 seconds'),
  (wr5,  'content-publish-facebook',       'n8n', 'corr-005-fb-dt',   'production', 'failed',    '{"location":"Downtown Edmonton","channel":"facebook"}',           '{"error":"rate_limit_exceeded","retry_after":3600}',now() - interval '1 day',     now() - interval '1 day'     + interval '8 seconds'),
  (wr6,  'kpi-snapshot-daily',             'n8n', 'corr-006-kpi-all', 'production', 'completed', '{"date":"2026-03-18","locations":["all"]}',                       '{"snapshots_written":15}',                         now() - interval '1 day',     now() - interval '1 day'     + interval '6 seconds'),
  (wr7,  'review-response-sync',           'n8n', 'corr-007-rv-dt',   'production', 'completed', '{"source":"google","location":"Downtown Edmonton"}',              '{"reviews_synced":3,"new_reviews":1}',              now() - interval '1 day',     now() - interval '1 day'     + interval '9 seconds'),
  (wr8,  'content-approval-notification',  'n8n', 'corr-008-appr',    'production', 'completed', '{"content_item_id":"ci6","action":"awaiting_approval"}',          '{"notification_sent":true}',                       now() - interval '22 hours',  now() - interval '22 hours'  + interval '3 seconds'),
  (wr9,  'integration-health-check',       'n8n', 'corr-009-health',  'production', 'partial',   '{"check_all":true}',                                              '{"checked":9,"degraded":1,"failed":0}',            now() - interval '2 hours',   now() - interval '2 hours'   + interval '5 seconds'),
  (wr10, 'content-publish-facebook',       'n8n', 'corr-010-fb-we',   'production', 'started',   '{"location":"West Edmonton","channel":"facebook"}',               '{}',                                               now() - interval '5 minutes', null)
ON CONFLICT DO NOTHING;

-- wf_workflow_exceptions
INSERT INTO wf_workflow_exceptions (workflow_name, workflow_run_id, source_system, severity, root_cause, summary, details_json, retry_attempts, max_retries, status, created_at, resolved_at) VALUES
  ('content-publish-facebook',      wr5,  'n8n', 'high',     'api_rate_limit',   'Facebook API rate limit exceeded for Downtown Edmonton — post failed after 3 retries',          '{"endpoint":"/v18.0/me/feed","http_status":429,"retry_after_seconds":3600,"location":"Downtown Edmonton"}',                3, 3, 'open',     now() - interval '1 day',    null),
  ('review-response-sync',          wr4,  'n8n', 'low',      'schema_mismatch',  'Google My Business API returned unexpected field structure for 1 review — skipped gracefully',  '{"review_id":"gmb_rv_unexpected_001","field":"reviewer.displayName","expected":"string","got":"null"}',                  0, 1, 'resolved', now() - interval '2 days',   now() - interval '2 days' + interval '30 minutes'),
  ('integration-health-check',      wr9,  'n8n', 'medium',   'token_expiry',     'TikTok integration token expiring within 48 hours — requires manual refresh',                   '{"integration":"TikTok","location":"West Edmonton","expires_at":"2026-03-21T00:00:00Z"}',                                0, 0, 'triaged',  now() - interval '2 hours',  null),
  ('content-approval-notification', null, 'n8n', 'low',      'delivery_failure', 'Slack notification for content approval failed — fallback email sent successfully',             '{"channel":"slack","fallback":"email","content_item":"Staff Introduction - Dr. Sarah Kim"}',                           1, 2, 'resolved', now() - interval '22 hours', now() - interval '21 hours'),
  ('kpi-snapshot-daily',            wr6,  'n8n', 'low',      'missing_data',     'KPI snapshot for West Edmonton missing reach metric — channel API temporarily unavailable',     '{"metric":"reach","location":"West Edmonton","channel":"TikTok","fallback":"previous_day_value_used"}',                 0, 0, 'ignored',  now() - interval '1 day',    null),
  ('content-publish-instagram',     null, 'n8n', 'critical', 'auth_revoked',     'Instagram auth token revoked for South Commons — all IG publish jobs blocked',                  '{"location":"South Commons","account":"@aimsouthcommons","action_required":"Re-authorize in Integrations tab"}',        0, 0, 'escalated',now() - interval '3 hours',  null);

-- wf_reviews
INSERT INTO wf_reviews (source, location_id, external_review_id, author_name, rating, review_text, review_timestamp, sentiment_score, severity_score, response_status, created_at, updated_at) VALUES
  ('google',   loc_sc, 'gmb_sc_rv_001', 'Jennifer Walsh',   5, 'Absolutely incredible team at South Commons. My physiotherapist completely changed how I manage my chronic back pain. Highly recommend!',     now() - interval '2 days',   0.95, 0.00, 'responded',        now() - interval '2 days',   now() - interval '1 day'),
  ('google',   loc_sc, 'gmb_sc_rv_002', 'Marcus Thompson',  4, 'Great clinic, very professional staff. Wait times can be a bit long but the quality of care makes up for it.',                                 now() - interval '3 days',   0.72, 0.15, 'responded',        now() - interval '3 days',   now() - interval '2 days'),
  ('google',   loc_sc, 'gmb_sc_rv_003', 'Anonymous',        2, 'Disappointed with how my cancellation was handled. No follow-up call, lost my appointment slot. Staff were unhelpful when I called.',         now() - interval '5 days',   0.15, 0.78, 'escalated',        now() - interval '5 days',   now() - interval '4 days'),
  ('google',   loc_sc, 'gmb_sc_rv_004', 'Priya Sharma',     5, 'Best physiotherapy experience I have ever had. The massage therapy combined with the physio program got me back to running in 6 weeks!',      now() - interval '1 day',    0.97, 0.00, 'drafted',          now() - interval '1 day',    now()),
  ('google',   loc_sc, 'gmb_sc_rv_005', 'David Chen',       3, 'Average experience. Nothing wrong but nothing exceptional either. Parking is a hassle.',                                                     now() - interval '7 days',   0.48, 0.20, 'responded',        now() - interval '7 days',   now() - interval '6 days'),
  ('google',   loc_dt, 'gmb_dt_rv_001', 'Sarah Blackwood',  5, 'Dr. Kim and the whole Downtown team are phenomenal. I came in barely able to walk and left my 3rd appointment feeling 80% better.',          now() - interval '1 day',    0.98, 0.00, 'unresponded',      now() - interval '1 day',    now()),
  ('google',   loc_dt, 'gmb_dt_rv_002', 'Robert Nguyen',    4, 'Very knowledgeable practitioners. The exercise programs they gave me are genuinely helping with my shoulder recovery.',                       now() - interval '4 days',   0.80, 0.05, 'responded',        now() - interval '4 days',   now() - interval '3 days'),
  ('google',   loc_dt, 'gmb_dt_rv_003', 'Emma Clarke',      1, 'Waited 25 minutes past my appointment time with no explanation. When I asked the front desk they were rude. Will not be returning.',         now() - interval '2 days',   0.05, 0.92, 'escalated',        now() - interval '2 days',   now() - interval '1 day'),
  ('facebook', loc_dt, 'fb_dt_rv_001',  'James Okonkwo',    5, 'Amazing place. Treated my sports injury and now I am back on the ice. The team really cares about outcomes.',                                now() - interval '3 days',   0.96, 0.00, 'responded',        now() - interval '3 days',   now() - interval '2 days'),
  ('google',   loc_we, 'gmb_we_rv_001', 'Lisa Park',        5, 'Pelvic floor physio program at West Edmonton is outstanding. Life changing treatment delivered with total professionalism and care.',         now() - interval '6 hours',  0.99, 0.00, 'unresponded',      now() - interval '6 hours',  now()),
  ('google',   loc_we, 'gmb_we_rv_002', 'Mike Stevenson',   4, 'Solid clinic. Chiropractor is excellent. Some scheduling issues in the past but they have improved recently.',                                now() - interval '5 days',   0.71, 0.12, 'responded',        now() - interval '5 days',   now() - interval '4 days'),
  ('google',   loc_we, 'gmb_we_rv_003', 'Fatima Al-Hassan', 2, 'Billing issue took 3 weeks to resolve. Nobody called me back when they said they would. Very frustrating experience.',                       now() - interval '8 days',   0.12, 0.75, 'awaiting_approval',now() - interval '8 days',   now() - interval '1 day'),
  ('facebook', loc_sc, 'fb_sc_rv_001',  'Tom Bradley',      5, 'Came in for a sports massage and ended up enrolling in the gym rehab program. Best decision I ever made for my health.',                     now() - interval '4 days',   0.94, 0.00, 'responded',        now() - interval '4 days',   now() - interval '3 days'),
  ('google',   loc_sc, 'gmb_sc_rv_006', 'Kelly Morrison',   5, 'The new booking system is so easy to use. Booked online, got a reminder text, everything was smooth. Great treatment too!',                  now() - interval '12 hours', 0.92, 0.00, 'unresponded',      now() - interval '12 hours', now()),
  ('facebook', loc_we, 'fb_we_rv_001',  'Carlos Mendez',    3, 'Decent clinic. Parking can be tricky. Staff are friendly but sometimes hard to reach by phone.',                                             now() - interval '3 days',   0.50, 0.22, 'responded',        now() - interval '3 days',   now() - interval '2 days')
ON CONFLICT (source, external_review_id) DO NOTHING;

-- wf_kpi_daily_snapshots
INSERT INTO wf_kpi_daily_snapshots (snapshot_date, location_id, channel_id, metric_name, metric_value, metadata_json, created_at)
SELECT
  d::date,
  loc,
  ch,
  metric,
  ROUND((base_val + (RANDOM() * variance))::numeric, 2),
  '{"source":"n8n_kpi_workflow"}'::jsonb,
  now()
FROM (
  VALUES
    (now() - interval '6 days'), (now() - interval '5 days'),
    (now() - interval '4 days'), (now() - interval '3 days'),
    (now() - interval '2 days'), (now() - interval '1 day'),
    (now())
) AS days(d)
CROSS JOIN (
  VALUES
    ('ada24372-6212-4c44-b731-e2d73f6a1741'::uuid, 'ad99c1f1-6d42-4678-90b4-30e692812697'::uuid, 'post_reach',    420::numeric, 180::numeric),
    ('ada24372-6212-4c44-b731-e2d73f6a1741'::uuid, '229a23db-84bb-4e08-a4e2-a961cb1c9176'::uuid, 'impressions',  1100::numeric, 400::numeric),
    ('623c41ff-2890-4e4f-8768-bae9fcfd3668'::uuid, 'ad99c1f1-6d42-4678-90b4-30e692812697'::uuid, 'post_reach',    380::numeric, 150::numeric),
    ('623c41ff-2890-4e4f-8768-bae9fcfd3668'::uuid, '3fb44205-7dd1-4a98-a1ac-60ac50956f9d'::uuid, 'profile_views',  95::numeric,  40::numeric),
    ('918be1ac-f4fe-4eaa-b539-ce2e16f83916'::uuid, '229a23db-84bb-4e08-a4e2-a961cb1c9176'::uuid, 'impressions',   880::numeric, 350::numeric),
    ('918be1ac-f4fe-4eaa-b539-ce2e16f83916'::uuid, '611c39ff-8175-4215-8b9a-ea250185721b'::uuid, 'video_views',   260::numeric, 120::numeric)
) AS metrics(loc, ch, metric, base_val, variance)
ON CONFLICT DO NOTHING;

-- wf_integration_accounts
INSERT INTO wf_integration_accounts (provider, account_name, location_id, environment, connection_status, scopes_summary, last_successful_sync_at, last_error_at, last_error_message, token_expires_at, metadata_json, created_at, updated_at) VALUES
  ('facebook',                'AIM South Commons',     loc_sc, 'production', 'connected',     'pages_manage_posts, pages_read_engagement',  now() - interval '2 hours',    null,                       null,                                        now() + interval '55 days', '{"page_id":"sc_fb_page_001"}', now() - interval '60 days', now() - interval '2 hours'),
  ('instagram',               'AIM South Commons',     loc_sc, 'production', 'auth_required', 'instagram_basic, instagram_content_publish', now() - interval '4 days',     now() - interval '3 hours', 'Token revoked — re-authorization required', now() - interval '3 hours', '{"ig_user_id":"sc_ig_001"}',   now() - interval '60 days', now() - interval '3 hours'),
  ('google_business_profile', 'AIM South Commons',     loc_sc, 'production', 'connected',     'Business.Manage, Reviews.ReadWrite',         now() - interval '30 minutes', null,                       null,                                        now() + interval '80 days', '{"location_id":"sc_gbp_001"}', now() - interval '90 days', now() - interval '30 minutes'),
  ('facebook',                'AIM Downtown Edmonton', loc_dt, 'production', 'connected',     'pages_manage_posts, pages_read_engagement',  now() - interval '1 hour',     null,                       null,                                        now() + interval '42 days', '{"page_id":"dt_fb_page_001"}', now() - interval '60 days', now() - interval '1 hour'),
  ('google_business_profile', 'AIM Downtown Edmonton', loc_dt, 'production', 'connected',     'Business.Manage, Reviews.ReadWrite',         now() - interval '45 minutes', null,                       null,                                        now() + interval '78 days', '{"location_id":"dt_gbp_001"}', now() - interval '90 days', now() - interval '45 minutes'),
  ('instagram',               'AIM Downtown Edmonton', loc_dt, 'production', 'connected',     'instagram_basic, instagram_content_publish', now() - interval '2 hours',    null,                       null,                                        now() + interval '30 days', '{"ig_user_id":"dt_ig_001"}',   now() - interval '60 days', now() - interval '2 hours'),
  ('facebook',                'AIM West Edmonton',     loc_we, 'production', 'connected',     'pages_manage_posts, pages_read_engagement',  now() - interval '3 hours',    null,                       null,                                        now() + interval '65 days', '{"page_id":"we_fb_page_001"}', now() - interval '60 days', now() - interval '3 hours'),
  ('tiktok',                  'AIM West Edmonton',     loc_we, 'production', 'degraded',      'video.upload, video.list',                   now() - interval '2 hours',    now() - interval '2 hours', 'Token expires in <48h — refresh required',  now() + interval '2 days',  '{"creator_id":"we_tt_001"}',   now() - interval '60 days', now() - interval '2 hours'),
  ('google_business_profile', 'AIM West Edmonton',     loc_we, 'production', 'connected',     'Business.Manage, Reviews.ReadWrite',         now() - interval '1 hour',     null,                       null,                                        now() + interval '72 days', '{"location_id":"we_gbp_001"}', now() - interval '90 days', now() - interval '1 hour')
ON CONFLICT DO NOTHING;

-- wf_alerts
INSERT INTO wf_alerts (alert_type, severity, title, message, target_type, status, created_at) VALUES
  ('auth_revoked',     'critical', 'Instagram Auth Revoked — South Commons',      'Instagram API token has been revoked for AIM South Commons. All Instagram publish jobs are blocked until re-authorization.',       'integration', 'open',         now() - interval '3 hours'),
  ('rate_limit',       'error',    'Facebook Rate Limit — Downtown Edmonton',      'Facebook Graph API rate limit exceeded. Affected publish job failed after maximum retries. Manual retry required.',               'publish_job',  'acknowledged', now() - interval '1 day'),
  ('token_expiry',     'warning',  'TikTok Token Expiring Soon — West Edmonton',   'TikTok API token for West Edmonton expires within 48 hours. Refresh token before 2026-03-21 to avoid publish failures.',         'integration', 'open',         now() - interval '2 hours'),
  ('sla_breach',       'warning',  'Review Response SLA Breached — South Commons', '3 Google reviews older than 48 hours remain unresponded at South Commons. SLA target is 24-hour response window.',             'location',    'open',         now() - interval '6 hours'),
  ('publish_failed',   'error',    'Content Publish Failure — Downtown Edmonton',  'Explainer post failed to publish to Facebook after 3 retry attempts. Content item requires manual re-queue or channel switch.', 'content_item', 'acknowledged', now() - interval '1 day'),
  ('workflow_partial', 'info',     'KPI Snapshot Partial — West Edmonton',         'Daily KPI snapshot completed with 1 missing metric (TikTok reach) due to temporary API unavailability.',                       'workflow',    'resolved',     now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- wf_notification_events
INSERT INTO wf_notification_events (notification_type, target_channel, payload_json, status, created_at, sent_at) VALUES
  ('content_approval_required', 'slack', '{"content_title":"Staff Introduction - Dr. Sarah Kim","location":"Downtown Edmonton","approve_url":"/automation/approvals"}',                                     'failed',  now() - interval '22 hours', null),
  ('content_approval_required', 'email', '{"content_title":"Staff Introduction - Dr. Sarah Kim","location":"Downtown Edmonton","approve_url":"/automation/approvals"}',                                     'sent',    now() - interval '22 hours', now() - interval '22 hours' + interval '5 seconds'),
  ('publish_failed',             'slack', '{"job_ref":"n8n-exec-fb-009","location":"Downtown Edmonton","failure_reason":"rate_limit_exceeded","retry_url":"/automation/exceptions"}',                        'sent',    now() - interval '1 day',    now() - interval '1 day'    + interval '3 seconds'),
  ('auth_token_expiring',        'email', '{"integration":"TikTok","location":"West Edmonton","expires_in_hours":48,"refresh_url":"/automation/integrations"}',                                              'sent',    now() - interval '2 hours',  now() - interval '2 hours'  + interval '4 seconds'),
  ('review_sla_breach',          'slack', '{"location":"South Commons","overdue_count":3,"oldest_review_age_hours":52,"review_url":"/automation/reviews"}',                                                  'sent',    now() - interval '6 hours',  now() - interval '6 hours'  + interval '2 seconds'),
  ('auth_revoked',               'email', '{"integration":"Instagram","location":"South Commons","action":"Re-authorize in Integrations tab","url":"/automation/integrations"}',                             'sent',    now() - interval '3 hours',  now() - interval '3 hours'  + interval '3 seconds'),
  ('daily_kpi_summary',          'email', '{"date":"2026-03-18","locations":["South Commons","Downtown Edmonton","West Edmonton"],"highlights":{"posts_published":4,"avg_reach":612,"new_reviews":3}}',      'sent',    now() - interval '1 day',    now() - interval '1 day'    + interval '6 seconds'),
  ('content_published',          'slack', '{"content_title":"Back Pain Prevention Tips","location":"South Commons","channel":"Facebook","post_reach":842}',                                                  'sent',    now() - interval '4 days',   now() - interval '4 days'   + interval '2 seconds')
ON CONFLICT DO NOTHING;

-- wf_audit_events
INSERT INTO wf_audit_events (actor_type, action, target_type, payload_json, created_at) VALUES
  ('system', 'publish_completed',        'publish_job',  '{"job_ref":"n8n-exec-fb-001","channel":"facebook","location":"South Commons","post_id":"fb_post_sc_001"}',                        now() - interval '4 days'),
  ('system', 'publish_completed',        'publish_job',  '{"job_ref":"n8n-exec-ig-002","channel":"instagram","location":"South Commons","post_id":"ig_post_sc_001"}',                       now() - interval '3 days'),
  ('system', 'publish_failed',           'publish_job',  '{"job_ref":"n8n-exec-fb-009","channel":"facebook","location":"Downtown Edmonton","failure":"rate_limit_exceeded","retry_count":3}',now() - interval '1 day'),
  ('system', 'review_synced',            'review',       '{"source":"google","location":"South Commons","reviews_synced":4,"new_reviews":2}',                                               now() - interval '2 days'),
  ('system', 'token_revoked_detected',   'integration',  '{"provider":"instagram","location":"South Commons","detected_via":"health_check"}',                                               now() - interval '3 hours'),
  ('system', 'workflow_exception',       'workflow_run', '{"workflow":"content-publish-facebook","exception_type":"api_rate_limit","location":"Downtown Edmonton"}',                         now() - interval '1 day'),
  ('system', 'kpi_snapshot_written',     'workflow_run', '{"date":"2026-03-18","snapshots_written":15,"partial":false}',                                                                     now() - interval '1 day'),
  ('system', 'publish_job_queued',       'publish_job',  '{"content_title":"Sports Recovery Spotlight","location":"South Commons","channel":"Google Business Profile","scheduled_for":"2026-03-20"}', now() - interval '1 day'),
  ('system', 'integration_health_check', 'integration',  '{"integrations_checked":9,"degraded":1,"failed":0,"degraded_provider":"tiktok_west"}',                                           now() - interval '2 hours'),
  ('system', 'alert_created',            'alert',        '{"alert_type":"auth_revoked","severity":"critical","title":"Instagram Auth Revoked — South Commons"}',                            now() - interval '3 hours')
ON CONFLICT DO NOTHING;

END $$;
