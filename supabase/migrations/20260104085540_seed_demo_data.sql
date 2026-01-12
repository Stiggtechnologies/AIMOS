/*
  # Seed Demo Data
  
  ## Summary
  Populates the database with realistic demo data to showcase the autonomous
  talent acquisition system functionality.
  
  ## Changes
    - Insert sample jobs
    - Insert sample candidates
    - Insert sample applications
    - Insert sample KPIs
    - Insert sample agent events
*/

-- Insert sample jobs
INSERT INTO jobs (title, role_type, location, department, status, compensation_min, compensation_max, job_description, priority_score, target_fill_date, headcount, remote_allowed, created_by_agent) VALUES
(
  'Senior Physiotherapist - Calgary',
  'physiotherapist',
  'Calgary, AB',
  'Clinical Services',
  'active',
  85000,
  105000,
  'Seeking an experienced physiotherapist to join our Calgary clinic. Must have Alberta licensure and 3+ years experience treating work-related injuries.',
  8.5,
  CURRENT_DATE + INTERVAL '14 days',
  1,
  false,
  'strategy-agent'
),
(
  'Kinesiologist - Edmonton',
  'kinesiologist',
  'Edmonton, AB',
  'Clinical Services',
  'active',
  65000,
  80000,
  'Looking for a certified kinesiologist to provide functional capacity evaluations and ergonomic assessments.',
  7.2,
  CURRENT_DATE + INTERVAL '21 days',
  2,
  false,
  'strategy-agent'
),
(
  'Massage Therapist - Red Deer',
  'massage_therapist',
  'Red Deer, AB',
  'Clinical Services',
  'active',
  55000,
  70000,
  'Registered massage therapist needed for growing Red Deer location. Focus on injury rehabilitation and pain management.',
  6.8,
  CURRENT_DATE + INTERVAL '30 days',
  1,
  false,
  NULL
),
(
  'Athletic Therapist - Calgary',
  'athletic_therapist',
  'Calgary, AB',
  'Sports Medicine',
  'active',
  60000,
  75000,
  'Athletic therapist for sports injury assessment and treatment. Experience with athletes preferred.',
  7.5,
  CURRENT_DATE + INTERVAL '20 days',
  1,
  false,
  'strategy-agent'
),
(
  'Clinical Administrator - Edmonton',
  'administrator',
  'Edmonton, AB',
  'Operations',
  'filled',
  50000,
  65000,
  'Administrative support for busy multi-disciplinary clinic. Scheduling, billing, and patient coordination.',
  5.0,
  CURRENT_DATE - INTERVAL '10 days',
  1,
  true,
  NULL
)
ON CONFLICT DO NOTHING;

-- Insert sample candidates
INSERT INTO candidates (email, first_name, last_name, phone, location, source_channel, skills, experience_years, overall_score, status, salary_expectation_min, salary_expectation_max, work_authorization) VALUES
('sarah.chen@email.com', 'Sarah', 'Chen', '403-555-0101', 'Calgary, AB', 'LinkedIn', '["Manual Therapy", "Sports Injuries", "Ergonomics"]', 5.5, 92.0, 'interviewing', 88000, 98000, 'Canadian Citizen'),
('michael.brown@email.com', 'Michael', 'Brown', '780-555-0102', 'Edmonton, AB', 'Indeed', '["Functional Assessments", "Exercise Prescription", "Injury Prevention"]', 3.2, 78.0, 'screening', 68000, 78000, 'Canadian Citizen'),
('jennifer.wong@email.com', 'Jennifer', 'Wong', '403-555-0103', 'Calgary, AB', 'LinkedIn', '["Deep Tissue", "Trigger Point", "Rehabilitation"]', 4.0, 85.0, 'interviewing', 60000, 70000, 'Permanent Resident'),
('david.singh@email.com', 'David', 'Singh', '403-555-0104', 'Calgary, AB', 'Direct Application', '["Sports Therapy", "Taping", "First Aid"]', 6.0, 88.0, 'offered', 65000, 72000, 'Canadian Citizen'),
('emma.johnson@email.com', 'Emma', 'Johnson', '780-555-0105', 'Edmonton, AB', 'Indeed', '["Scheduling", "EMR Systems", "Patient Care"]', 2.5, 72.0, 'screening', 52000, 60000, 'Canadian Citizen'),
('alex.patel@email.com', 'Alex', 'Patel', '403-555-0106', 'Calgary, AB', 'LinkedIn', '["Rehabilitation", "Pain Management", "Clinical Assessment"]', 7.0, 95.0, 'new', 90000, 105000, 'Canadian Citizen'),
('lisa.martinez@email.com', 'Lisa', 'Martinez', '403-555-0107', 'Red Deer, AB', 'Facebook Groups', '["Therapeutic Massage", "Injury Recovery", "Myofascial Release"]', 5.0, 81.0, 'screening', 58000, 68000, 'Canadian Citizen')
ON CONFLICT (email) DO NOTHING;

-- Insert sample applications (linking candidates to jobs)
DO $$
DECLARE
  job1_id UUID;
  job2_id UUID;
  job3_id UUID;
  job4_id UUID;
  cand1_id UUID;
  cand2_id UUID;
  cand3_id UUID;
  cand4_id UUID;
  cand5_id UUID;
  cand6_id UUID;
  cand7_id UUID;
BEGIN
  SELECT id INTO job1_id FROM jobs WHERE title = 'Senior Physiotherapist - Calgary' LIMIT 1;
  SELECT id INTO job2_id FROM jobs WHERE title = 'Kinesiologist - Edmonton' LIMIT 1;
  SELECT id INTO job3_id FROM jobs WHERE title = 'Massage Therapist - Red Deer' LIMIT 1;
  SELECT id INTO job4_id FROM jobs WHERE title = 'Athletic Therapist - Calgary' LIMIT 1;
  
  SELECT id INTO cand1_id FROM candidates WHERE email = 'sarah.chen@email.com';
  SELECT id INTO cand2_id FROM candidates WHERE email = 'michael.brown@email.com';
  SELECT id INTO cand3_id FROM candidates WHERE email = 'jennifer.wong@email.com';
  SELECT id INTO cand4_id FROM candidates WHERE email = 'david.singh@email.com';
  SELECT id INTO cand5_id FROM candidates WHERE email = 'emma.johnson@email.com';
  SELECT id INTO cand6_id FROM candidates WHERE email = 'alex.patel@email.com';
  SELECT id INTO cand7_id FROM candidates WHERE email = 'lisa.martinez@email.com';

  IF job1_id IS NOT NULL AND cand1_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand1_id, job1_id, 'interviewing', 92.0, 'Excellent qualifications. Strong manual therapy background. Passed initial screening with high marks.', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  IF job1_id IS NOT NULL AND cand6_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand6_id, job1_id, 'applied', 95.0, 'Outstanding candidate with 7 years experience. Priority for interview scheduling.', 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF job2_id IS NOT NULL AND cand2_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand2_id, job2_id, 'screening', 78.0, 'Meets minimum requirements. Good functional assessment experience. Needs salary discussion.', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  IF job3_id IS NOT NULL AND cand3_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand3_id, job3_id, 'interviewing', 85.0, 'Strong rehabilitation focus. Good cultural fit. Interview scheduled for next week.', 6)
    ON CONFLICT DO NOTHING;
  END IF;

  IF job3_id IS NOT NULL AND cand7_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand7_id, job3_id, 'screening', 81.0, 'Local candidate with relevant experience. Good availability.', 2)
    ON CONFLICT DO NOTHING;
  END IF;

  IF job4_id IS NOT NULL AND cand4_id IS NOT NULL THEN
    INSERT INTO applications (candidate_id, job_id, status, screening_score, screening_notes, days_in_pipeline)
    VALUES (cand4_id, job4_id, 'offered', 88.0, 'Excellent sports therapy background. All interviews passed. Offer extended at $70K.', 12)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample KPIs
INSERT INTO kpis (metric_name, metric_value, metric_unit, period_type, period_start, period_end) VALUES
('time_to_fill_days', 18.5, 'days', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('cost_per_hire', 2450.00, 'CAD', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('pipeline_conversion_rate', 4.2, 'percent', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
('candidate_quality_score', 82.5, 'score', 'weekly', DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' - INTERVAL '1 day'),
('interview_completion_rate', 89.0, 'percent', 'weekly', DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample agent events to show activity
INSERT INTO agent_events (agent_name, event_type, entity_type, payload, priority, status, completed_at, execution_time_ms) VALUES
('sourcing-agent', 'job.posted.linkedin', 'job', '{"job_id": "sample", "channel": "linkedin"}', 7, 'completed', NOW() - INTERVAL '2 hours', 1250),
('sourcing-agent', 'job.posted.indeed', 'job', '{"job_id": "sample", "channel": "indeed"}', 7, 'completed', NOW() - INTERVAL '2 hours', 980),
('screening-agent', 'resume.parsed', 'candidate', '{"candidate_id": "sample", "score": 92}', 5, 'completed', NOW() - INTERVAL '1 hour', 3200),
('screening-agent', 'candidate.scored', 'application', '{"application_id": "sample", "score": 85}', 5, 'completed', NOW() - INTERVAL '45 minutes', 1800),
('interview-coordinator', 'interview.scheduled', 'interview', '{"interview_id": "sample", "scheduled_at": "2024-01-15"}', 6, 'completed', NOW() - INTERVAL '30 minutes', 2100),
('analytics-agent', 'kpi.calculated', 'kpi', '{"metric": "time_to_fill", "value": 18.5}', 3, 'completed', NOW() - INTERVAL '15 minutes', 5400)
ON CONFLICT DO NOTHING;

-- Update sourcing channel stats with demo data
UPDATE sourcing_channels SET
  total_candidates = CASE channel_name
    WHEN 'LinkedIn' THEN 45
    WHEN 'Indeed' THEN 32
    WHEN 'Direct Application' THEN 18
    WHEN 'Facebook Groups' THEN 12
    WHEN 'Employee Referral' THEN 8
    ELSE total_candidates
  END,
  total_applications = CASE channel_name
    WHEN 'LinkedIn' THEN 38
    WHEN 'Indeed' THEN 28
    WHEN 'Direct Application' THEN 15
    WHEN 'Facebook Groups' THEN 10
    WHEN 'Employee Referral' THEN 7
    ELSE total_applications
  END,
  total_hires = CASE channel_name
    WHEN 'LinkedIn' THEN 3
    WHEN 'Indeed' THEN 2
    WHEN 'Direct Application' THEN 1
    WHEN 'Employee Referral' THEN 1
    ELSE total_hires
  END,
  average_quality_score = CASE channel_name
    WHEN 'LinkedIn' THEN 86.5
    WHEN 'Indeed' THEN 75.2
    WHEN 'Direct Application' THEN 79.8
    WHEN 'Facebook Groups' THEN 72.1
    WHEN 'Employee Referral' THEN 91.3
    ELSE average_quality_score
  END,
  conversion_rate = CASE channel_name
    WHEN 'LinkedIn' THEN 7.9
    WHEN 'Indeed' THEN 7.1
    WHEN 'Direct Application' THEN 6.7
    WHEN 'Facebook Groups' THEN 8.3
    WHEN 'Employee Referral' THEN 14.3
    ELSE conversion_rate
  END,
  cost_per_hire = CASE channel_name
    WHEN 'LinkedIn' THEN 3200.00
    WHEN 'Indeed' THEN 2100.00
    WHEN 'Direct Application' THEN 800.00
    WHEN 'Facebook Groups' THEN 150.00
    WHEN 'Employee Referral' THEN 1000.00
    ELSE cost_per_hire
  END
WHERE channel_name IN ('LinkedIn', 'Indeed', 'Direct Application', 'Facebook Groups', 'Employee Referral');
