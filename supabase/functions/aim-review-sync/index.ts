import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MockReview {
  external_review_id: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_timestamp: string;
}

function mockGBPReviewFetch(locationId: string): MockReview[] {
  return [
    {
      external_review_id: `gbp_${locationId}_${Date.now()}_1`,
      author_name: "Sarah M.",
      rating: 5,
      review_text: "Excellent care! The physiotherapists were knowledgeable and helped me recover quickly.",
      review_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      external_review_id: `gbp_${locationId}_${Date.now()}_2`,
      author_name: "James T.",
      rating: 1,
      review_text: "Very disappointed. My pain got worse after treatment. I may need to contact my lawyer about this.",
      review_timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      external_review_id: `gbp_${locationId}_${Date.now()}_3`,
      author_name: "Linda K.",
      rating: 4,
      review_text: "Great experience overall. Staff was friendly and professional.",
      review_timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function computeSeverityScore(rating: number, reviewText: string): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];
  const text = reviewText.toLowerCase();

  if (rating === 1) { score = 9.0; flags.push("one_star_review"); }
  else if (rating === 2) { score = 6.0; flags.push("low_rating"); }
  else if (rating >= 4) { score = 1.0; }
  else { score = 3.0; }

  const legalKeywords = ["lawyer", "legal", "sue", "court", "privacy", "human rights", "complaint"];
  const clinicalKeywords = ["worse", "pain increased", "injured", "harm", "negligent", "malpractice"];
  const billingKeywords = ["overcharged", "billing", "refund", "fraud", "scam", "charged twice"];

  if (legalKeywords.some((k) => text.includes(k))) {
    score = Math.max(score, 10.0);
    flags.push("legal_threat");
  }
  if (clinicalKeywords.some((k) => text.includes(k))) {
    score = Math.max(score, 8.5);
    flags.push("clinical_concern");
  }
  if (billingKeywords.some((k) => text.includes(k))) {
    score = Math.max(score, 7.0);
    flags.push("billing_complaint");
  }

  return { score, flags };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const locationId = url.searchParams.get("location_id");
    const source = url.searchParams.get("source") || "google_business_profile";

    const correlationId = crypto.randomUUID();

    const { data: runRecord } = await supabase
      .from("aim_workflow_runs")
      .insert({
        workflow_name: "review.sync",
        source_system: "cron",
        correlation_id: correlationId,
        environment: "production",
        status: "started",
        input_payload_json: { location_id: locationId, source },
      })
      .select()
      .single();

    const { data: locations, error: locError } = await supabase
      .from("aim_locations")
      .select("id, name, city")
      .eq("is_active", true)
      .then((res) => {
        if (locationId) {
          return supabase.from("aim_locations").select("id, name, city").eq("id", locationId);
        }
        return res;
      });

    if (locError) throw locError;

    const summary = {
      locations_processed: 0,
      reviews_fetched: 0,
      reviews_inserted: 0,
      reviews_deduplicated: 0,
      escalations_created: 0,
      draft_replies_queued: 0,
    };

    for (const location of locations || []) {
      summary.locations_processed++;

      const rawReviews = mockGBPReviewFetch(location.id);
      summary.reviews_fetched += rawReviews.length;

      for (const raw of rawReviews) {
        const { data: existing } = await supabase
          .from("aim_reviews")
          .select("id")
          .eq("source", source)
          .eq("external_review_id", raw.external_review_id)
          .maybeSingle();

        if (existing) {
          summary.reviews_deduplicated++;
          continue;
        }

        const { score, flags } = computeSeverityScore(raw.rating, raw.review_text);

        const initialStatus = score >= 9.0 ? "escalated" : score >= 7.0 ? "awaiting_approval" : "unresponded";

        const { data: reviewRecord, error: insertError } = await supabase
          .from("aim_reviews")
          .insert({
            source,
            location_id: location.id,
            external_review_id: raw.external_review_id,
            author_name: raw.author_name,
            rating: raw.rating,
            review_text: raw.review_text,
            review_timestamp: raw.review_timestamp,
            sentiment_score: raw.rating >= 4 ? 0.8 : raw.rating <= 2 ? -0.7 : 0.1,
            severity_score: score,
            response_status: initialStatus,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            summary.reviews_deduplicated++;
            continue;
          }
          throw insertError;
        }

        summary.reviews_inserted++;

        for (const flag of flags) {
          await supabase.from("aim_review_flags").insert({
            review_id: reviewRecord.id,
            flag_code: flag,
            confidence: 0.85,
          });
        }

        if (score >= 9.0) {
          summary.escalations_created++;
          await supabase.from("aim_operational_alerts").insert({
            alert_type: "critical_review",
            severity: "critical",
            title: `Critical review at ${location.name}`,
            message: `${raw.rating}/5 stars. Flags: ${flags.join(", ")}. Author: ${raw.author_name}`,
            target_type: "review",
            target_id: reviewRecord.id,
            status: "open",
          });
        } else if (raw.rating >= 4) {
          summary.draft_replies_queued++;
          await supabase.from("aim_review_drafts").insert({
            review_id: reviewRecord.id,
            drafted_by_type: "system",
            draft_text: `Thank you for your kind words, ${raw.author_name}! We're so glad to hear about your positive experience at ${location.name}. Our team works hard to provide excellent care, and your feedback means a lot to us.`,
            status: "draft",
          });
        }

        await supabase.from("aim_audit_events").insert({
          actor_type: "system",
          action: "review.ingested",
          target_type: "review",
          target_id: reviewRecord.id,
          correlation_id: correlationId,
          source_system: "review_sync",
          payload_json: {
            location_id: location.id,
            source,
            rating: raw.rating,
            severity_score: score,
            flags,
          },
        });
      }
    }

    if (runRecord) {
      await supabase
        .from("aim_workflow_runs")
        .update({
          status: "completed",
          output_payload_json: summary,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id);
    }

    return new Response(
      JSON.stringify({ success: true, correlation_id: correlationId, ...summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
