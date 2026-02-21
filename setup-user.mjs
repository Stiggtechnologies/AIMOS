#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://optlghedswctsklcxlkn.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdGxnaGVkc3djdHNrbGN4bGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE5NjI2MSwiZXhwIjoyMDgzNzcyMjYxfQ.DISM-4j8hspMUqxfqzL6uGnIR0b_uf51JW0WiUl32O0';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Setting up AIMOS user account...\n');

try {
  // Step 1: Get existing user
  console.log('Step 1: Checking for existing user...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }
  
  let user = users.find(u => u.email === 'orville@aimrehab.ca');
  
  if (!user) {
    // Create user
    console.log('Creating new user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'orville@aimrehab.ca',
      password: 'AIM2026!Executive',
      email_confirm: true,
      user_metadata: {
        first_name: 'Orville',
        last_name: 'Davis'
      }
    });
    
    if (error) {
      console.error('Error creating user:', error);
      process.exit(1);
    }
    
    user = data.user;
    console.log('✅ User created:', user.id);
  } else {
    console.log('✅ User exists:', user.id);
    
    // Update password
    console.log('Updating password...');
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'AIM2026!Executive',
      email_confirm: true
    });
    
    if (error) {
      console.error('Error updating password:', error);
    } else {
      console.log('✅ Password updated');
    }
  }
  
  // Step 2: Create user profile
  console.log('\nStep 2: Creating user profile...');
  
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: 'orville@aimrehab.ca',
      first_name: 'Orville',
      last_name: 'Davis',
      role: 'executive',
      phone: '780-215-2887',
      is_active: true
    }, {
      onConflict: 'id'
    })
    .select();
  
  if (profileError) {
    console.error('Profile error:', profileError);
    console.log('This might be OK if the table doesn\'t exist yet');
  } else {
    console.log('✅ Profile created/updated');
  }
  
  // Step 3: Test login
  console.log('\nStep 3: Testing login...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'orville@aimrehab.ca',
    password: 'AIM2026!Executive'
  });
  
  if (signInError) {
    console.error('❌ Login test failed:', signInError.message);
    console.log('\nPlease wait a few seconds and try logging in manually.');
  } else {
    console.log('✅ Login test successful!');
  }
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ SETUP COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log('Login at: https://aimos-ebon.vercel.app');
  console.log('Email:    orville@aimrehab.ca');
  console.log('Password: AIM2026!Executive');
  console.log('═══════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
