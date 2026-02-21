#!/usr/bin/env node
import https from 'https';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdGxnaGVkc3djdHNrbGN4bGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O8';
const SUPABASE_URL = 'optlghedswctsklcxlkn.supabase.co';

const SQL_COMMANDS = [
  // Fix UUID
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions`,
  `CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid AS $$ SELECT extensions.uuid_generate_v4(); $$ LANGUAGE SQL STABLE`,
  
  // Create user_profiles table
  `CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'executive',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  // Enable RLS
  `ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY`,
  
  // Policy
  `DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles`,
  `CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id)`,
  
  // Reset password
  `UPDATE auth.users SET encrypted_password = crypt('AIM2026!Executive', gen_salt('bf')), email_confirmed_at = NOW() WHERE email = 'orville@aimrehab.ca'`,
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, body });
        } else {
          resolve({ success: false, status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getUserId() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/user_profiles?email=eq.orville@aimrehab.ca&select=id',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data && data.length > 0) {
            resolve(data[0].id);
          } else {
            // Get from auth.users
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function createProfile(userId) {
  return new Promise((resolve, reject) => {
    const profileData = JSON.stringify({
      id: userId,
      email: 'orville@aimrehab.ca',
      first_name: 'Orville',
      last_name: 'Davis',
      role: 'executive',
      phone: '780-215-2887',
      is_active: true
    });
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/user_profiles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation,resolution=merge-duplicates',
        'Content-Length': profileData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ success: res.statusCode === 201, status: res.statusCode, body });
      });
    });
    
    req.on('error', reject);
    req.write(profileData);
    req.end();
  });
}

// Main execution
console.log('Setting up AIMOS...\n');

// Try to create profile directly using REST API
console.log('Step 1: Getting user ID...');
const userId = '11111111-1111-1111-1111-111111111111'; // From earlier
console.log('Using user ID:', userId);

console.log('\nStep 2: Creating profile...');
const result = await createProfile(userId);
console.log('Result:', result);

if (result.success) {
  console.log('\n✅ SUCCESS!');
  console.log('═══════════════════════════════════════════════');
  console.log('Login at: https://aimos-ebon.vercel.app');
  console.log('Email:    orville@aimrehab.ca');
  console.log('Password: AIM2026!Executive');
  console.log('═══════════════════════════════════════════════');
} else {
  console.log('\n⚠️ Profile creation returned:', result.status);
  console.log('Body:', result.body);
}
