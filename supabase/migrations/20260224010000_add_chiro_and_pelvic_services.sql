/*
  Add new service lines + booking services for:
  - Chiropractic Care
  - Pelvic Floor Therapy (Women)
  - Pelvic Floor Therapy (Men)

  Notes:
  - Safe to run multiple times (ON CONFLICT / DO blocks).
  - Uses clinic code AIM-EDM-001 seeded in 20260219000000_clinic_implementation_phase1.sql
*/

-- 1) CRM service lines
INSERT INTO crm_service_lines (name, slug, description, priority, target_clv, active)
VALUES
  ('Chiropractic Care', 'chiropractic', 'Chiropractic assessment and treatment for pain relief, mobility, and function', 5, 1200.00, true),
  ('Pelvic Floor Therapy - Women', 'pelvic-health-women', 'Confidential pelvic floor physiotherapy for women (prenatal/postpartum, incontinence, pelvic pain)', 6, 2500.00, true),
  ('Pelvic Floor Therapy - Men', 'pelvic-health-men', 'Discreet pelvic floor physiotherapy for men (post-prostate, incontinence, pelvic pain)', 7, 2000.00, true)
ON CONFLICT (slug) DO NOTHING;

-- 2) Extend booking_services to link to CRM + optionally default provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='booking_services' AND column_name='crm_service_line_id'
  ) THEN
    ALTER TABLE public.booking_services
      ADD COLUMN crm_service_line_id uuid REFERENCES crm_service_lines(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='booking_services' AND column_name='default_provider_id'
  ) THEN
    ALTER TABLE public.booking_services
      ADD COLUMN default_provider_id uuid REFERENCES public.user_profiles(id);
  END IF;
END $$;

-- 3) Add public.services rows (optional, but useful for internal catalogs)
INSERT INTO public.services (clinic_id, name, code, description, duration_minutes, is_active)
SELECT
  c.id,
  s.name,
  s.code,
  s.description,
  s.duration_minutes,
  true
FROM public.clinics c
CROSS JOIN (VALUES
  (
    'Chiropractic Care',
    'CHIRO',
    'Evidence-informed chiropractic assessment and treatment focused on reducing pain, improving mobility, and restoring function.',
    60
  ),
  (
    'Pelvic Floor Therapy - Women',
    'PELVIC_W',
    'Confidential pelvic floor physiotherapy for women including prenatal/postpartum care, incontinence, pelvic pain, and return-to-activity planning.',
    60
  ),
  (
    'Pelvic Floor Therapy - Men',
    'PELVIC_M',
    'Discreet pelvic floor physiotherapy for men including post-prostate surgery rehab, incontinence, pelvic pain, and pressure management for return to activity.',
    60
  )
) AS s(name, code, description, duration_minutes)
WHERE c.code = 'AIM-EDM-001'
ON CONFLICT DO NOTHING;

-- 4) Add booking_services rows
-- We link to crm_service_lines so booking-create can set CRM booking service_line_id.
INSERT INTO public.booking_services (
  clinic_id,
  service_id,
  crm_service_line_id,
  public_name,
  public_description,
  duration_minutes,
  appointment_type,
  min_notice_minutes,
  max_days_out,
  requires_intake,
  active
)
SELECT
  c.id,
  ps.id,
  sl.id,
  bs.public_name,
  bs.public_description,
  bs.duration_minutes,
  bs.appointment_type,
  bs.min_notice_minutes,
  bs.max_days_out,
  true,
  true
FROM public.clinics c
CROSS JOIN (VALUES
  (
    'chiropractic',
    'CHIRO',
    'Chiropractic Assessment (60 min)',
    'A focused assessment and treatment plan for back/neck pain, headaches, and mobility limitations. Includes education and a clear next-step plan.',
    60,
    'CHIROPRACTIC_INITIAL',
    120,
    30
  ),
  (
    'pelvic-health-women',
    'PELVIC_W',
    'Pelvic Floor Therapy — Women (60 min)',
    'Confidential pelvic health assessment for postpartum recovery, incontinence, pelvic pain, and pressure/heaviness symptoms. Consent-based and private.',
    60,
    'PELVIC_W_INITIAL',
    240,
    30
  ),
  (
    'pelvic-health-men',
    'PELVIC_M',
    'Pelvic Floor Therapy — Men (60 min)',
    'Discreet pelvic health assessment for post-prostate recovery, bladder control, pelvic pain, and pelvic floor tension. Consent-based and private.',
    60,
    'PELVIC_M_INITIAL',
    240,
    30
  )
) AS bs(service_line_slug, service_code, public_name, public_description, duration_minutes, appointment_type, min_notice_minutes, max_days_out)
JOIN crm_service_lines sl ON sl.slug = bs.service_line_slug
LEFT JOIN public.services ps
  ON ps.clinic_id = c.id
 AND ps.code = bs.service_code
WHERE c.code = 'AIM-EDM-001'
ON CONFLICT (clinic_id, public_name) DO NOTHING;

-- 5) (Optional) Add CRM lead source slugs used in reporting (no-op if already present)
-- Keeping the existing paid sources; service attribution should come via crm_bookings.service_line_id.
