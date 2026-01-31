import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResearchSource {
  id: string;
  name: string;
  approved: boolean;
  auto_ingest: boolean;
}

interface IngestionJob {
  id: string;
  source_id: string;
  source_name: string;
  status: "pending" | "running" | "completed" | "failed";
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

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    };

    // Fetch all approved sources with auto-ingest enabled
    const sourcesResponse = await fetch(
      `${supabaseUrl}/rest/v1/research_sources?approved=true&auto_ingest=true`,
      {
        method: "GET",
        headers,
      }
    );

    if (!sourcesResponse.ok) {
      throw new Error(`Failed to fetch research sources: ${sourcesResponse.statusText}`);
    }

    const sources: ResearchSource[] = await sourcesResponse.json();

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No approved research sources with auto-ingest enabled",
          jobsCreated: 0,
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

    const jobsCreated: IngestionJob[] = [];

    // Create ingestion jobs for each source
    for (const source of sources) {
      // Check if there's already a running job for this source
      const existingJobResponse = await fetch(
        `${supabaseUrl}/rest/v1/ingestion_jobs?source_id=eq.${source.id}&status=eq.running`,
        {
          method: "GET",
          headers,
        }
      );

      const existingJobs: IngestionJob[] = await existingJobResponse.json();

      if (existingJobs && existingJobs.length > 0) {
        console.log(`Skipping ${source.name}: already running`);
        continue;
      }

      // Create new ingestion job
      const jobData = {
        source_id: source.id,
        source_name: source.name,
        scheduled_for: new Date().toISOString(),
        status: "pending",
        papers_found: 0,
        papers_ingested: 0,
        papers_rejected: 0,
        metadata_quality_score: 0,
      };

      const jobResponse = await fetch(
        `${supabaseUrl}/rest/v1/ingestion_jobs`,
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify(jobData),
        }
      );

      if (jobResponse.ok) {
        const job = await jobResponse.json();
        jobsCreated.push(job[0]);
        console.log(`Created ingestion job for ${source.name}`);
      } else {
        console.error(`Failed to create job for ${source.name}`);
      }
    }

    // Update job statuses to "running"
    for (const job of jobsCreated) {
      await fetch(
        `${supabaseUrl}/rest/v1/ingestion_jobs?id=eq.${job.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "running" }),
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Research paper ingestion scheduled successfully",
        jobsCreated: jobsCreated.length,
        jobs: jobsCreated.map((j) => ({
          id: j.id,
          source: j.source_name,
          status: "running",
        })),
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
    console.error("Error in research-paper-ingestion:", errorMessage);

    return new Response(
      JSON.stringify({
        error: "Failed to process research paper ingestion",
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
