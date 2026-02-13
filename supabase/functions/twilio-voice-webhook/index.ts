import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Twilio Voice webhook → returns TwiML
// Configure your Twilio phone number Voice "A CALL COMES IN" to point here.
//
// Env:
// - TWILIO_FORWARD_TO_E164: e.g. +17802508188
// - TWILIO_CALLER_ID_E164: e.g. +18253608188 (your Twilio number)
// - TWILIO_VOICE_WHISPER_TEXT (optional)
// - TWILIO_VOICE_VOICEMAIL_GREETING (optional)
// - PUBLIC_BASE_URL (required for multi-step callbacks; e.g. https://<project>.supabase.co/functions/v1)
//
// Notes:
// - This endpoint does NOT currently validate X-Twilio-Signature. Add if/when needed.

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

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const forwardTo = Deno.env.get("TWILIO_FORWARD_TO_E164");
  const callerId = Deno.env.get("TWILIO_CALLER_ID_E164");
  const whisperText = Deno.env.get("TWILIO_VOICE_WHISPER_TEXT");
  const voicemailGreeting = Deno.env.get("TWILIO_VOICE_VOICEMAIL_GREETING") || "Please leave a message after the tone.";
  const publicBaseUrl = Deno.env.get("PUBLIC_BASE_URL");

  if (!forwardTo || !callerId) {
    const msg = `Missing env. Need TWILIO_FORWARD_TO_E164 and TWILIO_CALLER_ID_E164.`;
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escXml(msg)}</Say></Response>`,
      { status: 500, headers: xmlHeaders },
    );
  }

  // Twilio can POST back to the same webhook after <Dial> completes via the `action` URL.
  // We'll use this to drop into voicemail when the forward leg isn't answered.
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") || "inbound";

  if (!publicBaseUrl) {
    const msg = `Missing env. Need PUBLIC_BASE_URL (e.g. https://<project>.supabase.co/functions/v1).`;
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escXml(msg)}</Say></Response>`,
      { status: 500, headers: xmlHeaders },
    );
  }

  if (stage === "dial-result") {
    // When Dial finishes, Twilio will send DialCallStatus.
    // If it was completed, we're done. Otherwise, record voicemail.
    const form = req.method === "POST" ? await req.text() : "";
    const params = new URLSearchParams(form);
    const dialStatus = params.get("DialCallStatus") || "";

    if (dialStatus === "completed") {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`;
      return new Response(twiml, { status: 200, headers: xmlHeaders });
    }

    const recordAction = `${publicBaseUrl}/twilio-voice-webhook?stage=voicemail-saved`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
      `  <Say voice="alice">${escXml(voicemailGreeting)}</Say>\n` +
      `  <Record maxLength="120" playBeep="true" action="${escXml(recordAction)}" method="POST" />\n` +
      `</Response>`;
    return new Response(twiml, { status: 200, headers: xmlHeaders });
  }

  if (stage === "voicemail-saved") {
    // Placeholder: we will log RecordingSid/RecordingUrl via a separate callback in the next iteration.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Say voice="alice">Thank you. Goodbye.</Say></Response>`;
    return new Response(twiml, { status: 200, headers: xmlHeaders });
  }

  // Inbound call: forward to cell with an action to handle voicemail fallback.
  const say = whisperText ? `  <Say voice="alice">${escXml(whisperText)}</Say>\n` : "";
  const dialAction = `${publicBaseUrl}/twilio-voice-webhook?stage=dial-result`;
  const dial = `  <Dial callerId="${escXml(callerId)}" timeout="20" action="${escXml(dialAction)}" method="POST">${escXml(forwardTo)}</Dial>`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${say}${dial}\n</Response>`;
  return new Response(twiml, { status: 200, headers: xmlHeaders });
});
