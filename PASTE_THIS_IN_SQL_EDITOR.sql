-- ═══════════════════════════════════════════════════════════════
-- PASTE THIS IN SUPABASE SQL EDITOR AND CLICK "RUN"
-- https://supabase.com/dashboard/project/optlghedswctsklcxlkn/sql/new
-- ═══════════════════════════════════════════════════════════════

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'executive',
  phone TEXT,
  primary_clinic_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Insert your profile
INSERT INTO public.user_profiles (id, email, first_name, last_name, role, phone, is_active)
VALUES (
  '6cf8dbf7-58c7-4451-a7b1-e9eef572a15b',
  'orville@aimrehab.ca',
  'Orville',
  'Davis',
  'executive',
  '780-215-2887',
  true
);

-- Done! Now go log in at https://aimos-ebon.vercel.app
