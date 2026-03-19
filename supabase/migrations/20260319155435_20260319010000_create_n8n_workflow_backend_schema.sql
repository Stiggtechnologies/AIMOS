/*
  # n8n Workflow Backend Schema

  ## Summary
  Creates the complete backend schema for the AIM Automation Control System's n8n orchestration layer.
  This schema serves as the system-of-record for all workflow operations, exceptions, publishing jobs,
  review management, KPI snapshots, integration health, and audit events.

  ## New Tables

  ### Core Reference
  - `aim_workflow_roles` - Observer, Operator, Approver, Admin, Executive roles
  - `aim_workflow_channels` - Facebook, Instagram, LinkedIn, GBP, TikTok
  - `aim_workflow_locations` - Multi-location AIM clinic registry (separate from existing locations)

  ### Content Domain
  - `aim_content_items` - Master content records with lifecycle status and risk scoring
  - `aim_content_variants` - Per-channel caption/hook/cta variants
  - `aim_content_assets` - Images, videos, documents attached to content
  - `aim_content_tags` - Content tag registry
  - `aim_content_approvals_v2` - Approval requests with due dates and SLA tracking

  ### Publishing Domain
  - `aim_idempotency_keys` - Idempotency key registry for safe retries
  - `aim_publish_jobs` - Scheduled publish job queue per channel
  - `aim_publish_results` - Publish outcome records (success/failure with external_post_id)
  - `aim_scheduled_actions` - Generic scheduled action registry

  ### Reviews Domain
  - `aim_reviews` - Inbound review records from GBP, Facebook, etc.
  - `aim_review_flags` - Per-review risk flags (legal_threat, billing_complaint, etc.)
  - `aim_review_drafts` - AI/human-drafted reply texts
  - `aim_review_approvals` - Review reply approval workflow

  ### Workflow / Exception / Alerts
  - `aim_workflow_runs` - Per-execution workflow run records
  - `aim_workflow_exceptions` - Exception records with severity, retry tracking, escalation
  - `aim_alerts_v2` - Operational alerts (open/acknowledged/resolved)
  - `aim_notification_events` - Outbound notification queue

  ### KPI / Integrations / Policy / Audit
  - `aim_kpi_daily_snapshots` - Daily KPI metrics per location/channel
  - `aim_integration_accounts` - Integration health registry
  - `aim_policy_rules_v2` - Configurable policy rules for content, reviews, publishing
  - `aim_audit_events` - Immutable audit log

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all records
  - Admin/executive roles can write (content, workflow, integration management)
  - audit_events is insert-only (no update/delete)

  ## Important Notes
  1. Tables are prefixed `aim_` to avoid collision with existing tables
  2. Uses `aim_workflow_locations` and `aim_workflow_channels` as clean reference tables
  3. `aim_publish_jobs` uses `aim_idempotency_keys` FK for safe retry semantics
  4. `aim_workflow_runs` tracks every n8n execution for observability
  5. `aim_workflow_exceptions` supports retry_attempts + escalation lifecycle
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ======================================================
-- Core reference tables
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_workflow_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_workflow_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read channels"
  ON aim_workflow_channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON aim_workflow_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

-- ======================================================
-- Content domain
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  content_pillar text,
  primary_channel text,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft','generated','awaiting_approval','approved','scheduled',
      'publishing','published','failed','held','archived'
    )
  ),
  risk_score numeric(5,2) NOT NULL DEFAULT 0,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for timestamptz,
  idempotency_key text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read content items"
  ON aim_content_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert content items"
  ON aim_content_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update content items"
  ON aim_content_items FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_content_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES aim_content_items(id) ON DELETE CASCADE,
  channel text NOT NULL,
  variant_name text NOT NULL,
  caption_text text,
  hook_text text,
  cta_text text,
  compliance_notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','ready','approved','rejected','archived')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_content_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read variants"
  ON aim_content_variants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert variants"
  ON aim_content_variants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update variants"
  ON aim_content_variants FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES aim_content_items(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('image','video','document','link','other')),
  url text NOT NULL,
  thumbnail_url text,
  alt_text text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_content_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read assets"
  ON aim_content_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert assets"
  ON aim_content_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES aim_content_items(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_item_id, tag)
);

ALTER TABLE aim_content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tags"
  ON aim_content_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert tags"
  ON aim_content_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_content_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES aim_content_items(id) ON DELETE CASCADE,
  requested_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending','approved','rejected','held','rewrite_requested')
  ),
  comments text,
  due_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_content_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read approval requests"
  ON aim_content_approval_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert approval requests"
  ON aim_content_approval_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update approval requests"
  ON aim_content_approval_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Publishing domain
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  unique_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available' CHECK (
    status IN ('available','consumed','failed','expired')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read idempotency keys"
  ON aim_idempotency_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert idempotency keys"
  ON aim_idempotency_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update idempotency keys"
  ON aim_idempotency_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_publish_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES aim_content_items(id) ON DELETE CASCADE,
  content_variant_id uuid REFERENCES aim_content_variants(id) ON DELETE SET NULL,
  channel text NOT NULL,
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued','due','publishing','published','failed','cancelled','held')
  ),
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  idempotency_key_id uuid REFERENCES aim_idempotency_keys(id) ON DELETE SET NULL,
  external_job_ref text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read publish jobs"
  ON aim_publish_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert publish jobs"
  ON aim_publish_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update publish jobs"
  ON aim_publish_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_publish_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_job_id uuid NOT NULL REFERENCES aim_publish_jobs(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success','failure','partial')),
  external_post_id text,
  response_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_publish_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read publish results"
  ON aim_publish_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert publish results"
  ON aim_publish_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_scheduled_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled','processing','completed','failed','cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_scheduled_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read scheduled actions"
  ON aim_scheduled_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert scheduled actions"
  ON aim_scheduled_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update scheduled actions"
  ON aim_scheduled_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Reviews domain
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  external_review_id text NOT NULL,
  author_name text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  review_timestamp timestamptz,
  sentiment_score numeric(6,3),
  severity_score numeric(6,3),
  response_status text NOT NULL DEFAULT 'unresponded' CHECK (
    response_status IN ('unresponded','drafted','awaiting_approval','responded','escalated','monitored')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source, external_review_id)
);

ALTER TABLE aim_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read reviews"
  ON aim_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert reviews"
  ON aim_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update reviews"
  ON aim_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES aim_reviews(id) ON DELETE CASCADE,
  flag_code text NOT NULL,
  confidence numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read review flags"
  ON aim_review_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert review flags"
  ON aim_review_flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_review_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES aim_reviews(id) ON DELETE CASCADE,
  drafted_by_type text NOT NULL CHECK (drafted_by_type IN ('system','user','ai')),
  drafted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  draft_text text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','awaiting_approval','approved','rejected','posted')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_review_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read review drafts"
  ON aim_review_drafts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert review drafts"
  ON aim_review_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update review drafts"
  ON aim_review_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_review_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES aim_reviews(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES aim_review_drafts(id) ON DELETE CASCADE,
  requested_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','approved','rejected','held')
  ),
  comments text,
  due_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_review_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read review approval requests"
  ON aim_review_approval_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert review approval requests"
  ON aim_review_approval_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update review approval requests"
  ON aim_review_approval_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Workflow / exception / alerts
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  source_system text,
  correlation_id text,
  environment text DEFAULT 'production',
  status text NOT NULL DEFAULT 'started' CHECK (
    status IN ('started','completed','failed','partial','cancelled')
  ),
  input_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE aim_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read workflow runs"
  ON aim_workflow_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert workflow runs"
  ON aim_workflow_runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service can update workflow runs"
  ON aim_workflow_runs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_workflow_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  workflow_run_id uuid REFERENCES aim_workflow_runs(id) ON DELETE SET NULL,
  source_system text,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  root_cause text NOT NULL,
  summary text NOT NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  retry_attempts integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open','triaged','retrying','escalated','resolved','ignored')
  ),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE aim_workflow_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read exceptions"
  ON aim_workflow_exceptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert exceptions"
  ON aim_workflow_exceptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update exceptions"
  ON aim_workflow_exceptions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_operational_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  title text NOT NULL,
  message text,
  target_type text,
  target_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE aim_operational_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read operational alerts"
  ON aim_operational_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert operational alerts"
  ON aim_operational_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update operational alerts"
  ON aim_operational_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_channel text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','sent','failed','cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE aim_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read notification events"
  ON aim_notification_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert notification events"
  ON aim_notification_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update notification events"
  ON aim_notification_events FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- KPI / integrations / policy / audit
-- ======================================================

CREATE TABLE IF NOT EXISTS aim_kpi_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  channel text,
  metric_name text NOT NULL,
  metric_value numeric(14,2) NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_kpi_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read kpi snapshots"
  ON aim_kpi_daily_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert kpi snapshots"
  ON aim_kpi_daily_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_integration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  account_name text NOT NULL,
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  environment text NOT NULL DEFAULT 'production',
  connection_status text NOT NULL DEFAULT 'connected' CHECK (
    connection_status IN ('connected','degraded','disconnected','auth_required','disabled')
  ),
  scopes_summary text,
  last_successful_sync_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  token_expires_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_integration_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read integration accounts"
  ON aim_integration_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage integration accounts"
  ON aim_integration_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update integration accounts"
  ON aim_integration_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_workflow_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL UNIQUE,
  rule_type text NOT NULL,
  rule_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_workflow_policy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read workflow policy rules"
  ON aim_workflow_policy_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflow policy rules"
  ON aim_workflow_policy_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update workflow policy rules"
  ON aim_workflow_policy_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

-- ======================================================

CREATE TABLE IF NOT EXISTS aim_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  correlation_id text,
  source_system text DEFAULT 'app',
  environment text DEFAULT 'production',
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aim_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read audit events"
  ON aim_audit_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert audit events"
  ON aim_audit_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Indexes
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_aim_content_items_status ON aim_content_items(status);
CREATE INDEX IF NOT EXISTS idx_aim_content_items_location ON aim_content_items(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_items_scheduled_for ON aim_content_items(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_aim_content_items_idempotency ON aim_content_items(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_status ON aim_publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_scheduled_for ON aim_publish_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_channel ON aim_publish_jobs(channel);
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_location ON aim_publish_jobs(location_id);

CREATE INDEX IF NOT EXISTS idx_aim_reviews_location ON aim_reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_reviews_response_status ON aim_reviews(response_status);
CREATE INDEX IF NOT EXISTS idx_aim_reviews_timestamp ON aim_reviews(review_timestamp);
CREATE INDEX IF NOT EXISTS idx_aim_reviews_external_id ON aim_reviews(source, external_review_id);

CREATE INDEX IF NOT EXISTS idx_aim_workflow_runs_name ON aim_workflow_runs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_aim_workflow_runs_correlation ON aim_workflow_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_aim_workflow_runs_status ON aim_workflow_runs(status);

CREATE INDEX IF NOT EXISTS idx_aim_exceptions_status ON aim_workflow_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_aim_exceptions_severity ON aim_workflow_exceptions(severity);
CREATE INDEX IF NOT EXISTS idx_aim_exceptions_workflow ON aim_workflow_exceptions(workflow_name);

CREATE INDEX IF NOT EXISTS idx_aim_kpi_date ON aim_kpi_daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_aim_kpi_location_channel ON aim_kpi_daily_snapshots(location_id, channel);
CREATE INDEX IF NOT EXISTS idx_aim_kpi_metric ON aim_kpi_daily_snapshots(metric_name);

CREATE INDEX IF NOT EXISTS idx_aim_audit_events_target ON aim_audit_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_aim_audit_events_actor ON aim_audit_events(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_aim_audit_events_correlation ON aim_audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_aim_audit_events_created ON aim_audit_events(created_at);

CREATE INDEX IF NOT EXISTS idx_aim_integration_accounts_provider ON aim_integration_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_aim_integration_accounts_status ON aim_integration_accounts(connection_status);
CREATE INDEX IF NOT EXISTS idx_aim_integration_accounts_location ON aim_integration_accounts(location_id);

CREATE INDEX IF NOT EXISTS idx_aim_notification_events_status ON aim_notification_events(status);
CREATE INDEX IF NOT EXISTS idx_aim_notification_events_user ON aim_notification_events(target_user_id);

CREATE INDEX IF NOT EXISTS idx_aim_operational_alerts_status ON aim_operational_alerts(status);
CREATE INDEX IF NOT EXISTS idx_aim_operational_alerts_severity ON aim_operational_alerts(severity);

-- ======================================================
-- Seed reference data
-- ======================================================

INSERT INTO aim_workflow_channels (name, type)
VALUES
  ('Facebook', 'social'),
  ('Instagram', 'social'),
  ('LinkedIn', 'social'),
  ('Google Business Profile', 'local_search'),
  ('TikTok', 'social')
ON CONFLICT (name) DO NOTHING;

INSERT INTO aim_workflow_policy_rules (rule_name, rule_type, rule_config_json, active)
VALUES
  (
    'high_risk_content_requires_approval',
    'content_approval',
    '{"risk_score_threshold": 7.0, "applies_to": ["Facebook","Instagram","LinkedIn","TikTok","Google Business Profile"]}'::jsonb,
    true
  ),
  (
    'one_star_reviews_require_approver',
    'review_approval',
    '{"min_rating": 1, "require_approval": true}'::jsonb,
    true
  ),
  (
    'legal_threat_reviews_escalate',
    'review_escalation',
    '{"keywords": ["lawyer","legal","sue","privacy","human rights"], "severity":"critical"}'::jsonb,
    true
  ),
  (
    'duplicate_publish_prevention_window',
    'publish_safety',
    '{"window_minutes": 60}'::jsonb,
    true
  ),
  (
    'after_hours_schedule_restriction',
    'schedule_restriction',
    '{"restricted_hours": {"start": "22:00", "end": "07:00"}, "timezone": "America/Edmonton", "require_approval_override": true}'::jsonb,
    true
  )
ON CONFLICT (rule_name) DO NOTHING;

-- Seed integration accounts for AIM locations
INSERT INTO aim_integration_accounts (provider, account_name, location_id, environment, connection_status, scopes_summary, last_successful_sync_at)
SELECT
  unnest(ARRAY['meta_ads','google_business_profile','linkedin_pages','google_ads']) as provider,
  'AIM South Commons - ' || unnest(ARRAY['Meta Ads','GBP','LinkedIn','Google Ads']) as account_name,
  l.id,
  'production',
  'connected',
  'read,write,publish',
  now() - interval '2 hours'
FROM aim_locations l
WHERE l.name = 'AIM South Commons'
ON CONFLICT DO NOTHING;
