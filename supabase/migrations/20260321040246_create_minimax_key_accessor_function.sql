/*
  # Create Minimax API Key Accessor Function

  ## Summary
  Creates a security-definer PostgreSQL function that edge functions can call
  via RPC to safely retrieve the Minimax API key from Supabase Vault.

  ## Changes
  - New function `get_minimax_api_key()` — runs with service role privileges,
    reads from vault.decrypted_secrets, and returns the decrypted key string.

  ## Security
  - SECURITY DEFINER ensures it runs with the function owner's privileges
  - SET search_path prevents search-path injection
  - Only the service role should be calling this via edge functions
*/

CREATE OR REPLACE FUNCTION get_minimax_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  api_key text;
BEGIN
  SELECT decrypted_secret
    INTO api_key
    FROM vault.decrypted_secrets
   WHERE name = 'minimax_api_key'
   LIMIT 1;
  RETURN api_key;
END;
$$;

REVOKE ALL ON FUNCTION get_minimax_api_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_minimax_api_key() TO service_role;
