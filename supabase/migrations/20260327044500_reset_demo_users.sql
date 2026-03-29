-- Reset demo user passwords to new values
-- Run: supabase db push

-- For each demo user, we need to update their password
-- Using admin API to reset - but this needs to be done via Supabase Dashboard or CLI

-- Option 1: Delete users entirely (run in SQL Editor):
DELETE FROM auth.users WHERE email IN (
  'sarah.executive@aimrehab.ca',
  'michael.manager@aimrehab.ca', 
  'david.admin@aimrehab.ca'
);

-- Option 2: Update user email to force re-auth (but passwords can't be directly set)
-- The best approach is to delete and recreate with new passwords when needed

-- Log out all sessions (requires Refresh Token deletion):
DELETE FROM auth.refresh_tokens WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@aimrehab.ca'
);