-- Step 1: Fix UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create wrapper function in public schema
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid AS $$
  SELECT extensions.uuid_generate_v4();
$$ LANGUAGE SQL STABLE;

-- Step 2: Create minimal schema for user login
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'executive',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Step 3: Reset password for existing user
UPDATE auth.users 
SET 
  encrypted_password = crypt('AIM2026!Executive', gen_salt('bf')),
  email_confirmed_at = NOW()
WHERE email = 'orville@aimrehab.ca';

-- Step 4: Create profile for existing user
INSERT INTO public.user_profiles (id, email, first_name, last_name, role, phone, is_active)
SELECT 
  id,
  'orville@aimrehab.ca',
  'Orville',
  'Davis',
  'executive',
  '780-215-2887',
  true
FROM auth.users 
WHERE email = 'orville@aimrehab.ca'
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active;
