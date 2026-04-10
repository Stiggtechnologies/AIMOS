/*
  # Fix Auth Schema Circular Dependency

  1. Overview
    The auth schema cannot execute queries on public schema tables
    The handle_new_user function is missing
    This causes "Database error querying schema" when authenticating

  2. Solution
    Create handle_new_user function that safely creates user_profiles
    The function cannot use RLS policies - it runs as auth.uid()
    Use service_role context to bypass RLS during user creation

  3. Security
    This function only runs on new user signup
    It initializes basic profile data
    No sensitive operations are performed
*/

-- Create the handle_new_user function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert new user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_app_meta_data->>'role')::text, 'clinician'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail auth
  RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create or replace the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure user_profiles RLS is properly configured
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Remove all problematic policies
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users view own or admin oversight" ON user_profiles;
DROP POLICY IF EXISTS "Users update only own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert only own profile" ON user_profiles;

-- Create simple, safe policies
CREATE POLICY "read_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Admins can read all profiles for admin panel
CREATE POLICY "admin_read_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles up WHERE up.id = auth.uid())::text IN ('admin', 'executive')
  );
