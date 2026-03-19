/*
  # AIM Automation Control System - Core Schema

  ## Overview
  Marketing and local presence automation platform for Alberta Injury Management (AIM).
  Supports multi-location social media posting, content approval workflows, review triage,
  campaign health monitoring, and audit logging.

  ## New Tables
  1. `aim_locations` - AIM clinic locations with social media account links
  2. `aim_social_accounts` - Connected social/platform accounts per location
  3. `aim_content_posts` - Content queue with full lifecycle states
  4. `aim_post_media` - Media attachments for posts
  5. `aim_approval_workflows` - Configurable approval chains per location
  6. `aim_content_approvals` - Per-post approval records
  7. `aim_review_triage` - Review prioritization and assignment
  8. `aim_response_templates` - Reusable reply templates
  9. `aim_campaign_health` - Daily campaign KPI snapshots
  10. `aim_campaign_alerts` - Threshold-based campaign alerts
  11. `aim_policy_rules` - Configurable automation policy rules
  12. `aim_audit_log` - Immutable audit trail for all automation actions
  13. `aim_integration_configs` - Integration connection status
  14. `aim_kpi_snapshots` - Daily cross-location KPI summary

  ## Roles Used
  - admin, executive (from existing user_role enum)

  ## Content Lifecycle States
  draft → generated → awaiting_approval → approved → scheduled → publishing → published → failed → held → archived
*/

-- ============================================================
-- 1. AIM LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT 'AB',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'America/Edmonton',
  is_active boolean NOT NULL DEFAULT true,
  google_place_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aim_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view locations"
  ON aim_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert locations"
  ON aim_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update locations"
  ON aim_locations FOR UPDATE
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

-- ============================================================
-- 2. SOCIAL ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'google_business', 'tiktok')),
  account_id text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  page_id text,
  access_token_hint text DEFAULT '',
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error', 'pending')),
  last_synced_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, platform)
);

ALTER TABLE aim_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view social accounts"
  ON aim_social_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage social accounts"
  ON aim_social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update social accounts"
  ON aim_social_accounts FOR UPDATE
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

-- ============================================================
-- 3. CONTENT POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  social_account_id uuid REFERENCES aim_social_accounts(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'google_business', 'tiktok')),
  content_type text NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'story', 'reel', 'ad', 'event', 'offer')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'awaiting_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'held', 'archived')),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_post_id text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  idempotency_key text UNIQUE DEFAULT gen_random_uuid()::text,
  failure_reason text,
  retry_count integer NOT NULL DEFAULT 0,
  campaign_tag text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aim_content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content posts"
  ON aim_content_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create content posts"
  ON aim_content_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update content posts"
  ON aim_content_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. POST MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES aim_content_posts(id) ON DELETE CASCADE,
  media_url text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'gif', 'document')),
  alt_text text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aim_post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view post media"
  ON aim_post_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage post media"
  ON aim_post_media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. APPROVAL WORKFLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  platform text CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'google_business', 'tiktok', 'all')),
  content_type text DEFAULT 'all',
  required_approvers integer NOT NULL DEFAULT 1,
  approver_role text NOT NULL DEFAULT 'admin',
  auto_approve_after_hours integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aim_approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval workflows"
  ON aim_approval_workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage approval workflows"
  ON aim_approval_workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update approval workflows"
  ON aim_approval_workflows FOR UPDATE
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

-- ============================================================
-- 6. CONTENT APPROVALS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_content_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES aim_content_posts(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES aim_approval_workflows(id) ON DELETE SET NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'expired')),
  feedback text DEFAULT '',
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aim_content_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvals"
  ON aim_content_approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create approvals"
  ON aim_content_approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Approvers can update approvals"
  ON aim_content_approvals FOR UPDATE
  TO authenticated
  USING (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  )
  WITH CHECK (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

-- ============================================================
-- 7. REVIEW TRIAGE
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_review_triage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'google' CHECK (platform IN ('google', 'facebook', 'healthgrades', 'yelp')),
  external_review_id text NOT NULL DEFAULT '',
  reviewer_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_body text NOT NULL DEFAULT '',
  review_date timestamptz NOT NULL DEFAULT now(),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  risk_flags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'escalated', 'archived', 'flagged')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  response_text text DEFAULT '',
  responded_at timestamptz,
  escalation_note text DEFAULT '',
  sentiment text DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, external_review_id)
);

ALTER TABLE aim_review_triage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view review triage"
  ON aim_review_triage FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert review triage"
  ON aim_review_triage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update review triage"
  ON aim_review_triage FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 8. RESPONSE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('positive', 'negative', 'neutral', 'billing', 'general')),
  template_text text NOT NULL DEFAULT '',
  platform text DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aim_response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view response templates"
  ON aim_response_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage response templates"
  ON aim_response_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update response templates"
  ON aim_response_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 9. CAMPAIGN HEALTH
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_campaign_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'google_ads', 'tiktok')),
  campaign_id text NOT NULL DEFAULT '',
  campaign_name text NOT NULL DEFAULT '',
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  spend_cents integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  ctr_pct numeric(6,3) NOT NULL DEFAULT 0,
  cpl_cents integer NOT NULL DEFAULT 0,
  roas numeric(8,3) NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'learning', 'limited', 'error')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, platform, campaign_id, snapshot_date)
);

ALTER TABLE aim_campaign_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign health"
  ON aim_campaign_health FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign health"
  ON aim_campaign_health FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 10. CAMPAIGN ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_campaign_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  campaign_health_id uuid REFERENCES aim_campaign_health(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('high_cpl', 'low_roas', 'budget_exhausted', 'low_ctr', 'account_error', 'disapproval', 'learning_phase')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message text NOT NULL DEFAULT '',
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aim_campaign_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign alerts"
  ON aim_campaign_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign alerts"
  ON aim_campaign_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaign alerts"
  ON aim_campaign_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 11. POLICY RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  rule_type text NOT NULL CHECK (rule_type IN ('content_filter', 'approval_gate', 'schedule_restriction', 'spend_cap', 'review_escalation', 'auto_pause')),
  platform text DEFAULT 'all',
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE aim_policy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view policy rules"
  ON aim_policy_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage policy rules"
  ON aim_policy_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update policy rules"
  ON aim_policy_rules FOR UPDATE
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

-- ============================================================
-- 12. AUDIT LOG (insert-only, immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  resource_type text NOT NULL DEFAULT '',
  resource_id text NOT NULL DEFAULT '',
  location_id uuid REFERENCES aim_locations(id) ON DELETE SET NULL,
  platform text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aim_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log"
  ON aim_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit log"
  ON aim_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 13. INTEGRATION CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  integration_name text NOT NULL CHECK (integration_name IN ('facebook_ads', 'instagram', 'linkedin', 'google_business', 'tiktok', 'google_ads', 'n8n', 'openai')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  config jsonb NOT NULL DEFAULT '{}',
  last_verified_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, integration_name)
);

ALTER TABLE aim_integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view integration configs"
  ON aim_integration_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage integration configs"
  ON aim_integration_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can update integration configs"
  ON aim_integration_configs FOR UPDATE
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

-- ============================================================
-- 14. KPI SNAPSHOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS aim_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES aim_locations(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_posts_published integer NOT NULL DEFAULT 0,
  total_posts_pending integer NOT NULL DEFAULT 0,
  avg_response_time_hours numeric(8,2) NOT NULL DEFAULT 0,
  total_reviews_received integer NOT NULL DEFAULT 0,
  total_reviews_responded integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  total_ad_spend_cents integer NOT NULL DEFAULT 0,
  total_leads integer NOT NULL DEFAULT 0,
  total_conversions integer NOT NULL DEFAULT 0,
  avg_health_score integer NOT NULL DEFAULT 0,
  open_alerts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, snapshot_date)
);

ALTER TABLE aim_kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view kpi snapshots"
  ON aim_kpi_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert kpi snapshots"
  ON aim_kpi_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_status ON aim_content_posts(status);
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_location ON aim_content_posts(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_platform ON aim_content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_scheduled ON aim_content_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_aim_content_approvals_post ON aim_content_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_approvals_status ON aim_content_approvals(status);
CREATE INDEX IF NOT EXISTS idx_aim_review_triage_location ON aim_review_triage(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_review_triage_status ON aim_review_triage(status);
CREATE INDEX IF NOT EXISTS idx_aim_review_triage_priority ON aim_review_triage(priority);
CREATE INDEX IF NOT EXISTS idx_aim_campaign_health_location ON aim_campaign_health(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_campaign_health_date ON aim_campaign_health(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_aim_campaign_alerts_resolved ON aim_campaign_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_aim_audit_log_actor ON aim_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_aim_audit_log_created ON aim_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_aim_audit_log_resource ON aim_audit_log(resource_type, resource_id);
