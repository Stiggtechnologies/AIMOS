# AIMOS In‑House Call Tracking — Implementation Guide

This guide assumes:
- Supabase project is already connected to AIMOS
- Twilio account exists
- After-hours Twilio integration already works (so Voice + webhooks are familiar)

Business-hours call tracking is implemented using:
- Supabase migration: `20260223150000_create_call_tracking_module.sql`
- Edge functions: `call-tracking-number`, `call-tracking-voice-webhook`
- AIMOS UI: `Call Tracking (Business Hours)` view

---

## 0) Deploy database migration

1. Confirm the migration exists:
   - `supabase/migrations/20260223150000_create_call_tracking_module.sql`
2. Apply via your normal Supabase migration workflow.
3. Verify tables exist:
   - `call_tracking_numbers`
   - `call_tracking_sessions`
   - `call_tracking_calls`
4. Seed at least 1 row into `call_tracking_numbers` (next section).

---

## 1) Twilio setup

### 1.1 Buy tracking numbers
In Twilio Console:
- Phone Numbers → Manage → Buy a number
- Ensure **Voice** capability is enabled

Buy numbers for your chosen pool strategy:
- Minimum: 1–4 numbers (Google/Meta/Bing/Main)
- Higher volume Google Ads: consider 2–5 numbers for pooling later

### 1.2 Configure voice webhooks
For each tracking number:
- Configure **Voice → A CALL COMES IN**
  - Method: **POST**
  - URL:
    - `https://<project>.supabase.co/functions/v1/call-tracking-voice-webhook`

### 1.3 Configure forwarding destination
Set the clinic’s main business-hours line in edge function env:
- `TWILIO_FORWARD_TO_E164=+1XXXXXXXXXX`

Optional:
- `TWILIO_CALLER_ID_E164` if you want a consistent caller ID on forwarded calls.

---

## 2) Seed / manage the number pool in Supabase

Insert each Twilio number into `call_tracking_numbers`:

```sql
insert into call_tracking_numbers (e164, friendly_name, default_source_type, default_source_detail, active)
values
  ('+1780XXXXXXX', 'Google Ads', 'google_ads', null, true),
  ('+1403XXXXXXX', 'Meta Ads', 'meta_ads', null, true),
  ('+1587XXXXXXX', 'Bing Ads', 'bing_ads', null, true),
  ('+1825XXXXXXX', 'Main (Direct/Organic)', 'direct', null, true);
```

Notes:
- `default_source_type` is used when no session match is found.
- You can point “Main” to `direct` or `organic` depending on how you want fallback attribution to appear.

---

## 3) Deploy Supabase Edge Functions

### 3.1 Functions
- `supabase/functions/call-tracking-number/index.ts`
- `supabase/functions/call-tracking-voice-webhook/index.ts`

Deploy them using your standard Supabase function deployment.

### 3.2 Environment variables

#### `call-tracking-number`
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `CALL_TRACKING_SESSION_TTL_MINUTES=30`
- `CALL_TRACKING_DEFAULT_NUMBER_E164` (optional fallback)

#### `call-tracking-voice-webhook`
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `PUBLIC_BASE_URL=https://<project>.supabase.co/functions/v1`
- `TWILIO_FORWARD_TO_E164=+1XXXXXXXXXX`
- `TWILIO_CALLER_ID_E164` (optional)
- `CALL_TRACKING_SESSION_LOOKBACK_MINUTES=120`
- `CALL_TRACKING_VOICEMAIL_GREETING` (optional)

---

## 4) Website integration (DNI)

### 4.1 Add the DNI snippet
Add the DNI script to the marketing website pages where the phone number is displayed.

Minimum requirements:
- mark phone elements with a selector, e.g. `.phone-number`
- replace both text + `tel:` links

A robust starter snippet is included in `03_CODE_TEMPLATES.md`.

### 4.2 Recommended web practices
- Call the endpoint once per page load.
- Store the returned `session_id` (cookie or localStorage).
- Reuse the same number for the visitor within the TTL.
- Ensure the site is not blocking third-party cookies if you rely on cookies.

---

## 5) AIMOS frontend integration

### 5.1 Staff view
AIMOS includes:
- `src/components/call-tracking/CallTrackingView.tsx`

Add/verify routing (already present in `src/App.tsx`):
- route key: `call-tracking`
- label: “Call Tracking”

### 5.2 Permissions
- Ensure staff roles that need to tag outcomes have SELECT/UPDATE on `call_tracking_calls` via RLS.
- Executives/admins manage `call_tracking_numbers`.

---

## 6) Staff training (operational)

### 6.1 What staff must do daily
1. AIMOS → Call Tracking
2. For each call, set **Outcome**:
   - Booked / Callback / No Answer / Not Qualified / Price Objection / Already Booked / Spam
3. (Optional) Add notes (if you enable notes UI — recommended)

### 6.2 Outcome definitions (suggested)
- **Booked:** appointment scheduled
- **Callback:** needs follow-up call
- **Not qualified:** wrong service area/injury type
- **No answer:** missed/voicemail but no interaction
- **Spam:** robocall/solicitation

---

## 7) QA / test plan

### 7.1 End-to-end test
1. Visit website with UTMs:
   - `?utm_source=google&utm_medium=cpc&utm_campaign=test` or add `gclid=TEST`
2. Confirm phone swaps to the tracking number.
3. Call the displayed number.
4. Verify in Supabase:
   - `call_tracking_calls` row created
   - attribution fields populated
   - `lead_id` created in `crm_leads`
5. Verify call forwards to clinic number.
6. Tag outcome in AIMOS.
7. Verify reporting stats change.

### 7.2 Edge cases
- direct visit (no UTMs)
- two browsers hitting site at the same time (watch for mis-attribution if single number is shared)
- call missed → voicemail fallback recording url is saved

---

## 8) Recommended next steps (v1 → v1.1)

1. **Validate Twilio signatures** (`X-Twilio-Signature`) on the voice webhook.
2. Add number leasing for high-concurrency DNI (if needed).
3. Add outcome notes UI + link booking records to calls.
4. Implement Google Ads Offline Conversions upload using stored `gclid` when outcome becomes `booked`.
