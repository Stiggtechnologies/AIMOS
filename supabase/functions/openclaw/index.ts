import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errResp(
  correlation_id: string,
  command_name: string,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  available_actions?: { action: string; target_id?: string }[]
) {
  return json({
    ok: false,
    correlation_id,
    command_name,
    error: { code, message, ...(details ? { details } : {}) },
    ...(available_actions ? { available_actions } : {}),
  });
}

function okResp(
  correlation_id: string,
  command_name: string,
  payload: Record<string, unknown>
) {
  return json({ ok: true, correlation_id, command_name, ...payload });
}

interface Actor {
  type: string;
  id: string;
  role: string;
}

interface CommandEnvelope {
  command_name: string;
  correlation_id: string;
  actor: Actor;
  source: { channel: string; interface: string; environment: string };
  context?: {
    location_ids?: string[];
    channel_ids?: string[];
    date_range?: { from?: string | null; to?: string | null };
  };
  input: Record<string, unknown>;
  requested_at: string;
}

async function writeAuditEvent(
  sb: ReturnType<typeof createClient>,
  actor: Actor,
  action: string,
  target_type: string,
  target_id: string,
  payload: Record<string, unknown>
) {
  await sb.from("wf_audit_events").insert({
    actor_type: actor.type,
    actor_id: actor.id,
    action,
    target_type,
    target_id,
    payload_json: payload,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const command_name = segments[segments.length - 1];

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  let envelope: CommandEnvelope;
  try {
    envelope = await req.json();
  } catch {
    return errResp("", command_name, "INVALID_JSON", "Request body must be valid JSON");
  }

  const { correlation_id, actor, input } = envelope;

  if (!correlation_id || !actor?.id || !actor?.role) {
    return errResp(correlation_id ?? "", command_name, "MISSING_REQUIRED_FIELDS",
      "correlation_id, actor.id, and actor.role are required");
  }

  try {
    switch (command_name) {

      // ── READ: pending approvals summary ────────────────────────────────
      case "get_pending_approvals_summary": {
        const locationIds = input.location_ids as string[] | undefined;
        const includeOverdueOnly = input.include_overdue_only as boolean | undefined;
        const now = new Date().toISOString();

        let contentQ = sb
          .from("wf_content_approvals")
          .select(`id, content_item_id, approval_status, due_at, created_at,
                   wf_content_items!inner(title, location_id, risk_score, status,
                     wf_locations(name), wf_channels(name))`);

        contentQ = contentQ.in("approval_status", ["pending"]);
        if (locationIds?.length) {
          contentQ = contentQ.in("wf_content_items.location_id", locationIds);
        }
        if (includeOverdueOnly) {
          contentQ = contentQ.lt("due_at", now);
        }

        let reviewQ = sb
          .from("wf_review_approvals")
          .select("id, status, due_at, created_at, wf_reviews!inner(id, review_text, location_id, wf_locations(name))");
        reviewQ = reviewQ.eq("status", "pending");
        if (includeOverdueOnly) {
          reviewQ = reviewQ.lt("due_at", now);
        }

        const [{ data: contentApprovals }, { data: reviewApprovals }] = await Promise.all([
          contentQ,
          reviewQ,
        ]);

        const allItems: unknown[] = [];
        let overdue = 0;
        let highRisk = 0;

        for (const ca of contentApprovals ?? []) {
          const ci = (ca as Record<string, unknown>).wf_content_items as Record<string, unknown> | null;
          const isOverdue = ca.due_at && ca.due_at < now;
          const riskScore = (ci?.risk_score as number) ?? 0;
          if (isOverdue) overdue++;
          if (riskScore >= 7) highRisk++;
          allItems.push({
            id: ca.id,
            type: "content_approval",
            title: (ci?.title as string) ?? "Untitled",
            location_name: ((ci?.wf_locations as Record<string, unknown>)?.name as string) ?? null,
            channel_name: ((ci?.wf_channels as Record<string, unknown>)?.name as string) ?? null,
            risk_score: riskScore,
            due_at: ca.due_at,
            recommended_action: riskScore >= 7 ? "review_carefully" : "approve_or_rewrite",
          });
        }
        for (const ra of reviewApprovals ?? []) {
          const rv = (ra as Record<string, unknown>).wf_reviews as Record<string, unknown> | null;
          const isOverdue = ra.due_at && ra.due_at < now;
          if (isOverdue) overdue++;
          allItems.push({
            id: ra.id,
            type: "review_approval",
            title: `Review reply: ${((rv?.review_text as string) ?? "").slice(0, 60)}...`,
            location_name: ((rv?.wf_locations as Record<string, unknown>)?.name as string) ?? null,
            due_at: ra.due_at,
            recommended_action: "approve_or_rewrite",
          });
        }

        const topItems = allItems.slice(0, 5);
        const availableActions = topItems.map((item) => [
          { action: "approve_item", target_id: (item as Record<string, unknown>).id as string },
          { action: "request_rewrite", target_id: (item as Record<string, unknown>).id as string },
        ]).flat();

        return okResp(correlation_id, command_name, {
          summary: `You have ${allItems.length} pending approvals. ${overdue} are overdue. ${highRisk} are high risk.`,
          counts: { total: allItems.length, overdue, high_risk: highRisk },
          top_items: topItems,
          available_actions: availableActions,
        });
      }

      // ── READ: failed workflows summary ─────────────────────────────────
      case "get_failed_workflows_summary": {
        const severity = (input.severity as string[]) ?? ["low", "medium", "high", "critical"];
        const hours = (input.time_window_hours as number) ?? 24;
        const statuses = (input.status as string[]) ?? ["open", "retrying", "escalated"];
        const since = new Date(Date.now() - hours * 3600_000).toISOString();

        const { data: exceptions } = await sb
          .from("wf_workflow_exceptions")
          .select("id, workflow_name, severity, summary, root_cause, retry_attempts, max_retries, status, created_at, owner_user_id")
          .in("severity", severity)
          .in("status", statuses)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(50);

        const counts: Record<string, number> = { total: exceptions?.length ?? 0 };
        for (const ex of exceptions ?? []) {
          counts[ex.severity] = (counts[ex.severity] ?? 0) + 1;
        }

        const topItems = (exceptions ?? []).slice(0, 5).map((ex) => ({
          id: ex.id,
          type: "workflow_exception",
          title: ex.summary,
          severity: ex.severity,
          status: ex.status,
          retry_attempts: ex.retry_attempts,
          max_retries: ex.max_retries,
          recommended_action: ex.retry_attempts < ex.max_retries ? "retry" : "escalate",
        }));

        return okResp(correlation_id, command_name, {
          summary: `${counts.total} workflow exceptions in the last ${hours}h. Critical: ${counts.critical ?? 0}, High: ${counts.high ?? 0}.`,
          counts,
          top_items: topItems,
          available_actions: topItems.map((ex) => ({
            action: ex.recommended_action === "retry" ? "safe_retry" : "escalate_exception",
            target_id: ex.id,
          })),
        });
      }

      // ── READ: review SLA summary ────────────────────────────────────────
      case "get_review_sla_summary": {
        const locationIds = input.location_ids as string[] | undefined;
        const includeOverdueOnly = input.include_overdue_only as boolean | undefined;

        let q = sb
          .from("wf_reviews")
          .select("id, location_id, rating, response_status, review_timestamp, updated_at, wf_locations(name)")
          .in("response_status", ["unresponded", "drafted", "awaiting_approval"]);

        if (locationIds?.length) q = q.in("location_id", locationIds);

        const { data: reviews } = await q.order("review_timestamp", { ascending: true }).limit(200);

        const sla48h = new Date(Date.now() - 48 * 3600_000).toISOString();
        let overdue = 0;
        const byLocation: Record<string, { total: number; overdue: number; name: string }> = {};

        for (const r of reviews ?? []) {
          const locName = ((r.wf_locations as Record<string, unknown>)?.name as string) ?? r.location_id ?? "Unknown";
          if (!byLocation[r.location_id ?? "unknown"]) {
            byLocation[r.location_id ?? "unknown"] = { total: 0, overdue: 0, name: locName };
          }
          byLocation[r.location_id ?? "unknown"].total++;
          if (r.review_timestamp && r.review_timestamp < sla48h) {
            byLocation[r.location_id ?? "unknown"].overdue++;
            overdue++;
          }
        }

        const locations = Object.entries(byLocation).map(([loc_id, v]) => ({
          location_id: loc_id,
          location_name: v.name,
          pending: v.total,
          overdue: v.overdue,
          sla_met: v.overdue === 0,
        }));

        const filtered = includeOverdueOnly ? locations.filter((l) => l.overdue > 0) : locations;

        return okResp(correlation_id, command_name, {
          summary: `${reviews?.length ?? 0} reviews pending response. ${overdue} are overdue (>48h).`,
          counts: { total: reviews?.length ?? 0, overdue },
          data: { locations: filtered } as Record<string, unknown>,
        });
      }

      // ── READ: location status summary ───────────────────────────────────
      case "get_location_status_summary": {
        const locationIds = input.location_ids as string[];
        if (!locationIds?.length) {
          return errResp(correlation_id, command_name, "MISSING_LOCATION_IDS", "location_ids is required");
        }

        const now = new Date().toISOString();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
          { data: pendingApprovals },
          { data: scheduledPosts },
          { data: failedJobs },
          { data: overdueReviews },
          { data: integrations },
        ] = await Promise.all([
          sb.from("wf_content_approvals").select("id, wf_content_items!inner(location_id)")
            .eq("approval_status", "pending")
            .in("wf_content_items.location_id", locationIds),
          sb.from("wf_publish_jobs").select("id, location_id, scheduled_for")
            .in("status", ["queued", "due"])
            .in("location_id", locationIds)
            .gte("scheduled_for", todayStart.toISOString()),
          sb.from("wf_publish_jobs").select("id, location_id, status, failure_reason")
            .eq("status", "failed")
            .in("location_id", locationIds),
          sb.from("wf_reviews").select("id, location_id")
            .in("response_status", ["unresponded", "drafted"])
            .in("location_id", locationIds)
            .lt("review_timestamp", new Date(Date.now() - 48 * 3600_000).toISOString()),
          sb.from("wf_integration_accounts").select("id, provider, connection_status, location_id")
            .in("location_id", locationIds)
            .neq("connection_status", "connected"),
        ]);

        return okResp(correlation_id, command_name, {
          summary: `Status for ${locationIds.length} location(s). ${pendingApprovals?.length ?? 0} pending approvals, ${scheduledPosts?.length ?? 0} posts today.`,
          counts: {
            pending_approvals: pendingApprovals?.length ?? 0,
            scheduled_posts_today: scheduledPosts?.length ?? 0,
            failed_publish_jobs: failedJobs?.length ?? 0,
            overdue_reviews: overdueReviews?.length ?? 0,
            degraded_integrations: integrations?.length ?? 0,
          },
          data: {
            failed_jobs: (failedJobs ?? []).slice(0, 5),
            degraded_integrations: integrations ?? [],
          } as Record<string, unknown>,
        });
      }

      // ── READ: daily KPI summary ─────────────────────────────────────────
      case "get_daily_kpi_summary": {
        const date = (input.date as string) ?? new Date().toISOString().slice(0, 10);
        const locationIds = input.location_ids as string[] | undefined;
        const channelIds = input.channel_ids as string[] | undefined;

        let q = sb
          .from("wf_kpi_daily_snapshots")
          .select("metric_name, metric_value, location_id, channel_id")
          .eq("snapshot_date", date);

        if (locationIds?.length) q = q.in("location_id", locationIds);
        if (channelIds?.length) q = q.in("channel_id", channelIds);

        const { data: kpis } = await q;

        const agg: Record<string, number> = {};
        for (const kpi of kpis ?? []) {
          agg[kpi.metric_name] = (agg[kpi.metric_name] ?? 0) + Number(kpi.metric_value);
        }

        return okResp(correlation_id, command_name, {
          summary: `KPI summary for ${date}. ${Object.keys(agg).length} metrics tracked.`,
          counts: agg,
          data: { date, row_count: kpis?.length ?? 0 } as Record<string, unknown>,
        });
      }

      // ── WRITE: safe retry publish job ───────────────────────────────────
      case "safe_retry_publish_job": {
        const jobId = input.publish_job_id as string;
        const reason = (input.reason as string) ?? "manual retry";

        if (!jobId) return errResp(correlation_id, command_name, "MISSING_JOB_ID", "publish_job_id is required");

        const { data: job } = await sb
          .from("wf_publish_jobs")
          .select("id, status, retry_count, max_retries, idempotency_key_id")
          .eq("id", jobId)
          .maybeSingle();

        if (!job) return errResp(correlation_id, command_name, "JOB_NOT_FOUND", "Publish job not found", { publish_job_id: jobId });
        if (!["failed", "cancelled"].includes(job.status)) {
          return errResp(correlation_id, command_name, "JOB_NOT_RETRYABLE",
            `Job status is '${job.status}'. Only failed or cancelled jobs can be retried.`);
        }
        if (job.retry_count >= job.max_retries) {
          return errResp(correlation_id, command_name, "RETRY_LIMIT_EXCEEDED",
            "This publish job has already reached the retry limit.",
            { publish_job_id: jobId, retry_count: job.retry_count, max_retry_count: job.max_retries },
            [{ action: "escalate_exception", target_id: jobId }]
          );
        }

        const { error: updateErr } = await sb
          .from("wf_publish_jobs")
          .update({ status: "queued", retry_count: job.retry_count + 1, updated_at: new Date().toISOString() })
          .eq("id", jobId);

        if (updateErr) return errResp(correlation_id, command_name, "UPDATE_FAILED", updateErr.message);

        await writeAuditEvent(sb, actor, "safe_retry_publish_job", "wf_publish_jobs", jobId, { reason, previous_retry_count: job.retry_count });

        return okResp(correlation_id, command_name, {
          summary: `Publish job re-queued successfully. Retry ${job.retry_count + 1} of ${job.max_retries}.`,
          data: { publish_job_id: jobId, new_retry_count: job.retry_count + 1, max_retries: job.max_retries } as Record<string, unknown>,
          links: { web_ui: `/publish-jobs/${jobId}` },
        });
      }

      // ── WRITE: safe reschedule content item ─────────────────────────────
      case "safe_reschedule_content_item": {
        const itemId = input.content_item_id as string;
        const newTime = input.new_scheduled_for as string;
        const reason = (input.reason as string) ?? "manual reschedule";

        if (!itemId || !newTime) {
          return errResp(correlation_id, command_name, "MISSING_FIELDS", "content_item_id and new_scheduled_for are required");
        }

        const { data: item } = await sb
          .from("wf_content_items")
          .select("id, status, scheduled_for")
          .eq("id", itemId)
          .maybeSingle();

        if (!item) return errResp(correlation_id, command_name, "ITEM_NOT_FOUND", "Content item not found");
        if (["published", "publishing", "archived"].includes(item.status)) {
          return errResp(correlation_id, command_name, "ITEM_NOT_RESCHEDULABLE",
            `Cannot reschedule item with status '${item.status}'.`);
        }

        if (new Date(newTime) < new Date()) {
          return errResp(correlation_id, command_name, "INVALID_SCHEDULE_TIME", "New scheduled time must be in the future");
        }

        const { error: updateErr } = await sb
          .from("wf_content_items")
          .update({ scheduled_for: newTime, status: "scheduled", updated_at: new Date().toISOString() })
          .eq("id", itemId);

        if (updateErr) return errResp(correlation_id, command_name, "UPDATE_FAILED", updateErr.message);

        await sb.from("wf_publish_jobs")
          .update({ scheduled_for: newTime, status: "queued", updated_at: new Date().toISOString() })
          .eq("content_item_id", itemId)
          .in("status", ["queued", "due", "failed"]);

        await writeAuditEvent(sb, actor, "safe_reschedule_content_item", "wf_content_items", itemId, {
          reason,
          previous_scheduled_for: item.scheduled_for,
          new_scheduled_for: newTime,
        });

        return okResp(correlation_id, command_name, {
          summary: `Content item rescheduled to ${newTime}.`,
          data: { content_item_id: itemId, new_scheduled_for: newTime } as Record<string, unknown>,
          links: { web_ui: `/content/${itemId}` },
        });
      }

      // ── WRITE: approve item ─────────────────────────────────────────────
      case "approve_item": {
        const approvalId = input.approval_id as string;
        const approvalType = (input.approval_type as string) ?? "content";
        const comment = (input.comment as string) ?? "";

        if (!approvalId) return errResp(correlation_id, command_name, "MISSING_APPROVAL_ID", "approval_id is required");

        const table = approvalType === "review" ? "wf_review_approvals" : "wf_content_approvals";
        const statusField = approvalType === "review" ? "status" : "approval_status";

        const { data: approval } = await sb
          .from(table)
          .select(`id, ${statusField}`)
          .eq("id", approvalId)
          .maybeSingle();

        if (!approval) return errResp(correlation_id, command_name, "APPROVAL_NOT_FOUND", "Approval not found");
        const currentStatus = (approval as Record<string, string>)[statusField];
        if (currentStatus !== "pending") {
          return errResp(correlation_id, command_name, "APPROVAL_ALREADY_DECIDED",
            `Approval is already '${currentStatus}'.`);
        }

        const updatePayload: Record<string, string> = {
          [statusField]: "approved",
          acted_at: new Date().toISOString(),
        };
        if (comment) updatePayload.comments = comment;

        await sb.from(table).update(updatePayload).eq("id", approvalId);
        await writeAuditEvent(sb, actor, "approve_item", table, approvalId, { approval_type: approvalType, comment });

        return okResp(correlation_id, command_name, {
          summary: `${approvalType} approval approved successfully.`,
          data: { approval_id: approvalId, new_status: "approved" } as Record<string, unknown>,
        });
      }

      // ── WRITE: reject item ──────────────────────────────────────────────
      case "reject_item": {
        const approvalId = input.approval_id as string;
        const approvalType = (input.approval_type as string) ?? "content";
        const comment = input.comment as string;

        if (!approvalId || !comment) {
          return errResp(correlation_id, command_name, "MISSING_FIELDS", "approval_id and comment are required");
        }

        const table = approvalType === "review" ? "wf_review_approvals" : "wf_content_approvals";
        const statusField = approvalType === "review" ? "status" : "approval_status";

        await sb.from(table).update({ [statusField]: "rejected", comments: comment, acted_at: new Date().toISOString() }).eq("id", approvalId);
        await writeAuditEvent(sb, actor, "reject_item", table, approvalId, { approval_type: approvalType, comment });

        return okResp(correlation_id, command_name, {
          summary: `${approvalType} approval rejected.`,
          data: { approval_id: approvalId, new_status: "rejected" } as Record<string, unknown>,
        });
      }

      // ── WRITE: request rewrite ──────────────────────────────────────────
      case "request_rewrite": {
        const approvalId = input.approval_id as string;
        const instructions = input.instructions as string;

        if (!approvalId || !instructions) {
          return errResp(correlation_id, command_name, "MISSING_FIELDS", "approval_id and instructions are required");
        }

        await sb.from("wf_content_approvals").update({
          approval_status: "rewrite_requested",
          comments: instructions,
          acted_at: new Date().toISOString(),
        }).eq("id", approvalId);

        await writeAuditEvent(sb, actor, "request_rewrite", "wf_content_approvals", approvalId, { instructions });

        return okResp(correlation_id, command_name, {
          summary: "Rewrite requested. Item returned for editing.",
          data: { approval_id: approvalId, new_status: "rewrite_requested" } as Record<string, unknown>,
        });
      }

      // ── WRITE: escalate exception ───────────────────────────────────────
      case "escalate_exception": {
        const exceptionId = input.exception_id as string;
        const reason = input.reason as string;

        if (!exceptionId || !reason) {
          return errResp(correlation_id, command_name, "MISSING_FIELDS", "exception_id and reason are required");
        }

        const { data: ex } = await sb
          .from("wf_workflow_exceptions")
          .select("id, status")
          .eq("id", exceptionId)
          .maybeSingle();

        if (!ex) return errResp(correlation_id, command_name, "EXCEPTION_NOT_FOUND", "Exception not found");
        if (ex.status === "resolved") {
          return errResp(correlation_id, command_name, "ALREADY_RESOLVED", "Exception is already resolved");
        }

        await sb.from("wf_workflow_exceptions")
          .update({ status: "escalated" })
          .eq("id", exceptionId);

        await writeAuditEvent(sb, actor, "escalate_exception", "wf_workflow_exceptions", exceptionId, { reason });

        return okResp(correlation_id, command_name, {
          summary: "Exception escalated for admin review.",
          data: { exception_id: exceptionId, new_status: "escalated" } as Record<string, unknown>,
        });
      }

      // ── WRITE: assign owner ─────────────────────────────────────────────
      case "assign_owner": {
        const targetType = input.target_type as string;
        const targetId = input.target_id as string;
        const ownerUserId = input.owner_user_id as string;

        if (!targetType || !targetId || !ownerUserId) {
          return errResp(correlation_id, command_name, "MISSING_FIELDS", "target_type, target_id, and owner_user_id are required");
        }

        const tableMap: Record<string, string> = {
          workflow_exception: "wf_workflow_exceptions",
          review: "wf_reviews",
          content_item: "wf_content_items",
        };
        const table = tableMap[targetType];
        if (!table) return errResp(correlation_id, command_name, "INVALID_TARGET_TYPE", `Unknown target_type: ${targetType}`);

        await sb.from(table).update({ owner_user_id: ownerUserId }).eq("id", targetId);
        await writeAuditEvent(sb, actor, "assign_owner", table, targetId, { owner_user_id: ownerUserId });

        return okResp(correlation_id, command_name, {
          summary: `Owner assigned successfully.`,
          data: { target_type: targetType, target_id: targetId, owner_user_id: ownerUserId } as Record<string, unknown>,
        });
      }

      // ── DETAIL: content item ────────────────────────────────────────────
      case "get_content_item_detail": {
        const id = input.id as string;
        if (!id) return errResp(correlation_id, command_name, "MISSING_ID", "id is required");

        const { data: item } = await sb
          .from("wf_content_items")
          .select(`*, wf_locations(name), wf_channels(name),
                   wf_content_variants(*), wf_content_approvals(*), wf_content_tags(tag)`)
          .eq("id", id)
          .maybeSingle();

        if (!item) return errResp(correlation_id, command_name, "NOT_FOUND", "Content item not found");

        return okResp(correlation_id, command_name, {
          summary: `Content item: ${(item as Record<string, unknown>).title}`,
          data: item as unknown as Record<string, unknown>,
          available_actions: [
            { action: "request_rewrite", target_id: id },
            { action: "safe_reschedule_content_item", target_id: id },
          ],
          links: { web_ui: `/content/${id}` },
        });
      }

      // ── DETAIL: review ──────────────────────────────────────────────────
      case "get_review_detail": {
        const id = input.id as string;
        if (!id) return errResp(correlation_id, command_name, "MISSING_ID", "id is required");

        const { data: review } = await sb
          .from("wf_reviews")
          .select(`*, wf_locations(name), wf_review_flags(*), wf_review_drafts(*), wf_review_approvals(*)`)
          .eq("id", id)
          .maybeSingle();

        if (!review) return errResp(correlation_id, command_name, "NOT_FOUND", "Review not found");

        return okResp(correlation_id, command_name, {
          summary: `Review from ${(review as Record<string, unknown>).author_name ?? "Unknown"}: rating ${(review as Record<string, unknown>).rating}/5`,
          data: review as unknown as Record<string, unknown>,
          available_actions: [
            { action: "request_review_reply_draft", target_id: id },
            { action: "escalate", target_id: id },
          ],
          links: { web_ui: `/reviews/${id}` },
        });
      }

      // ── DETAIL: exception ───────────────────────────────────────────────
      case "get_exception_detail": {
        const id = input.id as string;
        if (!id) return errResp(correlation_id, command_name, "MISSING_ID", "id is required");

        const { data: ex } = await sb
          .from("wf_workflow_exceptions")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!ex) return errResp(correlation_id, command_name, "NOT_FOUND", "Exception not found");

        const canRetry = (ex as Record<string, unknown>).retry_attempts < (ex as Record<string, unknown>).max_retries;

        return okResp(correlation_id, command_name, {
          summary: `Exception: ${(ex as Record<string, unknown>).summary}`,
          data: ex as unknown as Record<string, unknown>,
          available_actions: [
            ...(canRetry ? [{ action: "safe_retry", target_id: id }] : []),
            { action: "escalate_exception", target_id: id },
            { action: "assign_owner", target_id: id },
          ],
          links: { web_ui: `/exceptions/${id}` },
        });
      }

      // ── DETAIL: publish job ─────────────────────────────────────────────
      case "get_publish_job_detail": {
        const id = input.id as string;
        if (!id) return errResp(correlation_id, command_name, "MISSING_ID", "id is required");

        const { data: job } = await sb
          .from("wf_publish_jobs")
          .select("*, wf_channels(name), wf_locations(name), wf_publish_results(*)")
          .eq("id", id)
          .maybeSingle();

        if (!job) return errResp(correlation_id, command_name, "NOT_FOUND", "Publish job not found");

        const canRetry = ["failed", "cancelled"].includes((job as Record<string, unknown>).status as string)
          && (job as Record<string, unknown>).retry_count < (job as Record<string, unknown>).max_retries;

        return okResp(correlation_id, command_name, {
          summary: `Publish job status: ${(job as Record<string, unknown>).status}`,
          data: job as unknown as Record<string, unknown>,
          available_actions: canRetry ? [{ action: "safe_retry_publish_job", target_id: id }] : [],
          links: { web_ui: `/publish-jobs/${id}` },
        });
      }

      // ── DETAIL: approval ────────────────────────────────────────────────
      case "get_approval_detail": {
        const id = input.id as string;
        if (!id) return errResp(correlation_id, command_name, "MISSING_ID", "id is required");

        const { data: ca } = await sb
          .from("wf_content_approvals")
          .select("*, wf_content_items(title, risk_score, status, wf_locations(name), wf_channels(name))")
          .eq("id", id)
          .maybeSingle();

        if (!ca) return errResp(correlation_id, command_name, "NOT_FOUND", "Approval not found");
        const isPending = (ca as Record<string, unknown>).approval_status === "pending";

        return okResp(correlation_id, command_name, {
          summary: `Approval status: ${(ca as Record<string, unknown>).approval_status}`,
          data: ca as unknown as Record<string, unknown>,
          available_actions: isPending ? [
            { action: "approve_item", target_id: id },
            { action: "reject_item", target_id: id },
            { action: "request_rewrite", target_id: id },
          ] : [],
          links: { web_ui: `/approvals/${id}` },
        });
      }

      // ── Unknown command ─────────────────────────────────────────────────
      default:
        return errResp(correlation_id, command_name, "UNKNOWN_COMMAND",
          `Command '${command_name}' is not recognized. Check /api/v1/openclaw docs.`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errResp(correlation_id, command_name, "INTERNAL_ERROR", message);
  }
});
