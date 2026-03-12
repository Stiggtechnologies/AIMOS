import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// booking-availability
// Computes bookable slots for a clinic + booking_service.
// MVP implementation: returns placeholder slots until full schedule subtraction is implemented.
//
// Env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toIsoWithOffset(d: Date) {
  // Deno Date#toISOString() is UTC; for MVP we return UTC ISO.
  // In production, return timezone-aware offsets from clinic timezone.
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);

  const body = await req.json().catch(() => ({}));
  const { clinicId, bookingServiceId, startDate, days = 7 } = body ?? {};
  if (!clinicId || !bookingServiceId || !startDate) return json({ ok: false, error: "clinicId, bookingServiceId, startDate required" }, 400);

  // TODO: implement real availability:
  // - load booking_services row (duration, min_notice, max_days_out)
  // - load clinic_hours
  // - load provider schedules / blocks
  // - subtract patient_appointments + active holds

  // Placeholder: generate 3 slots per day at 10am/1pm/4pm UTC.
  const slots: Array<{ start: string; end: string }> = [];
  const start = new Date(`${startDate}T00:00:00.000Z`);
  for (let i = 0; i < Number(days); i++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    for (const hour of [17, 20, 23]) { // roughly 10/1/4 MT in UTC when offset -7 (MVP)
      const s = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0));
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      slots.push({ start: toIsoWithOffset(s), end: toIsoWithOffset(e) });
    }
  }

  return json({ ok: true, slots });
});
