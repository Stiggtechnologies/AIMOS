/*
  # Fix Schema Errors Causing "Database error querying schema"

  Multiple broken database objects prevent Supabase from loading the schema,
  blocking ALL login attempts with "Database error querying schema".

  ## Fixes Applied

  1. handle_new_user() — references non-existent `display_name` column on user_profiles.
     Fixed to use only columns that actually exist (first_name, last_name, role, etc.).

  2. user_sessions RLS policy — references `user_profiles.user_id` which does not exist.
     The user_profiles PK column is `id`, not `user_id`. Fixed.

  3. user_sessions_summary view — broken JOIN on `user_profiles.user_id`.
     Fixed to JOIN on `user_profiles.id`.

  4. audit_log_immutable table — referenced by audit_trigger_func but never created.
     Created so the function resolves cleanly even though no trigger is attached yet.

  5. audit_trigger_func — earlier migrations set search_path = public, pgcrypto
     (pgcrypto is an extension, not a schema). Ensured it uses public, extensions.
*/

-- ═══════════════════════════════════════════════════════════════
-- 1. FIX handle_new_user() — remove display_name reference
-- ═══════════════════════════════════════════════════════════════

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

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════
-- 2. FIX user_sessions RLS — user_profiles.user_id → .id
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can view all user sessions" ON user_sessions;

CREATE POLICY "Admins can view all user sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Also fix the INSERT policy to be simpler and correct
DROP POLICY IF EXISTS "Users can insert own session data" ON user_sessions;

CREATE POLICY "Users can insert own session data"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- 3. FIX user_sessions_summary view — broken JOIN
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW user_sessions_summary AS
SELECT
  us.id,
  us.email,
  us.ip_address,
  us.user_agent,
  us.page_url,
  us.action_type,
  us.created_at,
  COALESCE(up.first_name || ' ' || up.last_name, us.email) AS full_name,
  up.role
FROM user_sessions us
LEFT JOIN user_profiles up ON us.user_id = up.id
ORDER BY us.created_at DESC;


-- ═══════════════════════════════════════════════════════════════
-- 4. CREATE audit_log_immutable table (referenced but never created)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_log_immutable (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id      text NOT NULL,
  event_type    text NOT NULL,
  table_name    text NOT NULL,
  record_id     uuid,
  action        text NOT NULL,
  old_data      jsonb,
  new_data      jsonb,
  changed_fields text[],
  user_id       uuid,
  user_role     text,
  checksum      text,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

-- Immutable: no UPDATE or DELETE allowed
ALTER TABLE public.audit_log_immutable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_insert_only"
  ON public.audit_log_immutable FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_log_read_admin"
  ON public.audit_log_immutable FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('admin', 'executive')
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- 5. FIX audit_trigger_func — ensure correct search_path
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  user_role text := NULL;
  event_id_val text;
  old_data_json jsonb;
  new_data_json jsonb;
  changed_fields_arr text[];
  checksum_val text;
BEGIN
  BEGIN
    SELECT role::text INTO user_role
    FROM user_profiles
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    user_role := NULL;
  END;

  event_id_val := TG_TABLE_NAME || '_' || gen_random_uuid()::text;

  IF TG_OP = 'DELETE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data_json := NULL;
    new_data_json := to_jsonb(NEW);
  ELSE
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);

    SELECT array_agg(key)
    INTO changed_fields_arr
    FROM jsonb_each(old_data_json)
    WHERE old_data_json->key IS DISTINCT FROM new_data_json->key;
  END IF;

  checksum_val := encode(
    digest(
      event_id_val || TG_OP || COALESCE(old_data_json::text, '') || COALESCE(new_data_json::text, '') || now()::text,
      'sha256'
    ),
    'hex'
  );

  INSERT INTO audit_log_immutable (
    event_id, event_type, table_name, record_id, action,
    old_data, new_data, changed_fields, user_id, user_role, checksum, metadata
  ) VALUES (
    event_id_val, 'data_mutation', TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id), TG_OP,
    old_data_json, new_data_json, changed_fields_arr,
    auth.uid(), user_role, checksum_val,
    jsonb_build_object('schema', TG_TABLE_SCHEMA, 'timestamp', now())
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Never let audit logging break production operations
  RAISE WARNING 'audit_trigger_func error: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- 6. ENSURE user_profiles RLS is clean (no circular deps)
-- ═══════════════════════════════════════════════════════════════

-- Drop any leftover problem policies
DROP POLICY IF EXISTS "admin_read_all" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;

-- Ensure the clean policies exist
DO $$
BEGIN
  -- select_own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'select_own'
  ) THEN
    CREATE POLICY "select_own" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
  END IF;

  -- select_all_authenticated
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'select_all_authenticated'
  ) THEN
    CREATE POLICY "select_all_authenticated" ON user_profiles FOR SELECT TO authenticated USING (true);
  END IF;

  -- insert_own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'insert_own'
  ) THEN
    CREATE POLICY "insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  END IF;

  -- update_own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'update_own'
  ) THEN
    CREATE POLICY "update_own" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;
