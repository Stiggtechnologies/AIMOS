import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Call Tracking Number Allocation (Dynamic Number Insertion)
// Public endpoint for website JS to request which tracking number to display.
//
// POST JSON:
// {
//   landing_page_url?: string,
//   last_page_url?: string,
//   referrer?: string,
//   utm_source?: string,
//   utm_medium?: string,
//   utm_campaign?: string,
//   utm_content?: string,
//   utm_term?: string,
//   gclid?: string,
//   fbclid?: string,
//   source_detail?: string
// }
//
// Response:
// {
//   session_id: string,
//   number: { e164: string, display: string }
//   source_type: string,
//   source_detail?: string,
//   expires_at: string
// }
//
// Env:
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
// - CALL_TRACKING_DEFAULT_NUMBER_E164 (optional fallback)
// - CALL_TRACKING_SESSION_TTL_MINUTES (optional, default 30)
//
// Notes:
// - This endpoint does not require Supabase auth. It writes via service role.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function asDisplay(e164: string): string {
  // naive format for North America. If not +1XXXXXXXXXX, return raw.
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return e164;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

function detectSourceType(input: any): { source_type: string; source_detail?: string } {
  const utmSource = String(input?.utm_source || "").toLowerCase();
  const utmMedium = String(input?.utm_medium || "").toLowerCase();
  const referrer = String(input?.referrer || "").toLowerCase();
  const hasGclid = !!input?.gclid;
  const hasFbclid = !!input?.fbclid;

  // Paid click IDs win.
  if (hasGclid) return { source_type: "google_ads", source_detail: input?.utm_campaign };
  if (hasFbclid) return { source_type: "meta_ads", source_detail: input?.utm_campaign };

  // UTM-based paid.
  if (utmMedium === "cpc" || utmMedium === "ppc" || utmMedium === "paid") {
    if (utmSource.includes("google")) return { source_type: "google_ads", source_detail: input?.utm_campaign };
    if (utmSource.includes("facebook") || utmSource.includes("instagram") || utmSource.includes("meta")) {
      return { source_type: "meta_ads", source_detail: input?.utm_campaign };
    }
    if (utmSource.includes("bing")) return { source_type: "bing_ads", source_detail: input?.utm_campaign };
    return { source_type: "other", source_detail: input?.utm_campaign };
  }

  // Organic/referral/direct heuristics.
  if (utmMedium === "organic") return { source_type: "organic" };
  if (utmMedium === "referral") return { source_type: "referral" };

  if (referrer.includes("google.") || referrer.includes("bing.") || referrer.includes("duckduckgo.")) {
    return { source_type: "organic" };
  }

  if (referrer && !referrer.includes("albertainjurymanagement") && !referrer.includes("aim")) {
    return { source_type: "referral", source_detail: referrer };
  }

  return { source_type: "direct" };
}

function randomSessionId(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const ttlMinutes = Number(Deno.env.get("CALL_TRACKING_SESSION_TTL_MINUTES") || "30");
  const fallbackNumber = Deno.env.get("CALL_TRACKING_DEFAULT_NUMBER_E164") || "";

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { source_type, source_detail } = detectSourceType(body);

  // Choose a tracking number for this source.
  // For V1 we select the first active number matching source, otherwise any active number.
  const pickNumber = async (): Promise<{ id: string; e164: string } | null> => {
    const q1 = `${supabaseUrl}/rest/v1/call_tracking_numbers?active=eq.true&default_source_type=eq.${encodeURIComponent(source_type)}&select=id,e164&limit=1`;
    const r1 = await fetch(q1, { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } });
    if (r1.ok) {
      const d1 = await r1.json();
      if (Array.isArray(d1) && d1[0]) return d1[0];
    }

    const q2 = `${supabaseUrl}/rest/v1/call_tracking_numbers?active=eq.true&select=id,e164&limit=1`;
    const r2 = await fetch(q2, { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } });
    if (r2.ok) {
      const d2 = await r2.json();
      if (Array.isArray(d2) && d2[0]) return d2[0];
    }

    if (fallbackNumber) {
      // Insert a synthetic number row if pool not seeded.
      const ins = await fetch(`${supabaseUrl}/rest/v1/call_tracking_numbers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          e164: fallbackNumber,
          friendly_name: "Fallback",
          default_source_type: source_type,
          default_source_detail: source_detail || null,
          active: true,
        }),
      });
      if (ins.ok) {
        const created = await ins.json();
        return created?.[0] || null;
      }
    }

    return null;
  };

  const number = await pickNumber();
  if (!number) {
    return new Response(JSON.stringify({ error: "No tracking numbers available" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const session_id = randomSessionId();
  const expires_at = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

  // Persist session using service role.
  const sessionInsert = await fetch(`${supabaseUrl}/rest/v1/call_tracking_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      session_id,
      tracking_number_id: number.id,
      source_type,
      source_detail: source_detail || body?.source_detail || null,
      utm_source: body?.utm_source || null,
      utm_medium: body?.utm_medium || null,
      utm_campaign: body?.utm_campaign || null,
      utm_content: body?.utm_content || null,
      utm_term: body?.utm_term || null,
      gclid: body?.gclid || null,
      fbclid: body?.fbclid || null,
      referrer: body?.referrer || null,
      landing_page_url: body?.landing_page_url || null,
      last_page_url: body?.last_page_url || null,
      user_agent: req.headers.get("user-agent"),
      expires_at,
    }),
  });

  if (!sessionInsert.ok) {
    const err = await sessionInsert.text();
    console.error("Failed to insert call tracking session", err);
  }

  // Set a soft cookie for the website (not HttpOnly) so client can include it if desired.
  // Note: Some sites may override this; it's optional.
  const setCookie = `aimos_ct_sid=${session_id}; Max-Age=${ttlMinutes * 60}; Path=/; SameSite=Lax`;

  return new Response(
    JSON.stringify({
      session_id,
      number: { e164: number.e164, display: asDisplay(number.e164) },
      source_type,
      source_detail: source_detail || body?.source_detail || null,
      expires_at,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setCookie,
        ...corsHeaders,
      },
    },
  );
});
