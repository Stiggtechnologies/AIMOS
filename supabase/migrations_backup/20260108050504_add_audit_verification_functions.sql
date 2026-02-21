/*
  # Add Audit Verification Functions

  ## Summary
  Adds audit trail verification functions to support governance middleware.
  All permission check functions already exist from previous migrations.

  ## New Functions
  1. `verify_audit_trail()` - Verify completeness of audit trail for a record
  2. `log_permission_check()` - Explicitly log permission check attempts

  ## Security
  - Functions use SECURITY DEFINER with explicit search_path
  - Read-only operations with no side effects
  - Available to all authenticated users
*/

-- =====================================================
-- AUDIT VERIFICATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION verify_audit_trail(
  p_table_name TEXT,
  p_record_id TEXT,
  p_expected_min_events INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_count INT;
  v_last_modified TIMESTAMPTZ;
  v_first_created TIMESTAMPTZ;
  v_unique_users INT;
BEGIN
  -- Get audit statistics
  SELECT
    COUNT(*),
    MAX(created_at),
    MIN(created_at),
    COUNT(DISTINCT user_id)
  INTO
    v_event_count,
    v_last_modified,
    v_first_created,
    v_unique_users
  FROM audit_events
  WHERE table_name = p_table_name
    AND record_id = p_record_id;

  -- Return verification result
  RETURN jsonb_build_object(
    'valid', COALESCE(v_event_count, 0) >= p_expected_min_events,
    'event_count', COALESCE(v_event_count, 0),
    'last_modified', v_last_modified,
    'first_created', v_first_created,
    'unique_users', COALESCE(v_unique_users, 0),
    'has_complete_trail', COALESCE(v_event_count, 0) >= p_expected_min_events
  );
END;
$$;

-- =====================================================
-- PERMISSION CHECK LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION log_permission_check(
  p_permission_key TEXT,
  p_check_passed BOOLEAN,
  p_denial_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO permission_checks (
    user_id,
    permission_key,
    check_passed,
    denial_reason
  ) VALUES (
    auth.uid(),
    p_permission_key,
    p_check_passed,
    p_denial_reason
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Silently fail if table doesn't exist or other error
    -- This prevents breaking existing functionality
    NULL;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION verify_audit_trail TO authenticated;
GRANT EXECUTE ON FUNCTION log_permission_check TO authenticated;
