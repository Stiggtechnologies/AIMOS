# AIMOS Native Online Booking — UX Flow (Mobile-first)

## Core principles
- **Fast**: user should see available times within 1–2 seconds.
- **Low friction**: minimal fields before showing availability.
- **Confidence**: clear confirmation, clear clinic address, easy cancel.
- **Accessible**: large tap targets, readable typography, minimal scrolling.

---

## User Journey (Happy Path)

### 1) Land on `/book`
**Primary CTA:** “Book an appointment”

Show immediately:
- Clinic selector (if >1 clinic) with:
  - name
  - city
  - phone
- Service selector cards

Conversion copy:
- “No referral required” / “Direct billing available” (if true)
- “Same-week availability” (only if availability supports it)

### 2) Select service
Service cards:
- “Physiotherapy Assessment (60 min)”
- “Sports Injury Assessment”
- “Massage Therapy”

Each includes:
- duration
- “Best for…”

### 3) Choose time
Slot picker:
- Defaults to next available day
- Tabs: Today / Tomorrow / This week
- Shows 6–12 slots per day with “More times”

UX safeguards:
- If no availability, show:
  - next available date
  - “Call clinic” CTA
  - optional waitlist form

### 4) Enter details + consent
Fields (minimal):
- First name
- Last name
- Phone (required)
- Email (optional but recommended)
- “What’s bothering you?” (optional)
- Consent checkboxes:
  - SMS confirmation/reminders
  - Terms of service
  - Privacy policy

At this step:
- Create slot hold (silent) OR on submit.

### 5) Confirmation
Show:
- Date/time (with timezone)
- Clinic name + address + Google Maps deep link
- What to bring
- “Add to calendar” (ICS download)
- Cancel link (tokenized)

Send:
- Confirmation SMS (and email if provided)

---

## Alternate Flows

### Slot hold expired
Trigger: booking-create returns `HOLD_EXPIRED`.

UI:
- “That time just got booked.”
- Refresh availability automatically.
- Keep user’s entered details in memory.

### Existing patient detected (Phase 2)
If patient match occurs (phone/email), optionally:
- show “Welcome back”
- skip DOB field

### After-hours
If booking is requested outside clinic hours:
- still allow booking for future dates
- offer “Need help now?” with after-hours phone/AI intake

---

## Mobile-first requirements
- Single-column layout
- Sticky bottom CTA bar (Next / Book)
- Slot buttons minimum 44px height
- Phone input uses `tel` keyboard
- Avoid long select lists; use searchable lists if needed

---

## Conversion Optimization Tactics

### Reduce time-to-availability
- Show slots after only selecting clinic+service (no personal details required).
- Cache `booking-availability` response per clinic+service for ~60s.

### Trust signals
- Clinic address + map
- Review stars snippet (if allowed)
- Privacy reassurance (“We never share your data”)

### Friction management
- Optional email
- Optional complaint text
- Remember last clinic selection

### Recovery
- Prominent “Call us” fallback
- Waitlist capture if no slots

---

## Recommended Metrics
- Step conversion rate (Clinic→Service→Slot→Details→Confirm)
- Availability latency (p50/p95)
- Hold expiry rate
- Booking completion time
- No-show rate by source/service
