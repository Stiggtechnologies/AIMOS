import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MatchRequest {
  domain: string;
  patient_profile?: Record<string, any>;
  clinical_findings?: Record<string, any>;
  preferences?: {
    outcome_focus?: string[];
    tags?: string[];
    limit_claims?: number;
  };
}

interface ClaimRow {
  claim_id: string;
  claim_text: string;
  confidence_score: number;
  clinical_tags: string[] | null;
  outcomes: string[] | null;
  evidence_level: string;
  risk_of_bias: string;
  source_id: string;
}

interface RuleRow {
  rule_id: string;
  rule_name: string;
  trigger: any;
  recommendation_text: string;
  patient_explanation_text: string;
  priority: number;
  is_active: boolean;
  domain?: string;
}

interface PathwayRow {
  pathway_id: string;
  name: string;
  domain?: string;
  intended_population: any;
  phases: any;
  visit_guidance: any;
  home_program_guidance: any;
  is_active: boolean;
}

function intersectCount(a: string[] = [], b: string[] = []): number {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  let c = 0;
  for (const x of a) if (setB.has(x.toLowerCase())) c++;
  return c;
}

function normalizeStrArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.map(String).filter(Boolean);
}

function scoreClaim(row: ClaimRow, req: MatchRequest): number {
  const tagsWanted = normalizeStrArray(req.preferences?.tags);
  const outcomesWanted = normalizeStrArray(req.preferences?.outcome_focus);

  const rowTags = normalizeStrArray(row.clinical_tags);
  const rowOutcomes = normalizeStrArray(row.outcomes);

  const tagMatches = intersectCount(rowTags, tagsWanted);
  const outcomeMatches = intersectCount(rowOutcomes, outcomesWanted);

  const tagBoost = Math.min(0.15 * tagMatches, 0.6);
  const outcomeBoost = Math.min(0.10 * outcomeMatches, 0.4);

  const lvl = (row.evidence_level || '').toLowerCase();
  const levelBoost =
    lvl === 'systematic_review'
      ? 0.25
      : lvl === 'rct'
      ? 0.2
      : lvl === 'cohort'
      ? 0.1
      : 0.05;

  const base = typeof row.confidence_score === 'number' ? row.confidence_score : 0.5;
  return base + tagBoost + outcomeBoost + levelBoost;
}

function evaluateRule(_trigger: any, _facts: Record<string, any>): boolean {
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: MatchRequest = await req.json();

    if (!body.domain || typeof body.domain !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid domain' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const domain = body.domain.trim().toLowerCase();
    const limitClaims = body.preferences?.limit_claims ?? 12;
    const patientProfile = body.patient_profile ?? {};
    const clinicalFindings = body.clinical_findings ?? {};
    const preferences = body.preferences ?? {};

    const { data: claimsData, error: claimsError } = await supabase
      .from('evidence_claims')
      .select(`
        claim_id,
        claim_text,
        confidence_score,
        clinical_tags,
        outcomes,
        evidence_level,
        risk_of_bias,
        source_id,
        research_sources!inner(
          id,
          evidence_authorities!inner(
            domain
          )
        )
      `)
      .eq('status', 'approved')
      .eq('research_sources.evidence_authorities.domain', domain);

    if (claimsError) {
      console.error('Claims error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch claims', detail: claimsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const claims: ClaimRow[] = (claimsData || []).map((item: any) => {
      const { research_sources, ...claim } = item;
      return claim;
    });

    const { data: rulesData, error: rulesError } = await supabase
      .from('clinical_rules')
      .select('*')
      .eq('is_active', true)
      .eq('domain', domain)
      .order('priority', { ascending: true });

    if (rulesError) {
      console.error('Rules error:', rulesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rules', detail: rulesError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const rules: RuleRow[] = rulesData || [];

    const { data: pathwaysData, error: pathwaysError } = await supabase
      .from('care_pathway_templates')
      .select('*')
      .eq('is_active', true)
      .eq('domain', domain);

    if (pathwaysError) {
      console.error('Pathways error:', pathwaysError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pathways', detail: pathwaysError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const pathways: PathwayRow[] = pathwaysData || [];

    const rankedClaims = claims
      .map((row) => ({
        ...row,
        score: scoreClaim(row, body),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limitClaims);

    const matchedRules = rules
      .filter((r) => evaluateRule(r.trigger, clinicalFindings))
      .map((r) => ({
        ...r,
        matched: true,
      }));

    const matchedPathways = pathways;

    return new Response(
      JSON.stringify({
        domain,
        inputs: {
          patient_profile: patientProfile,
          clinical_findings: clinicalFindings,
          preferences,
        },
        outputs: {
          claims: rankedClaims,
          rules: matchedRules,
          pathways: matchedPathways,
        },
        meta: {
          claim_count: claims.length,
          returned_claims: rankedClaims.length,
          returned_rules: matchedRules.length,
          returned_pathways: matchedPathways.length,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
