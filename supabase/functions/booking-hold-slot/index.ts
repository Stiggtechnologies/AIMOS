import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// booking-hold-slot
// Creates a short-lived hold on a slot to prevent double-booking.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);

  const { clinicId, bookingServiceId, start, end, sessionId } = await req.json().catch(() => ({}));
  if (!clinicId || !bookingServiceId || !start || !end) return json({ ok: false, error: "clinicId, bookingServiceId, start, end required" }, 400);

  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  // Load booking_service to optionally pin a default provider
  let defaultProviderId: string | null = null;
  try {
    const bsRes = await fetch(
      `${supabaseUrl}/rest/v1/booking_services?select=default_provider_id&id=eq.${encodeURIComponent(bookingServiceId)}&limit=1`,
      { headers: { "Authorization": `Bearer ${serviceKey}`, "apikey": serviceKey } },
    );
    const bsRows = await bsRes.json().catch(() => []);
    defaultProviderId = bsRows?.[0]?.default_provider_id ?? null;
  } catch (_e) {
    // ignore
  }

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/booking_slot_holds`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      clinic_id: clinicId,
      booking_service_id: bookingServiceId,
      provider_id: defaultProviderId,
      slot_start: start,
      slot_end: end,
      status: 'held',
      session_id: sessionId ?? null,
    }),
  });

  const inserted = await insertRes.json().catch(() => []);
  if (!insertRes.ok) {
    return json({ ok: false, error: "HOLD_FAILED", details: inserted }, 409);
  }

  const hold = inserted?.[0];
  return json({ ok: true, holdId: hold.id, expiresAt: hold.hold_expires_at });
});
