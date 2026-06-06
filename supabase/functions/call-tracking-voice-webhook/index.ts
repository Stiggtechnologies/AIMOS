import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Twilio Voice webhook for BUSINESS-HOURS call tracking numbers.
// Logs the call to call_tracking_calls, snapshots attribution (from session if available),
// creates a CRM lead, then forwards to the clinic primary number.
//
// Configure Twilio phone number Voice "A CALL COMES IN" to:
//   https://<project>.supabase.co/functions/v1/call-tracking-voice-webhook
//
// Env:
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
// - PUBLIC_BASE_URL (e.g. https://<project>.supabase.co/functions/v1)
// - TWILIO_FORWARD_TO_E164 (e.g. +17802508188)
// - TWILIO_CALLER_ID_E164 (optional)
// - CALL_TRACKING_SESSION_LOOKBACK_MINUTES (optional, default 120)
// - CALL_TRACKING_VOICEMAIL_GREETING (optional)
//
// Notes:
// - X-Twilio-Signature is NOT validated in this v1 implementation.

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

async function insertCall(
  supabaseUrl: string,
  serviceKey: string,
  payload: Record<string, unknown>,
) {
  const r = await fetch(`${supabaseUrl}/rest/v1/call_tracking_calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Failed to insert call: ${t}`);
  }
  const data = await r.json();
  return data?.[0];
}

async function updateCall(
  supabaseUrl: string,
  serviceKey: string,
  twilioCallSid: string,
  patch: Record<string, unknown>,
) {
  const r = await fetch(
    `${supabaseUrl}/rest/v1/call_tracking_calls?twilio_call_sid=eq.${encodeURIComponent(twilioCallSid)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch),
    },
  );
  if (!r.ok) {
    const t = await r.text();
    console.error("Failed to update call", t);
  }
}

async function findNumberRow(
  supabaseUrl: string,
  serviceKey: string,
  toE164: string,
): Promise<{ id: string; default_source_type: string; default_source_detail: string | null } | null> {
  const r = await fetch(
    `${supabaseUrl}/rest/v1/call_tracking_numbers?e164=eq.${encodeURIComponent(toE164)}&select=id,default_source_type,default_source_detail&limit=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
  );
  if (!r.ok) return null;
  const d = await r.json();
  return d?.[0] || null;
}

async function findRecentSessionForNumber(
  supabaseUrl: string,
  serviceKey: string,
  trackingNumberId: string,
  lookbackMinutes: number,
): Promise<any | null> {
  const since = new Date(Date.now() - lookbackMinutes * 60_000).toISOString();
  const url = `${supabaseUrl}/rest/v1/call_tracking_sessions?tracking_number_id=eq.${encodeURIComponent(trackingNumberId)}` +
    `&created_at=gte.${encodeURIComponent(since)}` +
    `&expires_at=gt.${encodeURIComponent(new Date().toISOString())}` +
    `&select=session_id,source_type,source_detail,utm_source,utm_medium,utm_campaign,utm_content,utm_term,gclid,fbclid,referrer,landing_page_url` +
    `&order=created_at.desc&limit=1`;

  const r = await fetch(url, { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } });
  if (!r.ok) return null;
  const d = await r.json();
  return d?.[0] || null;
}

async function mapLeadSourceSlug(sourceType: string | null | undefined): Promise<string> {
  switch (sourceType) {
    case "google_ads":
      return "google-ads-call";
    case "meta_ads":
      return "meta-ads-call";
    case "bing_ads":
      return "bing-ads-call";
    case "organic":
      return "organic-call";
    case "referral":
      return "referral-call";
    case "direct":
      return "direct-call";
    default:
      return "other-call";
  }
}

async function ensureLead(
  supabaseUrl: string,
  serviceKey: string,
  phone: string | null,
  sourceType: string | null,
  sourceDetail: string | null,
  attrs: any,
): Promise<string | null> {
  if (!phone) return null;

  const slug = await mapLeadSourceSlug(sourceType);
  const srcRes = await fetch(`${supabaseUrl}/rest/v1/crm_lead_sources?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  });
  const srcData = srcRes.ok ? await srcRes.json() : [];
  const leadSourceId = srcData?.[0]?.id || null;

  const notesLines: string[] = [];
  notesLines.push(`Inbound phone call (business hours)`);
  if (sourceType) notesLines.push(`Source: ${sourceType}${sourceDetail ? ` (${sourceDetail})` : ""}`);
  if (attrs?.landing_page_url) notesLines.push(`Landing page: ${attrs.landing_page_url}`);
  if (attrs?.gclid) notesLines.push(`gclid: ${attrs.gclid}`);
  if (attrs?.fbclid) notesLines.push(`fbclid: ${attrs.fbclid}`);

  const leadInsert = await fetch(`${supabaseUrl}/rest/v1/crm_leads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      first_name: "Inbound",
      last_name: "Caller",
      phone,
      email: null,
      lead_source_id: leadSourceId,
      landing_page_url: attrs?.landing_page_url || null,
      utm_source: attrs?.utm_source || null,
      utm_medium: attrs?.utm_medium || null,
      utm_campaign: attrs?.utm_campaign || null,
      utm_content: attrs?.utm_content || null,
      status: "new",
      priority: "medium",
      notes: notesLines.join("\n"),
      external_id: attrs?.twilio_call_sid || null,
    }),
  });

  if (!leadInsert.ok) {
    console.error("Failed creating CRM lead", await leadInsert.text());
    return null;
  }

  const created = await leadInsert.json();
  return created?.[0]?.id || null;
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  const publicBaseUrl = Deno.env.get("PUBLIC_BASE_URL");

  const forwardTo = Deno.env.get("TWILIO_FORWARD_TO_E164") || "+17802508188";
  const callerId = Deno.env.get("TWILIO_CALLER_ID_E164");
  const voicemailGreeting = Deno.env.get("CALL_TRACKING_VOICEMAIL_GREETING") ||
    "Please leave a message after the tone.";

  if (!supabaseUrl || !serviceKey || !publicBaseUrl) {
    const msg = `Missing env. Need SUPABASE_URL, SERVICE_ROLE_KEY, PUBLIC_BASE_URL.`;
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escXml(msg)}</Say></Response>`,
      { status: 500, headers: xmlHeaders },
    );
  }

  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") || "inbound";

  if (stage === "dial-result" || stage === "voicemail-saved") {
    const form = req.method === "POST" ? await req.text() : "";
    const params = new URLSearchParams(form);
    const callSid = params.get("CallSid") || "";

    if (!callSid) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { status: 200, headers: xmlHeaders },
      );
    }

    if (stage === "dial-result") {
      const dialStatus = params.get("DialCallStatus") || ""; // completed, busy, no-answer, failed
      const dialDuration = params.get("DialCallDuration");
      const endedAt = new Date().toISOString();

      const normalizedStatus = dialStatus === "completed" ? "completed" : "missed";
      await updateCall(supabaseUrl, serviceKey, callSid, {
        call_status: normalizedStatus,
        call_ended_at: endedAt,
        call_duration_seconds: dialDuration ? Number(dialDuration) : null,
      });

      if (dialStatus === "completed") {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`;
        return new Response(twiml, { status: 200, headers: xmlHeaders });
      }

      // Fallback to voicemail
      const recordAction = `${publicBaseUrl}/call-tracking-voice-webhook?stage=voicemail-saved`;
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
        `  <Say voice="alice">${escXml(voicemailGreeting)}</Say>\n` +
        `  <Record maxLength="120" playBeep="true" action="${escXml(recordAction)}" method="POST" />\n` +
        `</Response>`;
      return new Response(twiml, { status: 200, headers: xmlHeaders });
    }

    // stage === voicemail-saved
    const recordingUrl = params.get("RecordingUrl");
    const recordingDuration = params.get("RecordingDuration");
    await updateCall(supabaseUrl, serviceKey, callSid, {
      call_status: "voicemail",
      recording_url: recordingUrl || null,
      call_duration_seconds: recordingDuration ? Number(recordingDuration) : null,
      call_ended_at: new Date().toISOString(),
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Say voice="alice">Thank you. Goodbye.</Say></Response>`;
    return new Response(twiml, { status: 200, headers: xmlHeaders });
  }

  // Inbound stage: create call record then forward.
  const formData = req.method === "POST" ? await req.formData() : new FormData();
  const callSid = (formData.get("CallSid") as string) || "";
  const from = (formData.get("From") as string) || null;
  const to = (formData.get("To") as string) || "";

  if (!callSid || !to) {
    const msg = "Missing CallSid/To in Twilio request";
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escXml(msg)}</Say></Response>`,
      { status: 400, headers: xmlHeaders },
    );
  }

  const lookbackMinutes = Number(Deno.env.get("CALL_TRACKING_SESSION_LOOKBACK_MINUTES") || "120");

  const numberRow = await findNumberRow(supabaseUrl, serviceKey, to);
  const trackingNumberId = numberRow?.id || null;

  const session = trackingNumberId
    ? await findRecentSessionForNumber(supabaseUrl, serviceKey, trackingNumberId, lookbackMinutes)
    : null;

  const sourceType = session?.source_type || numberRow?.default_source_type || "direct";
  const sourceDetail = session?.source_detail || numberRow?.default_source_detail || null;

  // Insert call record
  await insertCall(supabaseUrl, serviceKey, {
    twilio_call_sid: callSid,
    from_number: from,
    to_number: to,
    call_started_at: new Date().toISOString(),
    call_status: "initiated",
    session_id: session?.session_id || null,
    tracking_number_id: trackingNumberId,

    source_type: sourceType,
    source_detail: sourceDetail,

    utm_source: session?.utm_source || null,
    utm_medium: session?.utm_medium || null,
    utm_campaign: session?.utm_campaign || null,
    utm_content: session?.utm_content || null,
    utm_term: session?.utm_term || null,
    gclid: session?.gclid || null,
    fbclid: session?.fbclid || null,
    referrer: session?.referrer || null,
    landing_page_url: session?.landing_page_url || null,
  });

  // Create CRM lead
  const leadId = await ensureLead(supabaseUrl, serviceKey, from, sourceType, sourceDetail, {
    ...session,
    twilio_call_sid: callSid,
  });
  if (leadId) {
    await updateCall(supabaseUrl, serviceKey, callSid, { lead_id: leadId });
  }

  // Forward to clinic number with callback action to capture result.
  const dialAction = `${publicBaseUrl}/call-tracking-voice-webhook?stage=dial-result`;
  const dialAttrs = callerId ? ` callerId=\"${escXml(callerId)}\"` : "";
  const dial = `  <Dial${dialAttrs} timeout=\"20\" action=\"${escXml(dialAction)}\" method=\"POST\">${escXml(forwardTo)}</Dial>`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${dial}\n</Response>`;
  return new Response(twiml, { status: 200, headers: xmlHeaders });
});
