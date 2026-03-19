import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CHANNELS = ["Facebook", "Instagram", "LinkedIn", "Google Business Profile", "TikTok"];

function mockKpiMetrics(locationId: string, channel: string, date: string) {
  const seed = (locationId + channel + date).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  return {
    impressions: Math.round(rand(800, 8000)),
    reach: Math.round(rand(400, 4000)),
    engagement: Math.round(rand(20, 400)),
    clicks: Math.round(rand(10, 200)),
    leads: Math.round(rand(0, 15)),
    spend_cents: Math.round(rand(1500, 12000)),
    conversions: Math.round(rand(0, 8)),
    follower_delta: Math.round(rand(-2, 20)),
    avg_response_time_minutes: Math.round(rand(30, 480)),
    reviews_received: Math.round(rand(0, 3)),
    avg_rating: parseFloat((rand(3.5, 5.0)).toFixed(2)),
  };
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
    const targetDate = url.searchParams.get("date") || new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const correlationId = crypto.randomUUID();

    const { data: runRecord } = await supabase
      .from("aim_workflow_runs")
      .insert({
        workflow_name: "kpi.daily_snapshot",
        source_system: "cron",
        correlation_id: correlationId,
        environment: "production",
        status: "started",
        input_payload_json: { snapshot_date: targetDate },
      })
      .select()
      .single();

    const { data: locations, error: locError } = await supabase
      .from("aim_locations")
      .select("id, name, city")
      .eq("is_active", true);

    if (locError) throw locError;

    let inserted = 0;
    let skipped = 0;

    for (const location of locations || []) {
      for (const channel of CHANNELS) {
        const { data: existing } = await supabase
          .from("aim_kpi_daily_snapshots")
          .select("id")
          .eq("snapshot_date", targetDate)
          .eq("location_id", location.id)
          .eq("channel", channel)
          .eq("metric_name", "impressions")
          .maybeSingle();

        if (existing) { skipped++; continue; }

        const metrics = mockKpiMetrics(location.id, channel, targetDate);

        const rows = Object.entries(metrics).map(([metric_name, metric_value]) => ({
          snapshot_date: targetDate,
          location_id: location.id,
          channel,
          metric_name,
          metric_value,
          metadata_json: { source: "kpi_adapter_mock", generated_at: new Date().toISOString() },
        }));

        const { error: insertError } = await supabase.from("aim_kpi_daily_snapshots").insert(rows);
        if (!insertError) inserted += rows.length;
      }
    }

    await supabase.from("aim_audit_events").insert({
      actor_type: "system",
      action: "kpi.snapshot.created",
      target_type: "kpi_daily_snapshots",
      target_id: crypto.randomUUID(),
      correlation_id: correlationId,
      source_system: "kpi_snapshot_job",
      payload_json: { snapshot_date: targetDate, inserted, skipped },
    });

    const output = { snapshot_date: targetDate, locations_processed: locations?.length || 0, rows_inserted: inserted, rows_skipped: skipped };

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
