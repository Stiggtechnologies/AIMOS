/*
  AIMOS Native Online Booking Schema (Public booking + safety primitives)
  - Adds booking_services, slot holds, intake submissions, tokens, audit events
  - Integrates with existing: clinics, services, patients, patient_appointments, crm_leads, crm_bookings

  NOTE: If patient_appointments does not exist in your current DB, create/restore it first.
*/

-- Booking services (what is bookable online)
CREATE TABLE IF NOT EXISTS public.booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  public_name text NOT NULL,
  public_description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  appointment_type text NOT NULL,
  min_notice_minutes integer NOT NULL DEFAULT 120,
  max_days_out integer NOT NULL DEFAULT 30,
  requires_intake boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, public_name)
);

ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Allow public read for active booking services (optional; safe if no sensitive data)
DROP POLICY IF EXISTS "Public can view active booking services" ON public.booking_services;
CREATE POLICY "Public can view active booking services"
  ON public.booking_services FOR SELECT
  USING (active = true);

-- Slot holds to prevent race conditions
CREATE TABLE IF NOT EXISTS public.booking_slot_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  booking_service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  provider_id uuid NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held','consumed','expired','released')),
  hold_expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_clinic_start ON public.booking_slot_holds(clinic_id, slot_start);
CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_expires ON public.booking_slot_holds(hold_expires_at);

-- Reduce collisions: only one active hold per clinic+time window.
-- This is intentionally conservative. If you later support multiple providers at same time, include provider_id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_booking_active_hold_per_slot'
  ) THEN
    ALTER TABLE public.booking_slot_holds
      ADD CONSTRAINT uniq_booking_active_hold_per_slot
      UNIQUE (clinic_id, slot_start, slot_end, status);
  END IF;
END $$;

ALTER TABLE public.booking_slot_holds ENABLE ROW LEVEL SECURITY;

-- Default: no direct public access
DROP POLICY IF EXISTS "No public access slot holds" ON public.booking_slot_holds;
CREATE POLICY "No public access slot holds"
  ON public.booking_slot_holds FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Intake submissions
CREATE TABLE IF NOT EXISTS public.booking_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  booking_service_id uuid NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  date_of_birth date,
  chief_complaint text,
  consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booking_intake_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access intake submissions" ON public.booking_intake_submissions;
CREATE POLICY "No public access intake submissions"
  ON public.booking_intake_submissions FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Action tokens (cancel/reschedule links)
CREATE TABLE IF NOT EXISTS public.booking_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  crm_booking_id uuid,
  token text NOT NULL UNIQUE,
  token_type text NOT NULL CHECK (token_type IN ('cancel','reschedule','confirm')),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_tokens_token ON public.booking_tokens(token);
ALTER TABLE public.booking_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access tokens" ON public.booking_tokens;
CREATE POLICY "No public access tokens"
  ON public.booking_tokens FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Audit events
CREATE TABLE IF NOT EXISTS public.booking_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id),
  booking_service_id uuid REFERENCES public.booking_services(id),
  hold_id uuid REFERENCES public.booking_slot_holds(id),
  appointment_id uuid,
  crm_lead_id uuid,
  crm_booking_id uuid,
  ip_hash text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_audit_events_created ON public.booking_audit_events(created_at DESC);
ALTER TABLE public.booking_audit_events ENABLE ROW LEVEL SECURITY;

-- Internal authenticated users can view audit (tune as needed)
DROP POLICY IF EXISTS "Authenticated can view booking audit" ON public.booking_audit_events;
CREATE POLICY "Authenticated can view booking audit"
  ON public.booking_audit_events FOR SELECT
  TO authenticated
  USING (true);
