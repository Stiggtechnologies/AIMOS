/*
  # Setup Research Paper Ingestion Cron Job

  1. Creates a cron job that triggers research paper ingestion weekly
  2. Ensures pg_cron extension is enabled
  3. Schedules the job to run every Monday at 2:00 AM UTC
  4. Calls the research-paper-ingestion edge function via HTTP

  Important Notes:
  - The cron job uses pg_cron extension
  - Runs weekly on Mondays at 02:00 UTC
  - Calls the deployed Edge Function endpoint
  - Logs execution results to console for monitoring
*/

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing research ingestion cron job
SELECT cron.unschedule('research-ingestion-weekly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'research-ingestion-weekly'
);

-- Schedule research paper ingestion to run weekly (Monday at 2:00 AM UTC)
SELECT cron.schedule(
  'research-ingestion-weekly',
  '0 2 * * 1',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/research-paper-ingestion',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('scheduled', true)
    ) as request_id;
  $$
);
