import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// booking-cancel
// Cancels an appointment using a token created at booking time.
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

  const { token } = await req.json().catch(() => ({}));
  if (!token) return json({ ok: false, error: "token required" }, 400);

  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
  };

  const tokRes = await fetch(`${supabaseUrl}/rest/v1/booking_tokens?select=*&token=eq.${encodeURIComponent(String(token))}&limit=1`, { headers });
  const tokRows = await tokRes.json().catch(() => []);
  const row = tokRows?.[0];
  if (!row) return json({ ok: false, error: "TOKEN_NOT_FOUND" }, 404);
  if (row.token_type !== 'cancel') return json({ ok: false, error: "TOKEN_INVALID" }, 400);

  if (row.appointment_id) {
    await fetch(`${supabaseUrl}/rest/v1/patient_appointments?id=eq.${encodeURIComponent(row.appointment_id)}`, {
      method: 'PATCH',
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ status: 'cancelled', cancelled_at: new Date().toISOString() }),
    });
  }

  if (row.crm_booking_id) {
    await fetch(`${supabaseUrl}/rest/v1/crm_bookings?id=eq.${encodeURIComponent(row.crm_booking_id)}`, {
      method: 'PATCH',
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }),
    });
  }

  return json({ ok: true });
});
