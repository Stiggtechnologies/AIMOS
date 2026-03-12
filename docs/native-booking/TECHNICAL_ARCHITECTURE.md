# AIMOS Native Online Booking (aimphysiotherapy.ca/book)

## 0) Goals & Non‑Goals

### Goals
- Replace Practice Perfect as the source of truth for **new patient online bookings**.
- Provide **real-time availability**, **slot holding**, and **atomic booking creation**.
- Write bookings into AIMOS data model so they appear in **SchedulerView** (via `patient_appointments`) and **CRM** (via `crm_leads` + `crm_bookings`).
- Support **SMS confirmation/reminders** using existing Twilio infrastructure (`comm-send-sms`, after-hours modules).
- Mobile-first, high-conversion booking flow at `/book`.

### Non‑Goals (Phase 1)
- Complex multi-visit plans, prepaid packages, or provider-specific intake forms beyond a basic intake.
- Full 2-way sync with Practice Perfect (we are **deprecating** PP for online bookings).
- Insurance adjudication.

---

## 1) Current AIMOS Components (Relevant)

### Existing tables (from migrations / code references)
- `clinics`, `clinic_hours`, `clinic_settings`
- `services` (clinic service catalog)
- `patients`
- **Scheduler view** reads from:
  - `patient_appointments` (as seen in `src/services/schedulerService.ts`)
  - `clinician_schedules` (blocks)
- **CRM**:
  - `crm_leads`, `crm_bookings`, `crm_service_lines`, `crm_lead_sources`, etc. (see `20260219020000_create_crm_automation_schema.sql`)

### Existing runtime components
- Supabase (DB + Auth + Edge Functions)
- Twilio: after-hours + inbound/outbound SMS + voice

### Current UI reference
- `src/components/aim-os/SchedulerView.tsx` is read-only but expects canonical data in `patient_appointments`.

---

## 2) Target Architecture (High Level)

**Frontend (Public)**
- `/book` page hosts `BookingFlow` wizard.
- Calls **Supabase Edge Functions** for availability and booking.
- Uses **Supabase anon key** only; all privileged logic stays server-side.

**Backend (Supabase Edge Functions)**
- `booking-availability`: compute/return bookable slots based on clinic hours, provider schedules, existing appointments, and rules.
- `booking-hold-slot`: create a short-lived hold to prevent race conditions.
- `booking-create`: validate hold, upsert lead/patient, create appointment + crm_booking, send confirmation SMS/email.
- `booking-cancel`: authenticated by signed token (from confirmation link) to cancel.

**Database**
- Add booking schema tables:
  - `booking_services` / mapping to `services`
  - `booking_slot_holds`
  - `booking_intake_submissions`
  - `booking_tokens` (signed action links)
  - `booking_audit_events`
- Ensure/verify `patient_appointments` exists (it appears in `schedulerService` and older migrations backup).

**Notifications**
- Use existing `comm-send-sms` edge function (or shared Twilio code) to send:
  - confirmation
  - reminder
  - cancellation

---

## 3) Data Model (Schema Additions)

> Note: AIMOS already has `crm_bookings` and `services`. The booking system needs *operational* tables for public booking safety (holds/tokens/audit) and for intake.

### 3.1 `booking_services`
Purpose: define what can be booked online and how it maps to internal `services` / appointment types.

Recommended columns:
- `id uuid pk`
- `clinic_id uuid -> clinics(id)`
- `service_id uuid -> services(id)`
- `public_name text` (marketing copy)
- `public_description text`
- `duration_minutes int`
- `appointment_type text` (what gets stored in `patient_appointments.appointment_type`)
- `min_notice_minutes int` (e.g., 120)
- `max_days_out int` (e.g., 30)
- `requires_intake boolean`
- `active boolean`

### 3.2 `booking_slot_holds`
Purpose: prevent double-booking while user is filling contact details/payment (if later).

- `id uuid pk`
- `clinic_id uuid`
- `booking_service_id uuid`
- `provider_id uuid null` (optional; if availability is provider-agnostic you can assign later)
- `slot_start timestamptz`
- `slot_end timestamptz`
- `status text` (`held` | `consumed` | `expired` | `released`)
- `hold_expires_at timestamptz` (default now()+5 minutes)
- `session_id text` (from client; non-PII)
- `created_at timestamptz`

Indexes:
- `(clinic_id, slot_start)`
- unique constraint to reduce collisions (see SQL scaffold).

### 3.3 `booking_intake_submissions`
Purpose: capture what the user entered (with consent). Keep separate from `patients` so we can store “pre‑patient” submissions.

- `id uuid pk`
- `clinic_id uuid`
- `booking_service_id uuid`
- `first_name text`
- `last_name text`
- `phone text`
- `email text null`
- `date_of_birth date null`
- `chief_complaint text null`
- `consents jsonb` (sms/email/terms/privacy)
- `utm jsonb` (utm_source, utm_campaign, gclid, fbclid, landing_page_url)
- `raw jsonb` (full payload, future-proof)
- `created_at timestamptz`

### 3.4 `booking_tokens`
Purpose: signed links for cancel/reschedule, and to avoid exposing internal IDs.

- `id uuid pk`
- `booking_id uuid null` (-> `patient_appointments.id` or `crm_bookings.id`, depending on use)
- `token text unique` (random)
- `token_type text` (`cancel` | `reschedule` | `confirm`)
- `expires_at timestamptz`
- `metadata jsonb`
- `created_at timestamptz`

### 3.5 `booking_audit_events`
Purpose: compliance + debugging.

- `id uuid pk`
- `event_type text` (availability_queried, slot_held, booking_created, sms_sent, cancelled)
- `clinic_id uuid`
- `booking_service_id uuid null`
- `hold_id uuid null`
- `appointment_id uuid null`
- `crm_lead_id uuid null`
- `crm_booking_id uuid null`
- `ip_hash text null`
- `user_agent text null`
- `metadata jsonb`
- `created_at timestamptz`

### 3.6 Links to existing CRM
On booking creation:
- Create/Upsert `crm_leads` using phone/email + UTM.
- Insert into `crm_bookings` referencing lead, clinic, service_line (or mapped service line) and `scheduled_at`.

### 3.7 Links to scheduler
On booking creation:
- Insert into `patient_appointments` (the SchedulerView source of truth) with:
  - `patient_id` (created/located)
  - `clinic_id`
  - `provider_id` (optional; if not chosen, choose an available provider in edge fn)
  - `appointment_type`
  - `appointment_date` (date)
  - `start_time`/`end_time` (time)
  - `status` = scheduled/confirmed
  - `chief_complaint`

---

## 4) Availability Algorithm (Phase 1)

### Inputs
- `clinic_id`
- `booking_service_id`
- date range: `start_date` → `end_date` (or a week at a time)
- optional: `provider_preference` (none in phase 1)

### Constraints
- Clinic hours (`clinic_hours`)
- Provider working schedules / blocks (`clinician_schedules`)
- Existing appointments (`patient_appointments`)
- Booking rules:
  - min notice
  - max days out
  - slot granularity (15 min)
  - buffer times between appointments (e.g., 5 min)

### Output
- A list of **bookable slots**: `[{ start, end, provider_id? }]`

### Recommended approach
- Generate candidate slots within clinic open/close times.
- For each provider (or pooled capacity), subtract blocked times:
  - blocks from `clinician_schedules` where `schedule_type` in (break, meeting, admin, training)
  - existing `patient_appointments` not cancelled
  - active holds in `booking_slot_holds` (status=held and not expired)
- If no provider selection, choose the **first provider with availability** and return slot without provider to keep UX simpler; assign provider at booking creation.

---

## 5) API Design (Supabase Edge Functions)

All endpoints are **Edge Functions** under `supabase/functions/*`.

### 5.1 `booking-availability`
**POST** `/functions/v1/booking-availability`

Request:
```json
{
  "clinicId": "uuid",
  "bookingServiceId": "uuid",
  "startDate": "2026-02-23",
  "days": 7,
  "timezone": "America/Edmonton"
}
```

Response:
```json
{
  "ok": true,
  "slots": [
    { "start": "2026-02-25T16:00:00-07:00", "end": "2026-02-25T17:00:00-07:00" }
  ]
}
```

### 5.2 `booking-hold-slot`
**POST** `/functions/v1/booking-hold-slot`

Request:
```json
{ "clinicId": "uuid", "bookingServiceId": "uuid", "start": "...", "end": "...", "sessionId": "..." }
```

Response:
```json
{ "ok": true, "holdId": "uuid", "expiresAt": "..." }
```

### 5.3 `booking-create`
**POST** `/functions/v1/booking-create`

Request:
```json
{
  "clinicId": "uuid",
  "bookingServiceId": "uuid",
  "holdId": "uuid",
  "intake": {
    "firstName": "...",
    "lastName": "...",
    "phone": "+1780...",
    "email": "...",
    "chiefComplaint": "...",
    "consents": { "sms": true, "terms": true, "privacy": true },
    "utm": { "utm_source": "google", "gclid": "..." }
  }
}
```

Response:
```json
{
  "ok": true,
  "appointmentId": "uuid",
  "crmLeadId": "uuid",
  "crmBookingId": "uuid",
  "cancelUrl": "https://aimphysiotherapy.ca/book/cancel?token=..."
}
```

### 5.4 `booking-cancel`
**POST** `/functions/v1/booking-cancel`

Request:
```json
{ "token": "..." }
```

Response:
```json
{ "ok": true }
```

---

## 6) Security & RLS

### Public booking surface area
- Public clients should only call Edge Functions.
- Direct table access from anon role should be **disabled** except for read-only reference data if needed (e.g., list of clinics/services).

### Service role usage
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY`.
- All inserts into booking tables, `patients`, `patient_appointments`, and CRM tables happen server-side.

### Anti-abuse
- Rate limit by IP (basic in-memory edge, or store in `booking_audit_events`).
- Honeypot field in intake form.
- SMS verification (Phase 2) if abuse occurs.

---

## 7) Frontend Component Structure

Proposed public booking folder:
```
src/
  components/
    public-booking/
      BookingFlow.tsx
      steps/
        StepClinic.tsx
        StepService.tsx
        StepSlot.tsx
        StepDetails.tsx
        StepConfirm.tsx
      ui/
        ProgressHeader.tsx
        SlotPicker.tsx
  services/
    booking/
      AvailabilityService.ts
      BookingApi.ts
```

### State model
- `clinicId`
- `bookingServiceId`
- `selectedSlot { start, end }`
- `holdId`
- `intake` fields

### Error handling
- Slot hold expired ⇒ return to slot selection and refresh availability.
- Network errors ⇒ retry.

---

## 8) Integration Points

### SchedulerView
- Bookings show up automatically if `patient_appointments` is updated.

### CRM dashboards
- Create `crm_leads` and `crm_bookings` for attribution + conversion reporting.

### Twilio
- Use `comm-send-sms` for confirmation.
- Optionally also write a message record to `comm_messages` (it already does best-effort storage).

### After-hours
- If booking is within after-hours window, optionally route to after-hours flow or mark as `needs_staff_followup`.

---

## 9) Observability

- Persist key events in `booking_audit_events`.
- Include correlation id (`x-request-id`) in edge function responses.
- Dashboard in admin to see:
  - availability queries count
  - holds created/expired
  - bookings created
  - drop-off per step (frontend analytics)

---

## 10) Appendix: Assumptions to Validate

1. `patient_appointments` and `clinician_schedules` exist in the active Supabase schema (they are referenced by app code; definitions exist in `supabase/migrations_backup`).
2. `services` table is the canonical service catalog for clinics.
3. Phone numbers are stored/handled in E.164.
4. Clinic timezone is `clinics.timezone` (default `America/Edmonton`).
