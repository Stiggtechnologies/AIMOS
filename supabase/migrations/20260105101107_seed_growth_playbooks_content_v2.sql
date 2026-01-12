/*
  # Seed Growth Playbooks Content

  ## Purpose
  Populate playbook library with actionable templates, scripts, checklists,
  and seasonal plans that clinic managers can use immediately
*/

DO $$
DECLARE
  exec_user_id uuid;
  admin_user_id uuid;
  clinic_id_1 uuid;
  playbook_employer uuid;
  playbook_referral uuid;
BEGIN
  -- Get IDs
  SELECT id INTO exec_user_id FROM user_profiles WHERE role = 'executive' LIMIT 1;
  SELECT id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO clinic_id_1 FROM clinics LIMIT 1;

  -- Playbook Templates
  INSERT INTO growth_playbook_templates (
    playbook_name, playbook_type, category, short_description, long_description,
    objectives, difficulty, estimated_time_hours, estimated_budget,
    required_resources, expected_leads, expected_conversion_rate, expected_revenue,
    expected_roi, best_timing, duration_weeks, times_used, avg_success_rating,
    is_active, created_by, tags
  ) VALUES
    (
      'Employer Benefits Season Campaign',
      'campaign',
      'Employer Engagement',
      'Target local employers during benefits enrollment periods',
      'Comprehensive campaign to position your clinic as the go-to provider for workplace injury care during annual benefits selection periods.',
      ARRAY['Partner with 10-15 local employers', 'Become preferred provider for 3-5 companies', 'Generate 50+ employer-referred patients'],
      'intermediate',
      40,
      3500.00,
      ARRAY['Benefits enrollment packets', 'Lunch presentation materials', 'Follow-up email templates', 'ROI calculator'],
      55,
      65.00,
      88000.00,
      2420.00,
      'Q1 (January-February), Q4 (November-December)',
      8,
      127,
      4.35,
      true,
      exec_user_id,
      ARRAY['employer', 'B2B', 'high-roi', 'seasonal']
    ),
    (
      'Referral Partner Reactivation Program',
      'outreach',
      'Referral Growth',
      'Systematically re-engage dormant referral sources',
      'Structured 6-week program to identify, segment, and re-engage referral partners who have gone quiet.',
      ARRAY['Reactivate 5-8 dormant partners', 'Establish quarterly touch-base cadence', 'Increase referral volume by 25%'],
      'beginner',
      25,
      1200.00,
      ARRAY['CRM for tracking', 'Gift budget', 'Lunch meeting budget', 'Marketing collateral'],
      35,
      70.00,
      56000.00,
      4567.00,
      'Year-round',
      6,
      203,
      4.52,
      true,
      exec_user_id,
      ARRAY['referral', 'relationship', 'quick-win']
    ),
    (
      'Community Health Fair Presence',
      'event',
      'Community Presence',
      'Maximize ROI from local health fairs',
      'Complete playbook for selecting, preparing for, and following up on community health fair participation.',
      ARRAY['Generate 75-100 qualified leads per event', 'Build brand awareness', 'Convert 20% to appointments'],
      'beginner',
      30,
      2500.00,
      ARRAY['Booth materials', 'Promotional items', 'Lead capture system'],
      85,
      22.00,
      34000.00,
      1260.00,
      'Spring and Fall',
      4,
      156,
      4.18,
      true,
      admin_user_id,
      ARRAY['community', 'events', 'awareness']
    ),
    (
      'Digital Lead Generation System',
      'digital',
      'Digital Marketing',
      'Build sustainable online patient acquisition funnel',
      'Comprehensive digital marketing playbook covering SEO, local search, and social media campaigns.',
      ARRAY['Achieve first page rankings', 'Generate 30+ leads per month', 'Reduce cost per lead by 40%'],
      'advanced',
      60,
      5000.00,
      ARRAY['Website', 'Marketing automation', 'Content creation', 'Ad budget'],
      120,
      35.00,
      84000.00,
      1580.00,
      'Year-round',
      12,
      89,
      4.41,
      true,
      exec_user_id,
      ARRAY['digital', 'marketing', 'scalable']
    ),
    (
      'Sports Team Partnership Program',
      'partnership',
      'Community Presence',
      'Partner with local sports teams for referrals',
      'Build sustainable partnerships with youth, high school, and amateur sports leagues.',
      ARRAY['Secure 3-5 team partnerships', 'Generate 40+ athlete referrals', 'Build community reputation'],
      'intermediate',
      35,
      4000.00,
      ARRAY['Sponsorship materials', 'Sideline supplies', 'Parent education materials'],
      45,
      55.00,
      49500.00,
      1138.00,
      'Pre-season',
      10,
      94,
      4.28,
      true,
      admin_user_id,
      ARRAY['sports', 'partnership', 'community']
    );

  -- Get playbook IDs for linking
  SELECT id INTO playbook_employer FROM growth_playbook_templates WHERE playbook_name = 'Employer Benefits Season Campaign' LIMIT 1;
  SELECT id INTO playbook_referral FROM growth_playbook_templates WHERE playbook_name = 'Referral Partner Reactivation Program' LIMIT 1;

  -- Outreach Scripts
  INSERT INTO growth_outreach_scripts (
    script_name, script_type, use_case,
    opening, body, closing, full_script,
    merge_fields, talking_points, objection_handlers,
    primary_cta, secondary_cta, tone, best_time_to_use, tips,
    times_used, avg_success_rate, is_active, created_by, tags
  ) VALUES
    (
      'Employer Cold Call - Benefits Season',
      'employer_cold',
      'Initial cold call to HR manager during benefits enrollment',
      'Hi [CONTACT_NAME], this is [YOUR_NAME] from [CLINIC_NAME]. I specialize in helping companies reduce injury costs.',
      'I know benefits season is busy, so I''ll be brief. Many partners see 30-40% reductions in injury downtime by making us their preferred provider. We offer same-day appointments and dedicated support. Would you be open to a 15-minute call?',
      'Perfect! I''ll send a calendar invite. In the meantime, I''ll email you our program overview. Looking forward to it!',
      'Hi [CONTACT_NAME], this is [YOUR_NAME] from [CLINIC_NAME]. I specialize in helping companies reduce injury costs. I know benefits season is busy, so I''ll be brief. Many partners see 30-40% reductions in injury downtime. Would you be open to a 15-minute call? Perfect! Looking forward to it!',
      '{"contact_name": "", "your_name": "", "clinic_name": "", "company_name": ""}'::jsonb,
      ARRAY['Same-day appointments', 'Direct billing', 'Injury prevention', 'Dedicated support', 'Transparent pricing'],
      '{"too_busy": "I understand. That is why a 15-minute call now saves time later. Next week?", "happy_with_current": "Great! Many partners keep existing providers but add us for overflow.", "no_budget": "Most find we reduce costs through faster return-to-work. Want to see the numbers?"}'::jsonb,
      'Schedule 15-minute call',
      'Receive program overview',
      'Professional',
      'Benefits enrollment (Nov-Jan)',
      ARRAY['Call 9-11am', 'Have their website open', 'Send follow-up immediately', 'Be a partner not vendor'],
      45,
      32.50,
      true,
      exec_user_id,
      ARRAY['employer', 'cold-call']
    ),
    (
      'Referral Partner Warm Email',
      'referral_partner',
      'Email to dormant partner',
      'Subject: It''s been too long! | Hi Dr. [LAST_NAME],',
      'I hope this finds you well! It''s been a while since we connected. We''ve expanded our services and thought you might have patients who could benefit. Love to grab coffee and catch up!',
      'Looking forward to reconnecting! [YOUR_NAME]',
      'Hi Dr. [LAST_NAME], Hope this finds you well! It''s been a while. We''ve expanded services including extended hours and new treatments. Love to grab coffee and catch up on how we can support your patients. Free next week?',
      '{"last_name": "", "your_name": "", "clinic_name": ""}'::jsonb,
      ARRAY['Acknowledge gap', 'Share what''s new', 'Focus on patients', 'Offer flexibility', 'Show genuine interest'],
      '{"no_response": "Follow up with phone 3-4 days later", "too_busy": "Offer email update", "damaged": "Acknowledge past issues, show improvements"}'::jsonb,
      'Schedule coffee',
      'Send services one-pager',
      'Friendly',
      'After 60+ days no referrals',
      ARRAY['Send Tue-Thu mornings', 'Keep personal', 'Reference past case', 'Don''t be pushy', 'Follow up in a week'],
      128,
      68.00,
      true,
      admin_user_id,
      ARRAY['referral', 'reactivation']
    );

  -- Engagement Checklists
  INSERT INTO growth_engagement_checklists (
    checklist_name, checklist_type, description,
    recommended_start_timing, total_duration_weeks, tasks,
    success_criteria, common_pitfalls, best_practices,
    required_materials, times_used, avg_completion_rate, is_active, created_by, tags
  ) VALUES
    (
      'Health Fair Execution',
      'event_planning',
      'Complete task list for health fair participation',
      '6 weeks before',
      6,
      '[{"task": "Research and select fairs", "week": -6, "critical": true}, {"task": "Register for events", "week": -6, "critical": true}, {"task": "Design booth", "week": -5, "critical": false}, {"task": "Order giveaways", "week": -5, "critical": true}, {"task": "Create lead capture", "week": -4, "critical": true}, {"task": "Train staff", "week": -3, "critical": true}, {"task": "Pack materials", "week": -1, "critical": true}, {"task": "Execute event", "week": 0, "critical": true}, {"task": "Follow up", "week": 0, "critical": true}]'::jsonb,
      ARRAY['75+ leads', '15+ appointments', 'Positive brand', 'ROI positive in 90 days'],
      ARRAY['Starting late', 'Poor lead capture', 'Unprepared staff', 'No follow-up'],
      ARRAY['Choose right events', 'Interactive booth', 'Capture emails', 'Train staff', 'Event-only offer', 'Follow up 24hrs'],
      ARRAY['Booth display', 'Promo items', 'Lead tablets', 'Collateral'],
      67,
      78.50,
      true,
      admin_user_id,
      ARRAY['events', 'health-fair']
    );

  -- Seasonal Plans
  INSERT INTO seasonal_demand_plans (
    season, year, expected_demand_trend, demand_drivers,
    recommended_playbooks, priority_initiatives,
    recommended_clinician_hours, recommended_marketing_budget,
    key_dates, last_year_leads, last_year_conversion_rate, last_year_revenue,
    is_template, created_by
  ) VALUES
    (
      'Q1_winter', 2026, 'high',
      ARRAY['New Year resolutions', 'Benefits enrollment', 'Winter sports injuries', 'Post-holiday budgets'],
      ARRAY['Employer Benefits Season', 'Digital Lead Generation', 'Referral Reactivation'],
      ARRAY['Launch employer campaign by Jan 5', 'Increase digital 30%', 'Reactivate top 10 partners'],
      400, 8500.00,
      '{"new_years": "2026-01-01", "benefits_deadline": "2026-01-31"}'::jsonb,
      225, 58.00, 522000.00,
      true, exec_user_id
    ),
    (
      'Q2_spring', 2026, 'moderate',
      ARRAY['Spring sports', 'Outdoor activities', 'Yard work injuries', 'Marathon training'],
      ARRAY['Sports Partnerships', 'Health Fairs', 'Referral Reactivation'],
      ARRAY['Secure 3-4 sports partnerships', 'Attend 2 health fairs', 'Summer campaign'],
      350, 6000.00,
      '{"spring_sports": "2026-03-15", "marathon": "2026-04-01"}'::jsonb,
      178, 62.00, 440800.00,
      true, exec_user_id
    ),
    (
      'Q3_summer', 2026, 'low',
      ARRAY['Vacation season', 'Summer sports', 'Youth camps', 'Fall prep'],
      ARRAY['Sports Partnerships', 'Digital Lead Generation'],
      ARRAY['Secure fall partnerships', 'Game-ready screenings', 'Plan Q4 campaign'],
      280, 4000.00,
      '{"vacation_peak": "2026-07-04", "back_to_school": "2026-08-01"}'::jsonb,
      142, 55.00, 312400.00,
      true, admin_user_id
    ),
    (
      'Q4_fall', 2026, 'peak',
      ARRAY['Fall sports', 'Benefits enrollment', 'Holiday injuries', 'Year-end insurance'],
      ARRAY['Employer Benefits', 'Sports Partnerships', 'Health Fairs', 'Referral Reactivation'],
      ARRAY['Launch benefits campaign Nov 1', 'Activate sports partnerships', 'Year-end push'],
      420, 9500.00,
      '{"benefits": "2026-11-01", "thanksgiving": "2026-11-26", "year_end": "2026-12-31"}'::jsonb,
      265, 61.00, 646400.00,
      true, exec_user_id
    );

  -- Example Executions
  IF playbook_employer IS NOT NULL AND clinic_id_1 IS NOT NULL THEN
    INSERT INTO playbook_executions (
      clinic_id, playbook_template_id, execution_name, status,
      start_date, planned_end_date, owner_id,
      custom_budget, completion_percentage, tasks_completed, tasks_total,
      leads_generated, appointments_booked, revenue_generated
    ) VALUES
      (
        clinic_id_1, playbook_employer, 'Q1 2026 Employer Push', 'in_progress',
        CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '5 weeks', admin_user_id,
        3200.00, 45, 12, 27, 18, 7, 11200.00
      );
  END IF;

  IF playbook_referral IS NOT NULL AND clinic_id_1 IS NOT NULL THEN
    INSERT INTO playbook_executions (
      clinic_id, playbook_template_id, execution_name, status,
      start_date, planned_end_date, actual_end_date, owner_id,
      custom_budget, completion_percentage, tasks_completed, tasks_total,
      leads_generated, appointments_booked, revenue_generated, success_rating
    ) VALUES
      (
        clinic_id_1, playbook_referral, 'Winter Referral Reactivation', 'completed',
        CURRENT_DATE - INTERVAL '7 weeks', CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE - INTERVAL '1 week', admin_user_id,
        800.00, 100, 15, 15, 28, 19, 30400.00, 5
      );
  END IF;

END $$;
