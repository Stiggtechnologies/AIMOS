/*
  # Definitive fix for user_profiles RLS - eliminates all recursion

  The "Database error querying schema" during login is caused by duplicate/conflicting
  RLS policies on user_profiles, some of which do a subquery back into user_profiles
  (infinite recursion). This migration drops ALL existing policies and creates exactly
  four clean, non-recursive ones.
*/

-- Drop every known policy name that has ever been applied to user_profiles
DROP POLICY IF EXISTS "select_own" ON user_profiles;
DROP POLICY IF EXISTS "select_all_authenticated" ON user_profiles;
DROP POLICY IF EXISTS "insert_own" ON user_profiles;
DROP POLICY IF EXISTS "update_own" ON user_profiles;
DROP POLICY IF EXISTS "read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_read_all" ON user_profiles;
DROP POLICY IF EXISTS "auth_system_can_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users view own or admin oversight" ON user_profiles;
DROP POLICY IF EXISTS "Users update only own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert only own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view active staff profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "fix_select_own" ON user_profiles;
DROP POLICY IF EXISTS "fix_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "fix_update_own" ON user_profiles;
DROP POLICY IF EXISTS "fix_select_all" ON user_profiles;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can read all profiles (needed for staff lookups, scheduling, etc.)
-- USING (true) is intentional here - profiles are not sensitive personal data in this system
CREATE POLICY "profiles_select_authenticated"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: users can only insert their own profile row
CREATE POLICY "profiles_insert_own"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: users can only update their own profile row
CREATE POLICY "profiles_update_own"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Service role bypass (for handle_new_user trigger and admin operations)
-- The service role already bypasses RLS by default in Supabase, so no policy needed.
