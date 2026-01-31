# CDS Endpoint & Seed Loader - Quick Start

## 🚀 CDS Endpoint

### Test It Now

1. Open `test-cds-endpoint.html` in browser
2. Select a domain (chronic_pain, acl, or neuro)
3. Click "Match Evidence"
4. View ranked claims, rules, and pathways

### Call from Code

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/cds-match`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain: 'chronic_pain',
      preferences: { limit_claims: 10 }
    })
  }
);

const data = await response.json();
```

### Response

```typescript
{
  domain: "chronic_pain",
  outputs: {
    claims: [...],      // Ranked evidence claims
    rules: [...],       // Matched clinical rules
    pathways: [...]     // Suggested care pathways
  },
  meta: {
    claim_count: 32,
    returned_claims: 10,
    returned_rules: 3,
    returned_pathways: 2
  }
}
```

---

## 📦 Seed Loader

### Install Dependencies

```bash
npm install
```

### Prepare Seed File

```bash
cp seed_bundle.example.sql seed_bundle.sql
# Edit seed_bundle.sql with your data
```

### Set Environment

```bash
export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

Get this from: Supabase Dashboard → Project Settings → Database → Connection String

### Run Seed

```bash
npm run seed
```

### Custom Seed

```bash
SEED_NAME="My Pack v2" SQL_FILE="custom.sql" npm run seed
```

---

## 📋 File Structure

```
/supabase/functions/cds-match/index.ts    # CDS endpoint (deployed ✓)
/scripts/seed-pg.ts                       # Seed loader
/seed_bundle.example.sql                  # Example SQL template
/test-cds-endpoint.html                   # Test UI
/CDS_ENDPOINT_AND_SEED_GUIDE.md          # Full documentation
```

---

## ✅ What's Working

- **CDS Endpoint**: Deployed and ready
- **Domain Filtering**: All queries filter by domain
- **Scoring**: Claims ranked by relevance
- **Seed Loader**: Transaction-safe with idempotency
- **Three Starter Packs**: chronic_pain, acl, neuro (seeded)

---

## 🔧 Common Tasks

### Add New Domain

1. Create SQL seed file with authorities, sources, claims, rules, pathways
2. Run: `SEED_NAME="New Domain Pack" SQL_FILE="new.sql" npm run seed`
3. Test: Call CDS endpoint with `domain: "new_domain"`

### Update Existing Evidence

1. Create new SQL with `ON CONFLICT ... DO UPDATE SET`
2. Use unique seed name: `SEED_NAME="Update Pack 2024-01"`
3. Run seed loader

### Query Specific Patient

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/cds-match`, {
  method: 'POST',
  body: JSON.stringify({
    domain: 'acl',
    patient_profile: { age: 24, weeks_post_op: 16 },
    clinical_findings: { quad_deficit: 25, hop_asymmetry: 15 },
    preferences: {
      tags: ['strength', 'landing'],
      outcome_focus: ['rts', 'reinjury'],
      limit_claims: 15
    }
  })
});
```

---

## 📖 Full Documentation

See `CDS_ENDPOINT_AND_SEED_GUIDE.md` for:
- Complete API reference
- Scoring algorithm details
- Security considerations
- Troubleshooting guide
- Integration examples
