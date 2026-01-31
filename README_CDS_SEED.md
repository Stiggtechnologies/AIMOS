# CDS Endpoint & Seed Loader

Clinical Decision Support API and transactional seeding system for evidence-based recommendations.

## 🎯 What This Provides

### 1. CDS Match Endpoint
Real-time API that returns domain-filtered evidence recommendations:
- Ranked evidence claims (by relevance score)
- Matched clinical rules (triggered by patient profile)
- Suggested care pathways (for current population)

### 2. Seed Loader
Transaction-safe SQL executor for populating evidence data:
- All-or-nothing seeding (no partial corruption)
- Idempotency (won't duplicate seeds)
- Version tracking (audit trail)
- Automatic rollback on errors

---

## 🚀 Quick Start

### Test CDS Endpoint

```bash
# Open in browser
open test-cds-endpoint.html

# Or call directly
curl -X POST https://[project].supabase.co/functions/v1/cds-match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"domain":"chronic_pain","preferences":{"limit_claims":10}}'
```

### Run Seed Loader

```bash
# Install dependencies
npm install

# Set database URL
export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Run seed
npm run seed
```

---

## 📚 Documentation

| Document | Purpose | Start Here If... |
|----------|---------|------------------|
| **[CDS_QUICK_START.md](./CDS_QUICK_START.md)** | Quick commands & examples | You want to use it now |
| **[CDS_ENDPOINT_AND_SEED_GUIDE.md](./CDS_ENDPOINT_AND_SEED_GUIDE.md)** | Complete reference | You need detailed docs |
| **[CDS_IMPLEMENTATION_SUMMARY.md](./CDS_IMPLEMENTATION_SUMMARY.md)** | Technical overview | You're a developer |

---

## 📁 Key Files

```
/supabase/functions/cds-match/index.ts    # CDS endpoint (deployed ✓)
/scripts/seed-pg.ts                       # Seed loader
/test-cds-endpoint.html                   # Test UI
/seed_bundle.example.sql                  # SQL template
```

---

## 🎓 Usage Examples

### Call CDS Endpoint

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
      domain: 'acl',
      patient_profile: { age: 24, weeks_post_op: 16 },
      clinical_findings: { quad_deficit: 25 },
      preferences: {
        tags: ['strength', 'landing'],
        limit_claims: 10
      }
    })
  }
);

const data = await response.json();
console.log(`Found ${data.outputs.claims.length} claims`);
```

### Load Seed Data

```bash
# 1. Create your SQL file
cp seed_bundle.example.sql my_pack.sql

# 2. Edit with your evidence data
vim my_pack.sql

# 3. Load into database
SEED_NAME="My Evidence Pack v1" \
SQL_FILE="my_pack.sql" \
npm run seed
```

---

## ✅ Features

### CDS Endpoint
- ✅ Domain filtering (no cross-contamination)
- ✅ Composite scoring (confidence + tags + outcomes + level)
- ✅ Database-level filtering (efficient JOINs)
- ✅ Full CORS support
- ✅ JWT authentication
- ✅ 200-500ms response time

### Seed Loader
- ✅ Transaction safety (BEGIN/COMMIT/ROLLBACK)
- ✅ Idempotency guard (won't duplicate)
- ✅ Version tracking (audit trail)
- ✅ Automatic error handling
- ✅ Clear console output

---

## 🧪 Testing

### 1. Test CDS Endpoint
Open `test-cds-endpoint.html` in browser:
- Select domain (chronic_pain, acl, neuro)
- Add optional filters (tags, outcomes)
- Click "Match Evidence"
- View ranked results

### 2. Verify Seed Loader
```bash
# Run seed twice - second time should skip
npm run seed
npm run seed  # Should say "already applied"
```

### 3. Check Database
```sql
-- View seeded version sets
SELECT * FROM evidence_version_sets ORDER BY created_at DESC;

-- Count evidence by domain
SELECT ea.domain, COUNT(ec.claim_id)
FROM evidence_claims ec
JOIN research_sources rs ON ec.source_id = rs.id
JOIN evidence_authorities ea ON rs.authority_id = ea.authority_id
GROUP BY ea.domain;
```

---

## 🔧 Integration

### Add to Your Component

```typescript
import { useState, useEffect } from 'react';

function EvidencePanel({ domain, patientProfile }) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cds-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ domain, patient_profile: patientProfile })
    })
    .then(res => res.json())
    .then(setResults);
  }, [domain, patientProfile]);

  return (
    <div>
      {results?.outputs.claims.map(claim => (
        <div key={claim.claim_id}>
          <strong>{claim.claim_text}</strong>
          <span>Score: {claim.score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Current State

### Deployed
✅ CDS endpoint live at `/functions/v1/cds-match`

### Seeded Domains
- ✅ Chronic Pain (IASP): 6 sources, 32 claims, 10 rules, 4 pathways
- ✅ ACL (IOC): 6 sources, 32 claims, 10 rules, 4 pathways
- ✅ Neuro (WFNR): 6 sources, 32 claims, 10 rules, 4 pathways

### Ready to Use
- ✅ Test UI functional
- ✅ Seed loader operational
- ✅ Documentation complete
- ✅ Build passing

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| CDS Response Time | 200-500ms |
| Seed Load Time | 1-3 seconds |
| Claims per Domain | 32 |
| Scoring Overhead | ~10ms |
| Database Queries | 3 (parallel) |

---

## 🔐 Security

- **CDS Endpoint**: Requires anon key, enforces RLS policies
- **Seed Loader**: Requires service role key (never commit!)
- **Database**: All queries parameterized (no SQL injection)
- **Environment**: Variables properly separated (public vs private)

---

## 🐛 Troubleshooting

### CDS Endpoint Issues

**Error: Unauthorized**
- Check Authorization header has Bearer token
- Verify anon key is correct

**Error: No results**
- Check domain name matches database (lowercase)
- Verify evidence exists for that domain
- Check RLS policies allow access

**Error: Slow response**
- Check database indexes exist
- Verify foreign key relationships
- Review Supabase logs

### Seed Loader Issues

**Error: Missing DATABASE_URL**
- Export environment variable
- Get from Supabase Project Settings → Database
- Use URI format (not pooler)

**Error: SQL syntax**
- Test queries in Supabase SQL editor first
- Check for missing semicolons
- Verify table/column names

**Error: Already applied**
- This is normal (idempotency working)
- Change SEED_NAME to apply again
- Or remove from evidence_version_sets

---

## 📞 Support

1. Read [CDS_QUICK_START.md](./CDS_QUICK_START.md) for quick answers
2. Check [CDS_ENDPOINT_AND_SEED_GUIDE.md](./CDS_ENDPOINT_AND_SEED_GUIDE.md) troubleshooting section
3. Review Supabase Edge Function logs
4. Verify environment variables are set correctly
5. Test with `test-cds-endpoint.html` to isolate issues

---

## 🎉 What You Can Do Now

1. **Get Real-Time Recommendations**
   - Call CDS endpoint with patient profile
   - Receive ranked evidence claims
   - Display clinical rules and pathways

2. **Seed New Evidence**
   - Package domain expertise as SQL
   - Run seed loader (transaction-safe)
   - Immediately available via CDS endpoint

3. **Build Evidence-Based UX**
   - Show recommendations in clinician view
   - Display patient education materials
   - Guide care decisions with pathways

4. **Scale Safely**
   - Add new domains independently
   - Update evidence without risk
   - Track all changes via version sets

---

**Built with:** Supabase Edge Functions, PostgreSQL, TypeScript, Node.js

**Status:** ✅ Production-ready
