import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Embedding {
  embedding: number[];
  claim_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    };

    const { data: claimsWithoutEmbeddings, error: fetchError } = await fetch(
      `${supabaseUrl}/rest/v1/evidence_claims?embedding=is.null&status=eq.approved&limit=50`,
      {
        method: "GET",
        headers,
      }
    ).then((r) => r.json());

    if (fetchError) {
      throw new Error(`Failed to fetch claims: ${fetchError}`);
    }

    if (!claimsWithoutEmbeddings || claimsWithoutEmbeddings.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No claims without embeddings found",
          processedCount: 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const embeddings: Embedding[] = [];
    let processedCount = 0;

    for (const claim of claimsWithoutEmbeddings) {
      try {
        const embeddingResponse = await fetch(
          "https://api.openai.com/v1/embeddings",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: claim.claim_text,
              model: "text-embedding-3-small",
            }),
          }
        );

        if (!embeddingResponse.ok) {
          console.error(`Failed to generate embedding for claim ${claim.claim_id}`);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0]?.embedding;

        if (embedding) {
          embeddings.push({
            embedding,
            claim_id: claim.claim_id,
          });
          processedCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing claim ${claim.claim_id}:`, error);
      }
    }

    if (embeddings.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Failed to generate embeddings",
          processedCount: 0,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    for (const { claim_id, embedding } of embeddings) {
      await fetch(
        `${supabaseUrl}/rest/v1/evidence_claims?claim_id=eq.${claim_id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ embedding }),
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Embeddings generated and stored successfully",
        processedCount,
        embeddingsStored: embeddings.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generate-embeddings:", errorMessage);

    return new Response(
      JSON.stringify({
        error: "Failed to generate embeddings",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
