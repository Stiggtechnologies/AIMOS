import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractionRequest {
  sourceId: string;
  documentText: string;
  jobId?: string;
}

interface ExtractedEvidence {
  claim_text: string;
  effect_direction: "benefit" | "no_difference" | "harm" | "uncertain";
  outcomes: string[];
  population: Record<string, any>;
  intervention: Record<string, any>;
  evidence_level: string;
  clinical_tags: string[];
  confidence_score: number;
  generalizability_notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { sourceId, documentText, jobId } = (await req.json()) as ExtractionRequest;

    if (!sourceId || !documentText) {
      return new Response(
        JSON.stringify({ error: "sourceId and documentText are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Update job status to extracting if jobId provided
    if (jobId) {
      await updateJobStatus(supabaseUrl, supabaseServiceKey, jobId, "extracting");
    }

    // Call OpenAI to extract evidence
    const extractedClaims = await extractEvidenceWithAI(
      openaiApiKey,
      documentText
    );

    // Store extracted claims in database
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    };

    const storedClaims = [];

    for (const claim of extractedClaims) {
      const claimData = {
        source_id: sourceId,
        ...claim,
        status: "needs_review",
      };

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/evidence_claims`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(claimData),
      });

      if (insertResponse.ok) {
        const storedClaim = await insertResponse.json();
        storedClaims.push(storedClaim[0]);

        // Store citations
        if (claim.citations && storedClaim[0]?.claim_id) {
          for (const citation of claim.citations) {
            await fetch(`${supabaseUrl}/rest/v1/claim_citations`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                claim_id: storedClaim[0].claim_id,
                ...citation,
              }),
            });
          }
        }
      }
    }

    // Update job status to completed
    if (jobId) {
      await updateJobStatus(supabaseUrl, supabaseServiceKey, jobId, "approved", {
        claims_extracted: storedClaims.length,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Evidence extraction completed successfully",
        claimsExtracted: storedClaims.length,
        claims: storedClaims,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in evidence extraction:", errorMessage);

    return new Response(
      JSON.stringify({
        error: "Evidence extraction failed",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function extractEvidenceWithAI(
  apiKey: string,
  documentText: string
): Promise<any[]> {
  const systemPrompt = `You are AIM OS Research Extraction Agent. Extract MDT-related evidence claims from the provided research document.

Return a JSON array of claims. Each claim must include:
- claim_text: Short, human-readable statement (required)
- effect_direction: 'benefit' | 'no_difference' | 'harm' | 'uncertain' (required)
- outcomes: Array of ['pain', 'function', 'disability', 'RTW', 'recurrence', 'satisfaction', 'utilization'] (required)
- population: {region, condition_type, acuity, age_range?, setting?}
- intervention: {approach, core_components, dose}
- evidence_level: 'systematic_review' | 'rct' | 'cohort' | 'case_series' | 'expert'
- clinical_tags: Array of relevant tags like 'centralization', 'directional_preference', etc.
- confidence_score: Number 0-1 based on clarity and completeness
- citations: Array of {location, excerpt, confidence} showing where claim comes from
- generalizability_notes?: Text about limitations or applicability

Extract 3-10 of the most clinically relevant claims. Never invent data.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Extract MDT evidence from this document:\n\n${documentText.substring(0, 4000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.log("Could not find JSON in response, returning empty array");
    return [];
  }

  const extractedClaims = JSON.parse(jsonMatch[0]);
  return Array.isArray(extractedClaims) ? extractedClaims : [];
}

async function updateJobStatus(
  supabaseUrl: string,
  serviceKey: string,
  jobId: string,
  status: string,
  result?: Record<string, any>
) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
  };

  const updateData: any = { status };
  if (result) {
    updateData.result = result;
  }

  await fetch(`${supabaseUrl}/rest/v1/evidence_jobs?job_id=eq.${jobId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updateData),
  });
}
