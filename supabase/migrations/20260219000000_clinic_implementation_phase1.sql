-- ═══════════════════════════════════════════════════════════════
-- AIMOS CLINIC IMPLEMENTATION - PHASE 1: CORE INFRASTRUCTURE
-- Deployed: February 19, 2026
-- Target: First Clinic Production Ready
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 1. CLINIC FOUNDATION
-- ═══════════════════════════════════════════════════════════════

-- Clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT DEFAULT 'Edmonton',
  province TEXT DEFAULT 'Alberta',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'America/Edmonton',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic settings
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, setting_key)
);

-- Operating hours
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, day_of_week)
);

-- Treatment rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_number TEXT,
  room_type TEXT DEFAULT 'treatment',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services offered
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  base_fee DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. ENHANCED USER MANAGEMENT
-- ═══════════════════════════════════════════════════════════════

-- Drop existing user_profiles if minimal version exists
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Enhanced user profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'clinician',
  department TEXT,
  employee_id TEXT,
  primary_clinic_id UUID REFERENCES public.clinics(id),
  license_number TEXT,
  license_type TEXT,
  license_expiry DATE,
  is_active BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-clinic assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

-- Roles and permissions
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, clinic_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 3. PATIENT MANAGEMENT
-- ═══════════════════════════════════════════════════════════════

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  patient_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT DEFAULT 'Edmonton',
  province TEXT DEFAULT 'Alberta',
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  referring_physician TEXT,
  referral_date DATE,
  occupation TEXT,
  employer TEXT,
  is_active BOOLEAN DEFAULT true,
  first_visit_date DATE,
  last_visit_date DATE,
  total_visits INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient insurance
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  policy_number TEXT,
  group_number TEXT,
  subscriber_name TEXT,
  subscriber_relationship TEXT DEFAULT 'self',
  is_primary BOOLEAN DEFAULT true,
  coverage_start_date DATE,
  coverage_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient consents
CREATE TABLE IF NOT EXISTS public.patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_version TEXT,
  consent_text TEXT,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signature_data TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. SCHEDULING SYSTEM
-- ═══════════════════════════════════════════════════════════════

-- Appointment types
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  duration_minutes INTEGER DEFAULT 60,
  color_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff schedules
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_working BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  patient_id UUID REFERENCES public.patients(id),
  clinician_id UUID REFERENCES public.user_profiles(id),
  room_id UUID REFERENCES public.rooms(id),
  appointment_type_id UUID REFERENCES public.appointment_types(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  parent_appointment_id UUID REFERENCES public.appointments(id),
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  no_show BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id),
  patient_id UUID REFERENCES public.patients(id),
  preferred_days JSONB,
  preferred_times JSONB,
  preferred_clinician_id UUID REFERENCES public.user_profiles(id),
  urgency TEXT DEFAULT 'normal',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Clinics: All authenticated users can view active clinics
CREATE POLICY "Authenticated users can view clinics" ON public.clinics
  FOR SELECT USING (is_active = true);

-- User profiles: Users can view and edit own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clinic managers can view all profiles in their clinic
CREATE POLICY "Clinic managers can view clinic staff" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = user_profiles.primary_clinic_id
    )
  );

-- Patients: Staff can view patients at their clinic
CREATE POLICY "Staff can view clinic patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = patients.clinic_id
    )
  );

CREATE POLICY "Staff can create patients" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = patients.clinic_id
    )
  );

CREATE POLICY "Staff can update clinic patients" ON public.patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = patients.clinic_id
    )
  );

-- Appointments: Staff can manage appointments at their clinic
CREATE POLICY "Staff can manage clinic appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = appointments.clinic_id
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 6. SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Seed default roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
  ('executive', 'Executive level access - all clinics, all features', true),
  ('clinic_manager', 'Clinic manager - full access to assigned clinic', true),
  ('physiotherapist', 'Physiotherapist - patient care and documentation', true),
  ('physio_assistant', 'Physiotherapy assistant - limited patient access', true),
  ('receptionist', 'Receptionist - scheduling and basic patient management', true),
  ('billing_coordinator', 'Billing coordinator - invoicing and payments', true)
ON CONFLICT (name) DO NOTHING;

-- Seed first clinic (will be configured with real data)
INSERT INTO public.clinics (name, code, city, province, is_active) VALUES
  ('AIM Physiotherapy - Edmonton', 'AIM-EDM-001', 'Edmonton', 'Alberta', true)
ON CONFLICT (code) DO NOTHING;

-- Seed default appointment types
INSERT INTO public.appointment_types (clinic_id, name, code, duration_minutes, color_code)
SELECT 
  id,
  type.name,
  type.code,
  type.duration,
  type.color
FROM public.clinics c
CROSS JOIN (VALUES
  ('Initial Assessment', 'INITIAL', 60, '#4CAF50'),
  ('Follow-up Treatment', 'FOLLOWUP', 30, '#2196F3'),
  ('Re-assessment', 'REASSESS', 45, '#FF9800'),
  ('Consultation', 'CONSULT', 15, '#9C27B0'),
  ('Group Session', 'GROUP', 90, '#00BCD4')
) AS type(name, code, duration, color)
WHERE c.code = 'AIM-EDM-001'
ON CONFLICT DO NOTHING;

-- Seed clinic hours (default Monday-Friday 8am-6pm, Saturday 9am-2pm)
INSERT INTO public.clinic_hours (clinic_id, day_of_week, open_time, close_time, is_closed)
SELECT 
  id,
  dow.day,
  dow.open_t::TIME,
  dow.close_t::TIME,
  dow.closed
FROM public.clinics c
CROSS JOIN (VALUES
  (0, '08:00', '18:00', false),  -- Monday
  (1, '08:00', '18:00', false),  -- Tuesday
  (2, '08:00', '18:00', false),  -- Wednesday
  (3, '08:00', '18:00', false),  -- Thursday
  (4, '08:00', '17:00', false),  -- Friday
  (5, '09:00', '14:00', false),  -- Saturday
  (6, NULL, NULL, true)          -- Sunday (closed)
) AS dow(day, open_t, close_t, closed)
WHERE c.code = 'AIM-EDM-001'
ON CONFLICT DO NOTHING;

-- Update Orville's profile with clinic assignment
UPDATE public.user_profiles
SET primary_clinic_id = (SELECT id FROM public.clinics WHERE code = 'AIM-EDM-001'),
    role = 'executive'
WHERE email = 'orville@aimrehab.ca';

-- Assign Orville to clinic
INSERT INTO public.user_clinics (user_id, clinic_id, is_primary)
SELECT 
  up.id,
  c.id,
  true
FROM public.user_profiles up
CROSS JOIN public.clinics c
WHERE up.email = 'orville@aimrehab.ca'
AND c.code = 'AIM-EDM-001'
ON CONFLICT DO NOTHING;

-- Assign executive role to Orville
INSERT INTO public.user_roles (user_id, role_id, clinic_id)
SELECT 
  up.id,
  r.id,
  c.id
FROM public.user_profiles up
CROSS JOIN public.roles r
CROSS JOIN public.clinics c
WHERE up.email = 'orville@aimrehab.ca'
AND r.name = 'executive'
AND c.code = 'AIM-EDM-001'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 7. INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_active ON public.patients(is_active);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician ON public.appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic ON public.user_profiles(primary_clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ═══════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════

-- Verify deployment
SELECT 'Phase 1 Core Infrastructure Deployed Successfully' as status,
       (SELECT COUNT(*) FROM public.clinics) as clinic_count,
       (SELECT COUNT(*) FROM public.patients) as patient_count,
       (SELECT COUNT(*) FROM public.appointments) as appointment_count,
       (SELECT COUNT(*) FROM public.roles) as role_count;