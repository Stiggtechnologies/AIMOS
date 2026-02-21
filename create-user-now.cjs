#!/usr/bin/env node

// Quick script to create Orville's user account
const https = require('https');

const SUPABASE_URL = 'https://optlghedswctsklcxlkn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.argv[2];

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: Need anon key');
  console.error('Usage: SUPABASE_ANON_KEY=your_key node create-user-now.js');
  console.error('   or: node create-user-now.js your_key');
  process.exit(1);
}

const email = 'orville@aimrehab.ca';
const password = 'AIM2026!Executive';

// Sign up via Supabase Auth
const data = JSON.stringify({
  email: email,
  password: password,
  email_confirm: true,
  data: {
    first_name: 'Orville',
    last_name: 'Davis'
  }
});

const options = {
  hostname: 'optlghedswctsklcxlkn.supabase.co',
  port: 443,
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Length': data.length
  }
};

console.log('Creating user account...');

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const result = JSON.parse(body);
      console.log('\n✅ USER CREATED SUCCESSFULLY!\n');
      console.log('════════════════════════════════════════');
      console.log('Login at: https://aimos-ebon.vercel.app');
      console.log('Email:    orville@aimrehab.ca');
      console.log('Password: AIM2026!Executive');
      console.log('════════════════════════════════════════\n');
      console.log('User ID:', result.user?.id);
      
      // Now create the profile
      createProfile(result.user.id);
    } else {
      console.error('❌ Error creating user:');
      console.error('Status:', res.statusCode);
      console.error('Response:', body);
      
      if (body.includes('already registered')) {
        console.log('\n⚠️  User already exists! Trying to create profile...');
        // Try to get user ID and create profile
        console.log('\nYou can log in with:');
        console.log('Email: orville@aimrehab.ca');
        console.log('Password: AIM2026!Executive');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();

// Create profile function
function createProfile(userId) {
  console.log('\nCreating user profile...');
  
  const profileData = JSON.stringify({
    id: userId,
    email: email,
    first_name: 'Orville',
    last_name: 'Davis',
    role: 'executive',
    phone: '780-215-2887',
    is_active: true
  });
  
  const profileOptions = {
    hostname: 'optlghedswctsklcxlkn.supabase.co',
    port: 443,
    path: '/rest/v1/user_profiles',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Length': profileData.length,
      'Prefer': 'return=representation'
    }
  };
  
  const profileReq = https.request(profileOptions, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        console.log('✅ Profile created successfully!');
        console.log('\nAll done! You can now log in.');
      } else {
        console.error('⚠️  Profile creation status:', res.statusCode);
        console.error('Response:', body);
        console.log('\nYou may need to create the profile manually.');
        console.log('User can still log in, but may not have full access.');
      }
    });
  });
  
  profileReq.on('error', (error) => {
    console.error('Profile creation error:', error);
  });
  
  profileReq.write(profileData);
  profileReq.end();
}
