
/*
  # Seed Remaining wf_* Tables

  Populates the remaining workflow schema tables with realistic AIM demo data.

  ## Tables seeded:
  - wf_content_approvals: 4 approval records for content awaiting/in-review
  - wf_review_approvals: 2 approval records for review replies needing sign-off
  - wf_content_variants: 6 content variants (channel-specific copy for content items)
  - wf_review_drafts: 5 AI/human drafted responses for reviews
  - wf_review_flags: 6 flag records on problematic reviews
  - wf_policy_rules: 8 automation policy rules

  ## Status values:
  - wf_content_approvals.approval_status: pending|approved|rejected|held|rewrite_requested
  - wf_review_approvals.status: pending|approved|rejected|held
  - wf_content_variants.status: draft|ready|approved|rejected|archived
  - wf_review_drafts.status: draft|awaiting_approval|approved|rejected|posted
  - wf_review_drafts.drafted_by_type: system|user|ai
*/

DO $$
DECLARE
  -- Content item IDs (from previous seed)
  ci_sarah  uuid := 'dfa47cd5-c6cc-4119-8c1b-19812759ffa4'; -- Staff Introduction - awaiting_approval
  ci_concus uuid := '276488ce-e220-45a3-a775-a1493aebc497'; -- Concussion Recovery Guide - approved
  ci_sports uuid := '15008cee-ec8c-4e37-94e0-21ecd05f8135'; -- Sports Recovery Spotlight - scheduled
  ci_pelv   uuid := '4a661042-3b73-4bdf-ba7c-fd46e0c0139e'; -- Pelvic Floor Awareness - generated
  ci_chiro  uuid := 'dd7970fa-051e-44f2-a900-dec86dd7e0af'; -- Chiro Adjustment Explainer - failed
  ci_bp     uuid := '45720197-f434-4864-9f0a-6f8a7e569031'; -- Back Pain Prevention Tips - published

  -- Review IDs (from previous seed)
  rv_fatima  uuid := 'e9c528c2-a443-449d-a8f8-5ea7e1057c60'; -- Fatima Al-Hassan 2* - awaiting_approval
  rv_anon    uuid := '50e5aec0-b8de-4480-8b00-a84586c23e31'; -- Anonymous 2* - escalated
  rv_emma    uuid := '642b4b1b-86af-4346-b471-c652b59f971d'; -- Emma Clarke 1* - escalated
  rv_sarah   uuid := '270aedec-bbdc-4b00-8215-6f54b4aafbfa'; -- Sarah Blackwood 5* - unresponded
  rv_priya   uuid := '2405be09-024b-499f-92ef-dc7ab8136554'; -- Priya Sharma 5* - drafted
  rv_kelly   uuid := 'ceea7594-191c-4e5d-9d43-ad1f71ad070b'; -- Kelly Morrison 5* - unresponded

  -- Channel IDs
  ch_fb  uuid := 'ad99c1f1-6d42-4678-90b4-30e692812697';
  ch_ig  uuid := '229a23db-84bb-4e08-a4e2-a961cb1c9176';
  ch_li  uuid := 'c2049977-7e04-4189-8c70-e015d7fa6d3f';
  ch_gbp uuid := '3fb44205-7dd1-4a98-a1ac-60ac50956f9d';

  -- Draft IDs for review_drafts (needed by review_approvals FK)
  rd1 uuid := gen_random_uuid();
  rd2 uuid := gen_random_uuid();
  rd3 uuid := gen_random_uuid();
  rd4 uuid := gen_random_uuid();
  rd5 uuid := gen_random_uuid();

BEGIN

-- ============================================================
-- wf_content_approvals
-- ============================================================
INSERT INTO wf_content_approvals (content_item_id, approval_status, comments, due_at, created_at) VALUES
  (ci_sarah,  'pending',            null,
   now() + interval '1 day',  now() - interval '22 hours'),
  (ci_concus, 'approved',           'LGTM — evidence refs solid, safe to publish',
   now() + interval '3 days', now() - interval '2 days'),
  (ci_pelv,   'pending',            null,
   now() + interval '2 days', now()),
  (ci_chiro,  'rewrite_requested',  'Opening hook too clinical — simplify for general audience. Avoid "subluxation" terminology.',
   now() - interval '12 hours', now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- wf_content_variants
-- ============================================================
INSERT INTO wf_content_variants (content_item_id, channel_id, variant_name, caption_text, hook_text, cta_text, compliance_notes, status, created_at, updated_at) VALUES
  (ci_bp,    ch_fb,  'Facebook long-form',
   'Lower back pain affects 80% of Canadians at some point in their lives. Our physiotherapists at AIM South Commons share 5 evidence-based strategies to protect your spine — whether you work at a desk or on your feet all day.',
   'Is your lower back silently suffering?',
   'Book a free 15-minute consult at the link in bio.',
   null, 'approved', now() - interval '6 days', now() - interval '5 days'),

  (ci_bp,    ch_ig,  'Instagram caption',
   'Your back works hard every day 💪 Here are 5 tips our physios swear by for keeping it strong. Save this post for your next desk break! #PhysioTips #BackHealth #Edmonton',
   null,
   'DM us to book your assessment →',
   'Emoji use approved. No medical claims made.', 'approved', now() - interval '6 days', now() - interval '5 days'),

  (ci_sarah, ch_ig,  'Staff intro reel caption',
   'We are thrilled to welcome Dr. Sarah Kim to our Downtown Edmonton team! 🎉 Sarah specializes in sports rehab and pelvic floor physiotherapy with 8 years of clinical experience. Stop by to say hello at our open house this Thursday.',
   'Big news at AIM Downtown!',
   'Book with Dr. Kim at the link in bio.',
   'Photo consent on file. No patient data referenced.', 'ready', now() - interval '1 day', now() - interval '1 day'),

  (ci_concus, ch_fb, 'Concussion guide Facebook',
   'Recovering from a concussion? Returning to activity too quickly is one of the most common mistakes — and it can set your recovery back weeks. Our licensed physiotherapists follow the latest Concussion in Sport Group protocols to guide you safely back to full activity.',
   'One wrong move after a concussion can cost you weeks.',
   'Download our free Return-to-Activity checklist — link in bio.',
   'References CISG 2023 guidelines. No specific patient outcomes cited.', 'approved', now() - interval '1 day', now()),

  (ci_pelv,  ch_ig,  'Pelvic floor IG carousel',
   'Did you know 1 in 3 women experience pelvic floor dysfunction? Our specialized physiotherapists at AIM West Edmonton can help. Swipe to learn the signs and what treatment looks like.',
   '1 in 3 women. Are you one of them?',
   'Book a confidential consult — DM us or visit the link in bio.',
   'Statistic sourced from PHAC 2022. Sensitive topic — approved for clinical education category.', 'draft', now(), now()),

  (ci_sports, ch_gbp, 'Google Business post',
   'From injured to back on the field in 9 weeks. Our sports rehabilitation team at AIM South Commons helped a local hockey player recover from a grade II ankle sprain using a structured progressive loading program. Ask us how we can help you get back to your sport.',
   null, null,
   'Patient verbal consent obtained. No name or identifying details used.', 'ready', now() - interval '1 day', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================
-- wf_review_drafts
-- ============================================================
INSERT INTO wf_review_drafts (id, review_id, drafted_by_type, draft_text, status, created_at, updated_at) VALUES
  (rd1, rv_priya, 'ai',
   'Thank you so much for this wonderful review, Priya! We are absolutely thrilled to hear that the combined massage therapy and physiotherapy program helped you get back to running in just 6 weeks — that is a fantastic outcome. Your kind words mean the world to our team at AIM South Commons. We look forward to supporting you on your continued fitness journey!',
   'awaiting_approval', now() - interval '1 day', now() - interval '1 day'),

  (rd2, rv_sarah, 'ai',
   'Thank you for sharing your experience, Sarah! We are so happy to hear Dr. Kim and the Downtown team could make such a difference for you. Getting you back on your feet is exactly what we are here for — we will pass your kind words along to the whole team. See you at your next appointment!',
   'draft', now() - interval '6 hours', now() - interval '6 hours'),

  (rd3, rv_fatima, 'user',
   'Hi Fatima, thank you for bringing this to our attention. We are very sorry to hear about the frustration with your billing issue and the lack of follow-up. This is not the standard of service we hold ourselves to. A member of our patient care team will be reaching out to you directly within 24 hours to resolve this. We truly appreciate your patience.',
   'awaiting_approval', now() - interval '1 day', now() - interval '1 day'),

  (rd4, rv_anon, 'user',
   'We are sorry to hear about your experience with your cancellation. You deserve better than what you experienced, and we take this seriously. We have shared your feedback with our clinical director. If you are open to it, we would welcome the opportunity to make this right — please contact us directly at your convenience.',
   'draft', now() - interval '4 days', now() - interval '4 days'),

  (rd5, rv_kelly, 'ai',
   'Thank you for the lovely review, Kelly! We are so glad the new booking system made things easier — we have been working hard to improve the experience from your very first touchpoint. We look forward to seeing you again soon at AIM South Commons!',
   'draft', now() - interval '10 hours', now() - interval '10 hours')
ON CONFLICT DO NOTHING;

-- ============================================================
-- wf_review_approvals (need draft IDs to reference)
-- ============================================================
INSERT INTO wf_review_approvals (review_id, draft_id, status, comments, due_at, created_at) VALUES
  (rv_priya,  rd1, 'pending', null,
   now() + interval '12 hours', now() - interval '1 day'),
  (rv_fatima, rd3, 'pending', null,
   now() + interval '6 hours',  now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================
-- wf_review_flags
-- ============================================================
INSERT INTO wf_review_flags (review_id, flag_code, confidence, notes, created_at) VALUES
  (rv_anon,  'negative_staff_mention',   0.88, 'Review mentions unhelpful staff directly — escalation recommended',                       now() - interval '5 days'),
  (rv_anon,  'cancellation_complaint',   0.95, 'Clear complaint about cancellation handling process',                                      now() - interval '5 days'),
  (rv_emma,  'wait_time_complaint',      0.92, 'Patient explicitly reports 25+ minute wait — operational flag raised',                     now() - interval '2 days'),
  (rv_emma,  'negative_staff_mention',   0.85, 'Front desk staff described as rude — HR awareness flag',                                  now() - interval '2 days'),
  (rv_fatima,'billing_complaint',        0.97, 'Billing issue unresolved for 3 weeks — finance team follow-up required',                  now() - interval '8 days'),
  (rv_fatima,'follow_up_failure',        0.91, 'Patient reports promised callback never occurred — process adherence issue',              now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- wf_policy_rules
-- ============================================================
INSERT INTO wf_policy_rules (rule_name, rule_type, rule_config_json, active, created_at, updated_at) VALUES
  ('High Risk Content Approval Gate',
   'approval_required',
   '{"condition":"risk_score >= 7","action":"require_human_approval","bypass_roles":["admin"],"description":"Any content with a risk score of 7 or above must be manually reviewed before scheduling"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Negative Review Auto-Escalation',
   'auto_escalate',
   '{"condition":"rating <= 2 AND severity_score >= 0.7","action":"set_response_status_escalated","notify_role":"clinic_manager","description":"1-2 star reviews with high severity auto-escalate to clinic manager for personal response"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Review SLA Enforcement',
   'sla_enforcement',
   '{"sla_hours":24,"condition":"response_status = unresponded","action":"alert_and_notify","channels":["slack","email"],"description":"Unresponded reviews older than 24 hours trigger an alert and staff notification"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Publish Job Max Retry Limit',
   'retry_limit',
   '{"max_retries":3,"on_exceed":"create_exception","exception_severity":"high","description":"After 3 failed publish attempts, create a high-severity workflow exception requiring manual intervention"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Integration Token Expiry Alert',
   'health_monitor',
   '{"condition":"token_expires_at < now() + interval 48 hours","action":"create_alert","alert_severity":"warning","description":"Alert operations team when any integration token is within 48 hours of expiry"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Staff Introduction Content Hold',
   'content_hold',
   '{"condition":"content_pillar = community AND title ILIKE \"%staff%\"","action":"require_hr_approval","description":"All staff introduction posts require HR sign-off before entering the approval queue"}',
   true, now() - interval '30 days', now() - interval '30 days'),

  ('Off-Hours Publish Pause',
   'schedule_gate',
   '{"condition":"scheduled_for BETWEEN 22:00 AND 07:00 local","action":"hold_for_manual_review","override_roles":["admin","content_manager"],"description":"Posts scheduled between 10pm and 7am are held for manual review to prevent unmonitored publishing"}',
   false, now() - interval '30 days', now() - interval '15 days'),

  ('Daily KPI Snapshot Automation',
   'scheduled_trigger',
   '{"cron":"0 6 * * *","action":"trigger_kpi_snapshot_workflow","target":"all_locations","description":"Automatically trigger the daily KPI snapshot workflow at 6am for all active locations"}',
   true, now() - interval '30 days', now() - interval '30 days')
ON CONFLICT DO NOTHING;

END $$;
