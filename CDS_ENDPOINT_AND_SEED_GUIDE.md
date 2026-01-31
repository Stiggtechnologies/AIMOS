# CDS Endpoint & Seed Loader Guide

## Overview

This guide covers two critical tools for managing clinical evidence:

1. **CDS Match Endpoint** - Real-time clinical decision support API
2. **Seed Loader** - Safe, transactional SQL seeding system

---

## 1. CDS Match Endpoint

### Description

The CDS Match endpoint (`/cds/match`) provides domain-filtered clinical decision support by:
- Matching evidence claims to patient profiles
- Evaluating clinical rules against patient findings
- Recommending care pathways
- Ranking results by relevance scores

### Endpoint Details

**URL:** `https://[your-project].supabase.co/functions/v1/cds-match`

**Method:** `POST`

**Authentication:** Bearer token (Supabase anon key)

### Request Schema

```typescript
{
  domain: string;                    // Required: clinical domain (e.g., "chronic_pain", "acl", "neuro")
  patient_profile?: {                // Optional: patient demographics and characteristics
    age?: number;
    region?: string;
    acuity?: string;
    [key: string]: any;
  };
  clinical_findings?: {              // Optional: current clinical findings
    centralization?: boolean;
    directional_preference?: string;
    pain_level?: number;
    [key: string]: any;
  };
  preferences?: {
    outcome_focus?: string[];        // e.g., ["function", "RTW", "pain_reduction"]
    tags?: string[];                 // e.g., ["sleep", "vestibular", "exercise"]
    limit_claims?: number;           // Default: 12, Max: 50
  };
}
```

### Response Schema

```typescript
{
  domain: string;
  inputs: {
    patient_profile: object;
    clinical_findings: object;
    preferences: object;
  };
  outputs: {
    claims: Array<{
      claim_id: string;
      claim_text: string;
      confidence_score: number;
      score: number;                 // Computed relevance score
      clinical_tags: string[];
      outcomes: string[];
      evidence_level: string;
      risk_of_bias: string;
      source_id: string;
    }>;
    rules: Array<{
      rule_id: string;
      rule_name: string;
      recommendation_text: string;
      patient_explanation_text: string;
      priority: number;
      matched: boolean;
    }>;
    pathways: Array<{
      pathway_id: string;
      name: string;
      intended_population: object;
      phases: object;
      visit_guidance: object;
      home_program_guidance: object;
    }>;
  };
  meta: {
    claim_count: number;             // Total claims in domain
    returned_claims: number;         // Claims returned after filtering/ranking
    returned_rules: number;
    returned_pathways: number;
  };
}
```

### Scoring Algorithm

Claims are ranked using a composite score:

**Base Score:** `confidence_score` (0.0 - 1.0)

**Tag Boost:** +0.15 per matched clinical tag (max +0.6)

**Outcome Boost:** +0.10 per matched outcome (max +0.4)

**Evidence Level Boost:**
- Systematic Review: +0.25
- RCT: +0.20
- Cohort: +0.10
- Other: +0.05

**Final Score = Base + Tag Boost + Outcome Boost + Level Boost**

### Usage Examples

#### Example 1: Basic Domain Query

```typescript
const response = await fetch(
  'https://[project].supabase.co/functions/v1/cds-match',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain: 'chronic_pain',
      preferences: {
        limit_claims: 10
      }
    })
  }
);

const data = await response.json();
console.log(`Found ${data.outputs.claims.length} claims`);
```

#### Example 2: Patient-Specific Matching

```typescript
const response = await fetch(
  'https://[project].supabase.co/functions/v1/cds-match',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain: 'acl',
      patient_profile: {
        age: 24,
        sport: 'soccer',
        surgery_date: '2024-01-15'
      },
      clinical_findings: {
        quad_strength_deficit: 25,
        hop_asymmetry: 15,
        weeks_post_op: 16
      },
      preferences: {
        outcome_focus: ['rts', 'reinjury_prevention'],
        tags: ['strength', 'landing', 'neuromuscular'],
        limit_claims: 15
      }
    })
  }
);

const data = await response.json();
console.log(`Matched ${data.outputs.rules.length} clinical rules`);
```

#### Example 3: React Hook Integration

```typescript
import { useState } from 'react';

function useCDSMatch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const match = async (request) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cds-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(request)
        }
      );
      const data = await response.json();
      setResults(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { match, loading, results };
}
```

### Domain Filtering

The endpoint automatically filters all evidence by domain:

- **Evidence Claims**: Filtered via `research_sources → evidence_authorities → domain`
- **Clinical Rules**: Filtered by `clinical_rules.domain`
- **Care Pathways**: Filtered by `care_pathway_templates.domain`

No cross-domain contamination occurs.

### Performance Notes

- Typical response time: 200-500ms
- Claims are pre-filtered at database level (efficient)
- Scoring happens in-memory (fast)
- Consider caching results for identical requests

---

## 2. Seed Loader

### Description

The seed loader provides safe, transactional SQL seeding with:
- **Transaction safety**: All-or-nothing execution
- **Idempotency**: Won't re-apply the same seed twice
- **Version tracking**: Uses `evidence_version_sets` table
- **Rollback on failure**: No partial data

### Installation

```bash
npm install
```

This installs:
- `pg` - PostgreSQL client
- `tsx` - TypeScript executor
- `@types/pg` - TypeScript definitions

### Setup

1. **Get Database Connection String**

   Go to Supabase Dashboard → Project Settings → Database → Connection String (URI)

   Copy the URI format (not the transaction pooler)

2. **Set Environment Variables**

   ```bash
   export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   export SEED_NAME="My Custom Seed v1"  # Optional
   export SQL_FILE="seed_bundle.sql"      # Optional
   ```

3. **Prepare Your SQL File**

   Copy the example:
   ```bash
   cp seed_bundle.example.sql seed_bundle.sql
   ```

   Edit `seed_bundle.sql` with your actual data.

### Usage

```bash
npm run seed
```

Or with custom parameters:

```bash
SEED_NAME="ACL Starter Pack v2" SQL_FILE="acl_pack.sql" npm run seed
```

### Seed File Structure

Your SQL file should:

1. Use idempotent operations (e.g., `ON CONFLICT DO NOTHING`)
2. Reference existing data via subqueries (not hardcoded IDs)
3. Include all related entities (authorities → sources → claims → rules → pathways)

Example structure:

```sql
-- 1. Authorities
INSERT INTO evidence_authorities (...) VALUES (...);

-- 2. Research Sources (reference authorities by name)
INSERT INTO research_sources (...)
SELECT ... FROM evidence_authorities WHERE name = '...'

-- 3. Evidence Claims (reference sources)
INSERT INTO evidence_claims (...)
SELECT ... FROM research_sources WHERE title = '...'

-- 4. Clinical Rules
INSERT INTO clinical_rules (...) VALUES (...);

-- 5. Care Pathways
INSERT INTO care_pathway_templates (...) VALUES (...);

-- 6. Education Assets
INSERT INTO patient_education_assets (...) VALUES (...);
```

### Idempotency Guard

The seed loader:

1. Begins a transaction
2. Checks `evidence_version_sets` for matching `SEED_NAME`
3. If found, rolls back and exits (already applied)
4. If not found, creates version set record
5. Executes your SQL
6. Commits transaction
7. On any error, rolls back everything

### Output

Success:
```
📦 Loading seed: Starter Pack Bundle v1
📄 SQL file: /path/to/seed_bundle.sql
🚀 Applying seed (transaction started)...
📝 Executing SQL bundle...
✅ Seed applied successfully: Starter Pack Bundle v1
📊 Transaction committed
```

Already applied:
```
📦 Loading seed: Starter Pack Bundle v1
📄 SQL file: /path/to/seed_bundle.sql
✅ Seed already applied (version set found): Starter Pack Bundle v1. Skipping.
```

Error:
```
📦 Loading seed: Starter Pack Bundle v1
📄 SQL file: /path/to/seed_bundle.sql
🚀 Applying seed (transaction started)...
📝 Executing SQL bundle...
❌ Seed failed. Rolled back. [error details]
```

### Multiple Environments

Use different seed names for different environments:

```bash
# Development
SEED_NAME="Dev Seed $(date +%Y%m%d)" npm run seed

# Staging
SEED_NAME="Staging Seed v1.2" npm run seed

# Production
SEED_NAME="Production Seed 2024-01-31" npm run seed
```

### Best Practices

1. **Version Your Seeds**
   - Use descriptive names: "ACL Pack v2.1", "Chronic Pain Baseline"
   - Include dates for tracking: "Neuro Pack 2024-01-31"

2. **Test Locally First**
   - Run against local/dev database
   - Verify output before production

3. **Use Meaningful Comments**
   - Document what each section does
   - Explain any complex logic

4. **Keep Seeds Atomic**
   - One seed = one logical unit of evidence
   - Don't mix unrelated domains

5. **Backup Before Production**
   - Always backup before seeding production
   - Supabase: Database → Backups

### Troubleshooting

**Error: Missing DATABASE_URL**
- Check environment variable is set
- Verify connection string format
- Ensure password is URL-encoded

**Error: SQL file not found**
- Check SQL_FILE path is correct
- Use absolute or relative path from project root

**Error: Seed failed (constraint violation)**
- Check for duplicate IDs
- Verify foreign key references exist
- Use `ON CONFLICT DO NOTHING` for idempotency

**Seed applies but data is wrong**
- Check SQL logic carefully
- Test queries individually in Supabase SQL editor
- Use `ROLLBACK` to test without committing

---

## Integration Example: Full Stack Flow

### 1. Seed Evidence Data

```bash
SEED_NAME="ACL Pack v1" SQL_FILE="acl_starter_pack.sql" npm run seed
```

### 2. Call CDS Endpoint from Frontend

```typescript
const getClinicalRecommendations = async (patientId: string) => {
  // Get patient data
  const patient = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  // Call CDS endpoint
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cds-match`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        domain: patient.data.condition_domain,
        patient_profile: {
          age: patient.data.age,
          acuity: patient.data.acuity,
          region: patient.data.region
        },
        clinical_findings: patient.data.latest_findings,
        preferences: {
          outcome_focus: ['function', 'pain'],
          tags: ['exercise', 'education'],
          limit_claims: 10
        }
      })
    }
  );

  const recommendations = await response.json();
  return recommendations;
};
```

### 3. Display in UI

```typescript
function EvidencePanel({ patientId }) {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    getClinicalRecommendations(patientId).then(setRecommendations);
  }, [patientId]);

  if (!recommendations) return <Loading />;

  return (
    <div>
      <h3>Evidence-Based Recommendations</h3>

      <section>
        <h4>Top Evidence ({recommendations.outputs.claims.length})</h4>
        {recommendations.outputs.claims.map(claim => (
          <ClaimCard key={claim.claim_id} claim={claim} />
        ))}
      </section>

      <section>
        <h4>Triggered Rules ({recommendations.outputs.rules.length})</h4>
        {recommendations.outputs.rules.map(rule => (
          <RuleCard key={rule.rule_id} rule={rule} />
        ))}
      </section>

      <section>
        <h4>Suggested Pathways ({recommendations.outputs.pathways.length})</h4>
        {recommendations.outputs.pathways.map(pathway => (
          <PathwayCard key={pathway.pathway_id} pathway={pathway} />
        ))}
      </section>
    </div>
  );
}
```

---

## Security Considerations

### CDS Endpoint

- Uses Supabase service role key internally (secure)
- Exposed endpoint requires authentication (anon key)
- RLS policies apply to all queries
- No SQL injection risk (parameterized queries)

### Seed Loader

- Requires service role credentials (never commit these!)
- Use environment variables only
- Run from secure environments (not CI/CD publicly)
- Always test on non-production first

---

## Future Enhancements

### CDS Endpoint

1. Add JSONLogic rule evaluation (currently stub)
2. Implement pathway population matching
3. Add caching layer for common queries
4. Return citation traceability
5. Support multi-domain queries

### Seed Loader

1. Add dry-run mode (preview without executing)
2. Generate diff reports (compare before/after)
3. Support rollback to previous seed version
4. Add validation before execution
5. Export existing data as seed files

---

## Support

For issues or questions:
- Check Supabase logs: Dashboard → Edge Functions → Logs
- Review database logs: Dashboard → Database → Logs
- Test queries in SQL Editor
- Verify RLS policies are not blocking access
