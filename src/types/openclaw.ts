export type OpenClawActorType = 'user' | 'system';
export type OpenClawEnvironment = 'development' | 'staging' | 'production';
export type OpenClawApprovalType = 'content' | 'review' | 'policy_exception';
export type OpenClawSeverity = 'low' | 'medium' | 'high' | 'critical';
export type OpenClawExceptionStatus = 'open' | 'triaged' | 'retrying' | 'escalated';

export interface OpenClawActor {
  type: OpenClawActorType;
  id: string;
  role: string;
}

export interface OpenClawSource {
  channel: string;
  interface: string;
  environment: OpenClawEnvironment;
}

export interface OpenClawContext {
  location_ids?: string[];
  channel_ids?: string[];
  date_range?: {
    from?: string | null;
    to?: string | null;
  };
}

export interface OpenClawCommandEnvelope {
  command_name: string;
  correlation_id: string;
  actor: OpenClawActor;
  source: OpenClawSource;
  context?: OpenClawContext;
  input: Record<string, unknown>;
  requested_at: string;
}

export interface OpenClawAvailableAction {
  action: string;
  target_id?: string;
  label?: string;
}

export interface OpenClawTopItem {
  id: string;
  type: string;
  title: string;
  location_name?: string;
  channel_name?: string;
  risk_score?: number;
  due_at?: string;
  recommended_action?: string;
  [key: string]: unknown;
}

export interface OpenClawCommandError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface OpenClawCommandResponse {
  ok: boolean;
  correlation_id: string;
  command_name: string;
  summary?: string;
  counts?: Record<string, number>;
  top_items?: OpenClawTopItem[];
  available_actions?: OpenClawAvailableAction[];
  links?: Record<string, string>;
  data?: Record<string, unknown>;
  error?: OpenClawCommandError;
}

export type OpenClawCommandName =
  | 'get_pending_approvals_summary'
  | 'get_failed_workflows_summary'
  | 'get_review_sla_summary'
  | 'get_location_status_summary'
  | 'get_daily_kpi_summary'
  | 'safe_retry_publish_job'
  | 'safe_reschedule_content_item'
  | 'request_caption_variants'
  | 'request_review_reply_draft'
  | 'approve_item'
  | 'reject_item'
  | 'request_rewrite'
  | 'escalate_exception'
  | 'assign_owner'
  | 'get_content_item_detail'
  | 'get_review_detail'
  | 'get_exception_detail'
  | 'get_publish_job_detail'
  | 'get_approval_detail';

export interface GetPendingApprovalsSummaryInput {
  location_ids?: string[];
  approval_types?: OpenClawApprovalType[];
  include_overdue_only?: boolean;
}

export interface GetFailedWorkflowsSummaryInput {
  severity?: OpenClawSeverity[];
  time_window_hours?: number;
  status?: OpenClawExceptionStatus[];
}

export interface GetReviewSlaSummaryInput {
  location_ids?: string[];
  include_overdue_only?: boolean;
}

export interface GetLocationStatusSummaryInput {
  location_ids: string[];
}

export interface GetDailyKpiSummaryInput {
  date: string;
  location_ids?: string[];
  channel_ids?: string[];
}

export interface SafeRetryPublishJobInput {
  publish_job_id: string;
  reason: string;
}

export interface SafeRescheduleContentItemInput {
  content_item_id: string;
  new_scheduled_for: string;
  reason: string;
}

export interface RequestCaptionVariantsInput {
  content_item_id: string;
  channel_ids: string[];
  variant_count?: number;
  tone?: string;
  goal?: string;
}

export interface RequestReviewReplyDraftInput {
  review_id: string;
  tone?: string;
  draft_mode?: 'new' | 'regenerate';
}

export interface ApproveItemInput {
  approval_id: string;
  approval_type: OpenClawApprovalType;
  comment?: string;
}

export interface RejectItemInput {
  approval_id: string;
  approval_type: OpenClawApprovalType;
  comment: string;
}

export interface RequestRewriteInput {
  approval_id: string;
  instructions: string;
}

export interface EscalateExceptionInput {
  exception_id: string;
  reason: string;
}

export interface AssignOwnerInput {
  target_type: 'workflow_exception' | 'review' | 'content_item';
  target_id: string;
  owner_user_id: string;
}
