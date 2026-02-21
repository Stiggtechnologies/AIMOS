/*
  # Seed Intranet Foundation Data

  ## Summary
  Seeds essential intranet data including clinics, academy categories, policies, and announcements.

  ## New Data

  ### Clinics (6 locations)
    - Calgary North, Calgary South, Edmonton Central
    - Red Deer, Lethbridge, Grande Prairie

  ### Academy Categories (6 categories)
    - Clinical Skills, Safety & Compliance, Technology & Systems
    - Company Culture, Leadership Development, Administrative

  ### Policies (4 core policies)
    - Code of Conduct, Privacy and Confidentiality
    - Workplace Safety, Professional Licensure Requirements

  ### Announcements (3 initial announcements)
    - Welcome message, Policy review reminder, Calgary expansion

  ## Notes
  - All data is production-ready with realistic Alberta locations
*/

-- =====================================================
-- SEED CLINICS
-- =====================================================

INSERT INTO clinics (name, code, address, city, province, postal_code, phone, email, treatment_rooms, services_offered, is_active) VALUES
(
  'Calgary North Clinic',
  'YYC-N',
  '123 Centre Street N',
  'Calgary',
  'AB',
  'T2E 2R2',
  '403-555-0101',
  'calgary.north@aimrehab.ca',
  8,
  '["Physiotherapy", "Massage Therapy", "Occupational Therapy", "Kinesiology"]',
  true
),
(
  'Calgary South Clinic',
  'YYC-S',
  '4567 Macleod Trail S',
  'Calgary',
  'AB',
  'T2G 4S5',
  '403-555-0102',
  'calgary.south@aimrehab.ca',
  6,
  '["Physiotherapy", "Massage Therapy", "Exercise Therapy"]',
  true
),
(
  'Edmonton Central Clinic',
  'YEG-C',
  '10250 Jasper Avenue',
  'Edmonton',
  'AB',
  'T5J 1W8',
  '780-555-0201',
  'edmonton.central@aimrehab.ca',
  10,
  '["Physiotherapy", "Massage Therapy", "Occupational Therapy", "Psychology", "Kinesiology"]',
  true
),
(
  'Red Deer Clinic',
  'YQF',
  '5001 19th Street',
  'Red Deer',
  'AB',
  'T4R 3R1',
  '403-555-0301',
  'reddeer@aimrehab.ca',
  5,
  '["Physiotherapy", "Massage Therapy", "Exercise Therapy"]',
  true
),
(
  'Lethbridge Clinic',
  'YQL',
  '123 5th Avenue S',
  'Lethbridge',
  'AB',
  'T1J 0V1',
  '403-555-0401',
  'lethbridge@aimrehab.ca',
  6,
  '["Physiotherapy", "Massage Therapy", "Occupational Therapy"]',
  true
),
(
  'Grande Prairie Clinic',
  'YQU',
  '10014 99th Street',
  'Grande Prairie',
  'AB',
  'T8V 2H7',
  '780-555-0501',
  'grandeprairie@aimrehab.ca',
  4,
  '["Physiotherapy", "Massage Therapy"]',
  true
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED ACADEMY CATEGORIES
-- =====================================================

INSERT INTO academy_categories (name, description, icon, sort_order, is_active) VALUES
(
  'Clinical Skills',
  'Evidence-based clinical practices and treatment techniques',
  'stethoscope',
  1,
  true
),
(
  'Safety & Compliance',
  'Workplace safety, infection control, and regulatory compliance',
  'shield',
  2,
  true
),
(
  'Technology & Systems',
  'AIM OS, EMR systems, and technology training',
  'monitor',
  3,
  true
),
(
  'Company Culture',
  'AIM values, mission, and organizational culture',
  'heart',
  4,
  true
),
(
  'Leadership Development',
  'Management skills, team leadership, and professional growth',
  'trending-up',
  5,
  true
),
(
  'Administrative',
  'Billing, scheduling, documentation, and administrative procedures',
  'file-text',
  6,
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED POLICIES
-- =====================================================

INSERT INTO policies (title, policy_number, category, description, content, version, effective_date, is_active, requires_acknowledgment, applicable_roles) VALUES
(
  'Code of Conduct',
  'HR-001',
  'Human Resources',
  'Professional standards and ethical behavior expected of all AIM staff',
  '# Code of Conduct

## Purpose
This Code of Conduct outlines the professional standards and ethical behavior expected of all Alberta Injury Management Inc. (AIM) employees, contractors, and affiliates.

## Core Principles

### Professionalism
- Maintain the highest standards of professional conduct
- Dress appropriately for your role and environment
- Communicate respectfully with patients, colleagues, and stakeholders

### Patient-Centered Care
- Always prioritize patient safety and wellbeing
- Treat all patients with dignity, respect, and compassion
- Maintain appropriate professional boundaries

### Integrity
- Be honest and transparent in all dealings
- Report concerns or violations promptly
- Never falsify records or documentation

### Collaboration
- Work cooperatively with colleagues across all disciplines
- Share knowledge and support team members',
  '1.0',
  '2024-01-01',
  true,
  true,
  '["executive", "clinic_manager", "clinician", "admin", "contractor"]'
),
(
  'Privacy and Confidentiality',
  'CL-001',
  'Compliance',
  'Protection of patient information and compliance with privacy legislation',
  '# Privacy and Confidentiality Policy

## Purpose
AIM is committed to protecting the privacy and confidentiality of patient information in compliance with the Health Information Act (HIA) and Personal Information Protection Act (PIPA).

## Patient Information

### What is Protected
- All patient health information (PHI)
- Personal identifiers
- Treatment records and progress notes
- Billing and insurance information

### Access Principles
- **Need to Know**: Access only information required for your role
- **Minimum Necessary**: Use the least amount of information needed
- **Legitimate Purpose**: Only for patient care, billing, or authorized purposes',
  '1.0',
  '2024-01-01',
  true,
  true,
  '["executive", "clinic_manager", "clinician", "admin", "contractor"]'
),
(
  'Workplace Safety',
  'HS-001',
  'Health & Safety',
  'Maintaining a safe work environment and injury prevention',
  '# Workplace Safety Policy

## Purpose
AIM is committed to providing a safe and healthy work environment for all staff, patients, and visitors.

## General Safety Principles

### Your Rights
- Right to know about workplace hazards
- Right to participate in safety activities
- Right to refuse unsafe work

### Your Responsibilities
- Follow all safety policies and procedures
- Use personal protective equipment (PPE) as required
- Report hazards, injuries, and near-misses immediately

## Infection Prevention and Control

### Hand Hygiene
- Wash hands before and after each patient contact
- Use alcohol-based hand sanitizer
- Wash for at least 15 seconds with soap and water',
  '1.0',
  '2024-01-01',
  true,
  true,
  '["executive", "clinic_manager", "clinician", "admin", "contractor"]'
),
(
  'Professional Licensure Requirements',
  'CL-002',
  'Compliance',
  'Maintaining valid professional licenses and certifications',
  '# Professional Licensure Requirements

## Purpose
AIM requires all regulated health professionals to maintain current, valid licenses and practice within their scope of practice.

## Regulatory Bodies

### Physiotherapists
- **Regulatory Body**: Physiotherapy Alberta College + Association (PACA)
- **Registration**: Active practicing permit required
- **Insurance**: Minimum $5 million liability insurance

### Massage Therapists
- **Regulatory Body**: College of Massage Therapists of Alberta (CMTA)
- **Registration**: Active registration required
- **Insurance**: Minimum $5 million liability insurance

## Your Responsibilities

### Initial Employment
- Provide proof of current license/registration
- Provide proof of liability insurance
- Submit criminal record check',
  '1.0',
  '2024-01-01',
  true,
  true,
  '["clinician"]'
)
ON CONFLICT (policy_number) DO NOTHING;

-- =====================================================
-- SEED ANNOUNCEMENTS
-- =====================================================

INSERT INTO announcements (title, content, priority, target_roles, is_published, published_at, is_pinned) VALUES
(
  'Welcome to AIM OS',
  '# Welcome to the AIM Intranet System

We are excited to launch our new internal operating system! This platform centralizes all the tools and information you need to succeed at AIM.

## Key Features:
- **Dashboard**: Role-based views with relevant KPIs
- **Academy**: Access training materials and complete required courses
- **Compliance**: Review policies and report incidents
- **People**: Connect with colleagues across all clinics

If you have questions or feedback, please contact IT support.',
  'high',
  '[]',
  true,
  now(),
  true
),
(
  'Annual Policy Review',
  '# Annual Policy Review - Action Required

All staff must review and acknowledge updated policies by January 31st.

**Required Policies:**
- Code of Conduct
- Privacy and Confidentiality
- Workplace Safety

Please visit the Compliance section to complete your acknowledgments.

**Deadline**: January 31, 2026',
  'normal',
  '[]',
  true,
  now(),
  false
),
(
  'Calgary South Clinic Expansion',
  '# Calgary South Location Expansion

We are excited to announce the expansion of our Calgary South clinic!

**What is New:**
- 2 additional treatment rooms
- New massage therapy suite
- Extended evening hours

**Effective Date**: February 1, 2026',
  'normal',
  '[]',
  true,
  now(),
  false
)
ON CONFLICT DO NOTHING;