# AIMOS In‑House Call Tracking — ROI Analysis

## Summary
AIMOS can replace third-party call tracking tools (e.g., CallRail) by using:
- a small pool of Twilio numbers
- Supabase Edge Functions + database tables
- staff outcome tagging in AIMOS

This yields:
- lower monthly software cost
- tighter integration with CRM + bookings
- better attribution quality (especially for Google Ads / Meta Ads)

---

## Cost breakdown

### A) Twilio (typical)
Costs vary by country and call volume; for North America, a practical estimate:
- Local numbers: **~$1–$2 / number / month**
- Inbound minutes: **usage-based** (depends on call volume)

Example (low-medium volume):
- 4 tracking numbers (Google/Meta/Bing/Main) × ~$1.50 ≈ **$6/mo**
- Inbound minutes, say 500 minutes × ~$0.01–$0.02 ≈ **$5–$10/mo**
- Total estimated Twilio incremental: **~$10–$25/mo**

Add a buffer and you land near the target: **~$30/mo**.

### B) CallRail (typical)
Common pricing ranges (varies by plan/features):
- **$45–$145+/mo**
- plus add-ons (form tracking, conversation intelligence, etc.)

### C) AIMOS (in-house)
- No added SaaS subscription
- Engineering time to implement/maintain
- Minimal ongoing cost aside from Twilio usage

---

## Value created (what improves)

### 1) Attribution accuracy for paid channels
With DNI, each visitor sees a tracking number and calls are logged with:
- `gclid` (Google)
- `fbclid` (Meta)
- UTMs

This enables:
- “Booked calls by campaign” reporting (when UTMs are present)
- channel-level call conversion rates

### 2) Closing the loop with CRM + bookings
Because calls create (or link to) `crm_leads`, you can measure:
- lead → booking conversion
- booking rates by source
- downstream revenue by source (once cases/visits are tracked)

### 3) Operational coaching
Outcome tagging reveals:
- objections patterns (price, not qualified)
- missed call rates
- callback workload

---

## Expected financial ROI (example model)

Assumptions (editable):
- CallRail cost: $95/mo
- Twilio incremental cost: $30/mo
- Net savings: $65/mo

If improved attribution/feedback loops produce just **1 extra booked patient/month** and the clinic’s margin per case is **$300**, then:
- incremental profit: $300/mo
- plus savings: $65/mo
- total benefit: **$365/mo**

Even at conservative numbers, the payback is strong.

---

## Google Ads Offline Conversions (incremental ROI)

### Why it matters
Uploading offline conversions back into Google Ads (using `gclid`) improves:
- bidding optimization
- true CPA measurement
- ability to optimize campaigns for **booked calls**, not just clicks

### AIMOS capability
AIMOS already stores `gclid` on:
- `call_tracking_sessions`
- `call_tracking_calls`

Once staff tags outcome = `booked` (and ideally links to booking time/value), AIMOS can:
- submit a conversion event via Google Ads API

Expected improvement:
- better bidding signals → lower CPA or more volume at same spend
- a realistic estimate is a **5–20% efficiency gain** over time depending on baseline tracking quality

---

## Risks / tradeoffs

### Engineering + maintenance
- Need to monitor webhooks and Edge Function logs
- Twilio signature validation should be added

### Attribution edge cases
- If the same tracking number is shared by multiple concurrent visitors, matching may drift.

Mitigation:
- dedicated numbers per source (v1)
- pooled leasing (v1.1) if traffic justifies it

### Staff compliance
Outcome tagging must be part of routine.
Mitigation:
- daily checklist
- dashboard shows “% calls tagged”

---

## Recommendation
Start with:
- 1 tracking number per major paid source (Google/Meta/Bing)
- 1 “Main” tracking number for direct/organic/referral

Then, if Google Ads concurrency grows:
- add 1–3 more Google numbers and implement number leasing.
