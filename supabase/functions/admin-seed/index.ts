import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Key",
};

interface SeedRequest {
  seed_name: string;
  sql_file?: string;
  sql_content?: string;
}

interface SeedResponse {
  status: "applied" | "skipped" | "error";
  message: string;
  seed_name?: string;
  sql_file?: string;
  detail?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = Deno.env.get("ADMIN_SEED_KEY");

    if (!adminKey || !expectedKey || adminKey !== expectedKey) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Forbidden - Invalid admin key"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: SeedRequest = await req.json();

    if (!body.seed_name || body.seed_name.length < 3) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Invalid seed_name - must be at least 3 characters",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.sql_content) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "sql_content is required in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingSeed, error: checkError } = await supabase
      .from("evidence_version_sets")
      .select("version_set_id")
      .eq("name", body.seed_name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing seed:", checkError);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Failed to check existing seed",
          detail: checkError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingSeed) {
      const response: SeedResponse = {
        status: "skipped",
        message: "Seed already applied",
        seed_name: body.seed_name,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Database URL not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pgModule = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const { Client } = pgModule;

    const client = new Client(dbUrl);
    await client.connect();

    try {
      await client.queryArray("BEGIN");

      const insertVersionSet = `
        INSERT INTO public.evidence_version_sets
          (publisher, name, release_date, diff_summary)
        VALUES
          ('AIM OS', $1, CURRENT_DATE, '{}'::jsonb)
      `;

      await client.queryArray(insertVersionSet, [body.seed_name]);

      await client.queryArray(body.sql_content);

      await client.queryArray("COMMIT");

      await client.end();

      const response: SeedResponse = {
        status: "applied",
        message: "Seed successfully applied",
        seed_name: body.seed_name,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (sqlError: any) {
      await client.queryArray("ROLLBACK");
      await client.end();

      console.error("SQL execution error:", sqlError);

      return new Response(
        JSON.stringify({
          status: "error",
          message: "Seed failed - transaction rolled back",
          detail: sqlError?.message ?? String(sqlError),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error: any) {
    console.error("Admin seed endpoint error:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error",
        detail: error?.message ?? String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
