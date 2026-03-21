import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const DEFAULT_MODEL = "MiniMax-Text-01";

async function getMinimaxKey(): Promise<string | null> {
  const envKey = Deno.env.get("MINIMAX_API_KEY");
  if (envKey) return envKey;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return null;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin
      .from("vault.decrypted_secrets")
      .select("decrypted_secret")
      .eq("name", "minimax_api_key")
      .maybeSingle();

    if (error || !data) return null;
    return data.decrypted_secret as string;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      messages,
      model = DEFAULT_MODEL,
      temperature = 0.7,
      max_tokens = 1000,
      context,
      stream = false,
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const minimaxKey = await getMinimaxKey();
    if (!minimaxKey) {
      return new Response(
        JSON.stringify({ error: "Minimax API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an AI assistant for Alberta Injury Management (AIM), a physiotherapy clinic management system.

You help with:
- Analyzing financial data and trends
- Providing operational insights
- Patient intake optimization
- Revenue cycle management
- Staff scheduling recommendations
- Clinical quality metrics

${context ? `\n\nCurrent Context:\n${JSON.stringify(context, null, 2)}` : ""}

Provide clear, actionable insights. Use data to support recommendations. Be concise but thorough.`;

    const hasSystemMessage = messages.some((m: { role: string }) => m.role === "system");
    const allMessages = hasSystemMessage
      ? messages
      : [{ role: "system", content: systemPrompt }, ...messages];

    const minimaxResponse = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${minimaxKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    if (!minimaxResponse.ok) {
      const errorText = await minimaxResponse.text();
      console.error("Minimax API error:", errorText);
      return new Response(
        JSON.stringify({ error: `Minimax API error: ${errorText}` }),
        { status: minimaxResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await minimaxResponse.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in minimax-assistant:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
