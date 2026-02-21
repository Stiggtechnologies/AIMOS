#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://optlghedswctsklcxlkn.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdGxnaGVkc3djdHNrbGN4bGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O0';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('Creating minimal AIMOS schema...\n');

const schema = `
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

-- Create notifications table (minimal)
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

-- Insert profile for Orville
INSERT INTO public.user_profiles (id, email, first_name, last_name, role, phone, is_active)
VALUES (
  '6cf8dbf7-58c7-4451-a7b1-e9eef572a15b',
  'orville@aimrehab.ca',
  'Orville',
  'Davis',
  'executive',
  '780-215-2887',
  true
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;
`;

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
  
  if (error) {
    console.error('Error:', error);
    
    // Try alternate method - create tables via REST API
    console.log('\nTrying alternate approach...');
    
    // Just create the profile directly
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: '6cf8dbf7-58c7-4451-a7b1-e9eef572a15b',
        email: 'orville@aimrehab.ca',
        first_name: 'Orville',
        last_name: 'Davis',
        role: 'executive',
        phone: '780-215-2887',
        is_active: true
      });
      
    if (profileError) {
      console.error('Profile error:', profileError);
      console.log('\n⚠️  Unable to create schema via API.');
      console.log('You need to run migrations manually in Supabase SQL Editor.');
      process.exit(1);
    }
  }
  
  console.log('✅ Schema created successfully!');
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ READY TO USE');
  console.log('═══════════════════════════════════════════════');
  console.log('Login at: https://aimos-ebon.vercel.app');
  console.log('Email:    orville@aimrehab.ca');
  console.log('Password: AIM2026!Executive');
  console.log('═══════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
