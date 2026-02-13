-- Verification Query: Check for remaining test/demo data in AIMOS
-- Run this BEFORE and AFTER cleanup to verify results
-- Created: 2026-02-12

-- =============================================================================
-- SUMMARY VIEW
-- =============================================================================

SELECT 
  'Test Data Summary' AS report_section,
  '' AS category,
  '' AS description,
  0 AS count;

-- =============================================================================
-- 1. DEMO USERS
-- =============================================================================

SELECT 
  'Demo Users' AS report_section,
  'User Profiles' AS category,
  email AS description,
  1 AS count
FROM user_profiles
WHERE 
  email LIKE '%@aimrehab.ca%'
  AND (
    email LIKE '%demo%'
    OR email LIKE '%test%'
    OR email LIKE '%executive@%'
    OR email LIKE '%manager@%'
    OR email LIKE '%clinician@%'
    OR email LIKE '%admin@%'
    OR email LIKE '%contractor@%'
  )
ORDER BY email;

-- =============================================================================
-- 2. TEST CRM LEADS
-- =============================================================================

SELECT 
  'Test Leads' AS report_section,
  'CRM Leads - Test Names' AS category,
  CONCAT(first_name, ' ', last_name, ' (', phone, ')') AS description,
  1 AS count
FROM crm_leads
WHERE 
  LOWER(first_name) IN ('test', 'demo', 'sample', 'example')
  OR LOWER(last_name) IN ('test', 'demo', 'sample', 'example', 'patient', 'lead', 'user')
ORDER BY created_at DESC
LIMIT 20;

SELECT 
  'Test Leads' AS report_section,
  'CRM Leads - Test Emails' AS category,
  CONCAT(first_name, ' ', last_name, ' <', email, '>') AS description,
  1 AS count
FROM crm_leads
WHERE 
  email LIKE '%test%'
  OR email LIKE '%demo%'
  OR email LIKE '%example.com%'
ORDER BY created_at DESC
LIMIT 20;

SELECT 
  'Test Leads' AS report_section,
  'CRM Leads - Test Phone Numbers' AS category,
  CONCAT(first_name, ' ', last_name, ' (', phone, ')') AS description,
  1 AS count
FROM crm_leads
WHERE 
  phone LIKE '%555%'
  OR phone LIKE '+1555%'
ORDER BY created_at DESC
LIMIT 20;

SELECT 
  'Test Leads' AS report_section,
  'CRM Leads - Test External IDs' AS category,
  CONCAT(external_id, ' - ', first_name, ' ', last_name) AS description,
  1 AS count
FROM crm_leads
WHERE 
  external_id LIKE 'test_%'
  OR external_id LIKE 'demo_%'
  OR external_id LIKE 'sample_%'
ORDER BY created_at DESC
LIMIT 20;

-- =============================================================================
-- 3. TEST COMMUNICATIONS
-- =============================================================================

SELECT 
  'Test Communications' AS report_section,
  'Conversations - Test Numbers' AS category,
  CONCAT(customer_phone_e164, ' → ', twilio_number_e164) AS description,
  (SELECT COUNT(*) FROM comm_messages WHERE conversation_id = c.id) AS count
FROM comm_conversations c
WHERE 
  customer_phone_e164 LIKE '+1555%'
ORDER BY created_at DESC
LIMIT 10;

SELECT 
  'Test Communications' AS report_section,
  'Twilio Inbound - Test Numbers' AS category,
  CONCAT(from_number, ' → ', to_number, ': ', LEFT(body, 50)) AS description,
  1 AS count
FROM twilio_inbound_messages
WHERE 
  from_number LIKE '%555%'
ORDER BY created_at DESC
LIMIT 10;

-- =============================================================================
-- 4. TEST BOOKINGS & APPOINTMENTS
-- =============================================================================

SELECT 
  'Test Bookings' AS report_section,
  'Appointments - Test/Demo Notes' AS category,
  CONCAT(DATE(start_time), ' ', LEFT(notes, 50)) AS description,
  1 AS count
FROM scheduler_appointments
WHERE 
  notes LIKE '%sample%'
  OR notes LIKE '%test%'
  OR notes LIKE '%demo%'
ORDER BY created_at DESC
LIMIT 10;

-- =============================================================================
-- 5. AGGREGATE COUNTS
-- =============================================================================

SELECT 
  'Aggregate Counts' AS report_section,
  'Total Test Users' AS category,
  '' AS description,
  COUNT(*) AS count
FROM user_profiles
WHERE 
  email LIKE '%test%'
  OR email LIKE '%demo%'
  OR email LIKE '%@aimrehab.ca%';

SELECT 
  'Aggregate Counts' AS report_section,
  'Total Test Leads' AS category,
  '' AS description,
  COUNT(*) AS count
FROM crm_leads
WHERE 
  LOWER(first_name) IN ('test', 'demo', 'sample')
  OR email LIKE '%test%'
  OR phone LIKE '%555%';

SELECT 
  'Aggregate Counts' AS report_section,
  'Total Test Conversations' AS category,
  '' AS description,
  COUNT(*) AS count
FROM comm_conversations
WHERE 
  customer_phone_e164 LIKE '+1555%';

SELECT 
  'Aggregate Counts' AS report_section,
  'Total Real Leads' AS category,
  'Leads that should remain after cleanup' AS description,
  COUNT(*) AS count
FROM crm_leads
WHERE 
  -- NOT test data
  LOWER(first_name) NOT IN ('test', 'demo', 'sample', 'example')
  AND LOWER(last_name) NOT IN ('test', 'demo', 'sample', 'example', 'patient', 'lead')
  AND (email IS NULL OR (email NOT LIKE '%test%' AND email NOT LIKE '%demo%' AND email NOT LIKE '%example.com%'))
  AND (phone NOT LIKE '%555%' OR phone IS NULL);

-- =============================================================================
-- 6. PRODUCTION READINESS CHECK
-- =============================================================================

SELECT 
  'Production Readiness' AS report_section,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ READY - No test leads remain'
    ELSE CONCAT('⚠️  WARNING - ', COUNT(*), ' test leads found')
  END AS category,
  'Run cleanup migration to remove test data' AS description,
  COUNT(*) AS count
FROM crm_leads
WHERE 
  LOWER(first_name) IN ('test', 'demo', 'sample')
  OR email LIKE '%test%'
  OR phone LIKE '%555%';

SELECT 
  'Production Readiness' AS report_section,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ READY - No demo users remain'
    ELSE CONCAT('⚠️  WARNING - ', COUNT(*), ' demo users found')
  END AS category,
  'Run cleanup script to remove demo auth users' AS description,
  COUNT(*) AS count
FROM user_profiles
WHERE 
  email IN (
    'sarah.executive@aimrehab.ca',
    'michael.manager@aimrehab.ca',
    'jennifer.clinician@aimrehab.ca',
    'david.admin@aimrehab.ca',
    'amanda.contractor@aimrehab.ca'
  );

-- =============================================================================
-- 7. REFERENCE DATA CHECK (Should NOT be removed)
-- =============================================================================

SELECT 
  'Reference Data (Keep)' AS report_section,
  'Lead Sources' AS category,
  name AS description,
  (SELECT COUNT(*) FROM crm_leads WHERE lead_source_id = ls.id) AS count
FROM crm_lead_sources ls
WHERE active = true
ORDER BY name;

SELECT 
  'Reference Data (Keep)' AS report_section,
  'Service Lines' AS category,
  name AS description,
  (SELECT COUNT(*) FROM crm_leads WHERE service_line_id = sl.id) AS count
FROM crm_service_lines sl
WHERE active = true
ORDER BY priority;

SELECT 
  'Reference Data (Keep)' AS report_section,
  'Clinics' AS category,
  CONCAT(name, ' (', code, ')') AS description,
  (SELECT COUNT(*) FROM crm_leads WHERE clinic_id = c.id) AS count
FROM clinics c
WHERE active = true
ORDER BY name;

-- =============================================================================
-- INTERPRETATION GUIDE
-- =============================================================================

/*
BEFORE CLEANUP:
- You should see test users with @aimrehab.ca emails
- You should see test leads with names like "Test", "Demo", "Sample"
- You should see phone numbers with 555 (test numbers)
- You should see test external IDs like test_123

AFTER CLEANUP:
- Demo users count should be 0
- Test leads count should be 0
- Reference data (lead sources, service lines, clinics) should remain
- Real patient leads should remain unchanged

PRODUCTION READY when:
- ✅ No test leads remain
- ✅ No demo users remain
- ✅ Reference data intact
- ✅ Real leads preserved
*/
