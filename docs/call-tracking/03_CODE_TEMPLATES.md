# AIMOS In‑House Call Tracking — Code Templates (TypeScript/React)

This file provides reusable templates/snippets you can copy into:
- the marketing website (DNI)
- Supabase Edge Functions (Twilio + call logging)
- AIMOS UI components (outcome tagging + analytics dashboard)

> Note: AIMOS already contains working implementations in:
> - `supabase/functions/call-tracking-number/index.ts`
> - `supabase/functions/call-tracking-voice-webhook/index.ts`
> - `src/components/call-tracking/CallTrackingView.tsx`
> - `src/services/callTrackingService.ts`

---

## 1) Dynamic Number Insertion (website JS)

### 1.1 Drop-in snippet (vanilla JS)

```html
<script>
(function () {
  const ENDPOINT = 'https://<project>.supabase.co/functions/v1/call-tracking-number';
  const SELECTOR = '.phone-number';

  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function getExistingSessionId() {
    // Prefer cookie set by the edge function.
    const m = document.cookie.match(/(?:^|; )aimos_ct_sid=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function fetchTrackingNumber() {
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
      fbclid: getParam('fbclid'),
      // Optional: your own identifiers
      source_detail: getParam('adgroup') || getParam('campaign')
    };

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    return await res.json();
  }

  function applyNumber(display, e164) {
    document.querySelectorAll(SELECTOR).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'a') {
        el.setAttribute('href', `tel:${e164}`);
        el.textContent = display;
      } else {
        el.textContent = display;
      }
    });
  }

  (async function init() {
    // If your site wants to reuse a previous session for the visitor, you can implement:
    // - a dedicated endpoint to “refresh” the session
    // - or simply let the edge function re-issue a session per page load
    const existing = getExistingSessionId();
    // (existing is not required for v1; currently the server does not accept it)

    const data = await fetchTrackingNumber();
    if (!data || !data.number) return;

    applyNumber(data.number.display, data.number.e164);
  })();
})();
</script>
```

### 1.2 React hook example (marketing site in React)

```ts
import { useEffect, useState } from 'react';

type TrackingNumberResponse = {
  session_id: string;
  expires_at: string;
  source_type: string;
  source_detail?: string | null;
  number: { e164: string; display: string };
};

export function useCallTrackingNumber(endpoint: string) {
  const [data, setData] = useState<TrackingNumberResponse | null>(null);

  useEffect(() => {
    (async () => {
      const u = new URL(window.location.href);
      const payload = {
        landing_page_url: u.toString(),
        last_page_url: u.toString(),
        referrer: document.referrer,
        utm_source: u.searchParams.get('utm_source'),
        utm_medium: u.searchParams.get('utm_medium'),
        utm_campaign: u.searchParams.get('utm_campaign'),
        utm_content: u.searchParams.get('utm_content'),
        utm_term: u.searchParams.get('utm_term'),
        gclid: u.searchParams.get('gclid'),
        fbclid: u.searchParams.get('fbclid')
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) return;
      setData(await res.json());
    })();
  }, [endpoint]);

  return data;
}
```

---

## 2) Edge Function — Call logging + forwarding (Twilio Voice)

This is the pattern implemented in `call-tracking-voice-webhook`:

- inbound: insert call row + attempt session match + create CRM lead
- dial-result: update status/duration and (if missed) fall back to voicemail
- voicemail-saved: store recording URL

### 2.1 Minimal TwiML forwarder (for reference)

```ts
function twimlDial(forwardTo: string, actionUrl: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n` +
    `  <Dial timeout="20" action="${actionUrl}" method="POST">${forwardTo}</Dial>\n` +
    `</Response>`;
}
```

### 2.2 Twilio signature validation (recommended add-on)

Pseudo-code (Deno):

```ts
// 1) Get X-Twilio-Signature header
// 2) Reconstruct the exact URL Twilio used
// 3) Sort params, generate HMAC-SHA1 with Twilio Auth Token
// 4) Compare in constant time

// Twilio docs: https://www.twilio.com/docs/usage/security#validating-requests
```

---

## 3) Staff outcome tagging UI (AIMOS)

AIMOS already has a working view (`CallTrackingView.tsx`).
Below is an enhanced pattern that adds outcome notes in a modal.

### 3.1 Outcome modal component (React)

```tsx
import { useState } from 'react';
import type { CallOutcome, CallTrackingCall } from '../../types/callTracking';

const OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'booked', label: 'Booked' },
  { value: 'callback', label: 'Callback' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'price_objection', label: 'Price Objection' },
  { value: 'already_booked', label: 'Already Booked' },
  { value: 'spam', label: 'Spam' },
];

type Props = {
  call: CallTrackingCall;
  onSave: (outcome: CallOutcome, notes?: string) => Promise<void>;
  onClose: () => void;
};

export function CallOutcomeModal({ call, onSave, onClose }: Props) {
  const [outcome, setOutcome] = useState<CallOutcome>(call.outcome || 'callback');
  const [notes, setNotes] = useState(call.outcome_notes || '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-4 space-y-3">
        <div className="font-semibold">Tag call outcome</div>
        <div className="text-sm text-gray-600">From: {call.from_number} • {new Date(call.call_started_at).toLocaleString()}</div>

        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as CallOutcome)}
          className="w-full border rounded px-3 py-2"
        >
          {OUTCOMES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Optional notes (objection, details, etc.)"
        />

        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try { await onSave(outcome, notes); onClose(); }
              finally { setSaving(false); }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4) Analytics dashboard component (AIMOS)

### 4.1 Simple “calls by source” chart data (Supabase query)

```ts
import { supabase } from '../lib/supabase';

export async function getCallsBySource(startIso: string, endIso: string) {
  const { data, error } = await supabase
    .from('call_tracking_calls')
    .select('source_type')
    .gte('call_started_at', startIso)
    .lte('call_started_at', endIso);

  if (error) throw error;

  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => {
    const k = r.source_type || 'unknown';
    counts[k] = (counts[k] || 0) + 1;
  });

  return counts;
}
```

### 4.2 KPI tiles (using existing RPC)

```ts
const { data, error } = await supabase
  .rpc('get_call_tracking_stats', { start_date: startIso, end_date: endIso })
  .single();
```

---

## 5) Offline conversion upload (design stub)

### 5.1 Data requirements
To upload a Google Ads offline conversion for “Booked Call”, you generally need:
- `gclid` captured at click/visit time (stored on `call_tracking_calls`)
- conversion action name/id
- conversion time (when booking occurred)
- value (optional)

### 5.2 Trigger point
When staff tags a call outcome to `booked`, enqueue an async job to upload conversions.
Options:
- Supabase Edge Function called from UI
- Supabase background worker pattern (cron + queue table)

Pseudo-schema:
```sql
create table if not exists ads_offline_conversion_queue (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_ads','meta')),
  call_id uuid references call_tracking_calls(id) on delete cascade,
  gclid text,
  fbclid text,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
