import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ArAggregatePayload {
  snapshot_date: string; // YYYY-MM-DD
  clinic_name: string;
  clinic_city: string;

  // Aggregate-only totals (no PHI)
  total_outstanding: number;

  // Optional: if you have bucket totals later
  current_0_30_days?: number;
  days_31_60?: number;
  days_61_90?: number;
  days_over_90?: number;

  payer_name?: string; // default "ALL"
  payer_type?: "WSIB" | "private" | "insurance" | "self-pay" | "other"; // default "other"

  risk_level?: "low" | "medium" | "high" | "critical";
  risk_reason?: string;
  recommended_action?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ArAggregatePayload = await req.json();

    if (!body.snapshot_date || !body.clinic_name || !body.clinic_city) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: snapshot_date, clinic_name, clinic_city" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof body.total_outstanding !== "number") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing/invalid total_outstanding (number)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find clinic by name and city (same pattern as import-revenue-report)
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id")
      .ilike("name", `%${body.clinic_name}%`)
      .ilike("city", `%${body.clinic_city}%`)
      .single();

    if (clinicError || !clinic) {
      return new Response(
        JSON.stringify({ success: false, error: `Clinic not found: ${body.clinic_name} in ${body.clinic_city}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payer_name = body.payer_name ?? "ALL";
    const payer_type = body.payer_type ?? "other";

    const current_0_30_days = body.current_0_30_days ?? body.total_outstanding;
    const days_31_60 = body.days_31_60 ?? 0;
    const days_61_90 = body.days_61_90 ?? 0;
    const days_over_90 = body.days_over_90 ?? 0;

    const risk_level = body.risk_level ?? "medium";
    const risk_reason = body.risk_reason ?? "Aggregate-only AR snapshot (no aging buckets provided).";
    const recommended_action = body.recommended_action ?? "Export AR aging buckets (CSV) to refine aging + risk.";

    const { data: inserted, error: insertError } = await supabase
      .from("accounts_receivable_aging")
      .insert({
        clinic_id: clinic.id,
        snapshot_date: body.snapshot_date,
        payer_name,
        payer_type,
        current_0_30_days,
        days_31_60,
        days_61_90,
        days_over_90,
        risk_level,
        risk_reason,
        recommended_action,
      })
      .select("id, clinic_id, snapshot_date, payer_name, total_outstanding")
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
