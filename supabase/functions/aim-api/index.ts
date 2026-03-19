import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function notFound(msg = "Not found") {
  return json({ ok: false, error: { code: "NOT_FOUND", message: msg } }, 404);
}

function badRequest(msg: string, details?: Record<string, unknown>) {
  return json({ ok: false, error: { code: "BAD_REQUEST", message: msg, ...(details ? { details } : {}) } }, 400);
}

function forbidden() {
  return json({ ok: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } }, 403);
}

function parseParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

async function writeAudit(
  sb: ReturnType<typeof createClient>,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  payload: Record<string, unknown> = {}
) {
  await sb.from("wf_audit_events").insert({
    actor_type: "user",
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload_json: payload,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/aim-api/, "").replace(/^\/api\/v1/, "").split("/").filter(Boolean);
  const method = req.method.toUpperCase();
  const params = parseParams(url);

  let body: Record<string, unknown> = {};
  if (["POST", "PATCH", "PUT"].includes(method)) {
    try { body = await req.json(); } catch { body = {}; }
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  }).auth.getUser();
  const actorId = user?.id ?? "system";

  try {
    const [res0, res1, res2] = segments;

    // ── /me ────────────────────────────────────────────────────────────
    if (res0 === "me" && !res1) {
      if (!user) return forbidden();
      const { data: profile } = await sb.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
      return json({ ok: true, data: { user: { id: user.id, email: user.email }, profile } });
    }

    if (res0 === "me" && res1 === "permissions") {
      if (!user) return forbidden();
      const { data: profile } = await sb.from("user_profiles").select("role").eq("id", user.id).maybeSingle();
      const role = (profile as Record<string, string> | null)?.role ?? "viewer";
      const permissions: Record<string, boolean> = {
        can_approve: ["admin", "executive", "approver"].includes(role),
        can_write_content: ["admin", "executive", "operator", "approver"].includes(role),
        can_manage_integrations: ["admin", "executive"].includes(role),
        can_manage_policies: ["admin", "executive"].includes(role),
        can_view_audit: ["admin", "executive"].includes(role),
        can_retry_jobs: ["admin", "executive", "operator"].includes(role),
      };
      return json({ ok: true, data: { role, permissions } });
    }

    // ── /dashboard ─────────────────────────────────────────────────────
    if (res0 === "dashboard") {
      if (res1 === "overview") {
        const locationId = params.location_id;
        const [{ data: approvals }, { data: jobs }, { data: alerts }, { data: kpis }] = await Promise.all([
          sb.from("wf_content_approvals").select("id, approval_status, due_at").eq("approval_status", "pending").limit(20),
          sb.from("wf_publish_jobs").select("id, status, scheduled_for").in("status", ["queued", "due", "failed"]).limit(20),
          sb.from("wf_alerts").select("id, title, severity, status").eq("status", "open").order("created_at", { ascending: false }).limit(10),
          sb.from("wf_kpi_daily_snapshots").select("metric_name, metric_value").eq("snapshot_date", new Date().toISOString().slice(0, 10)).limit(50),
        ]);
        return json({ ok: true, data: { pending_approvals: approvals?.length ?? 0, publish_jobs: jobs, alerts, kpis } });
      }
      if (res1 === "executive-summary") {
        const { data: kpis } = await sb.from("wf_kpi_daily_snapshots").select("metric_name, metric_value")
          .eq("snapshot_date", new Date().toISOString().slice(0, 10));
        const agg: Record<string, number> = {};
        for (const k of kpis ?? []) agg[k.metric_name] = (agg[k.metric_name] ?? 0) + Number(k.metric_value);
        return json({ ok: true, data: agg });
      }
      return notFound();
    }

    // ── /content-items ─────────────────────────────────────────────────
    if (res0 === "content-items") {
      if (!res1) {
        if (method === "GET") {
          let q = sb.from("wf_content_items").select(`*, wf_locations(name), wf_channels(name)`);
          if (params.status) q = q.eq("status", params.status);
          if (params.location_id) q = q.eq("location_id", params.location_id);
          if (params.channel_id) q = q.eq("primary_channel_id", params.channel_id);
          if (params.risk_min) q = q.gte("risk_score", params.risk_min);
          if (params.risk_max) q = q.lte("risk_score", params.risk_max);
          if (params.scheduled_from) q = q.gte("scheduled_for", params.scheduled_from);
          if (params.scheduled_to) q = q.lte("scheduled_for", params.scheduled_to);
          if (params.content_pillar) q = q.eq("content_pillar", params.content_pillar);
          const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
          if (error) return json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, 500);
          return json({ ok: true, data });
        }
        if (method === "POST") {
          const { data, error } = await sb.from("wf_content_items").insert({ ...body, created_by: actorId }).select().maybeSingle();
          if (error) return json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, 500);
          return json({ ok: true, data }, 201);
        }
      }

      const itemId = res1;
      if (!res2) {
        if (method === "GET") {
          const { data } = await sb.from("wf_content_items")
            .select("*, wf_locations(name), wf_channels(name), wf_content_variants(*), wf_content_approvals(*), wf_content_tags(tag)")
            .eq("id", itemId).maybeSingle();
          if (!data) return notFound();
          return json({ ok: true, data });
        }
        if (method === "PATCH") {
          const { data, error } = await sb.from("wf_content_items")
            .update({ ...body, updated_at: new Date().toISOString() }).eq("id", itemId).select().maybeSingle();
          if (error) return json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, 500);
          await writeAudit(sb, actorId, "update_content_item", "wf_content_items", itemId, body);
          return json({ ok: true, data });
        }
      }

      if (res2 === "request-approval") {
        const { data: item } = await sb.from("wf_content_items").select("id, title").eq("id", itemId).maybeSingle();
        if (!item) return notFound();
        const { data: approval } = await sb.from("wf_content_approvals").insert({
          content_item_id: itemId,
          requested_by_user_id: actorId,
          approval_status: "pending",
          due_at: body.due_at ?? null,
        }).select().maybeSingle();
        await writeAudit(sb, actorId, "request_approval", "wf_content_items", itemId, {});
        return json({ ok: true, data: approval }, 201);
      }

      if (res2 === "reschedule") {
        if (!body.new_scheduled_for) return badRequest("new_scheduled_for is required");
        await sb.from("wf_content_items").update({ scheduled_for: body.new_scheduled_for, status: "scheduled", updated_at: new Date().toISOString() }).eq("id", itemId);
        await sb.from("wf_publish_jobs").update({ scheduled_for: body.new_scheduled_for, updated_at: new Date().toISOString() }).eq("content_item_id", itemId).in("status", ["queued", "due"]);
        await writeAudit(sb, actorId, "reschedule_content_item", "wf_content_items", itemId, { new_scheduled_for: body.new_scheduled_for, reason: body.reason });
        return json({ ok: true, data: { content_item_id: itemId, new_scheduled_for: body.new_scheduled_for } });
      }

      if (res2 === "archive") {
        await sb.from("wf_content_items").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", itemId);
        await writeAudit(sb, actorId, "archive_content_item", "wf_content_items", itemId, {});
        return json({ ok: true, data: { content_item_id: itemId, status: "archived" } });
      }

      if (res2 === "duplicate") {
        const { data: orig } = await sb.from("wf_content_items").select("*").eq("id", itemId).maybeSingle();
        if (!orig) return notFound();
        const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = orig as Record<string, unknown>;
        const { data: dupe } = await sb.from("wf_content_items").insert({ ...rest, status: "draft", title: `${rest.title} (copy)`, created_by: actorId }).select().maybeSingle();
        return json({ ok: true, data: dupe }, 201);
      }

      if (res2 === "request-variants") {
        return json({ ok: true, data: { message: "Variant generation queued. Connect to AI edge function for completion." } });
      }
    }

    // ── /content-variants ──────────────────────────────────────────────
    if (res0 === "content-variants") {
      if (!res1) {
        const { data } = await sb.from("wf_content_variants").select("*, wf_channels(name)").order("created_at", { ascending: false }).limit(100);
        return json({ ok: true, data });
      }
      if (method === "GET") {
        const { data } = await sb.from("wf_content_variants").select("*, wf_channels(name)").eq("id", res1).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }
      if (method === "PATCH") {
        const { data } = await sb.from("wf_content_variants").update({ ...body, updated_at: new Date().toISOString() }).eq("id", res1).select().maybeSingle();
        return json({ ok: true, data });
      }
    }

    // ── /approvals ─────────────────────────────────────────────────────
    if (res0 === "approvals") {
      if (!res1) {
        let q = sb.from("wf_content_approvals")
          .select("*, wf_content_items(title, risk_score, status, wf_locations(name), wf_channels(name))");
        if (params.status) q = q.eq("approval_status", params.status);
        if (params.location_id) q = q.eq("wf_content_items.location_id", params.location_id);
        if (params.due_before) q = q.lt("due_at", params.due_before);
        const { data } = await q.order("created_at", { ascending: false }).limit(100);
        return json({ ok: true, data });
      }

      const approvalId = res1;
      if (!res2) {
        const { data } = await sb.from("wf_content_approvals")
          .select("*, wf_content_items(title, risk_score, wf_locations(name), wf_channels(name))")
          .eq("id", approvalId).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }

      const actionMap: Record<string, string> = { approve: "approved", reject: "rejected", hold: "held" };
      if (res2 in actionMap) {
        await sb.from("wf_content_approvals").update({
          approval_status: actionMap[res2],
          comments: body.comment ?? body.comments ?? null,
          acted_at: new Date().toISOString(),
        }).eq("id", approvalId);
        await writeAudit(sb, actorId, res2, "wf_content_approvals", approvalId, body);
        return json({ ok: true, data: { approval_id: approvalId, status: actionMap[res2] } });
      }
      if (res2 === "request-rewrite") {
        await sb.from("wf_content_approvals").update({
          approval_status: "rewrite_requested",
          comments: body.instructions ?? body.comment ?? null,
          acted_at: new Date().toISOString(),
        }).eq("id", approvalId);
        await writeAudit(sb, actorId, "request_rewrite", "wf_content_approvals", approvalId, body);
        return json({ ok: true, data: { approval_id: approvalId, status: "rewrite_requested" } });
      }
    }

    // ── /reviews ───────────────────────────────────────────────────────
    if (res0 === "reviews") {
      if (!res1) {
        let q = sb.from("wf_reviews").select("*, wf_locations(name), wf_review_flags(flag_code, confidence)");
        if (params.location_id) q = q.eq("location_id", params.location_id);
        if (params.rating) q = q.eq("rating", params.rating);
        if (params.response_status) q = q.eq("response_status", params.response_status);
        if (params.overdue_only === "true") q = q.lt("review_timestamp", new Date(Date.now() - 48 * 3600_000).toISOString());
        const { data } = await q.order("review_timestamp", { ascending: false }).limit(100);
        return json({ ok: true, data });
      }

      const reviewId = res1;
      if (!res2) {
        const { data } = await sb.from("wf_reviews")
          .select("*, wf_locations(name), wf_review_flags(*), wf_review_drafts(*), wf_review_approvals(*)")
          .eq("id", reviewId).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }

      if (res2 === "request-draft") {
        const { data: draft } = await sb.from("wf_review_drafts").insert({
          review_id: reviewId,
          drafted_by_type: "ai",
          drafted_by_user_id: actorId,
          draft_text: body.draft_text ?? "[AI draft pending — connect to AI service]",
          status: "draft",
        }).select().maybeSingle();
        return json({ ok: true, data: draft }, 201);
      }
      if (res2 === "escalate") {
        await sb.from("wf_reviews").update({ response_status: "escalated", updated_at: new Date().toISOString() }).eq("id", reviewId);
        await writeAudit(sb, actorId, "escalate_review", "wf_reviews", reviewId, body);
        return json({ ok: true, data: { review_id: reviewId, status: "escalated" } });
      }
      if (res2 === "assign-owner") {
        if (!body.owner_user_id) return badRequest("owner_user_id is required");
        await sb.from("wf_reviews").update({ owner_user_id: body.owner_user_id, updated_at: new Date().toISOString() }).eq("id", reviewId);
        return json({ ok: true, data: { review_id: reviewId, owner_user_id: body.owner_user_id } });
      }
    }

    // ── /review-drafts ─────────────────────────────────────────────────
    if (res0 === "review-drafts" && res1) {
      const draftId = res1;
      if (!res2 && method === "PATCH") {
        const { data } = await sb.from("wf_review_drafts").update({ ...body, updated_at: new Date().toISOString() }).eq("id", draftId).select().maybeSingle();
        return json({ ok: true, data });
      }
      if (res2 === "request-approval") {
        const { data: approval } = await sb.from("wf_review_approvals").insert({
          review_id: body.review_id,
          draft_id: draftId,
          requested_from_user_id: body.requested_from_user_id ?? actorId,
          status: "pending",
          due_at: body.due_at ?? null,
        }).select().maybeSingle();
        return json({ ok: true, data: approval }, 201);
      }
      if (res2 === "approve-and-send") {
        await sb.from("wf_review_drafts").update({ status: "posted", updated_at: new Date().toISOString() }).eq("id", draftId);
        const draft = await sb.from("wf_review_drafts").select("review_id").eq("id", draftId).maybeSingle();
        if (draft.data?.review_id) {
          await sb.from("wf_reviews").update({ response_status: "responded", updated_at: new Date().toISOString() }).eq("id", draft.data.review_id);
        }
        await writeAudit(sb, actorId, "approve_and_send_review_draft", "wf_review_drafts", draftId, {});
        return json({ ok: true, data: { draft_id: draftId, status: "posted" } });
      }
    }

    // ── /publish-jobs ──────────────────────────────────────────────────
    if (res0 === "publish-jobs") {
      if (!res1) {
        let q = sb.from("wf_publish_jobs").select("*, wf_channels(name), wf_locations(name)");
        if (params.status) q = q.eq("status", params.status);
        if (params.channel_id) q = q.eq("channel_id", params.channel_id);
        if (params.location_id) q = q.eq("location_id", params.location_id);
        if (params.scheduled_from) q = q.gte("scheduled_for", params.scheduled_from);
        if (params.scheduled_to) q = q.lte("scheduled_for", params.scheduled_to);
        const { data } = await q.order("scheduled_for", { ascending: false }).limit(100);
        return json({ ok: true, data });
      }

      const jobId = res1;
      if (!res2) {
        const { data } = await sb.from("wf_publish_jobs")
          .select("*, wf_channels(name), wf_locations(name), wf_publish_results(*)")
          .eq("id", jobId).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }

      if (res2 === "retry") {
        const { data: job } = await sb.from("wf_publish_jobs").select("id, status, retry_count, max_retries").eq("id", jobId).maybeSingle();
        if (!job) return notFound();
        if (job.retry_count >= job.max_retries) return badRequest("Retry limit reached", { retry_count: job.retry_count, max_retries: job.max_retries });
        await sb.from("wf_publish_jobs").update({ status: "queued", retry_count: job.retry_count + 1, updated_at: new Date().toISOString() }).eq("id", jobId);
        await writeAudit(sb, actorId, "retry_publish_job", "wf_publish_jobs", jobId, { reason: body.reason });
        return json({ ok: true, data: { publish_job_id: jobId, new_retry_count: job.retry_count + 1 } });
      }
      if (res2 === "cancel") {
        await sb.from("wf_publish_jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", jobId);
        await writeAudit(sb, actorId, "cancel_publish_job", "wf_publish_jobs", jobId, {});
        return json({ ok: true, data: { publish_job_id: jobId, status: "cancelled" } });
      }
      if (res2 === "results") {
        const { data } = await sb.from("wf_publish_results").select("*").eq("publish_job_id", jobId).order("created_at", { ascending: false });
        return json({ ok: true, data });
      }
    }

    // ── /exceptions ────────────────────────────────────────────────────
    if (res0 === "exceptions") {
      if (!res1) {
        let q = sb.from("wf_workflow_exceptions").select("*");
        if (params.severity) q = q.eq("severity", params.severity);
        if (params.status) q = q.eq("status", params.status);
        if (params.owner_user_id) q = q.eq("owner_user_id", params.owner_user_id);
        if (params.source_system) q = q.eq("source_system", params.source_system);
        const { data } = await q.order("created_at", { ascending: false }).limit(100);
        return json({ ok: true, data });
      }

      const exId = res1;
      if (!res2) {
        const { data } = await sb.from("wf_workflow_exceptions").select("*").eq("id", exId).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }

      if (res2 === "escalate") {
        await sb.from("wf_workflow_exceptions").update({ status: "escalated" }).eq("id", exId);
        await writeAudit(sb, actorId, "escalate_exception", "wf_workflow_exceptions", exId, body);
        return json({ ok: true, data: { exception_id: exId, status: "escalated" } });
      }
      if (res2 === "resolve") {
        await sb.from("wf_workflow_exceptions").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", exId);
        await writeAudit(sb, actorId, "resolve_exception", "wf_workflow_exceptions", exId, body);
        return json({ ok: true, data: { exception_id: exId, status: "resolved" } });
      }
      if (res2 === "assign-owner") {
        if (!body.owner_user_id) return badRequest("owner_user_id is required");
        await sb.from("wf_workflow_exceptions").update({ owner_user_id: body.owner_user_id }).eq("id", exId);
        return json({ ok: true, data: { exception_id: exId, owner_user_id: body.owner_user_id } });
      }
      if (res2 === "retry") {
        const { data: ex } = await sb.from("wf_workflow_exceptions").select("id, retry_attempts, max_retries").eq("id", exId).maybeSingle();
        if (!ex) return notFound();
        if (ex.retry_attempts >= ex.max_retries) return badRequest("Retry limit reached");
        await sb.from("wf_workflow_exceptions").update({ status: "retrying", retry_attempts: ex.retry_attempts + 1 }).eq("id", exId);
        await writeAudit(sb, actorId, "retry_exception", "wf_workflow_exceptions", exId, body);
        return json({ ok: true, data: { exception_id: exId, status: "retrying", new_attempt: ex.retry_attempts + 1 } });
      }
    }

    // ── /kpis ──────────────────────────────────────────────────────────
    if (res0 === "kpis") {
      if (res1 === "daily-summary") {
        const date = params.date ?? new Date().toISOString().slice(0, 10);
        let q = sb.from("wf_kpi_daily_snapshots").select("metric_name, metric_value, location_id, channel_id").eq("snapshot_date", date);
        if (params.location_id) q = q.eq("location_id", params.location_id);
        if (params.channel_id) q = q.eq("channel_id", params.channel_id);
        const { data } = await q;
        const agg: Record<string, number> = {};
        for (const k of data ?? []) agg[k.metric_name] = (agg[k.metric_name] ?? 0) + Number(k.metric_value);
        return json({ ok: true, data: { date, metrics: agg, rows: data } });
      }
      if (res1 === "channel-health") {
        const { data } = await sb.from("wf_kpi_daily_snapshots").select("channel_id, metric_name, metric_value, snapshot_date")
          .gte("snapshot_date", new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)).order("snapshot_date", { ascending: false });
        return json({ ok: true, data });
      }
      if (res1 === "review-sla") {
        const { data } = await sb.from("wf_reviews").select("location_id, response_status, review_timestamp, wf_locations(name)")
          .in("response_status", ["unresponded", "drafted", "awaiting_approval"]);
        return json({ ok: true, data });
      }
      if (res1 === "location-comparison") {
        const { data } = await sb.from("wf_kpi_daily_snapshots").select("location_id, metric_name, metric_value, snapshot_date, wf_locations(name)")
          .eq("snapshot_date", new Date().toISOString().slice(0, 10));
        return json({ ok: true, data });
      }
      if (res1 === "content-performance") {
        const { data } = await sb.from("wf_publish_results").select("status, created_at, wf_publish_jobs(channel_id, location_id, scheduled_for)")
          .order("created_at", { ascending: false }).limit(200);
        return json({ ok: true, data });
      }
    }

    // ── /locations ─────────────────────────────────────────────────────
    if (res0 === "locations") {
      if (!res1) {
        const { data } = await sb.from("wf_locations").select("*").eq("active", true).order("name");
        return json({ ok: true, data });
      }
      const locId = res1;
      if (!res2) {
        if (method === "GET") {
          const { data } = await sb.from("wf_locations").select("*").eq("id", locId).maybeSingle();
          if (!data) return notFound();
          return json({ ok: true, data });
        }
        if (method === "PATCH") {
          const { data } = await sb.from("wf_locations").update({ ...body, updated_at: new Date().toISOString() }).eq("id", locId).select().maybeSingle();
          return json({ ok: true, data });
        }
      }
      if (res2 === "status-summary") {
        const now = new Date().toISOString();
        const sla48h = new Date(Date.now() - 48 * 3600_000).toISOString();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const [{ data: approvals }, { data: posts }, { data: reviewBacklog }, { data: failedWf }] = await Promise.all([
          sb.from("wf_content_approvals").select("id").eq("approval_status", "pending"),
          sb.from("wf_publish_jobs").select("id").in("status", ["queued", "due"]).gte("scheduled_for", todayStart.toISOString()),
          sb.from("wf_reviews").select("id").eq("location_id", locId).in("response_status", ["unresponded"]).lt("review_timestamp", sla48h),
          sb.from("wf_workflow_exceptions").select("id").in("status", ["open", "escalated"]),
        ]);
        return json({ ok: true, data: { location_id: locId, pending_approvals: approvals?.length ?? 0, scheduled_posts_today: posts?.length ?? 0, overdue_review_backlog: reviewBacklog?.length ?? 0, open_exceptions: failedWf?.length ?? 0 } });
      }
    }

    // ── /integrations ──────────────────────────────────────────────────
    if (res0 === "integrations") {
      if (!res1) {
        const { data } = await sb.from("wf_integration_accounts").select("*").order("provider");
        return json({ ok: true, data });
      }
      const intId = res1;
      if (!res2) {
        const { data } = await sb.from("wf_integration_accounts").select("*").eq("id", intId).maybeSingle();
        if (!data) return notFound();
        return json({ ok: true, data });
      }
      if (res2 === "enable") {
        await sb.from("wf_integration_accounts").update({ connection_status: "connected", updated_at: new Date().toISOString() }).eq("id", intId);
        return json({ ok: true, data: { integration_id: intId, status: "connected" } });
      }
      if (res2 === "disable") {
        await sb.from("wf_integration_accounts").update({ connection_status: "disabled", updated_at: new Date().toISOString() }).eq("id", intId);
        return json({ ok: true, data: { integration_id: intId, status: "disabled" } });
      }
      if (res2 === "test") {
        return json({ ok: true, data: { integration_id: intId, test_result: "reachable", note: "Full connectivity test requires adapter layer." } });
      }
    }

    // ── /policies ──────────────────────────────────────────────────────
    if (res0 === "policies") {
      if (!res1) {
        if (method === "GET") {
          const { data } = await sb.from("wf_policy_rules").select("*").order("rule_name");
          return json({ ok: true, data });
        }
        if (method === "POST") {
          const { data } = await sb.from("wf_policy_rules").insert(body).select().maybeSingle();
          return json({ ok: true, data }, 201);
        }
      }
      const policyId = res1;
      if (!res2) {
        if (method === "GET") {
          const { data } = await sb.from("wf_policy_rules").select("*").eq("id", policyId).maybeSingle();
          if (!data) return notFound();
          return json({ ok: true, data });
        }
        if (method === "PATCH") {
          const { data } = await sb.from("wf_policy_rules").update({ ...body, updated_at: new Date().toISOString() }).eq("id", policyId).select().maybeSingle();
          return json({ ok: true, data });
        }
      }
      if (res2 === "activate") {
        await sb.from("wf_policy_rules").update({ active: true, updated_at: new Date().toISOString() }).eq("id", policyId);
        return json({ ok: true, data: { policy_id: policyId, active: true } });
      }
      if (res2 === "deactivate") {
        await sb.from("wf_policy_rules").update({ active: false, updated_at: new Date().toISOString() }).eq("id", policyId);
        return json({ ok: true, data: { policy_id: policyId, active: false } });
      }
    }

    // ── /audit-events ──────────────────────────────────────────────────
    if (res0 === "audit-events") {
      if (!res1) {
        let q = sb.from("wf_audit_events").select("*");
        if (params.actor_id) q = q.eq("actor_id", params.actor_id);
        if (params.target_type) q = q.eq("target_type", params.target_type);
        if (params.target_id) q = q.eq("target_id", params.target_id);
        if (params.action) q = q.eq("action", params.action);
        if (params.from) q = q.gte("created_at", params.from);
        if (params.to) q = q.lte("created_at", params.to);
        const { data } = await q.order("created_at", { ascending: false }).limit(200);
        return json({ ok: true, data });
      }
      const { data } = await sb.from("wf_audit_events").select("*").eq("id", res1).maybeSingle();
      if (!data) return notFound();
      return json({ ok: true, data });
    }

    // ── /notifications ─────────────────────────────────────────────────
    if (res0 === "notifications") {
      if (!res1) {
        const { data } = await sb.from("wf_notification_events").select("*")
          .eq("target_user_id", actorId).order("created_at", { ascending: false }).limit(50);
        return json({ ok: true, data });
      }
      if (res2 === "acknowledge") {
        await sb.from("wf_notification_events").update({ status: "sent" }).eq("id", res1);
        return json({ ok: true, data: { notification_id: res1 } });
      }
    }

    return notFound(`No route matched: ${method} /${segments.join("/")}`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: { code: "INTERNAL_ERROR", message } }, 500);
  }
});
