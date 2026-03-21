import { supabase } from '../lib/supabase';
import type {
  OpenClawCommandEnvelope,
  OpenClawCommandResponse,
  OpenClawCommandName,
  GetPendingApprovalsSummaryInput,
  GetFailedWorkflowsSummaryInput,
  GetReviewSlaSummaryInput,
  GetLocationStatusSummaryInput,
  GetDailyKpiSummaryInput,
  SafeRetryPublishJobInput,
  SafeRescheduleContentItemInput,
  RequestCaptionVariantsInput,
  RequestReviewReplyDraftInput,
  ApproveItemInput,
  RejectItemInput,
  RequestRewriteInput,
  EscalateExceptionInput,
  AssignOwnerInput,
} from '../types/openclaw';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeCorrelationId(): string {
  return `oc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function callOpenClaw(
  command_name: OpenClawCommandName,
  input: Record<string, unknown>,
  context?: OpenClawCommandEnvelope['context']
): Promise<OpenClawCommandResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  const envelope: OpenClawCommandEnvelope = {
    command_name,
    correlation_id: makeCorrelationId(),
    actor: {
      type: 'user',
      id: session?.user?.id ?? 'anonymous',
      role: 'operator',
    },
    source: {
      channel: 'webclient',
      interface: 'aim-os',
      environment: (import.meta.env.MODE === 'production' ? 'production' : 'development') as 'production' | 'development' | 'staging',
    },
    context: context ?? {},
    input,
    requested_at: new Date().toISOString(),
  };

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/openclaw/${command_name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
        Apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(envelope),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    return {
      ok: false,
      correlation_id: envelope.correlation_id,
      command_name,
      error: { code: `HTTP_${res.status}`, message: text },
    };
  }

  return res.json();
}

export const openclawCommandService = {
  getPendingApprovalsSummary(input: GetPendingApprovalsSummaryInput = {}) {
    return callOpenClaw('get_pending_approvals_summary', input as unknown as Record<string, unknown>);
  },

  getFailedWorkflowsSummary(input: GetFailedWorkflowsSummaryInput = {}) {
    return callOpenClaw('get_failed_workflows_summary', input as unknown as Record<string, unknown>);
  },

  getReviewSlaSummary(input: GetReviewSlaSummaryInput = {}) {
    return callOpenClaw('get_review_sla_summary', input as unknown as Record<string, unknown>);
  },

  getLocationStatusSummary(input: GetLocationStatusSummaryInput) {
    return callOpenClaw('get_location_status_summary', input as unknown as unknown as Record<string, unknown>);
  },

  getDailyKpiSummary(input: GetDailyKpiSummaryInput) {
    return callOpenClaw('get_daily_kpi_summary', input as unknown as Record<string, unknown>);
  },

  safeRetryPublishJob(input: SafeRetryPublishJobInput) {
    return callOpenClaw('safe_retry_publish_job', input as unknown as Record<string, unknown>);
  },

  safeRescheduleContentItem(input: SafeRescheduleContentItemInput) {
    return callOpenClaw('safe_reschedule_content_item', input as unknown as Record<string, unknown>);
  },

  requestCaptionVariants(input: RequestCaptionVariantsInput) {
    return callOpenClaw('request_caption_variants', input as unknown as Record<string, unknown>);
  },

  requestReviewReplyDraft(input: RequestReviewReplyDraftInput) {
    return callOpenClaw('request_review_reply_draft', input as unknown as Record<string, unknown>);
  },

  approveItem(input: ApproveItemInput) {
    return callOpenClaw('approve_item', input as unknown as Record<string, unknown>);
  },

  rejectItem(input: RejectItemInput) {
    return callOpenClaw('reject_item', input as unknown as Record<string, unknown>);
  },

  requestRewrite(input: RequestRewriteInput) {
    return callOpenClaw('request_rewrite', input as unknown as Record<string, unknown>);
  },

  escalateException(input: EscalateExceptionInput) {
    return callOpenClaw('escalate_exception', input as unknown as Record<string, unknown>);
  },

  assignOwner(input: AssignOwnerInput) {
    return callOpenClaw('assign_owner', input as unknown as Record<string, unknown>);
  },

  getContentItemDetail(id: string) {
    return callOpenClaw('get_content_item_detail', { id });
  },

  getReviewDetail(id: string) {
    return callOpenClaw('get_review_detail', { id });
  },

  getExceptionDetail(id: string) {
    return callOpenClaw('get_exception_detail', { id });
  },

  getPublishJobDetail(id: string) {
    return callOpenClaw('get_publish_job_detail', { id });
  },

  getApprovalDetail(id: string) {
    return callOpenClaw('get_approval_detail', { id });
  },
};
