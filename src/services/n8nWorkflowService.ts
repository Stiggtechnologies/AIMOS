import { supabase } from '../lib/supabase';

export type WorkflowEventType =
  | 'content.item.created'
  | 'content.approval.decided'
  | 'publish.job.failed'
  | 'review.received'
  | 'integration.auth.failed';

export interface WorkflowEventPayload {
  event_type: WorkflowEventType;
  correlation_id: string;
  actor_type: 'user' | 'system' | 'n8n' | 'openclaw';
  actor_id?: string;
  source: string;
  environment: string;
  target_type: string;
  target_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  source_system: string | null;
  correlation_id: string | null;
  environment: string | null;
  status: 'started' | 'completed' | 'failed' | 'partial' | 'cancelled';
  input_payload_json: Record<string, unknown>;
  output_payload_json: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
}

export interface WorkflowException {
  id: string;
  workflow_name: string;
  workflow_run_id: string | null;
  source_system: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  root_cause: string;
  summary: string;
  details_json: Record<string, unknown>;
  retry_attempts: number;
  max_retries: number;
  status: 'open' | 'triaged' | 'retrying' | 'escalated' | 'resolved' | 'ignored';
  owner_user_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface OperationalAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string | null;
  target_type: string | null;
  target_id: string | null;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface NotificationEvent {
  id: string;
  notification_type: string;
  target_user_id: string | null;
  target_channel: string | null;
  payload_json: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
  sent_at: string | null;
}

export interface KpiDailySnapshot {
  id: string;
  snapshot_date: string;
  location_id: string | null;
  channel_id: string | null;
  metric_name: string;
  metric_value: number;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface IntegrationAccount {
  id: string;
  provider: string;
  account_name: string;
  location_id: string | null;
  environment: string;
  connection_status: 'connected' | 'degraded' | 'disconnected' | 'auth_required' | 'disabled';
  scopes_summary: string | null;
  last_successful_sync_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  token_expires_at: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  location_id: string | null;
  content_pillar: string | null;
  primary_channel_id: string | null;
  status: string;
  risk_score: number;
  owner_user_id: string | null;
  scheduled_for: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  wf_locations?: { name: string } | null;
}

export interface ContentVariant {
  id: string;
  content_item_id: string;
  channel: string;
  variant_name: string;
  caption_text: string | null;
  hook_text: string | null;
  cta_text: string | null;
  compliance_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PublishJob {
  id: string;
  content_item_id: string;
  content_variant_id: string | null;
  channel_id: string | null;
  location_id: string | null;
  scheduled_for: string;
  status: 'queued' | 'due' | 'publishing' | 'published' | 'failed' | 'cancelled' | 'held';
  retry_count: number;
  max_retries: number;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  wf_content_items?: { title: string; status: string } | null;
  wf_locations?: { name: string } | null;
}

export interface AimReview {
  id: string;
  source: string;
  location_id: string | null;
  external_review_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_timestamp: string | null;
  sentiment_score: number | null;
  severity_score: number | null;
  response_status: string;
  created_at: string;
  updated_at: string;
  wf_locations?: { name: string } | null;
}

export interface WorkflowPolicyRule {
  id: string;
  rule_name: string;
  rule_type: string;
  rule_config_json: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  payload_json: Record<string, unknown>;
  created_at: string;
}

async function fireWorkflowEvent(
  eventType: WorkflowEventType,
  targetType: string,
  targetId: string,
  payload: Record<string, unknown>,
  actorId?: string
): Promise<{ success: boolean; workflow_run_id?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const body: WorkflowEventPayload = {
      event_type: eventType,
      correlation_id: crypto.randomUUID(),
      actor_type: 'user',
      actor_id: actorId || user?.id,
      source: 'app',
      environment: 'production',
      target_type: targetType,
      target_id: targetId,
      payload,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`${supabaseUrl}/functions/v1/aim-workflow-event`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function queryOpenClaw(endpoint: string): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/aim-workflow-event/${endpoint}`, {
    headers: { Authorization: `Bearer ${supabaseKey}` },
  });
  return res.json();
}

async function getWorkflowRuns(filters?: { workflow_name?: string; status?: string; limit?: number }): Promise<WorkflowRun[]> {
  let query = supabase.from('wf_workflow_runs').select('*').order('started_at', { ascending: false });
  if (filters?.workflow_name) query = query.eq('workflow_name', filters.workflow_name);
  if (filters?.status) query = query.eq('status', filters.status);
  query = query.limit(filters?.limit || 100);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getExceptions(filters?: { status?: string; severity?: string; limit?: number }): Promise<WorkflowException[]> {
  let query = supabase.from('wf_workflow_exceptions').select('*').order('created_at', { ascending: false });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  query = query.limit(filters?.limit || 100);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function resolveException(id: string): Promise<void> {
  const { error } = await supabase
    .from('wf_workflow_exceptions')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function getOperationalAlerts(filters?: { status?: string; severity?: string }): Promise<OperationalAlert[]> {
  let query = supabase.from('wf_alerts').select('*').order('created_at', { ascending: false });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.severity) query = query.eq('severity', filters.severity);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function acknowledgeAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('wf_alerts')
    .update({ status: 'acknowledged' })
    .eq('id', id);
  if (error) throw error;
}

async function resolveAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('wf_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function getKpiSnapshots(filters?: { location_id?: string; channel_id?: string; days?: number }): Promise<KpiDailySnapshot[]> {
  const daysBack = filters?.days || 30;
  const since = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];
  let query = supabase
    .from('wf_kpi_daily_snapshots')
    .select('*')
    .gte('snapshot_date', since)
    .order('snapshot_date', { ascending: false });
  if (filters?.location_id) query = query.eq('location_id', filters.location_id);
  if (filters?.channel_id) query = query.eq('channel_id', filters.channel_id);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getIntegrationAccounts(locationId?: string): Promise<IntegrationAccount[]> {
  let query = supabase.from('wf_integration_accounts').select('*').order('provider');
  if (locationId) query = query.eq('location_id', locationId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getContentItems(filters?: { location_id?: string; status?: string; limit?: number }): Promise<ContentItem[]> {
  let query = supabase
    .from('wf_content_items')
    .select('*, wf_locations(name)')
    .order('created_at', { ascending: false });
  if (filters?.location_id) query = query.eq('location_id', filters.location_id);
  if (filters?.status) query = query.eq('status', filters.status);
  query = query.limit(filters?.limit || 100);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ContentItem[];
}

async function createContentItem(item: Partial<ContentItem>): Promise<ContentItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('wf_content_items')
    .insert({ ...item, created_by: user?.id, owner_user_id: user?.id })
    .select('*, wf_locations(name)')
    .single();
  if (error) throw error;

  await fireWorkflowEvent('content.item.created', 'content_item', data.id, {
    title: data.title,
    risk_score: data.risk_score || 0,
    location_id: data.location_id,
    primary_channel_id: data.primary_channel_id,
  });

  return data as ContentItem;
}

async function getPublishJobs(filters?: { location_id?: string; status?: string; channel_id?: string }): Promise<PublishJob[]> {
  let query = supabase
    .from('wf_publish_jobs')
    .select('*, wf_content_items(title, status), wf_locations(name)')
    .order('scheduled_for', { ascending: false });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.channel_id) query = query.eq('channel_id', filters.channel_id);
  if (filters?.location_id) query = query.eq('location_id', filters.location_id);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PublishJob[];
}

async function getReviews(filters?: { location_id?: string; response_status?: string; limit?: number }): Promise<AimReview[]> {
  let query = supabase
    .from('wf_reviews')
    .select('*, wf_locations(name)')
    .order('created_at', { ascending: false });
  if (filters?.location_id) query = query.eq('location_id', filters.location_id);
  if (filters?.response_status) query = query.eq('response_status', filters.response_status);
  query = query.limit(filters?.limit || 100);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AimReview[];
}

async function getWorkflowPolicyRules(): Promise<WorkflowPolicyRule[]> {
  const { data, error } = await supabase
    .from('wf_policy_rules')
    .select('*')
    .order('rule_type');
  if (error) throw error;
  return data || [];
}

async function toggleWorkflowPolicyRule(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('wf_policy_rules')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function getAuditEvents(filters?: { target_type?: string; action?: string; limit?: number }): Promise<AuditEvent[]> {
  let query = supabase
    .from('wf_audit_events')
    .select('*')
    .order('created_at', { ascending: false });
  if (filters?.target_type) query = query.eq('target_type', filters.target_type);
  if (filters?.action) query = query.ilike('action', `%${filters.action}%`);
  query = query.limit(filters?.limit || 200);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function triggerPublishDispatcher(): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(`${supabaseUrl}/functions/v1/aim-publish-dispatcher`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

async function triggerReviewSync(locationId?: string): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/aim-review-sync${locationId ? `?location_id=${locationId}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${supabaseKey}` } });
  return res.json();
}

async function triggerKpiSnapshot(date?: string): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/aim-kpi-snapshot${date ? `?date=${date}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${supabaseKey}` } });
  return res.json();
}

async function triggerIntegrationHeartbeat(): Promise<Record<string, unknown>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(`${supabaseUrl}/functions/v1/aim-integration-heartbeat`, {
    headers: { Authorization: `Bearer ${supabaseKey}` },
  });
  return res.json();
}

export const n8nWorkflowService = {
  fireWorkflowEvent,
  queryOpenClaw,
  getWorkflowRuns,
  getExceptions,
  resolveException,
  getOperationalAlerts,
  acknowledgeAlert,
  resolveAlert,
  getKpiSnapshots,
  getIntegrationAccounts,
  getContentItems,
  createContentItem,
  getPublishJobs,
  getReviews,
  getWorkflowPolicyRules,
  toggleWorkflowPolicyRule,
  getAuditEvents,
  triggerPublishDispatcher,
  triggerReviewSync,
  triggerKpiSnapshot,
  triggerIntegrationHeartbeat,
};
