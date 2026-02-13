import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// AIMOS After-Hours Recording Complete Handler
// Updates call status when recording is complete

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const duration = formData.get('RecordingDuration') as string;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Update call with recording info
    await fetch(`${supabaseUrl}/rest/v1/after_hours_calls?twilio_call_sid=eq.${callSid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        recording_url: recordingUrl,
        call_duration_seconds: parseInt(duration) || 0,
        call_status: 'recorded',
        call_ended_at: new Date().toISOString()
      })
    });
    
    // Return TwiML to thank caller and hang up
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling Alberta Injury Management. We've recorded your information and will contact you tomorrow during business hours. Have a great evening.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Recording complete error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling. We'll get back to you soon.</Say>
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
