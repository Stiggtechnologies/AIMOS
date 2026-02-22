-- Create auth user for Orville with password 'AIM2026!'
-- Run this in Supabase SQL Editor if login doesn't work

DO $$
DECLARE
  existing_profile_id UUID;
  encrypted_password TEXT;
BEGIN
  -- Get the existing profile ID
  SELECT id INTO existing_profile_id 
  FROM public.user_profiles 
  WHERE email = 'orville@aimrehab.ca';
  
  IF existing_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for orville@aimrehab.ca';
  END IF;
  
  -- Check if auth user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = existing_profile_id) THEN
    RAISE NOTICE 'Auth user already exists!';
  ELSE
    -- Create auth user with password 'AIM2026!'
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
      existing_profile_id,
      '00000000-0000-0000-0000-000000000000',
      'orville@aimrehab.ca',
      encrypted_password,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Orville","last_name":"Davis"}',
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
      existing_profile_id,
      json_build_object('sub', existing_profile_id::text, 'email', 'orville@aimrehab.ca'),
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Auth user created successfully!';
    RAISE NOTICE 'Email: orville@aimrehab.ca';
    RAISE NOTICE 'Password: AIM2026!';
    RAISE NOTICE 'Profile ID: %', existing_profile_id;
  END IF;
END $$;
