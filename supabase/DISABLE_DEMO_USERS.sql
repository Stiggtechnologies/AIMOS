-- Run this in Supabase SQL Editor to disable demo accounts
-- Execute all 3 statements

-- 1. Delete the demo users (irreversible)
DELETE FROM auth.users WHERE email IN (
  'sarah.executive@aimrehab.ca',
  'michael.manager@aimrehab.ca',
  'david.admin@aimrehab.ca'
);

-- 2. Log out ALL active sessions
DELETE FROM auth.refresh_tokens;

-- 3. Confirm deletion
SELECT 'Demo users deleted' as status;