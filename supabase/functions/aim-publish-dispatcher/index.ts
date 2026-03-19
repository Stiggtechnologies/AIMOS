import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type PublishResult = {
  job_id: string;
  channel: string;
  status: string;
  external_post_id?: string;
  error?: string;
};

type AdapterResult = {
  success: boolean;
  external_post_id?: string;
  error?: string;
  response?: Record<string, unknown>;
};

async function callChannelAdapter(
  channel: string,
  _jobId: string,
  _contentItemId: string,
  _variantId: string | null,
  _locationId: string | null,
  _idempotencyKey: string
): Promise<AdapterResult> {
  const adapters: Record<string, () => AdapterResult> = {
    Facebook: () => ({
      success: true,
      external_post_id: `fb_${Date.now()}_mock`,
      response: { platform: "facebook", published: true },
    }),
    Instagram: () => ({
      success: true,
      external_post_id: `ig_${Date.now()}_mock`,
      response: { platform: "instagram", published: true },
    }),
    LinkedIn: () => ({
      success: true,
      external_post_id: `li_${Date.now()}_mock`,
      response: { platform: "linkedin", published: true },
    }),
    "Google Business Profile": () => ({
      success: true,
      external_post_id: `gbp_${Date.now()}_mock`,
      response: { platform: "gbp", published: true },
    }),
    TikTok: () => ({
      success: true,
      external_post_id: `tt_${Date.now()}_mock`,
      response: { platform: "tiktok", published: true },
    }),
  };

  const adapter = adapters[channel];
  if (!adapter) {
    return { success: false, error: `No adapter for channel: ${channel}` };
  }
  return adapter();
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

    const correlationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const windowEnd = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: runRecord } = await supabase
      .from("aim_workflow_runs")
      .insert({
        workflow_name: "publish.dispatcher",
        source_system: "cron",
        correlation_id: correlationId,
        environment: "production",
        status: "started",
        input_payload_json: { window_start: now, window_end: windowEnd },
      })
      .select()
      .single();

    const { data: dueJobs, error: jobsError } = await supabase
      .from("aim_publish_jobs")
      .select("*, aim_content_items(id, title, status, idempotency_key), aim_idempotency_keys(unique_key, status)")
      .in("status", ["queued", "due"])
      .lte("scheduled_for", windowEnd)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (jobsError) throw jobsError;

    const results: PublishResult[] = [];
    const skipped: string[] = [];

    for (const job of dueJobs || []) {
      const contentItem = job.aim_content_items as { status: string; idempotency_key: string } | null;
      const iKey = job.aim_idempotency_keys as { unique_key: string; status: string } | null;

      if (!contentItem || contentItem.status !== "approved") {
        skipped.push(job.id);
        continue;
      }

      if (iKey && iKey.status === "consumed") {
        await supabase
          .from("aim_publish_jobs")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        skipped.push(job.id);
        continue;
      }

      await supabase
        .from("aim_publish_jobs")
        .update({ status: "publishing", updated_at: new Date().toISOString() })
        .eq("id", job.id);

      const adapterResult = await callChannelAdapter(
        job.channel,
        job.id,
        job.content_item_id,
        job.content_variant_id,
        job.location_id,
        iKey?.unique_key || job.id
      );

      if (adapterResult.success) {
        await supabase.from("aim_publish_results").insert({
          publish_job_id: job.id,
          status: "success",
          external_post_id: adapterResult.external_post_id,
          response_payload_json: adapterResult.response || {},
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from("aim_publish_jobs")
          .update({ status: "published", updated_at: new Date().toISOString() })
          .eq("id", job.id);

        await supabase
          .from("aim_content_items")
          .update({ status: "published", updated_at: new Date().toISOString() })
          .eq("id", job.content_item_id);

        if (job.idempotency_key_id) {
          await supabase
            .from("aim_idempotency_keys")
            .update({ status: "consumed" })
            .eq("id", job.idempotency_key_id);
        }

        await supabase.from("aim_audit_events").insert({
          actor_type: "system",
          action: "publish.completed",
          target_type: "publish_job",
          target_id: job.id,
          correlation_id: correlationId,
          source_system: "publish_dispatcher",
          payload_json: {
            channel: job.channel,
            external_post_id: adapterResult.external_post_id,
            content_item_id: job.content_item_id,
          },
        });

        results.push({
          job_id: job.id,
          channel: job.channel,
          status: "published",
          external_post_id: adapterResult.external_post_id,
        });
      } else {
        const newRetryCount = (job.retry_count || 0) + 1;
        const isExhausted = newRetryCount >= (job.max_retries || 3);
        const newStatus = isExhausted ? "failed" : "queued";

        await supabase.from("aim_publish_results").insert({
          publish_job_id: job.id,
          status: "failure",
          error_payload_json: { error: adapterResult.error },
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from("aim_publish_jobs")
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            failure_reason: adapterResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await supabase.from("aim_workflow_exceptions").insert({
          workflow_name: "publish_job",
          workflow_run_id: runRecord?.id,
          source_system: "publish_dispatcher",
          severity: isExhausted ? "high" : "medium",
          root_cause: adapterResult.error || "adapter_failure",
          summary: `Publish failed for job ${job.id} on ${job.channel}`,
          details_json: { job_id: job.id, channel: job.channel, retry_count: newRetryCount, error: adapterResult.error },
          retry_attempts: newRetryCount,
          max_retries: job.max_retries || 3,
          status: isExhausted ? "escalated" : "open",
        });

        if (isExhausted) {
          await supabase.from("aim_operational_alerts").insert({
            alert_type: "retry_exhausted",
            severity: "error",
            title: `Publish failed after ${newRetryCount} retries`,
            message: `Channel: ${job.channel}. Error: ${adapterResult.error}`,
            target_type: "publish_job",
            target_id: job.id,
            status: "open",
          });
        }

        results.push({
          job_id: job.id,
          channel: job.channel,
          status: newStatus,
          error: adapterResult.error,
        });
      }
    }

    const output = {
      correlation_id: correlationId,
      jobs_processed: results.length,
      jobs_skipped: skipped.length,
      published: results.filter((r) => r.status === "published").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };

    if (runRecord) {
      await supabase
        .from("aim_workflow_runs")
        .update({
          status: "completed",
          output_payload_json: output,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id);
    }

    return new Response(JSON.stringify({ success: true, ...output }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
