-- Create Orville's user account
-- This creates both auth user and profile in one transaction

DO $$
DECLARE
  new_user_id UUID;
  clinic_id UUID;
  encrypted_password TEXT;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Get first clinic
  SELECT id INTO clinic_id FROM clinics LIMIT 1;
  
  -- Create auth user with password 'AIM2026!'
  -- Password hash for 'AIM2026!' using bcrypt
  encrypted_password := crypt('AIM2026!', gen_salt('bf'));
  
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
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'orville@aimrehab.ca',
    encrypted_password,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated'
  );

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
    json_build_object('sub', new_user_id::text, 'email', 'orville@aimrehab.ca'),
    'email',
    now(),
    now(),
    now()
  );

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
  );

  RAISE NOTICE 'User created successfully! ID: %', new_user_id;
  RAISE NOTICE 'Email: orville@aimrehab.ca';
  RAISE NOTICE 'Password: AIM2026!';
END $$;
