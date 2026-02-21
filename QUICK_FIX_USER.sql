-- EMERGENCY USER CREATION - RUN THIS IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/optlghedswctsklcxlkn/sql/new

-- Enable UUID extension properly
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a simple user directly in auth.users
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
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
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'orville@aimrehab.ca',
    crypt('AIM2026!Executive', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE
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
    format('{"sub":"%s","email":"orville@aimrehab.ca"}', new_user_id)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ USER CREATED!';
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE 'Email: orville@aimrehab.ca';
  RAISE NOTICE 'Password: AIM2026!Executive';
  RAISE NOTICE 'Login: https://aimos-ebon.vercel.app';
END $$;
