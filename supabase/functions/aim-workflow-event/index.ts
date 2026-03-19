import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WorkflowEventPayload {
  event_type: string;
  correlation_id: string;
  actor_type: "user" | "system" | "n8n" | "openclaw";
  actor_id?: string;
  source: string;
  environment: string;
  target_type: string;
  target_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "POST") {
      const body: WorkflowEventPayload = await req.json();

      const {
        event_type,
        correlation_id,
        actor_type,
        actor_id,
        source,
        environment,
        target_type,
        target_id,
        payload,
        timestamp,
      } = body;

      if (!event_type || !correlation_id || !target_type || !target_id) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: event_type, correlation_id, target_type, target_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: workflowRun, error: runError } = await supabase
        .from("aim_workflow_runs")
        .insert({
          workflow_name: event_type,
          source_system: source || "app",
          correlation_id,
          environment: environment || "production",
          status: "started",
          input_payload_json: payload || {},
        })
        .select()
        .single();

      if (runError) throw runError;

      const { error: auditError } = await supabase
        .from("aim_audit_events")
        .insert({
          actor_type: actor_type || "system",
          actor_id: actor_id || null,
          action: event_type,
          target_type,
          target_id,
          correlation_id,
          source_system: source || "app",
          environment: environment || "production",
          payload_json: { ...payload, workflow_run_id: workflowRun.id, timestamp },
        });

      if (auditError) throw auditError;

      let result: Record<string, unknown> = { workflow_run_id: workflowRun.id };

      switch (event_type) {
        case "content.item.created": {
          const { data: policyRules } = await supabase
            .from("aim_workflow_policy_rules")
            .select("*")
            .eq("active", true)
            .eq("rule_type", "content_approval");

          const riskScore = (payload as { risk_score?: number }).risk_score || 0;
          const threshold = (policyRules?.[0]?.rule_config_json as { risk_score_threshold?: number })?.risk_score_threshold || 7.0;
          const requiresApproval = riskScore >= threshold;

          if (requiresApproval) {
            await supabase.from("aim_content_approval_requests").insert({
              content_item_id: target_id,
              requested_by_user_id: actor_id || null,
              approval_status: "pending",
              due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
            await supabase
              .from("aim_content_items")
              .update({ status: "awaiting_approval", updated_at: new Date().toISOString() })
              .eq("id", target_id);
          } else {
            await supabase
              .from("aim_content_items")
              .update({ status: "approved", updated_at: new Date().toISOString() })
              .eq("id", target_id);
          }

          await supabase.from("aim_notification_events").insert({
            notification_type: requiresApproval ? "approval_requested" : "content_ready",
            target_user_id: actor_id || null,
            target_channel: "app",
            payload_json: {
              content_item_id: target_id,
              requires_approval: requiresApproval,
              risk_score: riskScore,
              correlation_id,
            },
            status: "pending",
          });

          result = { ...result, requires_approval: requiresApproval, risk_score: riskScore };
          break;
        }

        case "content.approval.decided": {
          const decision = (payload as { decision?: string }).decision;
          const comments = (payload as { comments?: string }).comments;

          if (!decision) {
            return new Response(
              JSON.stringify({ error: "Missing decision in payload" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const statusMap: Record<string, string> = {
            approved: "approved",
            rejected: "held",
            rewrite_requested: "draft",
          };

          const newStatus = statusMap[decision] || "held";
          await supabase
            .from("aim_content_items")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", target_id);

          await supabase.from("aim_notification_events").insert({
            notification_type: "approval_decided",
            target_channel: "app",
            payload_json: {
              content_item_id: target_id,
              decision,
              comments,
              new_status: newStatus,
              correlation_id,
            },
            status: "pending",
          });

          result = { ...result, decision, new_status: newStatus };
          break;
        }

        case "publish.job.failed": {
          const retryCount = (payload as { retry_count?: number }).retry_count || 0;
          const maxRetries = (payload as { max_retries?: number }).max_retries || 3;
          const failureReason = (payload as { failure_reason?: string }).failure_reason || "unknown";

          const isExhausted = retryCount >= maxRetries;
          const severity = isExhausted ? "high" : "medium";

          await supabase.from("aim_workflow_exceptions").insert({
            workflow_name: "publish_job",
            workflow_run_id: workflowRun.id,
            source_system: source || "publish_worker",
            severity,
            root_cause: failureReason,
            summary: `Publish job failed for ${target_type} ${target_id}`,
            details_json: payload,
            retry_attempts: retryCount,
            max_retries: maxRetries,
            status: isExhausted ? "escalated" : "open",
          });

          if (isExhausted) {
            await supabase.from("aim_operational_alerts").insert({
              alert_type: "retry_exhausted",
              severity: "error",
              title: "Publish retry exhausted",
              message: `Publish job for ${target_type} ${target_id} has exhausted all retries. Reason: ${failureReason}`,
              target_type,
              target_id,
              status: "open",
            });
          }

          result = { ...result, is_exhausted: isExhausted, exception_created: true };
          break;
        }

        case "review.received": {
          const rating = (payload as { rating?: number }).rating || 5;
          let severity_score = 0;
          const flags: string[] = [];

          if (rating === 1) { severity_score = 9.0; flags.push("one_star_review"); }
          else if (rating === 2) { severity_score = 6.0; flags.push("low_rating"); }
          else if (rating >= 4) { severity_score = 1.0; }

          const reviewText = ((payload as { review_text?: string }).review_text || "").toLowerCase();
          const legalKeywords = ["lawyer", "legal", "sue", "privacy", "human rights", "court"];
          const medicalKeywords = ["worse", "pain increased", "injured", "harm", "negligent"];
          const billingKeywords = ["overcharged", "billing", "refund", "fraud", "scam"];

          if (legalKeywords.some((k) => reviewText.includes(k))) {
            severity_score = 10.0;
            flags.push("legal_threat");
          }
          if (medicalKeywords.some((k) => reviewText.includes(k))) {
            severity_score = Math.max(severity_score, 8.5);
            flags.push("clinical_concern");
          }
          if (billingKeywords.some((k) => reviewText.includes(k))) {
            severity_score = Math.max(severity_score, 7.0);
            flags.push("billing_complaint");
          }

          await supabase
            .from("aim_reviews")
            .update({ severity_score, updated_at: new Date().toISOString() })
            .eq("id", target_id);

          for (const flag of flags) {
            await supabase.from("aim_review_flags").insert({
              review_id: target_id,
              flag_code: flag,
              confidence: 0.9,
            });
          }

          const requiresEscalation = severity_score >= 9.0;
          if (requiresEscalation) {
            await supabase
              .from("aim_reviews")
              .update({ response_status: "escalated", updated_at: new Date().toISOString() })
              .eq("id", target_id);

            await supabase.from("aim_operational_alerts").insert({
              alert_type: "review_escalation",
              severity: "critical",
              title: "Critical review requires immediate attention",
              message: `Review flagged for: ${flags.join(", ")}. Rating: ${rating}/5`,
              target_type: "review",
              target_id,
              status: "open",
            });
          }

          result = { ...result, severity_score, flags, requires_escalation: requiresEscalation };
          break;
        }

        case "integration.auth.failed": {
          const provider = (payload as { provider?: string }).provider || "unknown";

          await supabase
            .from("aim_integration_accounts")
            .update({
              connection_status: "auth_required",
              last_error_at: new Date().toISOString(),
              last_error_message: "Authentication failed or token expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", target_id);

          await supabase.from("aim_operational_alerts").insert({
            alert_type: "auth_failure",
            severity: "error",
            title: `Integration auth failed: ${provider}`,
            message: `The ${provider} integration requires re-authentication. Publishing may be blocked.`,
            target_type: "integration_account",
            target_id,
            status: "open",
          });

          result = { ...result, provider, alert_created: true };
          break;
        }

        default:
          result = { ...result, event_type, message: "Event logged, no specific handler" };
      }

      await supabase
        .from("aim_workflow_runs")
        .update({
          status: "completed",
          output_payload_json: result,
          completed_at: new Date().toISOString(),
        })
        .eq("id", workflowRun.id);

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET" && path) {
      switch (path) {
        case "pending-approvals": {
          const { data, error } = await supabase
            .from("aim_content_approval_requests")
            .select("*, aim_content_items(id, title, status, risk_score, location_id, aim_locations(name, city))")
            .eq("approval_status", "pending")
            .order("created_at", { ascending: true });

          if (error) throw error;
          return new Response(
            JSON.stringify({
              summary: "Pending content approvals",
              count: data.length,
              items: data,
              safe_actions: ["approve_content", "reject_content", "request_rewrite"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case "failed-workflows": {
          const { data, error } = await supabase
            .from("aim_workflow_exceptions")
            .select("*")
            .in("status", ["open", "escalated"])
            .order("created_at", { ascending: false })
            .limit(50);

          if (error) throw error;
          const critical = data.filter((e) => e.severity === "critical").length;
          const high = data.filter((e) => e.severity === "high").length;
          return new Response(
            JSON.stringify({
              summary: "Failed workflow exceptions",
              count: data.length,
              critical,
              high,
              top_items: data.slice(0, 10),
              safe_actions: ["retry_workflow", "escalate_exception", "resolve_exception"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case "review-sla": {
          const slaHours = 24;
          const slaThreshold = new Date(Date.now() - slaHours * 60 * 60 * 1000).toISOString();
          const { data, error } = await supabase
            .from("aim_reviews")
            .select("*, aim_locations(name, city)")
            .in("response_status", ["unresponded", "drafted"])
            .lt("created_at", slaThreshold)
            .order("created_at", { ascending: true });

          if (error) throw error;
          return new Response(
            JSON.stringify({
              summary: `Reviews breaching ${slaHours}h SLA`,
              count: data.length,
              sla_hours: slaHours,
              top_items: data.slice(0, 10),
              safe_actions: ["draft_review_reply", "escalate_review"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case "location-status": {
          const { data: locations, error: locError } = await supabase
            .from("aim_locations")
            .select("id, name, city")
            .eq("is_active", true);

          if (locError) throw locError;

          const { data: integrations } = await supabase
            .from("aim_integration_accounts")
            .select("location_id, provider, connection_status");

          const { data: openAlerts } = await supabase
            .from("aim_operational_alerts")
            .select("target_id, severity")
            .eq("status", "open");

          const locationStatus = locations?.map((loc) => {
            const locIntegrations = integrations?.filter((i) => i.location_id === loc.id) || [];
            const locAlerts = openAlerts?.filter((a) => a.target_id === loc.id) || [];
            const hasAuthIssue = locIntegrations.some((i) =>
              ["auth_required", "disconnected", "degraded"].includes(i.connection_status)
            );
            return {
              ...loc,
              integration_count: locIntegrations.length,
              healthy_integrations: locIntegrations.filter((i) => i.connection_status === "connected").length,
              has_auth_issue: hasAuthIssue,
              open_alerts: locAlerts.length,
              critical_alerts: locAlerts.filter((a) => a.severity === "critical").length,
            };
          });

          return new Response(
            JSON.stringify({
              summary: "Location operational status",
              count: locations?.length || 0,
              locations: locationStatus,
              safe_actions: ["reconnect_integration", "view_location_alerts"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        case "daily-kpi": {
          const today = new Date().toISOString().split("T")[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

          const { data, error } = await supabase
            .from("aim_kpi_daily_snapshots")
            .select("*, aim_locations(name, city)")
            .in("snapshot_date", [today, yesterday])
            .order("snapshot_date", { ascending: false });

          if (error) throw error;
          return new Response(
            JSON.stringify({
              summary: "Daily KPI snapshot",
              date: today,
              count: data.length,
              snapshots: data,
              safe_actions: ["export_kpi_report"],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: "Unknown endpoint" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
