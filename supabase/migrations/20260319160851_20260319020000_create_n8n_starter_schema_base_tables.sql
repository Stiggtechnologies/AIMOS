/*
  # n8n Automation Control System - Base Schema

  ## Summary
  Creates the foundational tables from the original n8n architecture spec that were not yet present.
  These are the canonical tables the n8n workflow spec references directly (no aim_ prefix) —
  separate from the aim_* prefixed tables added for the live Supabase-backed workflow layer.

  ## New Tables

  ### Core Reference
  - `wf_roles` - Observer, Operator, Approver, Admin, Executive
  - `wf_users` - User registry with status
  - `wf_user_roles` - User-to-role assignments
  - `wf_locations` - Multi-location clinic registry for automation system
  - `wf_channels` - Social/local channels registry

  ### Content Domain
  - `wf_content_items` - Master content records with lifecycle status and risk scoring
  - `wf_content_variants` - Per-channel caption/hook/cta variants
  - `wf_content_assets` - Media and document assets
  - `wf_content_tags` - Content taxonomy tags
  - `wf_content_approvals` - Approval requests with SLA tracking

  ### Publishing Domain
  - `wf_idempotency_keys` - Idempotency registry for safe retries
  - `wf_publish_jobs` - Scheduled publish queue per channel
  - `wf_publish_results` - Publish outcomes with external_post_id
  - `wf_scheduled_actions` - Generic scheduled action registry

  ### Reviews Domain
  - `wf_reviews` - Inbound reviews (GBP, FB, etc.)
  - `wf_review_flags` - Risk flags per review
  - `wf_review_drafts` - AI/human reply drafts
  - `wf_review_approvals` - Review reply approval workflow

  ### Workflow / Exceptions / Alerts
  - `wf_workflow_runs` - Per-execution run records
  - `wf_workflow_exceptions` - Exception registry with retry/escalation
  - `wf_alerts` - Operational alert registry
  - `wf_notification_events` - Outbound notification queue

  ### KPI / Integrations / Policy / Audit
  - `wf_kpi_daily_snapshots` - Daily KPI metrics by location/channel
  - `wf_integration_accounts` - Integration health registry
  - `wf_policy_rules` - Configurable workflow policy rules
  - `wf_audit_events` - Immutable audit log

  ## Notes
  1. Prefixed `wf_` to avoid collision with existing system tables
  2. References auth.users for owner/actor fields
  3. All tables have RLS enabled
  4. Seed data: roles, channels, locations, policy rules
*/

-- ======================================================
-- Core reference tables
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_roles"
  ON wf_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage wf_roles"
  ON wf_roles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive'))
  );

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_users"
  ON wf_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_users"
  ON wf_users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update own wf_user"
  ON wf_users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES wf_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES wf_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE wf_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_user_roles"
  ON wf_user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage wf_user_roles"
  ON wf_user_roles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive'))
  );

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  province text,
  timezone text NOT NULL DEFAULT 'America/Edmonton',
  active boolean NOT NULL DEFAULT true,
  google_business_profile_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_locations"
  ON wf_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage wf_locations"
  ON wf_locations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive'))
  );

CREATE POLICY "Admins can update wf_locations"
  ON wf_locations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')));

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_channels"
  ON wf_channels FOR SELECT TO authenticated USING (true);

-- ======================================================
-- Content domain
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location_id uuid REFERENCES wf_locations(id) ON DELETE SET NULL,
  content_pillar text,
  primary_channel_id uuid REFERENCES wf_channels(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','generated','awaiting_approval','approved','scheduled','publishing','published','failed','held','archived')
  ),
  risk_score numeric(5,2) NOT NULL DEFAULT 0,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_content_items"
  ON wf_content_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_content_items"
  ON wf_content_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_content_items"
  ON wf_content_items FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_content_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES wf_content_items(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES wf_channels(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  caption_text text,
  hook_text text,
  cta_text text,
  compliance_notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','approved','rejected','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_content_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_content_variants"
  ON wf_content_variants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_content_variants"
  ON wf_content_variants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_content_variants"
  ON wf_content_variants FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES wf_content_items(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('image','video','document','link','other')),
  url text NOT NULL,
  thumbnail_url text,
  alt_text text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_content_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_content_assets"
  ON wf_content_assets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_content_assets"
  ON wf_content_assets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES wf_content_items(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_item_id, tag)
);

ALTER TABLE wf_content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_content_tags"
  ON wf_content_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_content_tags"
  ON wf_content_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_content_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES wf_content_items(id) ON DELETE CASCADE,
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

ALTER TABLE wf_content_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_content_approvals"
  ON wf_content_approvals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_content_approvals"
  ON wf_content_approvals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_content_approvals"
  ON wf_content_approvals FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Publishing domain
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  unique_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','consumed','failed','expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_idempotency_keys"
  ON wf_idempotency_keys FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_idempotency_keys"
  ON wf_idempotency_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_idempotency_keys"
  ON wf_idempotency_keys FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_publish_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES wf_content_items(id) ON DELETE CASCADE,
  content_variant_id uuid REFERENCES wf_content_variants(id) ON DELETE SET NULL,
  channel_id uuid NOT NULL REFERENCES wf_channels(id) ON DELETE CASCADE,
  location_id uuid REFERENCES wf_locations(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued','due','publishing','published','failed','cancelled','held')
  ),
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  idempotency_key_id uuid REFERENCES wf_idempotency_keys(id) ON DELETE SET NULL,
  external_job_ref text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_publish_jobs"
  ON wf_publish_jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_publish_jobs"
  ON wf_publish_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_publish_jobs"
  ON wf_publish_jobs FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_publish_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_job_id uuid NOT NULL REFERENCES wf_publish_jobs(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success','failure','partial')),
  external_post_id text,
  response_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_publish_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_publish_results"
  ON wf_publish_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_publish_results"
  ON wf_publish_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_scheduled_actions (
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

ALTER TABLE wf_scheduled_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_scheduled_actions"
  ON wf_scheduled_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_scheduled_actions"
  ON wf_scheduled_actions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_scheduled_actions"
  ON wf_scheduled_actions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Reviews domain
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  location_id uuid REFERENCES wf_locations(id) ON DELETE SET NULL,
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

ALTER TABLE wf_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_reviews"
  ON wf_reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_reviews"
  ON wf_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_reviews"
  ON wf_reviews FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES wf_reviews(id) ON DELETE CASCADE,
  flag_code text NOT NULL,
  confidence numeric(5,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_review_flags"
  ON wf_review_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_review_flags"
  ON wf_review_flags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_review_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES wf_reviews(id) ON DELETE CASCADE,
  drafted_by_type text NOT NULL CHECK (drafted_by_type IN ('system','user','ai')),
  drafted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  draft_text text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','awaiting_approval','approved','rejected','posted')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_review_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_review_drafts"
  ON wf_review_drafts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_review_drafts"
  ON wf_review_drafts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_review_drafts"
  ON wf_review_drafts FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_review_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES wf_reviews(id) ON DELETE CASCADE,
  draft_id uuid NOT NULL REFERENCES wf_review_drafts(id) ON DELETE CASCADE,
  requested_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','approved','rejected','held')
  ),
  comments text,
  due_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_review_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_review_approvals"
  ON wf_review_approvals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_review_approvals"
  ON wf_review_approvals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_review_approvals"
  ON wf_review_approvals FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Workflow / exception / alerts
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_workflow_runs (
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

ALTER TABLE wf_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_workflow_runs"
  ON wf_workflow_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_workflow_runs"
  ON wf_workflow_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_workflow_runs"
  ON wf_workflow_runs FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_workflow_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  workflow_run_id uuid REFERENCES wf_workflow_runs(id) ON DELETE SET NULL,
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

ALTER TABLE wf_workflow_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_workflow_exceptions"
  ON wf_workflow_exceptions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_workflow_exceptions"
  ON wf_workflow_exceptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_workflow_exceptions"
  ON wf_workflow_exceptions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_alerts (
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

ALTER TABLE wf_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_alerts"
  ON wf_alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_alerts"
  ON wf_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_alerts"
  ON wf_alerts FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_notification_events (
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

ALTER TABLE wf_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_notification_events"
  ON wf_notification_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_notification_events"
  ON wf_notification_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update wf_notification_events"
  ON wf_notification_events FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- KPI / integrations / policy / audit
-- ======================================================

CREATE TABLE IF NOT EXISTS wf_kpi_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  location_id uuid REFERENCES wf_locations(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES wf_channels(id) ON DELETE SET NULL,
  metric_name text NOT NULL,
  metric_value numeric(14,2) NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_kpi_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_kpi_daily_snapshots"
  ON wf_kpi_daily_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_kpi_daily_snapshots"
  ON wf_kpi_daily_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_integration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  account_name text NOT NULL,
  location_id uuid REFERENCES wf_locations(id) ON DELETE SET NULL,
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

ALTER TABLE wf_integration_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_integration_accounts"
  ON wf_integration_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage wf_integration_accounts"
  ON wf_integration_accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')));

CREATE POLICY "Admins can update wf_integration_accounts"
  ON wf_integration_accounts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')));

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL UNIQUE,
  rule_type text NOT NULL,
  rule_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_policy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_policy_rules"
  ON wf_policy_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage wf_policy_rules"
  ON wf_policy_rules FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')));

CREATE POLICY "Admins can update wf_policy_rules"
  ON wf_policy_rules FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin','executive')));

-- ======================================================

CREATE TABLE IF NOT EXISTS wf_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wf_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read wf_audit_events"
  ON wf_audit_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert wf_audit_events"
  ON wf_audit_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ======================================================
-- Indexes
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_wf_content_items_status ON wf_content_items(status);
CREATE INDEX IF NOT EXISTS idx_wf_content_items_location ON wf_content_items(location_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_items_scheduled_for ON wf_content_items(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_status ON wf_publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_scheduled_for ON wf_publish_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_wf_publish_jobs_channel ON wf_publish_jobs(channel_id);

CREATE INDEX IF NOT EXISTS idx_wf_reviews_location ON wf_reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_wf_reviews_response_status ON wf_reviews(response_status);
CREATE INDEX IF NOT EXISTS idx_wf_reviews_timestamp ON wf_reviews(review_timestamp);

CREATE INDEX IF NOT EXISTS idx_wf_exceptions_status ON wf_workflow_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_wf_exceptions_severity ON wf_workflow_exceptions(severity);
CREATE INDEX IF NOT EXISTS idx_wf_exceptions_owner ON wf_workflow_exceptions(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_wf_kpi_snapshot_date ON wf_kpi_daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_wf_kpi_location_channel ON wf_kpi_daily_snapshots(location_id, channel_id);

CREATE INDEX IF NOT EXISTS idx_wf_audit_events_target ON wf_audit_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_wf_audit_events_actor ON wf_audit_events(actor_type, actor_id);

CREATE INDEX IF NOT EXISTS idx_wf_workflow_runs_name ON wf_workflow_runs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_wf_workflow_runs_status ON wf_workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_wf_workflow_runs_correlation ON wf_workflow_runs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_wf_integration_accounts_provider ON wf_integration_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_wf_integration_accounts_status ON wf_integration_accounts(connection_status);

CREATE INDEX IF NOT EXISTS idx_wf_notifications_status ON wf_notification_events(status);

-- ======================================================
-- Seed reference data
-- ======================================================

INSERT INTO wf_roles (name, description) VALUES
  ('observer',  'Can view dashboards and queues'),
  ('operator',  'Can perform safe operational actions'),
  ('approver',  'Can approve content and replies'),
  ('admin',     'Can manage integrations, policies, users'),
  ('executive', 'Can view executive summaries and high-level approvals')
ON CONFLICT (name) DO NOTHING;

INSERT INTO wf_channels (name, type) VALUES
  ('Facebook',               'social'),
  ('Instagram',              'social'),
  ('LinkedIn',               'social'),
  ('Google Business Profile','local_search'),
  ('TikTok',                 'social')
ON CONFLICT (name) DO NOTHING;

INSERT INTO wf_locations (name, city, province, timezone, active, notes) VALUES
  ('AIM South Commons',      'Edmonton', 'Alberta', 'America/Edmonton', true, 'Flagship south Edmonton clinic'),
  ('AIM Downtown Edmonton',  'Edmonton', 'Alberta', 'America/Edmonton', true, 'Urban central location'),
  ('AIM West Edmonton',      'Edmonton', 'Alberta', 'America/Edmonton', true, 'Growth location')
ON CONFLICT DO NOTHING;

INSERT INTO wf_policy_rules (rule_name, rule_type, rule_config_json, active) VALUES
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
  )
ON CONFLICT (rule_name) DO NOTHING;
