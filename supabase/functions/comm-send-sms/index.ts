import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Server-side outbound SMS sender for the Communications module.
//
// Env:
// - TWILIO_ACCOUNT_SID
// - TWILIO_AUTH_TOKEN
// - TWILIO_FROM_E164 (clinic number, e.g. +18253608188)
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Request JSON:
// { "to": "+1...", "body": "...", "conversationId"?: "uuid" }

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_E164");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!accountSid || !authToken || !from || !supabaseUrl || !serviceKey) {
    return json({
      error: "Missing env. Need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_E164, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
    }, 500);
  }

  const { to, body, conversationId } = await req.json().catch(() => ({}));
  if (!to || !body) return json({ error: "to and body are required" }, 400);

  const basic = btoa(`${accountSid}:${authToken}`);
  const form = new URLSearchParams();
  form.set("To", String(to));
  form.set("From", String(from));
  form.set("Body", String(body));

  const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const twilioJson = await twilioRes.json().catch(() => null);
  if (!twilioRes.ok) {
    return json({ error: "Twilio send failed", details: twilioJson }, twilioRes.status);
  }

  // Best-effort store in comm_messages.
  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
  };

  let convId = conversationId as string | undefined;
  if (!convId) {
    // Find or create conversation for sms.
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/comm_conversations?select=id&channel=eq.sms&customer_phone_e164=eq.${encodeURIComponent(String(to))}&twilio_number_e164=eq.${encodeURIComponent(String(from))}&limit=1`,
      { headers },
    );
    const found = await findRes.json().catch(() => []);
    convId = found?.[0]?.id;

    if (!convId) {
      const insertConvRes = await fetch(`${supabaseUrl}/rest/v1/comm_conversations`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          channel: "sms",
          customer_phone_e164: String(to),
          twilio_number_e164: String(from),
          status: "open",
          last_activity_at: new Date().toISOString(),
          last_message_preview: String(body).slice(0, 160),
        }),
      });
      const inserted = await insertConvRes.json().catch(() => []);
      convId = inserted?.[0]?.id;
    }
  }

  if (convId) {
    await fetch(`${supabaseUrl}/rest/v1/comm_conversations?id=eq.${convId}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({
        last_activity_at: new Date().toISOString(),
        last_message_preview: String(body).slice(0, 160),
        status: "open",
      }),
    });

    await fetch(`${supabaseUrl}/rest/v1/comm_messages`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({
        conversation_id: convId,
        direction: "outbound",
        from_number_e164: String(from),
        to_number_e164: String(to),
        body: String(body),
        twilio_message_sid: twilioJson?.sid || null,
        twilio_status: twilioJson?.status || null,
        raw_payload: twilioJson,
      }),
    });
  }

  return json({ ok: true, twilio: twilioJson, conversationId: convId });
});
