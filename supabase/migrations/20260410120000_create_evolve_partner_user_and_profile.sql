/*
  # Create Evolve Partner Auth User + Profile

  The migration 20260410024708 was supposed to create the Evolve partner profile
  but only contained the audit trigger fix. This migration completes the work.

  ## What it does
  1. Creates the auth user for Evolve@aimphysiotherapy.ca in auth.users
  2. Creates the auth identity so Supabase Auth recognizes the email/password login
  3. Creates the user_profiles row with partner_read_only role
  4. Grants scoped clinic_access to AIM South Commons (can_manage = false, read-only)

  ## Security
  - partner_read_only role: read-only, no write access across the platform
  - clinic_access restricted to Evolve-linked clinics only (can_manage = false)

  ## Alternative
  If this migration fails (e.g. pgcrypto not available), use setup-evolve-user.mjs instead.
*/

DO $$
DECLARE
  v_evolve_user_id uuid := gen_random_uuid();
  v_south_commons_id uuid;
  encrypted_pw text;
BEGIN

  -- =====================================================
  -- 0. GUARD: skip if user already exists
  -- =====================================================
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'Evolve@aimphysiotherapy.ca') THEN
    RAISE NOTICE 'Auth user Evolve@aimphysiotherapy.ca already exists — skipping creation.';

    -- Still ensure profile + clinic_access exist
    SELECT id INTO v_evolve_user_id FROM auth.users WHERE email = 'Evolve@aimphysiotherapy.ca';
  ELSE
    -- =====================================================
    -- 1. CREATE AUTH USER
    -- =====================================================
    encrypted_pw := crypt('EvolveAIM2026!', gen_salt('bf'));

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      v_evolve_user_id,
      '00000000-0000-0000-0000-000000000000',
      'Evolve@aimphysiotherapy.ca',
      encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Evolve Strength","last_name":"Partner"}'::jsonb,
      'authenticated',
      'authenticated'
    );

    -- =====================================================
    -- 2. CREATE AUTH IDENTITY
    -- =====================================================
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_evolve_user_id,
      jsonb_build_object('sub', v_evolve_user_id::text, 'email', 'Evolve@aimphysiotherapy.ca'),
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Auth user created: Evolve@aimphysiotherapy.ca  (id: %)', v_evolve_user_id;
  END IF;

  -- =====================================================
  -- 3. CREATE USER PROFILE
  -- =====================================================
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    is_active
  ) VALUES (
    v_evolve_user_id,
    'Evolve@aimphysiotherapy.ca',
    'Evolve Strength',
    'Partner',
    'partner_read_only',
    NULL,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'partner_read_only',
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'User profile created/updated for Evolve partner (partner_read_only role).';

  -- =====================================================
  -- 4. GRANT CLINIC ACCESS — AIM South Commons (read-only)
  -- =====================================================
  SELECT id INTO v_south_commons_id
  FROM public.clinics
  WHERE name ILIKE '%South Commons%'
  LIMIT 1;

  IF v_south_commons_id IS NOT NULL THEN
    INSERT INTO public.clinic_access (
      user_id,
      clinic_id,
      role,
      granted_at
    ) VALUES (
      v_evolve_user_id,
      v_south_commons_id,
      'partner_read_only',
      now()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Clinic access granted: AIM South Commons (id: %)', v_south_commons_id;
  ELSE
    RAISE NOTICE 'WARNING: AIM South Commons clinic not found — clinic_access not granted.';
  END IF;

END $$;
