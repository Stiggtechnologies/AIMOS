# AIMOS Native Online Booking — Implementation Roadmap

This plan assumes AIMOS already has clinic + patient + basic scheduler tables in Supabase, and existing Twilio edge functions.

## Phase Breakdown
- **Phase 0 (prep):** confirm schema + decide “source of truth” for appointments.
- **Phase 1 (MVP):** online booking with availability, slot holds, confirmation SMS.
- **Phase 2:** reschedule/cancel links, reminders, analytics, staff tooling.
- **Phase 3:** optimization + experiments, multi-clinic scaling.

---

## Week-by-Week Plan (6 weeks)

### Week 1 — Discovery + Schema Foundation
**Goals:** lock requirements, confirm existing tables, add booking schema.

Tasks
- Verify tables exist in current Supabase project:
  - `patient_appointments`, `clinician_schedules`, `clinic_hours`, `services`, `patients`
- Confirm desired booking types and mapping:
  - public service list → internal `services` rows
  - `appointment_type` values expected by Scheduler
- Implement migration: booking schema additions
  - `booking_services`, `booking_slot_holds`, `booking_intake_submissions`, `booking_tokens`, `booking_audit_events`
- Add RLS policies (default deny public; allow authenticated internal where appropriate)

Dependencies
- Supabase access, migration pipeline

Deliverables
- Migration SQL merged + applied
- Seed `booking_services` for 1 clinic

### Week 2 — Availability Service + Slot Holds (Edge)
**Goals:** compute availability safely and reserve slots.

Tasks
- Build edge function `booking-availability`
  - reads clinic hours, provider schedules (if used), existing appointments
  - returns slots for next 7 days
- Build edge function `booking-hold-slot`
  - creates hold w/ TTL (e.g., 5 minutes)
  - prevents collisions (unique constraint + transactional insert)
- Add basic rate limiting and audit events

Dependencies
- Accurate schedule/blocks data in `clinician_schedules`

Deliverables
- Edge functions deployed
- Postman/curl scripts for manual testing

### Week 3 — Booking Create (Edge) + CRM integration
**Goals:** atomic creation of patient + appointment + CRM records.

Tasks
- Build edge function `booking-create`
  - validates hold (not expired, correct slot)
  - creates `booking_intake_submissions`
  - upserts `patients` (by phone/email)
  - inserts `patient_appointments`
  - inserts `crm_leads` + `crm_bookings` (with UTM attribution)
  - consumes hold (status=consumed)
  - sends confirmation SMS via Twilio (reuse `comm-send-sms` patterns)
- Generate action tokens (`booking_tokens`) for cancel/reschedule links

Dependencies
- Decide unique patient matching strategy (phone first, then email)

Deliverables
- End-to-end booking via API

### Week 4 — Public Frontend `/book` (React)
**Goals:** conversion-optimized booking flow.

Tasks
- Implement `BookingFlow.tsx` wizard
  - Step 1: clinic (if multiple)
  - Step 2: service selection
  - Step 3: choose slot (calls availability)
  - Step 4: details + consent (creates hold then booking)
  - Step 5: confirmation screen
- Client-side resilience
  - slot hold expiration handling
  - back/forward behavior
- Instrument step analytics (events only; no PHI in analytics)

Dependencies
- UI/brand requirements for aimphysiotherapy.ca

Deliverables
- `/book` route in app
- Mobile QA complete

### Week 5 — Cancellation + Reminders + Staff Visibility
**Goals:** reduce no-shows and improve support.

Tasks
- Edge function `booking-cancel` (token-based)
  - updates `patient_appointments.status=cancelled`
  - updates `crm_bookings.status=cancelled`
  - records audit event
- Add reminder job (choose one):
  - Supabase scheduled function (if available) OR
  - lightweight cron invoking edge function daily
- Admin view: recent online bookings + status + contact

Deliverables
- Cancel from link works
- Reminder sends for upcoming bookings

### Week 6 — Hardening + Migration from Practice Perfect
**Goals:** production readiness and cutover.

Tasks
- Load testing on availability endpoint
- Security review:
  - RLS
  - edge function auth
  - PII handling
- Monitoring dashboards:
  - booking volume
  - conversion by step
  - error rates
- Cutover plan
  - Update website links/forms to point to `/book`
  - Disable PP online booking widget
  - Staff SOP update

Deliverables
- Production launch
- Runbook + rollback plan

---

## Testing Strategy

### Unit tests
- Availability algorithm: slot generation, block subtraction, min-notice logic.
- Hold validation: expiry, uniqueness.

### Integration tests
- Happy path: choose slot → hold → booking-create → appointment appears in Scheduler.
- Duplicate booking attempts at same slot.
- Hold expires before booking-create.
- CRM records created with correct UTM.

### Manual QA (mobile-first)
- iPhone Safari / Chrome Android
- Slow network
- Back button behavior

---

## Migration Plan From Practice Perfect

### Step 1 — Parallel run (1–2 weeks)
- Keep PP operational for internal scheduling.
- Run AIMOS booking for **new online bookings only**.
- Staff monitors SchedulerView to confirm new bookings appear.

### Step 2 — Cutover
- Replace PP booking link/widget on aimphysiotherapy.ca.
- Update Google Ads landing pages to `/book`.

### Step 3 — Cleanup / deprecation
- Stop any PP write-back dependencies for bookings.
- Keep PP read-only import (if needed) until fully retired.

---

## Key Decisions (Need Owner Sign-off)
- Provider selection strategy:
  - (A) user chooses provider
  - (B) system assigns provider (recommended MVP)
- Patient matching:
  - phone-only vs phone+dob
- Consent requirements:
  - SMS consent default?
  - privacy/terms gating
