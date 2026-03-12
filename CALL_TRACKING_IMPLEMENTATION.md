# AIMOS In‑House Call Tracking (Business Hours)

## Goal
Track *which marketing source drove each inbound phone call* during business hours without using CallRail.

This module provides:
- Dynamic Number Insertion (DNI) via an Edge Function (`call-tracking-number`)
- Twilio forwarding + call logging via an Edge Function (`call-tracking-voice-webhook`)
- CRM lead creation with attribution
- Staff outcome tagging UI inside AIMOS (`Call Tracking` view)

---

## Architecture (High Level)

### 1) Website visit → tracking number
1. Visitor lands on website (with UTMs / referrer / click IDs)
2. Website JS calls:
   - `POST https://<project>.supabase.co/functions/v1/call-tracking-number`
3. Edge Function:
   - detects `source_type` (google_ads, meta_ads, organic, referral, direct, …)
   - selects an active Twilio tracking number from `call_tracking_numbers`
   - writes `call_tracking_sessions` (expires in ~30 min)
   - returns `{ session_id, number: {e164, display} }`
4. Website replaces visible phone number links

### 2) Phone call → Twilio webhook
1. Caller dials the displayed tracking number
2. Twilio hits:
   - `https://<project>.supabase.co/functions/v1/call-tracking-voice-webhook`
3. Edge Function:
   - creates `call_tracking_calls` row
   - attempts to attach most recent unexpired `call_tracking_sessions` for that tracking number
   - snapshots attribution fields onto the call record
   - creates a `crm_leads` row with the same attribution
   - returns TwiML to forward the call to the clinic primary number
4. On Dial completion, Twilio calls back (action URL) and the function updates call status/duration.

---

## Database Objects
Created by migration:
- `call_tracking_numbers` — Twilio number pool + default attribution
- `call_tracking_sessions` — per-visit attribution sessions (DNI)
- `call_tracking_calls` — call log with attribution snapshot + CRM linkage
- `get_call_tracking_stats(start_date, end_date)` — reporting function

Lead Sources added/ensured:
- `google-ads-call`, `meta-ads-call`, `bing-ads-call`, `organic-call`, `referral-call`, `direct-call`, `other-call`

---

## Supabase Edge Functions

### A) `call-tracking-number`
**Purpose:** Used by website JS to get the tracking number.

**Env:**
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `CALL_TRACKING_SESSION_TTL_MINUTES` (default 30)
- `CALL_TRACKING_DEFAULT_NUMBER_E164` (optional fallback)

**Input:** JSON with UTMs/referrer/gclid/fbclid.

**Output:** JSON with `session_id`, `number`, `source_type`, `expires_at`.

### B) `call-tracking-voice-webhook`
**Purpose:** Twilio Voice inbound handler for tracking numbers.

**Env:**
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `PUBLIC_BASE_URL` (required for action callbacks)
- `TWILIO_FORWARD_TO_E164` (clinic number, e.g. `+17802508188`)
- `TWILIO_CALLER_ID_E164` (optional)
- `CALL_TRACKING_SESSION_LOOKBACK_MINUTES` (default 120)
- `CALL_TRACKING_VOICEMAIL_GREETING` (optional)

**Twilio config:**
- For each tracking number, set Voice webhook `A CALL COMES IN` → the function URL above.

---

## Frontend (AIMOS)
A new AIMOS view is added:
- Sidebar → **Call Tracking**
- Component: `src/components/call-tracking/CallTrackingView.tsx`

Capabilities:
- list recent call logs
- filter by source
- staff outcome tagging (Booked / Callback / Not Qualified / etc.)

---

## Website JS Snippet (Example)
This is typically installed in the marketing site, not inside AIMOS.

```html
<script>
(async function() {
  function getParam(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  const payload = {
    landing_page_url: window.location.href,
    last_page_url: window.location.href,
    referrer: document.referrer,
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign'),
    utm_content: getParam('utm_content'),
    utm_term: getParam('utm_term'),
    gclid: getParam('gclid'),
    fbclid: getParam('fbclid')
  };

  const res = await fetch('https://<project>.supabase.co/functions/v1/call-tracking-number', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) return;
  const data = await res.json();

  document.querySelectorAll('.phone-number').forEach(el => {
    if (el.tagName.toLowerCase() === 'a') {
      el.href = `tel:${data.number.e164}`;
      el.textContent = data.number.display;
    } else {
      el.textContent = data.number.display;
    }
  });
})();
</script>
```

---

## Staff Training (Quick)
1. Open AIMOS → **Call Tracking**
2. For each call, set an **Outcome**:
   - Booked / Callback / No Answer / Not Qualified / Price Objection / Already Booked / Spam
3. Use the **Source filter** to review which channel is generating calls.

---

## Known Limitations (V1)
- Attribution matching from call → web session is "best effort" and currently uses: **tracking number + recent session lookback window**.
  - If each source has a dedicated tracking number, attribution is deterministic.
  - If you rotate numbers within a source, attribution may drift when multiple visitors share a number within the lookback.
- Twilio request signature validation is not yet implemented.
- Offline conversion upload to Google Ads is not yet wired (recommended next step once outcomes are tagged reliably).

---

## Next Steps (Recommended)
- Add X-Twilio-Signature validation.
- Add a richer outcome panel with notes + linking to booking records.
- Implement Google Ads Offline Conversion imports using stored `gclid` when outcome becomes `booked`.
- Expand number allocation to true pooling per source with per-session locking.
