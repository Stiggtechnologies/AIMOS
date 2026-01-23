import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReportMetadata {
  period_start: string;
  period_end: string;
  clinic_name: string;
  clinic_city: string;
}

interface OverallMetrics {
  total_revenue: number;
  total_visits: number;
  total_items?: number;
  total_hours?: number;
  unique_clients?: number;
  revenue_per_visit?: number;
  revenue_per_hour?: number;
  operating_margin_percent?: number;
}

interface PayerMix {
  wsib_percent?: number;
  private_insurance_percent?: number;
  mva_percent?: number;
  patient_direct_percent?: number;
  other_percent?: number;
}

interface ServiceLine {
  service_line: string;
  service_category: string;
  total_revenue: number;
  revenue_percent?: number;
  total_visits: number;
  billable_hours?: number;
  revenue_per_visit?: number;
  revenue_per_hour?: number;
  direct_costs?: number;
  allocated_overhead?: number;
  gross_margin_percent?: number;
  contribution_margin_percent?: number;
  capacity_utilization_percent?: number;
  growth_rate_percent?: number;
  trend_direction?: string;
  performance_tier?: string;
  strategic_priority?: string;
}

interface RevenueReport {
  report_metadata: ReportMetadata;
  overall_metrics: OverallMetrics;
  payer_mix?: PayerMix;
  service_lines: ServiceLine[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const report: RevenueReport = await req.json();

    // Validate required fields
    if (!report.report_metadata || !report.overall_metrics || !report.service_lines) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: report_metadata, overall_metrics, or service_lines",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find clinic by name and city
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id")
      .ilike("name", `%${report.report_metadata.clinic_name}%`)
      .ilike("city", `%${report.report_metadata.clinic_city}%`)
      .single();

    if (clinicError || !clinic) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Clinic not found: ${report.report_metadata.clinic_name} in ${report.report_metadata.clinic_city}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clinic_id = clinic.id;

    // Calculate auto-fill values
    const metrics = report.overall_metrics;
    const revenue_per_visit = metrics.revenue_per_visit ||
      (metrics.total_visits > 0 ? metrics.total_revenue / metrics.total_visits : 0);
    const revenue_per_hour = metrics.revenue_per_hour ||
      (metrics.total_hours && metrics.total_hours > 0 ? metrics.total_revenue / metrics.total_hours : 0);

    // Calculate payer mix total
    const payer = report.payer_mix || {};
    const wsib_percent = payer.wsib_percent || 0;
    const private_percent = payer.private_insurance_percent || 0;
    const mva_percent = payer.mva_percent || 0;
    const patient_percent = payer.patient_direct_percent || 0;
    const other_percent = payer.other_percent ||
      Math.max(0, 100 - wsib_percent - private_percent - mva_percent - patient_percent);

    // Insert clinic financial metrics
    const { error: metricsError } = await supabase
      .from("clinic_financial_metrics")
      .insert({
        clinic_id,
        period_start: report.report_metadata.period_start,
        period_end: report.report_metadata.period_end,
        total_revenue: metrics.total_revenue,
        total_visits: metrics.total_visits,
        revenue_per_visit,
        total_clinician_hours: metrics.total_hours || 0,
        revenue_per_clinician_hour: revenue_per_hour,
        operating_margin_percent: metrics.operating_margin_percent || 0,
        variance_vs_prior_period_percent: 0,
        variance_vs_budget_percent: 0,
        payer_mix_wsib_percent: wsib_percent,
        payer_mix_private_percent: private_percent + mva_percent + patient_percent,
        payer_mix_other_percent: other_percent,
        trend_direction: "stable",
        alert_flag: false,
        alert_message: `Imported from API on ${new Date().toISOString().split('T')[0]}. ${metrics.unique_clients || 0} unique clients.`,
      });

    if (metricsError) {
      console.error("Metrics insert error:", metricsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to insert metrics: ${metricsError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert service lines
    const serviceLineInserts = report.service_lines.map((sl) => {
      const avg_visits_per_day = sl.total_visits / 21; // Assuming ~21 working days per month

      return {
        clinic_id,
        period_start: report.report_metadata.period_start,
        period_end: report.report_metadata.period_end,
        service_line: sl.service_line,
        service_category: sl.service_category,
        total_visits: sl.total_visits,
        total_billable_hours: sl.billable_hours || 0,
        average_visits_per_day: avg_visits_per_day,
        total_revenue: sl.total_revenue,
        revenue_per_visit: sl.revenue_per_visit || (sl.total_visits > 0 ? sl.total_revenue / sl.total_visits : 0),
        revenue_per_hour: sl.revenue_per_hour || (sl.billable_hours && sl.billable_hours > 0 ? sl.total_revenue / sl.billable_hours : 0),
        direct_costs: sl.direct_costs || 0,
        allocated_overhead: sl.allocated_overhead || 0,
        gross_margin_percent: sl.gross_margin_percent || 0,
        contribution_margin_percent: sl.contribution_margin_percent || 0,
        capacity_utilization_percent: sl.capacity_utilization_percent || 0,
        growth_rate_percent: sl.growth_rate_percent || 0,
        trend_direction: sl.trend_direction || "stable",
        performance_tier: sl.performance_tier || "cash_cow",
        strategic_priority: sl.strategic_priority || "maintain",
        notes: `Imported from API. ${sl.revenue_percent?.toFixed(2) || 0}% of total revenue.`,
      };
    });

    const { error: serviceError } = await supabase
      .from("service_line_performance")
      .insert(serviceLineInserts);

    if (serviceError) {
      console.error("Service line insert error:", serviceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to insert service lines: ${serviceError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Revenue report imported successfully",
        clinic_id,
        period: `${report.report_metadata.period_start} to ${report.report_metadata.period_end}`,
        total_revenue: metrics.total_revenue,
        service_lines_imported: report.service_lines.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
