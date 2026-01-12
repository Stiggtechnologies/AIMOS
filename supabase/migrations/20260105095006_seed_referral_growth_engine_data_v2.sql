/*
  # Seed Referral Growth Engine Demo Data

  ## Purpose
  Populate comprehensive referral growth engine with realistic data

  ## Data Seeded
  1. Partner Scorecards (Q4 2025 performance)
  2. Partner Segments (Tier-based and status-based)
  3. Reactivation Workflows (active and completed)
  4. Outreach Activities (extensive touchpoint history)
  
  ## Demonstrates
  - Partner performance grading (A+ to F)
  - Relationship health trends
  - Reactivation workflow progression
  - Outreach cadence compliance
  - Segment-based strategies
*/

-- Get user IDs for assignments
DO $$
DECLARE
  exec_user_id uuid;
  admin_user_id uuid;
  partner_id_1 uuid;
  partner_id_2 uuid;
  partner_id_3 uuid;
  partner_id_4 uuid;
  segment_platinum uuid;
  segment_gold uuid;
  segment_dormant uuid;
  workflow_id_1 uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO exec_user_id FROM user_profiles WHERE role = 'executive' LIMIT 1;
  SELECT id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
  
  -- Get partner IDs
  SELECT id INTO partner_id_1 FROM referral_partners WHERE partner_name = 'Alberta Sports Medicine' LIMIT 1;
  SELECT id INTO partner_id_2 FROM referral_partners WHERE partner_name = 'Mountain View Medical' LIMIT 1;
  SELECT id INTO partner_id_3 FROM referral_partners WHERE partner_name = 'Calgary Wellness Group' LIMIT 1;
  SELECT id INTO partner_id_4 FROM referral_partners WHERE partner_name = 'Peak Performance Clinic' LIMIT 1;

  -- Partner Segments
  INSERT INTO referral_partner_segments (
    segment_name, segment_type, description, criteria,
    engagement_strategy, recommended_cadence, recommended_touchpoint_mix,
    target_referrals_per_month, target_conversion_rate, target_revenue_per_partner,
    is_active, partner_count, created_by
  ) VALUES
    (
      'Platinum Partners',
      'tier',
      'Top-performing partners with 10+ referrals/month and 80%+ conversion rates',
      '{"min_referrals_per_month": 10, "min_conversion_rate": 80, "min_lifetime_value": 50000}'::jsonb,
      'White-glove service: priority scheduling, quarterly executive dinners, co-marketing opportunities',
      'Weekly touchpoints',
      '{"calls": 1, "emails": 2, "meetings": 1, "events": 1}'::jsonb,
      15, 85.00, 75000.00,
      true, 2, exec_user_id
    ),
    (
      'Gold Partners',
      'tier',
      'High-performing partners with 5-9 referrals/month and 60%+ conversion rates',
      '{"min_referrals_per_month": 5, "min_conversion_rate": 60, "min_lifetime_value": 25000}'::jsonb,
      'Regular engagement: bi-weekly check-ins, monthly newsletters, semi-annual lunch meetings',
      'Bi-weekly touchpoints',
      '{"calls": 1, "emails": 3, "meetings": 0.5}'::jsonb,
      10, 70.00, 40000.00,
      true, 3, exec_user_id
    ),
    (
      'Silver Partners',
      'tier',
      'Developing partners with 2-4 referrals/month',
      '{"min_referrals_per_month": 2, "max_referrals_per_month": 4}'::jsonb,
      'Growth-focused: monthly check-ins, educational content, quarterly training sessions',
      'Monthly touchpoints',
      '{"calls": 0.5, "emails": 4, "newsletter": 1}'::jsonb,
      5, 60.00, 20000.00,
      true, 5, exec_user_id
    ),
    (
      'Dormant Partners',
      'status',
      'Previously active partners with no referrals in 90+ days',
      '{"days_since_last_referral": 90, "previous_referrals_min": 1}'::jsonb,
      'Reactivation-focused: personalized outreach, value proposition refresh, incentive offers',
      'Reactivation cadence (Day 0, 7, 14, 30)',
      '{"calls": 2, "emails": 3, "meetings": 1}'::jsonb,
      3, 50.00, 15000.00,
      true, 2, admin_user_id
    ),
    (
      'High-Potential Prospects',
      'potential',
      'New partners showing strong early indicators',
      '{"relationship_age_days_max": 90, "engagement_score_min": 75}'::jsonb,
      'Acceleration-focused: frequent touchpoints, success stories, quick wins',
      'Weekly touchpoints',
      '{"calls": 2, "emails": 2, "meetings": 1}'::jsonb,
      8, 65.00, 35000.00,
      true, 3, exec_user_id
    )
  ON CONFLICT DO NOTHING;
  
  -- Get segment IDs
  SELECT id INTO segment_platinum FROM referral_partner_segments WHERE segment_name = 'Platinum Partners';
  SELECT id INTO segment_gold FROM referral_partner_segments WHERE segment_name = 'Gold Partners';
  SELECT id INTO segment_dormant FROM referral_partner_segments WHERE segment_name = 'Dormant Partners';

  -- Partner Scorecards (Q4 2025)
  IF partner_id_1 IS NOT NULL THEN
    INSERT INTO referral_partner_scorecards (
      partner_id, period_start, period_end,
      referrals_received, referrals_converted, conversion_rate,
      avg_case_complexity, appropriate_referral_rate, documentation_quality_score,
      avg_time_to_referral_hours, urgent_case_sla_compliance,
      total_revenue_generated, avg_revenue_per_referral, revenue_growth_rate,
      response_rate, meeting_attendance_rate, last_interaction_days_ago,
      relationship_trend, churn_risk_score, overall_score, grade,
      strengths, areas_for_improvement, recommended_actions,
      generated_by, notes
    ) VALUES (
      partner_id_1, '2025-10-01', '2025-12-31',
      42, 38, 90.48,
      'High', 95.00, 92,
      4.2, 98.00,
      152000.00, 4000.00, 15.50,
      95.00, 100.00, 3,
      'growing', 5, 95, 'A+',
      ARRAY['Exceptional conversion rate', 'High-quality documentation', 'Excellent SLA compliance', 'Strong relationship engagement'],
      ARRAY['Could increase referral volume slightly'],
      ARRAY['Schedule quarterly strategic planning session', 'Explore co-marketing opportunities', 'Maintain white-glove service'],
      exec_user_id,
      'Top performer. Model partner for others.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_2 IS NOT NULL THEN
    INSERT INTO referral_partner_scorecards (
      partner_id, period_start, period_end,
      referrals_received, referrals_converted, conversion_rate,
      avg_case_complexity, appropriate_referral_rate, documentation_quality_score,
      avg_time_to_referral_hours, urgent_case_sla_compliance,
      total_revenue_generated, avg_revenue_per_referral, revenue_growth_rate,
      response_rate, meeting_attendance_rate, last_interaction_days_ago,
      relationship_trend, churn_risk_score, overall_score, grade,
      strengths, areas_for_improvement, recommended_actions,
      generated_by, notes
    ) VALUES (
      partner_id_2, '2025-10-01', '2025-12-31',
      28, 19, 67.86,
      'Medium', 82.00, 78,
      8.5, 85.00,
      76000.00, 4000.00, 5.25,
      80.00, 75.00, 7,
      'stable', 25, 78, 'B+',
      ARRAY['Consistent referral volume', 'Good case complexity mix', 'Reliable partner'],
      ARRAY['Conversion rate below target', 'Documentation completeness', 'Response time to urgent cases'],
      ARRAY['Provide additional training on intake process', 'Share conversion best practices', 'Improve documentation templates'],
      exec_user_id,
      'Solid performer with room for improvement.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_3 IS NOT NULL THEN
    INSERT INTO referral_partner_scorecards (
      partner_id, period_start, period_end,
      referrals_received, referrals_converted, conversion_rate,
      avg_case_complexity, appropriate_referral_rate, documentation_quality_score,
      avg_time_to_referral_hours, urgent_case_sla_compliance,
      total_revenue_generated, avg_revenue_per_referral, revenue_growth_rate,
      response_rate, meeting_attendance_rate, last_interaction_days_ago,
      relationship_trend, churn_risk_score, overall_score, grade,
      strengths, areas_for_improvement, recommended_actions,
      generated_by, notes
    ) VALUES (
      partner_id_3, '2025-10-01', '2025-12-31',
      15, 8, 53.33,
      'Low', 65.00, 55,
      12.0, 70.00,
      32000.00, 4000.00, -10.25,
      65.00, 50.00, 45,
      'declining', 65, 55, 'C',
      ARRAY['Established relationship', 'Familiar with processes'],
      ARRAY['Low conversion rate', 'Declining volume', 'Poor documentation quality', 'Missed meetings', 'Long response times'],
      ARRAY['Schedule urgent strategy meeting', 'Identify root causes of decline', 'Consider reactivation workflow', 'Provide intensive support'],
      admin_user_id,
      'At-risk partner. Immediate intervention needed.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_4 IS NOT NULL THEN
    INSERT INTO referral_partner_scorecards (
      partner_id, period_start, period_end,
      referrals_received, referrals_converted, conversion_rate,
      avg_case_complexity, appropriate_referral_rate, documentation_quality_score,
      avg_time_to_referral_hours, urgent_case_sla_compliance,
      total_revenue_generated, avg_revenue_per_referral, revenue_growth_rate,
      response_rate, meeting_attendance_rate, last_interaction_days_ago,
      relationship_trend, churn_risk_score, overall_score, grade,
      strengths, areas_for_improvement, recommended_actions,
      generated_by, notes
    ) VALUES (
      partner_id_4, '2025-10-01', '2025-12-31',
      2, 1, 50.00,
      'Low', 50.00, 40,
      18.0, 50.00,
      4000.00, 4000.00, -80.00,
      40.00, 25.00, 95,
      'at_risk', 90, 35, 'D',
      ARRAY['Has referred in past'],
      ARRAY['Near zero activity', 'Very poor engagement', 'No recent contact', 'Minimal referrals'],
      ARRAY['Launch reactivation workflow immediately', 'Investigate relationship issues', 'Personal outreach from executive', 'Consider relationship viability'],
      admin_user_id,
      'Dormant partner. Critical reactivation needed or close relationship.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assign partners to segments
  IF partner_id_1 IS NOT NULL AND segment_platinum IS NOT NULL THEN
    INSERT INTO referral_partner_segment_members (partner_id, segment_id, auto_assigned)
    VALUES (partner_id_1, segment_platinum, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_2 IS NOT NULL AND segment_gold IS NOT NULL THEN
    INSERT INTO referral_partner_segment_members (partner_id, segment_id, auto_assigned)
    VALUES (partner_id_2, segment_gold, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_3 IS NOT NULL AND segment_dormant IS NOT NULL THEN
    INSERT INTO referral_partner_segment_members (partner_id, segment_id, auto_assigned)
    VALUES (partner_id_3, segment_dormant, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_4 IS NOT NULL AND segment_dormant IS NOT NULL THEN
    INSERT INTO referral_partner_segment_members (partner_id, segment_id, auto_assigned)
    VALUES (partner_id_4, segment_dormant, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Reactivation Workflows
  IF partner_id_3 IS NOT NULL THEN
    INSERT INTO referral_reactivation_workflows (
      partner_id, workflow_name, workflow_stage,
      days_dormant, last_referral_date, dormancy_reason,
      outreach_cadence, assigned_to, priority,
      touchpoints_completed, next_action_type, next_action_due,
      outcome, notes
    ) VALUES (
      partner_id_3,
      'Reactivate Calgary Wellness Group',
      'follow_up',
      45, CURRENT_DATE - INTERVAL '45 days', 'Declining engagement and referral quality',
      'Day 0, Day 7, Day 14, Day 30',
      admin_user_id, 'high',
      2, 'meeting', CURRENT_DATE + INTERVAL '5 days',
      'pending',
      'Initial outreach completed. Waiting for meeting confirmation.'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO workflow_id_1;
  END IF;

  IF partner_id_4 IS NOT NULL THEN
    INSERT INTO referral_reactivation_workflows (
      partner_id, workflow_name, workflow_stage,
      days_dormant, last_referral_date, dormancy_reason,
      outreach_cadence, assigned_to, priority,
      touchpoints_completed, next_action_type, next_action_due,
      outcome, notes
    ) VALUES (
      partner_id_4,
      'Reactivate Peak Performance Clinic',
      'initial_outreach',
      95, CURRENT_DATE - INTERVAL '95 days', 'Lost contact. No response to recent outreach.',
      'Day 0, Day 7, Day 14, Day 30, Day 60',
      exec_user_id, 'critical',
      1, 'call', CURRENT_DATE + INTERVAL '2 days',
      'pending',
      'Executive-level outreach required. Previous relationship was strong.'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Get workflow ID if not already set
  IF workflow_id_1 IS NULL AND partner_id_3 IS NOT NULL THEN
    SELECT id INTO workflow_id_1 FROM referral_reactivation_workflows WHERE partner_id = partner_id_3 LIMIT 1;
  END IF;

  -- Outreach Activities (Rich touchpoint history)
  IF partner_id_1 IS NOT NULL THEN
    -- Platinum partner: frequent, high-quality touchpoints
    INSERT INTO referral_outreach_activities (
      partner_id, activity_type, activity_date, duration_minutes,
      conducted_by, outcome, sentiment,
      key_discussion_points, action_items, opportunities_identified,
      follow_up_required, next_outreach_date, next_outreach_type,
      is_on_schedule, days_since_last_contact, cadence_goal_days, notes
    ) VALUES
      (
        partner_id_1, 'meeting', CURRENT_DATE - INTERVAL '3 days', 60,
        exec_user_id, 'meeting_held', 'positive',
        ARRAY['Q4 performance review', 'Co-marketing initiative discussion', '2026 growth strategy'],
        ARRAY['Send co-marketing proposal by end of week', 'Schedule Q1 planning session'],
        ARRAY['Potential to expand to new service lines', 'Interest in preferred provider status'],
        true, CURRENT_DATE + INTERVAL '7 days', 'email',
        true, 3, 7,
        'Excellent meeting. Partner very engaged and excited about 2026 plans.'
      ),
      (
        partner_id_1, 'email', CURRENT_DATE - INTERVAL '10 days', NULL,
        exec_user_id, 'email_sent', 'positive',
        ARRAY['Monthly performance update', 'Thank you for continued partnership'],
        ARRAY[], ARRAY[],
        false, NULL, NULL,
        true, 7, 7,
        'Sent monthly newsletter with their performance highlights.'
      ),
      (
        partner_id_1, 'lunch', CURRENT_DATE - INTERVAL '30 days', 90,
        exec_user_id, 'meeting_held', 'positive',
        ARRAY['Relationship building', 'Industry trends discussion', 'Partnership satisfaction check-in'],
        ARRAY['Continue quarterly lunch tradition'],
        ARRAY['Partner open to joint research project'],
        false, NULL, NULL,
        true, 20, 30,
        'Quarterly executive lunch. Relationship extremely strong.'
      )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_2 IS NOT NULL THEN
    -- Gold partner: regular touchpoints
    INSERT INTO referral_outreach_activities (
      partner_id, activity_type, activity_date, duration_minutes,
      conducted_by, outcome, sentiment,
      key_discussion_points, action_items, opportunities_identified, concerns_raised,
      follow_up_required, next_outreach_date, next_outreach_type,
      is_on_schedule, days_since_last_contact, cadence_goal_days, notes
    ) VALUES
      (
        partner_id_2, 'call', CURRENT_DATE - INTERVAL '7 days', 25,
        admin_user_id, 'connected', 'neutral',
        ARRAY['Conversion rate discussion', 'Process improvement suggestions'],
        ARRAY['Send updated intake forms', 'Schedule training session'],
        ARRAY['Interest in improving conversion rates'],
        ARRAY['Some documentation challenges'],
        true, CURRENT_DATE + INTERVAL '14 days', 'call',
        true, 7, 14,
        'Partner receptive to improvement initiatives.'
      ),
      (
        partner_id_2, 'email', CURRENT_DATE - INTERVAL '14 days', NULL,
        admin_user_id, 'email_sent', 'positive',
        ARRAY['Bi-weekly check-in', 'Sharing best practices'],
        ARRAY[], ARRAY[],
        false, NULL, NULL,
        true, 7, 14,
        'Sent case studies on improving conversion rates.'
      )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_3 IS NOT NULL AND workflow_id_1 IS NOT NULL THEN
    -- Declining partner: reactivation outreach
    INSERT INTO referral_outreach_activities (
      partner_id, reactivation_workflow_id, activity_type, activity_date, duration_minutes,
      conducted_by, outcome, sentiment,
      key_discussion_points, action_items, concerns_raised,
      follow_up_required, next_outreach_date, next_outreach_type,
      is_on_schedule, days_since_last_contact, cadence_goal_days, notes
    ) VALUES
      (
        partner_id_3, workflow_id_1, 'call', CURRENT_DATE - INTERVAL '7 days', 15,
        admin_user_id, 'connected', 'mixed',
        ARRAY['Noticed decline in referrals', 'Offered support and training'],
        ARRAY['Schedule face-to-face meeting', 'Identify root cause'],
        ARRAY['Partner mentioned internal staffing changes', 'Some process frustration'],
        true, CURRENT_DATE + INTERVAL '5 days', 'meeting',
        true, 7, 7,
        'Partner acknowledged issues. Open to meeting to discuss solutions.'
      ),
      (
        partner_id_3, workflow_id_1, 'email', CURRENT_DATE - INTERVAL '14 days', NULL,
        admin_user_id, 'email_sent', 'neutral',
        ARRAY['Reactivation outreach', 'Checking in on partnership'],
        ARRAY['Follow up with phone call'],
        ARRAY[],
        true, CURRENT_DATE - INTERVAL '7 days', 'call',
        true, 7, 7,
        'Initial reactivation email sent. Waiting for response.'
      )
    ON CONFLICT DO NOTHING;
  END IF;

  IF partner_id_4 IS NOT NULL THEN
    -- Dormant partner: struggling to connect
    INSERT INTO referral_outreach_activities (
      partner_id, activity_type, activity_date, duration_minutes,
      conducted_by, outcome, sentiment,
      key_discussion_points, action_items,
      follow_up_required, next_outreach_date, next_outreach_type,
      is_on_schedule, days_since_last_contact, cadence_goal_days, notes
    ) VALUES
      (
        partner_id_4, 'call', CURRENT_DATE - INTERVAL '7 days', NULL,
        exec_user_id, 'voicemail', NULL,
        ARRAY[], ARRAY['Try again in 2 days'],
        true, CURRENT_DATE + INTERVAL '2 days', 'call',
        false, 88, 7,
        'Left voicemail. No response yet.'
      ),
      (
        partner_id_4, 'email', CURRENT_DATE - INTERVAL '14 days', NULL,
        exec_user_id, 'email_sent', NULL,
        ARRAY['Checking in', 'Interested in reconnecting'],
        ARRAY['Follow up with call'],
        true, CURRENT_DATE - INTERVAL '7 days', 'call',
        false, 81, 7,
        'Reactivation email sent from executive. No response.'
      )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
