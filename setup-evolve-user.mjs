#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// ─── Configuration ──────────────────────────────────────────
// Uses the current production Supabase instance.
// Pass the service role key via env var or replace the placeholder below.
const supabaseUrl = process.env.SUPABASE_URL || 'https://tfnoogotbyshsznpjspk.supabase.co';
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '<PASTE_SERVICE_ROLE_KEY_HERE>';

if (serviceKey.startsWith('<')) {
  console.error('ERROR: Set the SUPABASE_SERVICE_ROLE_KEY environment variable first.');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
  console.error('  node setup-evolve-user.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EMAIL    = 'Evolve@aimphysiotherapy.ca';
const PASSWORD = 'EvolveAIM2026!';

console.log('Setting up Evolve partner account...\n');

try {
  // ── Step 1: Create or update auth user ────────────────────
  console.log('Step 1: Checking for existing user...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('Error listing users:', listError); process.exit(1); }

  let user = users.find(u => u.email === EMAIL);

  if (!user) {
    console.log('Creating new auth user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: 'Evolve Strength', last_name: 'Partner' }
    });
    if (error) { console.error('Error creating user:', error); process.exit(1); }
    user = data.user;
    console.log('  Auth user created:', user.id);
  } else {
    console.log('  Auth user exists:', user.id);
    // Reset password to the expected value
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true
    });
    if (error) { console.error('Error updating password:', error); }
    else       { console.log('  Password reset to expected value.'); }
  }

  // ── Step 2: Upsert user profile ───────────────────────────
  console.log('\nStep 2: Creating user profile...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: EMAIL,
      first_name: 'Evolve Strength',
      last_name: 'Partner',
      role: 'partner_read_only',
      is_active: true
    }, { onConflict: 'id' });

  if (profileError) { console.error('Profile error:', profileError); }
  else              { console.log('  Profile created/updated (role: partner_read_only).'); }

  // ── Step 3: Grant clinic access ───────────────────────────
  console.log('\nStep 3: Granting clinic access...');
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name')
    .ilike('name', '%South Commons%')
    .maybeSingle();

  if (clinic) {
    const { error: accessError } = await supabase
      .from('clinic_access')
      .upsert({
        user_id: user.id,
        clinic_id: clinic.id,
        role: 'partner_read_only',
        granted_at: new Date().toISOString()
      }, { onConflict: 'user_id,clinic_id' });

    if (accessError) { console.error('Clinic access error:', accessError); }
    else             { console.log(`  Clinic access granted: ${clinic.name} (${clinic.id})`); }
  } else {
    console.log('  WARNING: AIM South Commons clinic not found.');
  }

  // ── Step 4: Test login ────────────────────────────────────
  console.log('\nStep 4: Testing login...');
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD
  });

  if (signInError) { console.error('  Login test FAILED:', signInError.message); }
  else             { console.log('  Login test PASSED.'); }

  console.log('\n' + '='.length);
  console.log('='.repeat(50));
  console.log('  SETUP COMPLETE');
  console.log('='.repeat(50));
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Role:     partner_read_only`);
  console.log('='.repeat(50) + '\n');

} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
