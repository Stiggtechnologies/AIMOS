/*
  # AIM Growth Engine - Extend CRM for Multi-Channel v3

  Adds missing columns to crm_leads and creates two new tables:
  crm_lead_activities and crm_channel_budgets.
  Seeds missing channel sources that don't already exist.
*/

-- ── Extend crm_leads ───────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='channel_source') THEN
    ALTER TABLE crm_leads ADD COLUMN channel_source text DEFAULT 'unknown';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='content_topic') THEN
    ALTER TABLE crm_leads ADD COLUMN content_topic text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='funnel_type') THEN
    ALTER TABLE crm_leads ADD COLUMN funnel_type text DEFAULT 'general';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='urgency_level') THEN
    ALTER TABLE crm_leads ADD COLUMN urgency_level text DEFAULT 'medium';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='intent_confidence') THEN
    ALTER TABLE crm_leads ADD COLUMN intent_confidence text DEFAULT 'medium';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='lead_value_estimate') THEN
    ALTER TABLE crm_leads ADD COLUMN lead_value_estimate numeric(10,2) DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='conversion_failure_reason') THEN
    ALTER TABLE crm_leads ADD COLUMN conversion_failure_reason text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='crm_leads' AND column_name='assigned_to') THEN
    ALTER TABLE crm_leads ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_leads_channel_source ON crm_leads(channel_source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_funnel_type    ON crm_leads(funnel_type);

-- ── Seed missing channel sources (avoid conflicts on both name and slug) ───

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_lead_sources WHERE slug='google-business-profile') THEN
    INSERT INTO crm_lead_sources(name,slug,type,active)
    VALUES('Google Business Profile','google-business-profile','organic',true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_lead_sources WHERE slug='instagram') THEN
    INSERT INTO crm_lead_sources(name,slug,type,active)
    VALUES('Instagram','instagram','paid',true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_lead_sources WHERE slug='tiktok') THEN
    INSERT INTO crm_lead_sources(name,slug,type,active)
    VALUES('TikTok','tiktok','paid',true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_lead_sources WHERE slug='linkedin') THEN
    INSERT INTO crm_lead_sources(name,slug,type,active)
    VALUES('LinkedIn','linkedin','paid',true);
  END IF;
END $$;

-- ── crm_lead_activities ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note',
  performed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes         text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_crm_lead_act_lead_id    ON crm_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_act_created_at ON crm_lead_activities(created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='crm_lead_activities' AND policyname='Lead activities select policy') THEN
    CREATE POLICY "Lead activities select policy"
      ON crm_lead_activities FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='crm_lead_activities' AND policyname='Lead activities insert policy') THEN
    CREATE POLICY "Lead activities insert policy"
      ON crm_lead_activities FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='crm_lead_activities' AND policyname='Lead activities update policy') THEN
    CREATE POLICY "Lead activities update policy"
      ON crm_lead_activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── crm_channel_budgets ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_channel_budgets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_source   text NOT NULL,
  clinic_id        uuid REFERENCES clinics(id) ON DELETE CASCADE,
  period_month     text NOT NULL,
  budget_amount    numeric(10,2) DEFAULT 0,
  actual_spend     numeric(10,2) DEFAULT 0,
  leads_count      integer DEFAULT 0,
  bookings_count   integer DEFAULT 0,
  revenue          numeric(12,2) DEFAULT 0,
  cost_per_lead    numeric(10,2) DEFAULT 0,
  cost_per_booking numeric(10,2) DEFAULT 0,
  roas             numeric(8,4) DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE crm_channel_budgets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_crm_chan_budgets_channel ON crm_channel_budgets(channel_source);
CREATE INDEX IF NOT EXISTS idx_crm_chan_budgets_month   ON crm_channel_budgets(period_month);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='crm_channel_budgets' AND policyname='Channel budgets select policy') THEN
    CREATE POLICY "Channel budgets select policy"
      ON crm_channel_budgets FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='crm_channel_budgets' AND policyname='Channel budgets manage policy') THEN
    CREATE POLICY "Channel budgets manage policy"
      ON crm_channel_budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── Seed demo channel budget data ─────────────────────────────────────────

INSERT INTO crm_channel_budgets
  (channel_source, period_month, budget_amount, actual_spend,
   leads_count, bookings_count, revenue, cost_per_lead, cost_per_booking, roas)
VALUES
  ('google-ads',             '2026-03', 3500, 3180,  87, 42, 18900, 36.55, 75.71, 5.94),
  ('google-business-profile','2026-03',    0,    0,  34, 19,  8550,  0,     0,    0),
  ('facebook-ads',           '2026-03', 1800, 1650,  56, 22,  9900, 29.46, 75.00, 6.00),
  ('instagram',              '2026-03',  800,  720,  31, 12,  5400, 23.23, 60.00, 7.50),
  ('tiktok',                 '2026-03',  600,  540,  43, 11,  4950, 12.56, 49.09, 9.17),
  ('linkedin',               '2026-03',  500,  420,  14,  8,  3600, 30.00, 52.50, 8.57),
  ('website-organic',        '2026-03',    0,    0,  22, 13,  5850,  0,     0,    0);
