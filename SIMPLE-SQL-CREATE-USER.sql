-- ═══════════════════════════════════════════════════════════════
-- RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/optlghedswctsklcxlkn/editor
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  new_user_id UUID;
  clinic_id UUID;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := '11111111-1111-1111-1111-111111111111'::uuid;
  
  -- Get first clinic
  SELECT id INTO clinic_id FROM clinics LIMIT 1;
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'orville@aimrehab.ca',
    crypt('AIM2026!Executive', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create identity
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
    new_user_id,
    format('{"sub":"%s","email":"orville@aimrehab.ca"}', new_user_id)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider, id) DO NOTHING;

  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    new_user_id,
    'orville@aimrehab.ca',
    'Orville',
    'Davis',
    'executive',
    clinic_id,
    '780-215-2887',
    true
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ USER CREATED!';
  RAISE NOTICE 'Email: orville@aimrehab.ca';
  RAISE NOTICE 'Password: AIM2026!Executive';
  RAISE NOTICE 'Login at: https://aimos-ebon.vercel.app';
END $$;
