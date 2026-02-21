-- Migration: Add Facebook Ads lead source
-- Created: 2026-02-12
-- Purpose: Add Facebook Ads as a lead source for CRM integration

-- Insert Facebook Ads lead source if it doesn't exist
INSERT INTO crm_lead_sources (slug, name, description, active, created_at, updated_at)
VALUES (
  'facebook-ads',
  'Facebook Lead Ads',
  'Leads generated from Facebook Lead Ads campaigns',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Add campaign tracking support to crm_leads (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN campaign_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_crm_leads_campaign_id ON crm_leads(campaign_id);
  END IF;
END $$;

-- Comment the webhook URL for reference
COMMENT ON TABLE crm_lead_sources IS 'Lead sources for CRM. Facebook Ads webhook: https://[your-project].supabase.co/functions/v1/facebook-leads-webhook';
