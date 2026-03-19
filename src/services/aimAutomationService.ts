import { supabase } from '../lib/supabase';

export type PostStatus =
  | 'draft' | 'generated' | 'awaiting_approval' | 'approved'
  | 'scheduled' | 'publishing' | 'published' | 'failed' | 'held' | 'archived';

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'google_business' | 'tiktok';

export type ReviewPriority = 'critical' | 'high' | 'normal' | 'low';

export type ReviewStatus = 'new' | 'in_progress' | 'responded' | 'escalated' | 'archived' | 'flagged';

export interface AimLocation {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  is_active: boolean;
  google_place_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  location_id: string;
  platform: Platform;
  account_id: string;
  account_name: string;
  page_id: string | null;
  status: 'active' | 'disconnected' | 'error' | 'pending';
  last_synced_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentPost {
  id: string;
  location_id: string | null;
  social_account_id: string | null;
  platform: Platform;
  content_type: 'post' | 'story' | 'reel' | 'ad' | 'event' | 'offer';
  status: PostStatus;
  title: string;
  body: string;
  hashtags: string[];
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  idempotency_key: string;
  failure_reason: string | null;
  retry_count: number;
  campaign_tag: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface ContentApproval {
  id: string;
  post_id: string;
  workflow_id: string | null;
  requester_id: string | null;
  approver_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired';
  feedback: string;
  decided_at: string | null;
  expires_at: string | null;
  created_at: string;
  aim_content_posts?: ContentPost;
}

export interface ReviewTriage {
  id: string;
  location_id: string;
  platform: 'google' | 'facebook' | 'healthgrades' | 'yelp';
  external_review_id: string;
  reviewer_name: string;
  rating: number;
  review_body: string;
  review_date: string;
  priority: ReviewPriority;
  risk_flags: string[];
  status: ReviewStatus;
  assigned_to: string | null;
  response_text: string;
  responded_at: string | null;
  escalation_note: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  created_at: string;
  updated_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface CampaignHealth {
  id: string;
  location_id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'google_ads' | 'tiktok';
  campaign_id: string;
  campaign_name: string;
  snapshot_date: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  leads: number;
  conversions: number;
  ctr_pct: number;
  cpl_cents: number;
  roas: number;
  health_score: number;
  status: 'active' | 'paused' | 'learning' | 'limited' | 'error';
  created_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface CampaignAlert {
  id: string;
  location_id: string;
  campaign_health_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface PolicyRule {
  id: string;
  location_id: string | null;
  name: string;
  rule_type: 'content_filter' | 'approval_gate' | 'schedule_restriction' | 'spend_cap' | 'review_escalation' | 'auto_pause';
  platform: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  location_id: string | null;
  platform: string | null;
  details: Record<string, unknown>;
  created_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface IntegrationConfig {
  id: string;
  location_id: string;
  integration_name: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  config: Record<string, unknown>;
  last_verified_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface KpiSnapshot {
  id: string;
  location_id: string;
  snapshot_date: string;
  total_posts_published: number;
  total_posts_pending: number;
  avg_response_time_hours: number;
  total_reviews_received: number;
  total_reviews_responded: number;
  avg_rating: number;
  total_ad_spend_cents: number;
  total_leads: number;
  total_conversions: number;
  avg_health_score: number;
  open_alerts: number;
  created_at: string;
  aim_locations?: { name: string; city: string } | null;
}

export interface ResponseTemplate {
  id: string;
  location_id: string | null;
  name: string;
  category: 'positive' | 'negative' | 'neutral' | 'billing' | 'general';
  template_text: string;
  platform: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// LOCATIONS
// ============================================================

async function getLocations(): Promise<AimLocation[]> {
  const { data, error } = await supabase
    .from('aim_locations')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// CONTENT POSTS
// ============================================================

async function getContentPosts(filters?: {
  locationId?: string;
  platform?: string;
  status?: string;
}): Promise<ContentPost[]> {
  let query = supabase
    .from('aim_content_posts')
    .select('*, aim_locations(name, city)')
    .order('created_at', { ascending: false });

  if (filters?.locationId) query = query.eq('location_id', filters.locationId);
  if (filters?.platform) query = query.eq('platform', filters.platform);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function updatePostStatus(postId: string, status: PostStatus, extra?: { failure_reason?: string }): Promise<void> {
  const { error } = await supabase
    .from('aim_content_posts')
    .update({ status, ...extra, updated_at: new Date().toISOString() })
    .eq('id', postId);
  if (error) throw error;
}

async function createPost(post: Partial<ContentPost>): Promise<ContentPost> {
  const { data, error } = await supabase
    .from('aim_content_posts')
    .insert(post)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// APPROVALS
// ============================================================

async function getPendingApprovals(locationId?: string): Promise<ContentApproval[]> {
  let query = supabase
    .from('aim_content_approvals')
    .select('*, aim_content_posts(*, aim_locations(name, city))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (locationId) {
    query = query.eq('aim_content_posts.location_id', locationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function decideApproval(
  approvalId: string,
  decision: 'approved' | 'rejected',
  feedback?: string,
): Promise<void> {
  const { error } = await supabase
    .from('aim_content_approvals')
    .update({
      status: decision,
      feedback: feedback ?? '',
      decided_at: new Date().toISOString(),
    })
    .eq('id', approvalId);
  if (error) throw error;
}

// ============================================================
// REVIEW TRIAGE
// ============================================================

async function getReviews(filters?: {
  locationId?: string;
  status?: string;
  priority?: string;
}): Promise<ReviewTriage[]> {
  let query = supabase
    .from('aim_review_triage')
    .select('*, aim_locations(name, city)')
    .order('review_date', { ascending: false });

  if (filters?.locationId) query = query.eq('location_id', filters.locationId);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function updateReview(
  reviewId: string,
  updates: Partial<Pick<ReviewTriage, 'status' | 'priority' | 'response_text' | 'responded_at' | 'escalation_note' | 'assigned_to'>>,
): Promise<void> {
  const { error } = await supabase
    .from('aim_review_triage')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reviewId);
  if (error) throw error;
}

async function getResponseTemplates(locationId?: string): Promise<ResponseTemplate[]> {
  let query = supabase
    .from('aim_response_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (locationId) query = query.eq('location_id', locationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// CAMPAIGN HEALTH
// ============================================================

async function getCampaignHealth(locationId?: string): Promise<CampaignHealth[]> {
  let query = supabase
    .from('aim_campaign_health')
    .select('*, aim_locations(name, city)')
    .order('snapshot_date', { ascending: false })
    .order('health_score', { ascending: true });

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function getCampaignAlerts(resolved?: boolean): Promise<CampaignAlert[]> {
  let query = supabase
    .from('aim_campaign_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (resolved !== undefined) query = query.eq('is_resolved', resolved);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function resolveAlert(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('aim_campaign_alerts')
    .update({ is_resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
    .eq('id', alertId);
  if (error) throw error;
}

// ============================================================
// POLICY RULES
// ============================================================

async function getPolicyRules(locationId?: string): Promise<PolicyRule[]> {
  let query = supabase
    .from('aim_policy_rules')
    .select('*, aim_locations(name, city)')
    .order('priority', { ascending: true });

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function togglePolicyRule(ruleId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('aim_policy_rules')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', ruleId);
  if (error) throw error;
}

// ============================================================
// AUDIT LOG
// ============================================================

async function getAuditLog(filters?: {
  locationId?: string;
  resourceType?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('aim_audit_log')
    .select('*, aim_locations(name, city)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 200);

  if (filters?.locationId) query = query.eq('location_id', filters.locationId);
  if (filters?.resourceType) query = query.eq('resource_type', filters.resourceType);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function logAction(entry: {
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  location_id?: string;
  platform?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('aim_audit_log').insert({
    actor_id: user?.id ?? null,
    actor_name: entry.actor_name,
    action: entry.action,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id,
    location_id: entry.location_id ?? null,
    platform: entry.platform ?? null,
    details: entry.details ?? {},
  });
  if (error) throw error;
}

// ============================================================
// INTEGRATIONS
// ============================================================

async function getIntegrationConfigs(locationId?: string): Promise<IntegrationConfig[]> {
  let query = supabase
    .from('aim_integration_configs')
    .select('*, aim_locations(name, city)')
    .order('integration_name');

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function getSocialAccounts(locationId?: string): Promise<SocialAccount[]> {
  let query = supabase
    .from('aim_social_accounts')
    .select('*')
    .order('platform');

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// KPI SNAPSHOTS
// ============================================================

async function getKpiSnapshots(locationId?: string, days = 7): Promise<KpiSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from('aim_kpi_snapshots')
    .select('*, aim_locations(name, city)')
    .gte('snapshot_date', since.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: false });

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export const aimAutomationService = {
  getLocations,
  getContentPosts,
  updatePostStatus,
  createPost,
  getPendingApprovals,
  decideApproval,
  getReviews,
  updateReview,
  getResponseTemplates,
  getCampaignHealth,
  getCampaignAlerts,
  resolveAlert,
  getPolicyRules,
  togglePolicyRule,
  getAuditLog,
  logAction,
  getIntegrationConfigs,
  getSocialAccounts,
  getKpiSnapshots,
};
