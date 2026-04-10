/*
  # Fix Audit Trigger - Defensive Null Handling for Auth Operations

  ## Problem
  The audit_trigger_func hits RLS policy issues when Supabase auth system
  queries the database during login. The trigger SELECT from user_profiles
  can fail if the query context is special (auth operations, etc).

  ## Solution
  Make the role lookup defensive - if it fails or returns null, continue anyway.
  The audit log will record null for user_role in those cases, which is acceptable.
*/

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
END;
$$;
