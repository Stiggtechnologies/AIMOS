import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// AIMOS After-Hours Voice Intake Processor
// Transcribes call, extracts data with AI, creates CRM lead

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIExtractedData {
  patient_name?: string;
  injury_description?: string;
  pain_level?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  phone_number?: string;
  email?: string;
}

async function analyzeTranscription(transcription: string): Promise<AIExtractedData> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiKey) {
    console.warn('No OpenAI key, returning default analysis');
    return {
      injury_description: transcription,
      urgency_level: 'medium'
    };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant analyzing after-hours call transcriptions for a medical clinic. Extract key information and assess urgency.

Return JSON with:
- patient_name: Full name if mentioned
- injury_description: Brief summary of injury/concern
- pain_level: low/moderate/high/severe if mentioned
- urgency_level: emergency (needs ER), high (next day priority), medium (routine), low (non-urgent)
- phone_number: If mentioned (E.164 format)
- email: If mentioned

Urgency guidelines:
- emergency: severe pain, inability to move, chest pain, neurological symptoms
- high: significant pain/limitation, recent injury, WCB/MVA
- medium: moderate symptoms, general rehab
- low: wellness, maintenance, questions`
          },
          {
            role: 'user',
            content: transcription
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);
    
    return {
      urgency_level: extracted.urgency_level || 'medium',
      ...extracted
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      injury_description: transcription,
      urgency_level: 'medium'
    };
  }
}

async function createCRMLead(callId: string, supabaseUrl: string, serviceKey: string) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/create_lead_from_after_hours_call`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ call_id: callId })
      }
    );
    
    if (!response.ok) {
      console.error('Failed to create lead:', await response.text());
    }
  } catch (error) {
    console.error('Error creating lead:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const transcription = formData.get('TranscriptionText') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    
    // Analyze transcription with AI
    const extracted = await analyzeTranscription(transcription);
    
    // Get the call record
    const callResponse = await fetch(
      `${supabaseUrl}/rest/v1/after_hours_calls?twilio_call_sid=eq.${callSid}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        }
      }
    );
    
    const calls = await callResponse.json();
    const callId = calls[0]?.id;
    
    if (!callId) {
      throw new Error(`Call not found for ${callSid}`);
    }
    
    // Update call with transcription and AI analysis
    await fetch(`${supabaseUrl}/rest/v1/after_hours_calls?id=eq.${callId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        recording_url: recordingUrl,
        transcription: transcription,
        ai_extracted_data: extracted,
        patient_name: extracted.patient_name,
        patient_phone: extracted.phone_number,
        patient_email: extracted.email,
        injury_description: extracted.injury_description,
        pain_level: extracted.pain_level,
        urgency_level: extracted.urgency_level,
        call_status: 'transcribed'
      })
    });
    
    // Create CRM lead automatically
    await createCRMLead(callId, supabaseUrl, serviceKey);
    
    console.log(`Processed call ${callSid}, urgency: ${extracted.urgency_level}`);
    
    return new Response(
      JSON.stringify({ success: true, callId, urgency: extracted.urgency_level }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    console.error('Process intake error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
