import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Facebook Lead Ads Webhook
//
// This endpoint receives leads from Facebook Lead Ads via:
// 1. Zapier integration (immediate, recommended)
// 2. Facebook Leads Export webhooks (direct, requires setup)
//
// Env:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - FACEBOOK_WEBHOOK_VERIFY_TOKEN (optional, for Facebook direct verification)
//
// Configuration:
// - Zapier: Send POST to this endpoint with Facebook lead data
// - Facebook Direct: Set as webhook URL in Facebook Business Manager

interface FacebookLeadPayload {
  // Facebook native fields
  id?: string;
  created_time?: string;
  field_data?: Array<{ name: string; values: string[] }>;
  
  // Zapier-transformed fields (flattened)
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  
  // Campaign context
  campaign_name?: string;
  campaign_id?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
  form_name?: string;
  
  // Custom fields
  service_interest?: string;
  injury_type?: string;
  pain_level?: string;
  insurance_type?: string;
  preferred_contact?: string;
  additional_notes?: string;
}

function extractFieldValue(fieldData: Array<{ name: string; values: string[] }>, fieldName: string): string | undefined {
  const field = fieldData.find(f => f.name.toLowerCase().includes(fieldName.toLowerCase()));
  return field?.values?.[0];
}

function parsePhoneNumber(phone?: string): string | undefined {
  if (!phone) return undefined;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Ensure it starts with country code (default to +1 for North America)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.length > 7) {
    return `+${digits}`;
  }
  
  return undefined;
}

async function createLeadInAIMOS(payload: FacebookLeadPayload, supabaseUrl: string, serviceKey: string) {
  const headers = {
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
    "Content-Type": "application/json",
  };

  // Parse fields from native Facebook format if present
  let firstName = payload.first_name;
  let lastName = payload.last_name;
  let email = payload.email;
  let phone = payload.phone_number || payload.phone;
  
  if (payload.field_data) {
    firstName = firstName || extractFieldValue(payload.field_data, 'first_name');
    lastName = lastName || extractFieldValue(payload.field_data, 'last_name');
    email = email || extractFieldValue(payload.field_data, 'email');
    phone = phone || extractFieldValue(payload.field_data, 'phone');
    
    // Try full_name if first/last not available
    const fullName = payload.full_name || extractFieldValue(payload.field_data, 'full_name');
    if (fullName && !firstName && !lastName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || parts[0];
    }
  }

  // Parse and format phone number
  const formattedPhone = parsePhoneNumber(phone);
  
  if (!formattedPhone) {
    throw new Error('Valid phone number is required');
  }

  // Get Facebook lead source ID
  const sourcesRes = await fetch(
    `${supabaseUrl}/rest/v1/crm_lead_sources?select=id&slug=eq.facebook-ads&limit=1`,
    { headers }
  );
  const sources = await sourcesRes.json().catch(() => []);
  const leadSourceId = sources?.[0]?.id;

  if (!leadSourceId) {
    throw new Error('Facebook Ads lead source not found in AIMOS. Run migration first.');
  }

  // Get default clinic ID (AIM Edmonton)
  const clinicsRes = await fetch(
    `${supabaseUrl}/rest/v1/clinics?select=id&slug=eq.aim-edmonton&limit=1`,
    { headers }
  );
  const clinics = await clinicsRes.json().catch(() => []);
  const clinicId = clinics?.[0]?.id;

  // Determine service line from form data
  let serviceLineId: string | undefined;
  const serviceInterest = payload.service_interest || 
    (payload.field_data ? extractFieldValue(payload.field_data, 'service') : undefined);
  
  if (serviceInterest) {
    const serviceQuery = `${supabaseUrl}/rest/v1/crm_service_lines?select=id&or=(name.ilike.%${encodeURIComponent(serviceInterest)}%,slug.ilike.%${encodeURIComponent(serviceInterest)}%)&active=eq.true&limit=1`;
    const serviceRes = await fetch(serviceQuery, { headers });
    const services = await serviceRes.json().catch(() => []);
    serviceLineId = services?.[0]?.id;
  }

  // Determine payor type from insurance field
  let payorTypeId: string | undefined;
  const insuranceType = payload.insurance_type || 
    (payload.field_data ? extractFieldValue(payload.field_data, 'insurance') : undefined);
  
  if (insuranceType) {
    const payorQuery = `${supabaseUrl}/rest/v1/crm_payor_types?select=id&or=(name.ilike.%${encodeURIComponent(insuranceType)}%,slug.ilike.%${encodeURIComponent(insuranceType)}%)&active=eq.true&limit=1`;
    const payorRes = await fetch(payorQuery, { headers });
    const payors = await payorRes.json().catch(() => []);
    payorTypeId = payors?.[0]?.id;
  }

  // Build notes from additional fields
  const notes: string[] = [];
  if (payload.injury_type) notes.push(`Injury type: ${payload.injury_type}`);
  if (payload.pain_level) notes.push(`Pain level: ${payload.pain_level}`);
  if (payload.preferred_contact) notes.push(`Preferred contact: ${payload.preferred_contact}`);
  if (payload.additional_notes) notes.push(`Notes: ${payload.additional_notes}`);
  if (payload.campaign_name) notes.push(`Campaign: ${payload.campaign_name}`);
  if (payload.ad_name) notes.push(`Ad: ${payload.ad_name}`);
  if (payload.form_name) notes.push(`Form: ${payload.form_name}`);

  // Create lead in AIMOS
  const leadData = {
    external_id: payload.id || `fb-${Date.now()}`,
    first_name: firstName || 'Unknown',
    last_name: lastName || 'Unknown',
    email: email || null,
    phone: formattedPhone,
    service_line_id: serviceLineId || null,
    payor_type_id: payorTypeId || null,
    lead_source_id: leadSourceId,
    clinic_id: clinicId || null,
    campaign_id: payload.campaign_id || null,
    status: 'new',
    priority: 'high', // Facebook leads are high priority (paid, intent-driven)
    notes: notes.length > 0 ? notes.join('\n') : null,
  };

  const createRes = await fetch(`${supabaseUrl}/rest/v1/crm_leads`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(leadData),
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    throw new Error(`Failed to create lead: ${error}`);
  }

  const created = await createRes.json();
  return created[0];
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Configuration error: Missing Supabase credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle Facebook webhook verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = Deno.env.get('FACEBOOK_WEBHOOK_VERIFY_TOKEN') || 'aimos_fb_leads';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Facebook webhook verified');
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle lead submission (POST)
  if (req.method === 'POST') {
    try {
      const payload: FacebookLeadPayload = await req.json();
      console.log('Received Facebook lead:', JSON.stringify(payload, null, 2));

      // Create lead in AIMOS
      const lead = await createLeadInAIMOS(payload, supabaseUrl, serviceKey);
      console.log('Created lead in AIMOS:', lead.id);

      return new Response(
        JSON.stringify({
          success: true,
          lead_id: lead.id,
          message: 'Lead successfully imported to AIMOS',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error processing Facebook lead:', message);

      return new Response(
        JSON.stringify({
          success: false,
          error: message,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
