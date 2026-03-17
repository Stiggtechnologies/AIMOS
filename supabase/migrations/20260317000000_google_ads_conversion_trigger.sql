-- Migration: Google Ads Conversion Upload Trigger
-- Created: 2026-03-17
-- Purpose: Automatically send conversions to Google Ads when calls are marked as "booked"

-- =============================================================================
-- 1) ADD CONVERSION TRACKING COLUMN
-- =============================================================================

ALTER TABLE call_tracking_calls 
ADD COLUMN IF NOT EXISTS conversion_uploaded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_call_tracking_calls_conversion_uploaded 
ON call_tracking_calls(conversion_uploaded_at) 
WHERE conversion_uploaded_at IS NOT NULL;

COMMENT ON COLUMN call_tracking_calls.conversion_uploaded_at IS 'Timestamp when conversion was uploaded to Google Ads (NULL = not uploaded yet)';

-- =============================================================================
-- 2) TRIGGER FUNCTION TO INVOKE EDGE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_google_ads_conversion()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text;
  payload jsonb;
  http_response jsonb;
BEGIN
  -- Only process if:
  -- 1. Outcome changed to 'booked'
  -- 2. GCLID exists (Google Ads traffic)
  -- 3. Conversion not already uploaded
  IF NEW.outcome = 'booked' 
     AND NEW.gclid IS NOT NULL 
     AND NEW.conversion_uploaded_at IS NULL 
     AND (OLD.outcome IS DISTINCT FROM NEW.outcome) THEN
    
    -- Construct Edge Function URL
    edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/google-ads-conversion';
    
    -- Build payload
    payload := jsonb_build_object(
      'call_id', NEW.id::text,
      'gclid', NEW.gclid,
      'conversion_time', NEW.call_started_at::text,
      'conversion_value', 350, -- $350 CAD for booked appointment
      'currency_code', 'CAD'
    );
    
    -- Call Edge Function asynchronously via pg_net (if available)
    -- Note: This requires pg_net extension. If not available, use a cron job instead.
    BEGIN
      SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := payload
      ) INTO http_response;
      
      RAISE NOTICE 'Google Ads conversion trigger fired for call %: %', NEW.id, http_response;
    EXCEPTION WHEN OTHERS THEN
      -- If pg_net not available or fails, log error but don't block the update
      RAISE WARNING 'Failed to trigger Google Ads conversion for call %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3) CREATE TRIGGER
-- =============================================================================

DROP TRIGGER IF EXISTS trg_google_ads_conversion ON call_tracking_calls;

CREATE TRIGGER trg_google_ads_conversion
  AFTER UPDATE OF outcome ON call_tracking_calls
  FOR EACH ROW
  EXECUTE FUNCTION trigger_google_ads_conversion();

COMMENT ON TRIGGER trg_google_ads_conversion ON call_tracking_calls IS 
'Automatically uploads conversion to Google Ads when call outcome is set to "booked" and GCLID exists';

-- =============================================================================
-- 4) MANUAL FUNCTION FOR BULK/RETRY UPLOADS
-- =============================================================================

CREATE OR REPLACE FUNCTION upload_pending_google_ads_conversions()
RETURNS TABLE(
  call_id uuid,
  status text,
  message text
) AS $$
DECLARE
  call_record RECORD;
  edge_function_url text;
  payload jsonb;
  http_response jsonb;
BEGIN
  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/google-ads-conversion';
  
  -- Find all booked calls with GCLID that haven't been uploaded
  FOR call_record IN 
    SELECT id, gclid, call_started_at
    FROM call_tracking_calls
    WHERE outcome = 'booked'
      AND gclid IS NOT NULL
      AND conversion_uploaded_at IS NULL
    ORDER BY call_started_at DESC
    LIMIT 100
  LOOP
    BEGIN
      payload := jsonb_build_object(
        'call_id', call_record.id::text,
        'gclid', call_record.gclid,
        'conversion_time', call_record.call_started_at::text,
        'conversion_value', 350,
        'currency_code', 'CAD'
      );
      
      SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := payload
      ) INTO http_response;
      
      call_id := call_record.id;
      status := 'success';
      message := 'Conversion uploaded';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      call_id := call_record.id;
      status := 'error';
      message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION upload_pending_google_ads_conversions IS 
'Manually upload pending Google Ads conversions (max 100 at a time). Use for bulk processing or retries.';

-- =============================================================================
-- 5) SETTINGS FOR EDGE FUNCTION URL
-- =============================================================================

-- Note: These settings need to be configured at runtime
-- Run these manually after deployment:
-- 
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://optlghedswctsklcxlkn.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
