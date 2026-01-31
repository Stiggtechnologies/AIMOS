// Debug test to see what's actually happening

const SUPABASE_URL = 'https://tfnoogotbyshsznpjspk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M';

async function test() {
  console.log('Step 1: Authenticating...');

  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'jennifer.clinician@aimrehab.ca',
      password: 'Demo2026!Clinician'
    })
  });

  const authData = await authResponse.json();
  console.log('Auth successful:', authData.user?.email);

  const accessToken = authData.access_token;

  console.log('\nStep 2: Calling OpenAI edge function...');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Say hello!' }
      ],
      model: 'gpt-4o-mini'
    })
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('\nResponse body:', responseText);

  try {
    const json = JSON.parse(responseText);
    console.log('\nParsed JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('\nNot JSON response');
  }
}

test().catch(console.error);
