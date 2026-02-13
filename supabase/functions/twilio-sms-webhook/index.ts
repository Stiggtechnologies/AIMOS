import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Twilio Messaging webhook (SMS inbound) → stores inbound message + returns TwiML.
//
// Configure your Twilio Messaging "A MESSAGE COMES IN" to point here.
//
// Env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// This endpoint does NOT currently validate X-Twilio-Signature.

const xmlHeaders = {
  "Content-Type": "text/xml; charset=utf-8",
  "Cache-Control": "no-store",
};

function escXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readTwilioForm(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const body = await req.text();
    return Object.fromEntries(new URLSearchParams(body));
  }
  if (ct.includes("application/json")) {
    return await req.json();
  }
  // Try best-effort
  const body = await req.text();
  return Object.fromEntries(new URLSearchParams(body));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = await readTwilioForm(req);

    const from = String(payload.From || "");
    const to = String(payload.To || "");
    const body = String(payload.Body || "");
    const messageSid = String(payload.MessageSid || "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && serviceKey) {
      const headers = {
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
        "Content-Type": "application/json",
      };

      // 1) Raw inbound log (legacy/simple)
      await fetch(`${supabaseUrl}/rest/v1/twilio_inbound_messages`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          message_sid: messageSid || null,
          from_number: from || null,
          to_number: to || null,
          body: body || null,
          raw_payload: payload,
        }),
      });

      // 2) Communications module (conversation + message)
      // Upsert conversation by (sms, customer_phone_e164=From, twilio_number_e164=To)
      // We do it in two steps to avoid needing PostgREST upsert on composite uniqueness.
      // (We rely on index + select/insert best-effort.)
      const findRes = await fetch(
        `${supabaseUrl}/rest/v1/comm_conversations?select=id&channel=eq.sms&customer_phone_e164=eq.${encodeURIComponent(from)}&twilio_number_e164=eq.${encodeURIComponent(to)}&limit=1`,
        { headers },
      );
      const found = await findRes.json().catch(() => []);
      let conversationId = found?.[0]?.id as string | undefined;

      if (!conversationId) {
        const insertConvRes = await fetch(`${supabaseUrl}/rest/v1/comm_conversations`, {
          method: "POST",
          headers: { ...headers, "Prefer": "return=representation" },
          body: JSON.stringify({
            channel: "sms",
            customer_phone_e164: from,
            twilio_number_e164: to,
            status: "open",
            last_activity_at: new Date().toISOString(),
            last_message_preview: body?.slice(0, 160) || null,
          }),
        });
        const inserted = await insertConvRes.json().catch(() => []);
        conversationId = inserted?.[0]?.id;
      } else {
        await fetch(
          `${supabaseUrl}/rest/v1/comm_conversations?id=eq.${conversationId}`,
          {
            method: "PATCH",
            headers: { ...headers, "Prefer": "return=minimal" },
            body: JSON.stringify({
              last_activity_at: new Date().toISOString(),
              last_message_preview: body?.slice(0, 160) || null,
              status: "open",
            }),
          },
        );
      }

      if (conversationId) {
        await fetch(`${supabaseUrl}/rest/v1/comm_messages`, {
          method: "POST",
          headers: { ...headers, "Prefer": "return=minimal" },
          body: JSON.stringify({
            conversation_id: conversationId,
            direction: "inbound",
            from_number_e164: from,
            to_number_e164: to,
            body,
            twilio_message_sid: messageSid || null,
            twilio_status: String(payload.SmsStatus || payload.MessageStatus || "received"),
            raw_payload: payload,
          }),
        });
      }
    }

    // No auto-reply by default.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`;
    return new Response(twiml, { status: 200, headers: xmlHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escXml(
      `Error: ${msg}`,
    )}</Message></Response>`;
    return new Response(twiml, { status: 200, headers: xmlHeaders });
  }
});
