# Admin Seed Endpoint

## Overview

Production-safe endpoint for seeding evidence bundles into your database.

**Endpoint:** `POST /functions/v1/admin-seed`

**Features:**
- 🔒 Protected by admin key
- 🔁 Idempotent (won't double-seed)
- 🔐 Transactional (all-or-nothing)
- ⚙️ Environment-driven (no hard-coding)

---

## Security Model

### Admin Key Authentication

**Header:** `x-admin-key: <SECRET>`

**Environment Variable:** `ADMIN_SEED_KEY`

Set in Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secret: `ADMIN_SEED_KEY` = `your-super-long-random-secret`
3. Save and redeploy functions

**Generate a secure key:**
```bash
openssl rand -base64 32
```

---

## API Reference

### Request

**Method:** `POST`

**URL:** `https://[project].supabase.co/functions/v1/admin-seed`

**Headers:**
```
Content-Type: application/json
x-admin-key: your-admin-key-here
```

**Body:**
```json
{
  "seed_name": "Starter Pack Bundle v1",
  "sql_content": "INSERT INTO evidence_authorities..."
}
```

**Fields:**
- `seed_name` (required): Unique identifier for this seed (min 3 chars)
- `sql_content` (required): Complete SQL to execute

---

## Response Codes

### ✅ 200 - Success (Applied)

```json
{
  "status": "applied",
  "message": "Seed successfully applied",
  "seed_name": "Starter Pack Bundle v1"
}
```

### ⏭️ 200 - Success (Skipped)

```json
{
  "status": "skipped",
  "message": "Seed already applied",
  "seed_name": "Starter Pack Bundle v1"
}
```

### ❌ 403 - Forbidden

```json
{
  "status": "error",
  "message": "Forbidden - Invalid admin key"
}
```

### ❌ 400 - Bad Request

```json
{
  "status": "error",
  "message": "Invalid seed_name - must be at least 3 characters"
}
```

### ❌ 500 - Seed Failed

```json
{
  "status": "error",
  "message": "Seed failed - transaction rolled back",
  "detail": "relation \"evidence_claims\" does not exist"
}
```

---

## Usage Examples

### Example 1: Seed from File

```bash
# Read SQL file
SQL_CONTENT=$(cat seed_bundle.sql)

# Send to endpoint
curl -X POST \
  https://[project].supabase.co/functions/v1/admin-seed \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key-here" \
  -d "{
    \"seed_name\": \"Starter Pack Bundle v1\",
    \"sql_content\": $(echo "$SQL_CONTENT" | jq -Rs .)
  }"
```

### Example 2: Seed from Script

```bash
#!/bin/bash

SUPABASE_URL="https://your-project.supabase.co"
ADMIN_KEY="your-admin-key-here"
SEED_NAME="Concussion Evidence Pack"
SQL_FILE="concussion_seed.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file not found: $SQL_FILE"
  exit 1
fi

SQL_CONTENT=$(cat "$SQL_FILE" | jq -Rs .)

RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/admin-seed" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d "{
    \"seed_name\": \"$SEED_NAME\",
    \"sql_content\": $SQL_CONTENT
  }")

echo "$RESPONSE" | jq .
```

### Example 3: TypeScript/JavaScript

```typescript
async function seedDatabase(seedName: string, sqlContent: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-seed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': import.meta.env.VITE_ADMIN_SEED_KEY,
      },
      body: JSON.stringify({
        seed_name: seedName,
        sql_content: sqlContent,
      }),
    }
  );

  const result = await response.json();

  if (result.status === 'applied') {
    console.log('✅ Seed applied:', result.seed_name);
  } else if (result.status === 'skipped') {
    console.log('⏭️ Seed already exists:', result.seed_name);
  } else {
    console.error('❌ Seed failed:', result.message, result.detail);
  }

  return result;
}

// Usage
const sqlContent = await fetch('/seed_bundle.sql').then(r => r.text());
await seedDatabase('Starter Pack Bundle v1', sqlContent);
```

---

## Idempotency

The endpoint checks if a seed with the same `seed_name` already exists in `evidence_version_sets` before executing:

```sql
SELECT 1 FROM evidence_version_sets
WHERE name = 'Starter Pack Bundle v1'
```

**If exists:**
- Returns `status: "skipped"`
- No SQL execution
- Safe to retry

**If not exists:**
- Registers seed version
- Executes SQL
- Commits transaction

---

## Transaction Safety

All operations run in a single PostgreSQL transaction:

```
BEGIN
  ↓
INSERT INTO evidence_version_sets (...)
  ↓
EXECUTE sql_content
  ↓
COMMIT (success) or ROLLBACK (failure)
```

**Benefits:**
- All-or-nothing execution
- No partial seeds
- Safe to retry on failure
- Database consistency guaranteed

---

## Workflow

### 1. Prepare Seed Bundle

Create SQL file with complete seed data:

```sql
-- seed_bundle.sql

-- 1. Evidence Authorities
INSERT INTO evidence_authorities (domain, name, ...) VALUES
  ('chronic_pain', 'IASP', ...),
  ('acl', 'IOC', ...);

-- 2. Research Sources
INSERT INTO research_sources (authority_id, name, ...) VALUES
  (...);

-- 3. Evidence Claims
INSERT INTO evidence_claims (source_id, claim_text, ...) VALUES
  (...);

-- 4. Clinical Rules
INSERT INTO clinical_rules (domain, rule_name, ...) VALUES
  (...);

-- 5. Care Pathways
INSERT INTO care_pathway_templates (domain, name, ...) VALUES
  (...);
```

### 2. Test Locally

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export ADMIN_SEED_KEY="your-admin-key"

# Run test
./test-admin-seed.sh
```

### 3. Deploy to Production

```bash
# Same command works in production
curl -X POST \
  "$SUPABASE_URL/functions/v1/admin-seed" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SEED_KEY" \
  -d @seed_request.json
```

### 4. Verify

```bash
# Check if seed was applied
curl "$SUPABASE_URL/rest/v1/evidence_version_sets?name=eq.Starter%20Pack%20Bundle%20v1" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

---

## Error Handling

### Common Errors

**1. Invalid Admin Key**
```json
{
  "status": "error",
  "message": "Forbidden - Invalid admin key"
}
```

**Solution:** Check `ADMIN_SEED_KEY` environment variable

---

**2. Missing seed_name**
```json
{
  "status": "error",
  "message": "Invalid seed_name - must be at least 3 characters"
}
```

**Solution:** Provide valid `seed_name` in request body

---

**3. SQL Syntax Error**
```json
{
  "status": "error",
  "message": "Seed failed - transaction rolled back",
  "detail": "syntax error at or near \"INSERTT\""
}
```

**Solution:** Fix SQL syntax in `sql_content`

---

**4. Foreign Key Violation**
```json
{
  "status": "error",
  "message": "Seed failed - transaction rolled back",
  "detail": "insert or update on table \"evidence_claims\" violates foreign key constraint"
}
```

**Solution:** Ensure referenced records exist (e.g., authority before source)

---

**5. Database Connection Error**
```json
{
  "status": "error",
  "message": "Database URL not configured"
}
```

**Solution:** Check `SUPABASE_DB_URL` environment variable

---

## Best Practices

### 1. Naming Convention

Use semantic versioning for seed names:

```
✅ Good:
- "Chronic Pain Evidence Pack v1.0"
- "ACL Starter Pack 2024-01"
- "Concussion Bundle Release 3"

❌ Bad:
- "seed"
- "test"
- "data"
```

### 2. SQL Structure

Always include full dependency chain:

```sql
-- 1. Authorities (no dependencies)
INSERT INTO evidence_authorities ...

-- 2. Sources (depends on authorities)
INSERT INTO research_sources ...

-- 3. Claims (depends on sources)
INSERT INTO evidence_claims ...

-- 4. Rules (depends on authorities)
INSERT INTO clinical_rules ...

-- 5. Pathways (depends on authorities)
INSERT INTO care_pathway_templates ...
```

### 3. Testing

Test in staging before production:

```bash
# Test with small dataset first
curl -X POST "$STAGING_URL/functions/v1/admin-seed" ...

# Verify results
# Check UI, run queries

# Deploy to production
curl -X POST "$PROD_URL/functions/v1/admin-seed" ...
```

### 4. Versioning

Track seed versions in your repo:

```
seeds/
  ├── v1.0-initial-pack.sql
  ├── v1.1-acl-update.sql
  ├── v2.0-neuro-expansion.sql
  └── README.md (changelog)
```

### 5. Audit Trail

The `evidence_version_sets` table tracks all applied seeds:

```sql
SELECT
  version_set_id,
  name,
  publisher,
  release_date,
  created_at
FROM evidence_version_sets
ORDER BY created_at DESC;
```

---

## Security Checklist

- [ ] `ADMIN_SEED_KEY` is at least 32 characters
- [ ] Admin key is stored in environment variables (not code)
- [ ] Admin key is different for staging and production
- [ ] Endpoint is only called from trusted sources
- [ ] SQL content is validated before sending
- [ ] Logs are monitored for unauthorized attempts

---

## Monitoring

### View Logs in Supabase Dashboard

1. Go to Edge Functions → Logs
2. Filter by `admin-seed`
3. Check for errors or unauthorized access attempts

### Track Seed History

```sql
-- All seeds applied
SELECT * FROM evidence_version_sets
ORDER BY created_at DESC;

-- Recent seeds
SELECT name, publisher, release_date, created_at
FROM evidence_version_sets
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Troubleshooting

### Seed Won't Apply

**Check 1: Verify admin key**
```bash
echo $ADMIN_SEED_KEY
# Should output your key
```

**Check 2: Test endpoint connectivity**
```bash
curl -X OPTIONS \
  "$SUPABASE_URL/functions/v1/admin-seed"
# Should return 200
```

**Check 3: Validate SQL syntax**
```bash
# Test SQL locally first
psql -d your_db -f seed_bundle.sql
```

**Check 4: Check Supabase logs**
```
Dashboard → Edge Functions → admin-seed → Logs
```

### Seed Applied But Data Missing

**Check 1: Verify transaction committed**
```sql
SELECT * FROM evidence_version_sets
WHERE name = 'Your Seed Name';
-- Should have 1 row
```

**Check 2: Query actual data**
```sql
SELECT COUNT(*) FROM evidence_claims;
SELECT COUNT(*) FROM clinical_rules;
-- Should show expected counts
```

**Check 3: Check RLS policies**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE evidence_claims DISABLE ROW LEVEL SECURITY;
SELECT * FROM evidence_claims LIMIT 5;
```

---

## Comparison: Admin Endpoint vs npm run seed

| Feature | Admin Endpoint | npm run seed |
|---------|---------------|--------------|
| **Security** | API key protected | Local only |
| **Location** | Remote server | Local machine |
| **Transaction** | Single transaction | Single transaction |
| **Idempotent** | Yes | Yes |
| **Monitoring** | Supabase logs | Console output |
| **Access** | HTTP/HTTPS | Direct DB connection |
| **Use Case** | Production deploys | Local development |

**Recommendation:**
- Use `npm run seed` for **local development**
- Use admin endpoint for **production deploys**

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Evidence Pack

on:
  push:
    branches: [main]
    paths:
      - 'seeds/**'

jobs:
  deploy-seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Seed Bundle
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          ADMIN_SEED_KEY: ${{ secrets.ADMIN_SEED_KEY }}
        run: |
          SQL_CONTENT=$(cat seeds/latest.sql | jq -Rs .)

          curl -X POST \
            "$SUPABASE_URL/functions/v1/admin-seed" \
            -H "Content-Type: application/json" \
            -H "x-admin-key: $ADMIN_SEED_KEY" \
            -d "{
              \"seed_name\": \"GitHub Deploy $(date +%Y%m%d_%H%M%S)\",
              \"sql_content\": $SQL_CONTENT
            }" \
            -f || exit 1
```

---

## Status

✅ **Deployed and operational**

**Endpoint:** `POST /functions/v1/admin-seed`

**Next Steps:**
1. Set `ADMIN_SEED_KEY` in Supabase Dashboard
2. Test with `test-admin-seed.html`
3. Deploy first evidence pack
4. Monitor logs for success

---

## Related Documentation

- **[CDS_ENDPOINT_AND_SEED_GUIDE.md](./CDS_ENDPOINT_AND_SEED_GUIDE.md)** - Seed file format
- **[seed_bundle.example.sql](./seed_bundle.example.sql)** - SQL template
- **[test-admin-seed.html](./test-admin-seed.html)** - Test UI
