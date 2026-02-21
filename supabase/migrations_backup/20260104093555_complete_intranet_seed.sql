/*
  # Complete Intranet Seed Data
  
  ## Summary
  Final seed data for announcements and metrics
*/

-- Fix announcements to allow null author_id (for system announcements)
-- Then insert announcements
INSERT INTO announcements (title, content, priority, target_roles, is_published, published_at, is_pinned) VALUES
(
  'Welcome to AIM OS',
  E'# Welcome to the AIM Intranet System\n\nWe''re excited to launch our new internal operating system! This platform centralizes all the tools and information you need to succeed at AIM.\n\n## Key Features:\n- **Dashboard**: Role-based views with relevant KPIs\n- **Academy**: Access training materials and complete required courses\n- **Compliance**: Review policies and report incidents\n- **People**: Connect with colleagues across all clinics\n- **Talent**: View open positions and track hiring (AI-powered)\n- **Clinics**: View clinic information and metrics\n\nIf you have questions or feedback, please contact IT support.',
  'high',
  '[]',
  true,
  now(),
  true
),
(
  'Upcoming Policy Review',
  E'# Annual Policy Review - Action Required\n\nAll staff must review and acknowledge updated policies by January 31st.\n\n**Required Policies:**\n- Code of Conduct\n- Privacy and Confidentiality\n- Workplace Safety\n- Professional Licensure (Clinicians only)\n\nPlease visit the Compliance section to complete your acknowledgments.\n\n**Deadline**: January 31, 2026',
  'normal',
  '[]',
  true,
  now(),
  false
),
(
  'New Calgary South Clinic Opening',
  E'# Calgary South Location Expansion\n\nWe''re excited to announce the expansion of our Calgary South clinic!\n\n**What''s New:**\n- 2 additional treatment rooms\n- New massage therapy suite\n- Upgraded equipment\n- Extended evening hours\n\n**Effective Date**: February 1, 2026\n\nCongratulations to the Calgary South team!',
  'normal',
  '[]',
  true,
  now(),
  false
)
ON CONFLICT DO NOTHING;

-- Insert Sample Academy Content
DO $$
DECLARE
  cat_clinical_id UUID;
  cat_safety_id UUID;
  cat_tech_id UUID;
  cat_culture_id UUID;
BEGIN
  SELECT id INTO cat_clinical_id FROM academy_categories WHERE name = 'Clinical Skills' LIMIT 1;
  SELECT id INTO cat_safety_id FROM academy_categories WHERE name = 'Safety & Compliance' LIMIT 1;
  SELECT id INTO cat_tech_id FROM academy_categories WHERE name = 'Technology & Systems' LIMIT 1;
  SELECT id INTO cat_culture_id FROM academy_categories WHERE name = 'Company Culture' LIMIT 1;

  IF cat_clinical_id IS NOT NULL THEN
    INSERT INTO academy_content (title, description, content_type, category_id, content_text, duration_minutes, is_required, required_for_roles, is_published, published_at) VALUES
    (
      'Assessment Best Practices',
      'Comprehensive guide to conducting thorough patient assessments',
      'document',
      cat_clinical_id,
      E'# Assessment Best Practices\n\n## Initial Assessment\n1. Review referral and patient history\n2. Conduct subjective interview\n3. Perform objective measurements\n4. Document findings in EMR\n\n## Key Principles\n- Listen actively to patient concerns\n- Use validated assessment tools\n- Document clearly and thoroughly\n- Develop measurable treatment goals\n\n## Red Flags\nAlways screen for serious pathology:\n- Fever, unexplained weight loss\n- Numbness/tingling with weakness\n- Progressive neurological symptoms\n- History of cancer\n- Recent significant trauma',
      30,
      true,
      '["clinician"]',
      true,
      now()
    ),
    (
      'Documentation Standards',
      'Learn AIM documentation requirements and EMR best practices',
      'document',
      cat_clinical_id,
      E'# Documentation Standards\n\n## SOAP Note Format\n- **S**ubjective: Patient''s description of symptoms\n- **O**bjective: Measurements, observations, tests\n- **A**ssessment: Clinical impression and diagnosis\n- **P**lan: Treatment plan and goals\n\n## Requirements\n- Complete notes within 24 hours\n- Use clear, professional language\n- Include all required fields\n- Sign and lock notes\n- Never alter locked notes\n\n## Tips\n- Be specific and measurable\n- Avoid abbreviations patients won''t understand\n- Document patient education provided',
      20,
      true,
      '["clinician"]',
      true,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_safety_id IS NOT NULL THEN
    INSERT INTO academy_content (title, description, content_type, category_id, content_text, duration_minutes, is_required, required_for_roles, is_published, published_at) VALUES
    (
      'Infection Control Protocols',
      'Proper hygiene and infection prevention protocols',
      'document',
      cat_safety_id,
      E'# Infection Control Protocols\n\n## Hand Hygiene\n- Wash hands before and after each patient\n- Use alcohol-based sanitizer when soap unavailable\n- Minimum 15 seconds of washing with soap\n- Don''t forget thumbs, fingertips, and wrists\n\n## Equipment Sanitization\n- Clean all equipment between patients\n- Use approved hospital-grade disinfectants\n- Allow proper contact time (read product label)\n- Clean treatment tables, pillows, wedges\n\n## PPE Usage\n- Wear gloves when contact with bodily fluids expected\n- Use face masks for respiratory symptoms\n- Dispose of PPE properly in designated bins\n- Never reuse single-use items',
      15,
      true,
      '["clinician", "admin"]',
      true,
      now()
    ),
    (
      'Emergency Procedures',
      'What to do in medical emergencies at the clinic',
      'document',
      cat_safety_id,
      E'# Emergency Procedures\n\n## Medical Emergency\n1. Call 911 immediately\n2. Begin first aid/CPR if trained\n3. Notify clinic manager\n4. Document incident thoroughly\n5. Preserve any involved equipment\n\n## Fire Emergency\n1. Activate fire alarm\n2. Evacuate all patients and staff\n3. Close doors behind you\n4. Meet at designated assembly point\n5. Do NOT re-enter building\n\n## First Aid Kits\n- Location: Reception desk and staff room\n- Inspect monthly\n- Report missing/expired items',
      10,
      true,
      '["clinician", "admin", "clinic_manager"]',
      true,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_tech_id IS NOT NULL THEN
    INSERT INTO academy_content (title, description, content_type, category_id, content_text, duration_minutes, is_required, is_published, published_at) VALUES
    (
      'AIM OS User Guide',
      'Complete guide to using the AIM intranet system',
      'document',
      cat_tech_id,
      E'# AIM OS User Guide\n\n## Getting Started\n1. Log in with your AIM email and password\n2. Complete your profile\n3. Select your primary clinic\n4. Explore your role-based dashboard\n\n## Navigation\n- **Dashboard**: Your personalized view\n- **Clinics**: View clinic details and metrics\n- **People**: Staff directory and contact info\n- **Academy**: Training and development\n- **Compliance**: Policies and incident reporting\n- **Talent**: Hiring and recruitment (AI-powered)\n- **Announcements**: Company news and updates\n\n## Tips\n- Use the search bar to find anything quickly\n- Switch clinics using the dropdown\n- Check announcements daily\n- Complete required training on time\n\n## Support\nFor technical issues:\n- Email: it@aimrehab.ca\n- Phone: 1-888-AIM-HELP',
      10,
      false,
      true,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF cat_culture_id IS NOT NULL THEN
    INSERT INTO academy_content (title, description, content_type, category_id, content_text, duration_minutes, is_required, is_published, published_at) VALUES
    (
      'AIM Values and Mission',
      'Understanding what drives our organization',
      'document',
      cat_culture_id,
      E'# AIM Values and Mission\n\n## Our Mission\nTo provide exceptional, evidence-based rehabilitation services that help Albertans return to work and life activities as quickly and safely as possible.\n\n## Our Values\n\n**Excellence**: We strive for the highest quality in patient care\n\n**Collaboration**: We work together across clinics and disciplines\n\n**Innovation**: We embrace new technologies and treatment approaches\n\n**Integrity**: We do what''s right, even when no one is watching\n\n**Compassion**: We treat every patient with empathy and respect\n\n## Our Culture\n- Patient-centered care\n- Continuous learning and improvement\n- Work-life balance\n- Open communication\n- Recognition and appreciation',
      15,
      true,
      '["executive", "clinic_manager", "clinician", "admin", "contractor"]',
      true,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Update clinic metrics with realistic data
DO $$
DECLARE
  clinic RECORD;
  day_offset INTEGER;
BEGIN
  FOR clinic IN SELECT id FROM clinics WHERE is_active = true LOOP
    FOR day_offset IN 0..6 LOOP
      INSERT INTO clinic_metrics (
        clinic_id,
        metric_date,
        patient_visits,
        revenue,
        utilization_rate,
        staff_count,
        new_patients,
        cancellations,
        no_shows
      ) VALUES (
        clinic.id,
        CURRENT_DATE - day_offset,
        FLOOR(RANDOM() * 30 + 20)::INTEGER,
        ROUND((RANDOM() * 3000 + 2000)::NUMERIC, 2),
        ROUND((RANDOM() * 20 + 70)::NUMERIC, 2),
        FLOOR(RANDOM() * 5 + 3)::INTEGER,
        FLOOR(RANDOM() * 5 + 1)::INTEGER,
        FLOOR(RANDOM() * 3)::INTEGER,
        FLOOR(RANDOM() * 2)::INTEGER
      )
      ON CONFLICT (clinic_id, metric_date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
