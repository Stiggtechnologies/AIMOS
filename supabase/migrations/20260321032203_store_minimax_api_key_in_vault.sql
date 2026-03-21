/*
  # Store Minimax API Key in Supabase Vault

  ## Summary
  Securely stores the Minimax API key in the Supabase Vault (pg_secrets extension)
  so it can be accessed by edge functions using the service role key.

  ## Changes
  - Enables the pg_crypt extension if not already enabled
  - Upserts the Minimax API key into vault.secrets under the name 'minimax_api_key'
  - The key is encrypted at rest using Supabase Vault

  ## Security
  - Only accessible via service role (bypasses RLS)
  - Never exposed to the browser or anon clients
*/

-- Enable vault if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Store (or replace) the Minimax API key in vault
DO $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = 'minimax_api_key' LIMIT 1;
  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(
      existing_id,
      'sk-api-vAQWF-DA-Au5RXEqyS9YwTOXXeGf8KI2mgdcYMhrBM71-gUg8U8ErRatq8ilEnIELaw_JWz67oCjrnry1-GCXB3Ja-y74AqMgUWFJL0ttQblyqT61v-kf5M'
    );
  ELSE
    PERFORM vault.create_secret(
      'sk-api-vAQWF-DA-Au5RXEqyS9YwTOXXeGf8KI2mgdcYMhrBM71-gUg8U8ErRatq8ilEnIELaw_JWz67oCjrnry1-GCXB3Ja-y74AqMgUWFJL0ttQblyqT61v-kf5M',
      'minimax_api_key',
      'Minimax AI API key for chat completions and text generation'
    );
  END IF;
END $$;
