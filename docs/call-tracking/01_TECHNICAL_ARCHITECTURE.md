# AIMOS In‑House Call Tracking System (Business Hours) — Technical Architecture

## Objective
Attribute each inbound business-hours phone call to a marketing source (Google Ads, Meta Ads, Organic, Referral, Direct, etc.) using the existing Twilio + Supabase stack inside AIMOS.

This design uses **Dynamic Number Insertion (DNI)** + **Twilio Voice webhooks** + **CRM linkage** so that:
- A website visitor sees a **source-specific tracking number**.
- When they call, Twilio routes the call through an AIMOS webhook.
- AIMOS logs the call, **snapshots attribution**, optionally creates a **CRM lead**, and forwards to the clinic.
- Staff tag the **call outcome** (Booked, Callback, Spam, etc.), enabling reporting + offline conversion uploads.

---

## Components (AIMOS native)

### Data layer (Supabase Postgres)
**Core tables (already implemented by migration `20260223150000_create_call_tracking_module.sql`):**
- `call_tracking_numbers` — pool of Twilio numbers (E.164). Each can have a **default** attribution.
- `call_tracking_sessions` — DNI sessions created by the website when it requests a tracking number.
- `call_tracking_calls` — call log created/updated from Twilio webhooks. Includes attribution snapshot + CRM linkage.
- `get_call_tracking_stats(start_date, end_date)` — reporting RPC used by AIMOS dashboards.

### Edge functions (Supabase)
- `call-tracking-number` — public endpoint called by the website to select a tracking number + create a session.
- `call-tracking-voice-webhook` — Twilio Voice webhook endpoint to log calls + forward + update final status/voicemail.

### App layer (React)
- `src/components/call-tracking/CallTrackingView.tsx` — staff-facing call list + filters + outcome tagging.
- `src/services/callTrackingService.ts` — read calls + stats and update outcomes.

---

## Twilio number pool strategy

### Strategy A (simplest, recommended for v1): **Dedicated numbers per source**
Allocate 1 Twilio number per channel:
- Google Ads → 1 number
- Meta Ads → 1 number
- Bing Ads → 1 number
- Organic/Referral/Direct → either shared 1 number or separate numbers

**Pros**
- Deterministic attribution even with multiple concurrent website visitors.
- Fewer moving parts.

**Cons**
- Can’t distinguish campaigns/ad groups via number alone (still captured via UTMs/gclid when present).

### Strategy B (more accurate for high concurrency): **True pooled DNI (per source)**
Allocate N numbers per high-volume source (typically Google Ads), then “lease” a number per session for a TTL.

**How to implement pooling cleanly (optional extension):**
- Add a `call_tracking_number_leases` table:
  - `tracking_number_id`, `session_id`, `leased_until`, `created_at`
- `call-tracking-number` picks a number with no active lease; creates/extends a lease.
- Ensures two concurrent visitors don’t see the same number.

**Pros**
- Better attribution under high simultaneous traffic.

**Cons**
- Requires more numbers (cost) + additional logic.

### Strategy C (hybrid): **Dedicated for paid + fallback for everything else**
- Dedicated numbers for Google/Meta/Bing
- A single “main” tracking number for Organic/Referral/Direct

**Pros**
- Keeps cost low while preserving paid attribution.

---

## Dynamic Number Insertion (DNI)

### Flow
1. Visitor lands on marketing site with UTMs / click IDs.
2. Site JS calls `POST /functions/v1/call-tracking-number` with attribution payload.
3. Edge function:
   - classifies the traffic (`source_type`) using click IDs > UTMs > referrer heuristics
   - selects a tracking number from `call_tracking_numbers`
   - creates `call_tracking_sessions` (with `expires_at`)
   - returns `{ session_id, number }`
4. Site replaces visible phone numbers and `tel:` links with the returned number.

### Session TTL
Use a TTL of **30 minutes** for most clinics:
- short enough to reduce mis-attribution
- long enough for typical “browse then call” behavior

Implemented via `CALL_TRACKING_SESSION_TTL_MINUTES`.

### Attribution fields captured
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid` (Google click id)
- `fbclid` (Meta click id)
- `referrer`, `landing_page_url`, `last_page_url`

---

## Twilio call → attribution matching

### Primary match (current implementation)
When a call hits a tracking number:
- look up the `call_tracking_numbers` row by `To` (E.164)
- find the most recent, non-expired `call_tracking_sessions` for that `tracking_number_id` within a lookback window
- attach that session to the call (`session_id`) and **snapshot** attribution onto `call_tracking_calls`

Lookback is controlled by `CALL_TRACKING_SESSION_LOOKBACK_MINUTES` (default 120).

### Why we snapshot attribution onto `call_tracking_calls`
Session rows can expire or be cleaned up; reporting must remain stable.
Storing a denormalized snapshot on the call record guarantees reporting doesn’t change later.

### Known limitation
If multiple visitors share the same tracking number in the lookback window, the call might attach to the most recent session.

Mitigations:
- Use **Strategy A** (dedicated numbers per source)
- or implement **Strategy B** (leases / true pooled DNI)

---

## Call lifecycle + outcomes

### Twilio webhook stages (current edge function)
- `stage=inbound` (default): create call record, create CRM lead, return `<Dial>`
- `stage=dial-result`: Twilio posts Dial status/duration → update call status; if missed, fall back to voicemail
- `stage=voicemail-saved`: Twilio posts recording URL/duration → update call + thank you

### Outcome tagging (staff)
Front desk (or admin) tags calls in AIMOS:
- `booked`, `callback`, `no_answer`, `not_qualified`, `price_objection`, `already_booked`, `spam`

Outcome tagging enables:
- “Booked calls by source” reporting
- offline conversion uploads (Google Ads, Meta)
- training insights (what objections happen most often)

---

## UTM → call → booking attribution logic

### Core attribution principles
1. **Click IDs beat everything:**
   - If `gclid` exists → Google Ads
   - If `fbclid` exists → Meta Ads
2. **UTMs are next:**
   - `utm_medium=cpc/ppc/paid` → paid source inferred from `utm_source`
3. **Referrer heuristics:**
   - Search referrer domains → organic
   - Other external referrers → referral
4. **Else direct**

### Linking to CRM objects
- Each call can create a `crm_leads` row immediately.
- Later, if staff books an appointment, the booking should link to that lead (existing CRM flows).

Optional enhancement:
- Add a `crm_bookings.call_tracking_call_id` FK (or a join table) if you want deterministic booking↔call linkage.

---

## Security and integrity notes
- `call-tracking-number` is public; it writes using `SERVICE_ROLE_KEY`.
- `call-tracking-voice-webhook` should be treated as a secure endpoint; **recommended next step** is to validate `X-Twilio-Signature`.
- RLS: staff can read calls/sessions; only executive/admin can manage number pool.

---

## Observability
Recommended logs/metrics:
- Edge function logs for:
  - number allocation success/fail
  - Twilio webhook inserts/updates
- DB dashboards:
  - calls per source per day
  - % calls with session_id attached
  - % calls tagged with outcome
