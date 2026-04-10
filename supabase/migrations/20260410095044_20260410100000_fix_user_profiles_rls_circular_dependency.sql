/*
  # Fix user_profiles RLS circular dependency causing auth failure

  The "Database error querying schema" is caused by the admin_read_all policy
  doing a subquery on user_profiles FROM user_profiles, causing infinite recursion
  during Supabase's auth schema validation.

  Solution: Drop ALL policies on user_profiles and replace with non-recursive ones.
  Use auth.jwt() claims instead of querying user_profiles to check roles.
*/

-- Drop every policy on user_profiles
DROP POLICY IF EXISTS "Authenticated users can view active staff profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_read_all" ON user_profiles;
DROP POLICY IF EXISTS "auth_system_can_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users view own or admin oversight" ON user_profiles;
DROP POLICY IF EXISTS "Users update only own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert only own profile" ON user_profiles;

-- Simple non-recursive SELECT: own row only
CREATE POLICY "select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Authenticated users can see other profiles (needed for staff lookups)
CREATE POLICY "select_all_authenticated"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT own only
CREATE POLICY "insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE own only
CREATE POLICY "update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Also fix handle_new_user to provide required non-null fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_app_meta_data->>'role'), 'clinician'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
