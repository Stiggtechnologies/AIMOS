import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// AIMOS After-Hours Incoming Call Handler
// Receives Twilio webhook for incoming calls and returns TwiML

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function createTwiML(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${body}</Say>
  <Pause length="1"/>
  <Record 
    maxLength="120"
    transcribe="true"
    transcribeCallback="${Deno.env.get('SUPABASE_URL')}/functions/v1/process-voice-intake"
    action="${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-recording-complete"
    playBeep="true"
  />
</Response>`;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create initial call record
    await fetch(`${supabaseUrl}/rest/v1/after_hours_calls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        twilio_call_sid: callSid,
        from_number: from,
        to_number: to,
        call_started_at: new Date().toISOString(),
        call_status: 'initiated'
      })
    });
    
    const greeting = `Hello, you've reached Alberta Injury Management. 
    Our clinic is currently closed, but we'd like to help capture your information 
    so we can get back to you first thing tomorrow morning.
    Please describe your injury or concern, and tell us how we can help you. 
    You'll have up to two minutes. Press any key when you're done, or just wait for the beep.`;
    
    const twiml = createTwiML(greeting);
    
    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Incoming call error:', error);
    
    // Fallback TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We apologize, but we're experiencing technical difficulties. Please call back later or visit our website.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        ...corsHeaders
      }
    });
  }
});
