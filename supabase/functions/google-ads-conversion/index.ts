import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Google Ads Conversion Upload for Call Tracking
 * 
 * This Edge Function sends conversion data to Google Ads API when:
 * - A call is marked as "booked" in call_tracking_calls table
 * - The call has a valid GCLID from the original session
 * 
 * Triggered by database trigger on call_tracking_calls.outcome update
 * 
 * Env vars needed:
 * - GOOGLE_ADS_DEVELOPER_TOKEN
 * - GOOGLE_ADS_CLIENT_ID
 * - GOOGLE_ADS_CLIENT_SECRET
 * - GOOGLE_ADS_REFRESH_TOKEN
 * - GOOGLE_ADS_CUSTOMER_ID (e.g., "6741184707")
 * - GOOGLE_ADS_CONVERSION_ACTION_ID (from Google Ads > Tools > Conversions)
 */

interface ConversionPayload {
  call_id: string;
  gclid: string;
  conversion_time: string;
  conversion_value?: number;
  currency_code?: string;
}

/**
 * Get OAuth2 access token from refresh token
 */
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Upload conversion to Google Ads API
 */
async function uploadConversion(
  accessToken: string,
  developerToken: string,
  customerId: string,
  conversionActionId: string,
  payload: ConversionPayload
): Promise<void> {
  const apiUrl = `https://googleads.googleapis.com/v16/customers/${customerId}:uploadClickConversions`;

  // Format conversion time (YYYY-MM-DD HH:mm:ss+00:00)
  const conversionDateTime = new Date(payload.conversion_time)
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, '+00:00');

  const conversionData = {
    conversions: [
      {
        gclid: payload.gclid,
        conversionAction: `customers/${customerId}/conversionActions/${conversionActionId}`,
        conversionDateTime: conversionDateTime,
        conversionValue: payload.conversion_value || 350, // Default $350 for booked appointment
        currencyCode: payload.currency_code || "CAD",
      },
    ],
    partialFailure: false,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(conversionData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload conversion: ${error}`);
  }

  const result = await response.json();
  console.log("Conversion uploaded successfully:", result);
}

/**
 * Mark conversion as uploaded in database
 */
async function markConversionUploaded(
  supabaseUrl: string,
  serviceKey: string,
  callId: string
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/call_tracking_calls?id=eq.${callId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        conversion_uploaded_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to mark conversion as uploaded: ${error}`);
  }
}

Deno.serve(async (req) => {
  try {
    // Parse request body (should be trigger payload from database)
    const payload: ConversionPayload = await req.json();

    console.log("Received conversion upload request:", payload);

    // Validate payload
    if (!payload.call_id || !payload.gclid || !payload.conversion_time) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: call_id, gclid, conversion_time",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
    const customerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
    const conversionActionId = Deno.env.get("GOOGLE_ADS_CONVERSION_ACTION_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!developerToken || !clientId || !clientSecret || !refreshToken || 
        !customerId || !conversionActionId || !supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required environment variables for Google Ads API",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    // Upload conversion to Google Ads
    await uploadConversion(
      accessToken,
      developerToken,
      customerId,
      conversionActionId,
      payload
    );

    // Mark conversion as uploaded in database
    await markConversionUploaded(supabaseUrl, serviceKey, payload.call_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conversion uploaded successfully",
        call_id: payload.call_id,
        gclid: payload.gclid,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error uploading conversion:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
