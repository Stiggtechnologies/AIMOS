/*
  # Create Booking Services Table for Online Booking
  
  1. New Tables
    - `booking_services` - Services available for online booking
    - `booking_slot_holds` - Temporary holds on time slots
    - `booking_intake_submissions` - Patient intake forms
    - `booking_tokens` - Cancel/reschedule tokens
    - `booking_audit_events` - Audit trail
    
  2. Security
    - RLS enabled on all tables
    - Public can view active booking services
    - Other tables restricted to authenticated/edge functions
    
  3. Seed Data
    - Adds common service types for existing clinics
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

-- Allow public read for active booking services (public booking page needs this)
CREATE POLICY "Public can view active booking services"
  ON public.booking_services FOR SELECT
  USING (active = true);

-- Staff can manage booking services
CREATE POLICY "Staff can manage booking services"
  ON public.booking_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

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

ALTER TABLE public.booking_slot_holds ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (staff) can view holds
CREATE POLICY "Staff can view slot holds"
  ON public.booking_slot_holds FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "Staff can view intake submissions"
  ON public.booking_intake_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

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

CREATE POLICY "Staff can view booking tokens"
  ON public.booking_tokens FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "Authenticated can view booking audit"
  ON public.booking_audit_events FOR SELECT
  TO authenticated
  USING (true);

-- Seed booking services for existing clinics
INSERT INTO public.booking_services (clinic_id, public_name, public_description, duration_minutes, appointment_type, active)
SELECT 
  c.id,
  'Initial Assessment',
  'Comprehensive first visit evaluation with one of our clinicians',
  60,
  'initial_assessment',
  true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_services bs 
  WHERE bs.clinic_id = c.id AND bs.public_name = 'Initial Assessment'
)
ON CONFLICT (clinic_id, public_name) DO NOTHING;

INSERT INTO public.booking_services (clinic_id, public_name, public_description, duration_minutes, appointment_type, active)
SELECT 
  c.id,
  'Follow-up Treatment',
  'Continuation of your treatment plan',
  30,
  'follow_up',
  true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_services bs 
  WHERE bs.clinic_id = c.id AND bs.public_name = 'Follow-up Treatment'
)
ON CONFLICT (clinic_id, public_name) DO NOTHING;

INSERT INTO public.booking_services (clinic_id, public_name, public_description, duration_minutes, appointment_type, active)
SELECT 
  c.id,
  'Sports Injury Consultation',
  'Specialized assessment for sports-related injuries',
  45,
  'sports_consultation',
  true
FROM public.clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_services bs 
  WHERE bs.clinic_id = c.id AND bs.public_name = 'Sports Injury Consultation'
)
ON CONFLICT (clinic_id, public_name) DO NOTHING;
