import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface HeartbeatResult {
  integration_id: string;
  provider: string;
  account_name: string;
  previous_status: string;
  new_status: string;
  degraded: boolean;
  token_expiry_warning: boolean;
}

function mockHeartbeat(provider: string, accountName: string): { ok: boolean; error?: string } {
  const degradedProviders = ["tiktok_business"];
  if (degradedProviders.includes(provider)) {
    return { ok: false, error: "API rate limit exceeded or token expired" };
  }
  return { ok: true };
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
    const now = new Date();
    const tokenWarningWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: runRecord } = await supabase
      .from("aim_workflow_runs")
      .insert({
        workflow_name: "integration.heartbeat",
        source_system: "cron",
        correlation_id: correlationId,
        environment: "production",
        status: "started",
        input_payload_json: { checked_at: now.toISOString() },
      })
      .select()
      .single();

    const { data: integrations, error: intError } = await supabase
      .from("aim_integration_accounts")
      .select("*")
      .neq("connection_status", "disabled");

    if (intError) throw intError;

    const results: HeartbeatResult[] = [];
    let degradedCount = 0;
    let tokenWarningCount = 0;

    for (const integration of integrations || []) {
      const heartbeat = mockHeartbeat(integration.provider, integration.account_name);
      const previousStatus = integration.connection_status;

      let newStatus = previousStatus;
      let tokenExpiryWarning = false;

      if (heartbeat.ok) {
        newStatus = "connected";
        await supabase.from("aim_integration_accounts").update({
          connection_status: "connected",
          last_successful_sync_at: now.toISOString(),
          last_error_message: null,
          updated_at: now.toISOString(),
        }).eq("id", integration.id);
      } else {
        newStatus = "degraded";
        degradedCount++;
        await supabase.from("aim_integration_accounts").update({
          connection_status: "degraded",
          last_error_at: now.toISOString(),
          last_error_message: heartbeat.error,
          updated_at: now.toISOString(),
        }).eq("id", integration.id);

        if (previousStatus === "connected") {
          await supabase.from("aim_operational_alerts").insert({
            alert_type: "integration_degraded",
            severity: "warning",
            title: `Integration degraded: ${integration.provider}`,
            message: `${integration.account_name} is no longer responding. Error: ${heartbeat.error}`,
            target_type: "integration_account",
            target_id: integration.id,
            status: "open",
          });
        }
      }

      if (integration.token_expires_at && integration.token_expires_at < tokenWarningWindow) {
        tokenExpiryWarning = true;
        tokenWarningCount++;
        await supabase.from("aim_operational_alerts").insert({
          alert_type: "token_expiry_warning",
          severity: "warning",
          title: `Token expiring soon: ${integration.provider}`,
          message: `${integration.account_name} token expires at ${integration.token_expires_at}. Please re-authenticate.`,
          target_type: "integration_account",
          target_id: integration.id,
          status: "open",
        });

        await supabase.from("aim_notification_events").insert({
          notification_type: "token_expiry_warning",
          target_channel: "app",
          payload_json: {
            integration_id: integration.id,
            provider: integration.provider,
            account_name: integration.account_name,
            expires_at: integration.token_expires_at,
            correlation_id: correlationId,
          },
          status: "pending",
        });
      }

      results.push({
        integration_id: integration.id,
        provider: integration.provider,
        account_name: integration.account_name,
        previous_status: previousStatus,
        new_status: newStatus,
        degraded: !heartbeat.ok,
        token_expiry_warning: tokenExpiryWarning,
      });
    }

    await supabase.from("aim_audit_events").insert({
      actor_type: "system",
      action: "integration.heartbeat.completed",
      target_type: "integration_accounts",
      target_id: crypto.randomUUID(),
      correlation_id: correlationId,
      source_system: "heartbeat_job",
      payload_json: {
        checked: results.length,
        degraded: degradedCount,
        token_warnings: tokenWarningCount,
      },
    });

    const output = {
      checked: results.length,
      healthy: results.filter((r) => r.new_status === "connected").length,
      degraded: degradedCount,
      token_warnings: tokenWarningCount,
      results,
    };

    if (runRecord) {
      await supabase.from("aim_workflow_runs").update({
        status: "completed",
        output_payload_json: output,
        completed_at: new Date().toISOString(),
      }).eq("id", runRecord.id);
    }

    return new Response(JSON.stringify({ success: true, correlation_id: correlationId, ...output }), {
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
