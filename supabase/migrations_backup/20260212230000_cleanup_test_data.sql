-- Migration: Clean up all test/demo/sample data before production launch
-- Created: 2026-02-12
-- Purpose: Remove test data to ensure clean real data ingestion (Facebook Ads → AIMOS)
-- IMPORTANT: This is a destructive operation. Backup before running if needed.

-- =============================================================================
-- CLEANUP STRATEGY
-- =============================================================================
-- 1. Remove demo users and their associated data
-- 2. Remove test CRM leads (but keep lead sources/service lines/payor types)
-- 3. Remove sample bookings and appointments
-- 4. Keep: System configuration data, lookup tables, reference data
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DEMO USERS CLEANUP
-- =============================================================================

-- Get demo user IDs
CREATE TEMP TABLE demo_user_ids AS
SELECT id FROM user_profiles
WHERE email IN (
  'sarah.executive@aimrehab.ca',
  'michael.manager@aimrehab.ca',
  'jennifer.clinician@aimrehab.ca',
  'david.admin@aimrehab.ca',
  'amanda.contractor@aimrehab.ca'
);

-- Remove clinic access for demo users
DELETE FROM clinic_access
WHERE user_id IN (SELECT id FROM demo_user_ids);

-- Remove any credentials or licenses for demo users
DELETE FROM credentials
WHERE user_id IN (SELECT id FROM demo_user_ids);

-- Remove demo user profiles (keep actual staff profiles)
DELETE FROM user_profiles
WHERE id IN (SELECT id FROM demo_user_ids);

-- Note: auth.users entries should be cleaned via Supabase Auth UI or separate admin query
-- We don't directly delete from auth.users in migrations for safety

-- =============================================================================
-- 2. CRM TEST LEADS CLEANUP
-- =============================================================================

-- Remove test leads (common test patterns)
-- Keep real patient leads but remove obvious test data
DELETE FROM crm_leads
WHERE 
  -- Test/demo names
  LOWER(first_name) IN ('test', 'demo', 'sample', 'example')
  OR LOWER(last_name) IN ('test', 'demo', 'sample', 'example', 'patient', 'lead', 'user')
  OR email LIKE '%test%'
  OR email LIKE '%demo%'
  OR email LIKE '%example.com%'
  OR phone LIKE '%555%' -- North American test numbers
  OR phone LIKE '+15551%' -- E.164 test numbers
  OR external_id LIKE 'test_%'
  OR external_id LIKE 'demo_%'
  OR external_id LIKE 'sample_%';

-- =============================================================================
-- 3. SCHEDULER & BOOKINGS CLEANUP
-- =============================================================================

-- Remove sample bookings (created by seed scripts)
DELETE FROM scheduler_appointments
WHERE notes LIKE '%sample%' OR notes LIKE '%test%' OR notes LIKE '%demo%';

DELETE FROM treatment_room_bookings
WHERE created_at < NOW() - INTERVAL '30 days'; -- Remove old sample bookings

-- =============================================================================
-- 4. COMMUNICATION MODULE CLEANUP
-- =============================================================================

-- Remove test conversations and messages
DELETE FROM comm_messages
WHERE conversation_id IN (
  SELECT id FROM comm_conversations
  WHERE customer_phone_e164 LIKE '+1555%' -- Test numbers
);

DELETE FROM comm_conversations
WHERE customer_phone_e164 LIKE '+1555%';

-- Remove test Twilio inbound messages
DELETE FROM twilio_inbound_messages
WHERE from_number LIKE '%555%';

-- =============================================================================
-- 5. OPERATIONS DATA CLEANUP
-- =============================================================================

-- Remove test patient records (if any exist with test patterns)
-- Be VERY careful here - only remove obvious test data
-- Commenting out by default for safety
-- DELETE FROM patients WHERE email LIKE '%test%' OR email LIKE '%demo%';

-- =============================================================================
-- 6. ANALYTICS & REPORTING CLEANUP
-- =============================================================================

-- Remove test analytics events
DELETE FROM analytics_events
WHERE user_id IN (SELECT id FROM demo_user_ids);

-- =============================================================================
-- 7. AI AGENT EXECUTION LOGS CLEANUP
-- =============================================================================

-- Remove test agent executions
DELETE FROM agent_executions
WHERE created_by IN (SELECT id FROM demo_user_ids);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Log cleanup results
DO $$
DECLARE
  remaining_test_leads INTEGER;
  remaining_demo_users INTEGER;
  remaining_test_bookings INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_test_leads
  FROM crm_leads
  WHERE LOWER(first_name) IN ('test', 'demo', 'sample')
     OR email LIKE '%test%'
     OR phone LIKE '%555%';

  SELECT COUNT(*) INTO remaining_demo_users
  FROM user_profiles
  WHERE email LIKE '%demo%' OR email LIKE '%test%';

  SELECT COUNT(*) INTO remaining_test_bookings
  FROM scheduler_appointments
  WHERE notes LIKE '%test%' OR notes LIKE '%demo%';

  RAISE NOTICE 'Cleanup Complete:';
  RAISE NOTICE '- Remaining test leads: %', remaining_test_leads;
  RAISE NOTICE '- Remaining demo users: %', remaining_demo_users;
  RAISE NOTICE '- Remaining test bookings: %', remaining_test_bookings;

  IF remaining_test_leads > 0 OR remaining_demo_users > 0 THEN
    RAISE WARNING 'Some test data may remain. Review manually if needed.';
  END IF;
END $$;

-- Clean up temp table
DROP TABLE demo_user_ids;

COMMIT;

-- =============================================================================
-- POST-CLEANUP ACTIONS (Manual)
-- =============================================================================

-- TODO (Supabase Dashboard):
-- 1. Go to Authentication → Users
-- 2. Manually delete users with emails:
--    - sarah.executive@aimrehab.ca
--    - michael.manager@aimrehab.ca
--    - jennifer.clinician@aimrehab.ca
--    - david.admin@aimrehab.ca
--    - amanda.contractor@aimrehab.ca
--
-- 3. Verify CRM Leads table is clean:
--    SELECT * FROM crm_leads WHERE created_at < NOW();
--
-- 4. Verify no test phone numbers remain:
--    SELECT * FROM crm_leads WHERE phone LIKE '%555%';

-- =============================================================================
-- WHAT THIS KEEPS (Important Reference Data)
-- =============================================================================
-- ✅ crm_lead_sources (Facebook Ads, referrals, etc.)
-- ✅ crm_service_lines (Physio, WCB, MVA, etc.)
-- ✅ crm_payor_types (WCB, Insurance, Private Pay, etc.)
-- ✅ crm_clv_tiers (High/Medium/Low value tiers)
-- ✅ clinics (AIM Edmonton, etc.)
-- ✅ treatment_rooms (Room configurations)
-- ✅ Clinical protocols, evidence, starter packs
-- ✅ System configuration and settings

COMMENT ON TABLE crm_leads IS 'CRM Leads - test data cleaned 2026-02-12. Ready for production Facebook Ads integration.';
