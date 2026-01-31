# Admin Seed Endpoint - Quick Start

One-click evidence bundle deployment to production.

---

## 🚀 Setup (5 minutes)

### Step 1: Set Admin Key in Supabase

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `ADMIN_SEED_KEY`
5. Value: Generate secure key:
   ```bash
   openssl rand -base64 32
   ```
6. Click **Save**

### Step 2: Export Locally (for testing)

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export ADMIN_SEED_KEY="your-admin-key-from-step-1"
```

---

## 📦 Deploy a Seed Bundle

### Option 1: Using Test UI (Easiest)

```bash
open test-admin-seed.html
```

1. Enter Supabase URL
2. Enter Admin Key
3. Paste SQL content
4. Click **Deploy Seed**

### Option 2: Using Shell Script

```bash
./test-admin-seed.sh "My Seed Name" path/to/seed.sql
```

### Option 3: Using curl

```bash
# Read SQL file
SQL_CONTENT=$(cat seed_bundle.sql | jq -Rs .)

# Deploy
curl -X POST \
  "$SUPABASE_URL/functions/v1/admin-seed" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SEED_KEY" \
  -d "{
    \"seed_name\": \"Starter Pack v1\",
    \"sql_content\": $SQL_CONTENT
  }"
```

---

## ✅ Verify Deployment

### Check Seed Version

```bash
# Using Supabase REST API
curl "$SUPABASE_URL/rest/v1/evidence_version_sets?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Query Seeded Data

```sql
-- Count authorities
SELECT COUNT(*) FROM evidence_authorities;

-- Count claims
SELECT COUNT(*) FROM evidence_claims;

-- Count rules
SELECT COUNT(*) FROM clinical_rules;

-- Count pathways
SELECT COUNT(*) FROM care_pathway_templates;
```

---

## 🔄 Re-deploying

The endpoint is **idempotent** - it won't re-apply the same seed:

```bash
# First call: Applied ✅
./test-admin-seed.sh "Bundle v1" seed.sql
# Output: "status": "applied"

# Second call: Skipped ⏭️
./test-admin-seed.sh "Bundle v1" seed.sql
# Output: "status": "skipped", "message": "Seed already applied"
```

To deploy new data, use a different seed name:

```bash
./test-admin-seed.sh "Bundle v2" seed_updated.sql
```

---

## 🎯 Common Use Cases

### 1. Initial Production Seed

```bash
# Deploy all three domains
./test-admin-seed.sh "Initial Evidence Pack" seed_bundle.sql
```

### 2. Update Existing Domain

```bash
# Create update SQL with only new/changed records
./test-admin-seed.sh "Chronic Pain Update 2024-02" chronic_pain_update.sql
```

### 3. Add New Domain

```bash
# Create SQL for new domain
./test-admin-seed.sh "Pediatrics Domain v1" pediatrics_seed.sql
```

### 4. Hotfix Critical Data

```bash
# Quick fix for urgent updates
./test-admin-seed.sh "Hotfix 2024-01-31" hotfix.sql
```

---

## 📋 Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `applied` ✅ | Seed deployed successfully | Check deployed data |
| `skipped` ⏭️ | Already applied | Use different seed_name |
| `error` ❌ | Failed (rolled back) | Check error detail |

---

## 🔧 Troubleshooting

### Error: "Forbidden - Invalid admin key"

**Solution:**
```bash
# Check key is set
echo $ADMIN_SEED_KEY

# Verify in Supabase Dashboard
# Edge Functions → Secrets → ADMIN_SEED_KEY
```

### Error: "Seed failed - transaction rolled back"

**Solution:**
```bash
# Test SQL locally first
psql -d your_db -f seed.sql

# Check SQL syntax
# Verify foreign key references
# Ensure table structure matches
```

### Error: "SQL file not found"

**Solution:**
```bash
# Check file exists
ls -la seed_bundle.sql

# Use absolute path
./test-admin-seed.sh "Test" /full/path/to/seed.sql
```

### Seed Applied but Data Missing

**Solution:**
```sql
-- Check seed was registered
SELECT * FROM evidence_version_sets
WHERE name = 'Your Seed Name';

-- Check RLS policies aren't blocking
SET ROLE postgres;
SELECT COUNT(*) FROM evidence_claims;
```

---

## 🎓 Example Workflows

### Workflow 1: Local Dev → Production

```bash
# 1. Test seed locally
npm run seed

# 2. Verify data
npm run dev
# Check UI shows evidence

# 3. Deploy to production
./test-admin-seed.sh "Production Deploy v1" seed_bundle.sql

# 4. Verify in production
# Open production URL
# Check Evidence Overlay
```

### Workflow 2: Continuous Deployment

```yaml
# .github/workflows/deploy-seed.yml
name: Deploy Evidence Pack

on:
  push:
    branches: [main]
    paths: ['seeds/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Seed
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          ADMIN_SEED_KEY: ${{ secrets.ADMIN_SEED_KEY }}
        run: ./test-admin-seed.sh "Auto Deploy $(date +%Y%m%d)" seeds/latest.sql
```

### Workflow 3: Multi-Environment

```bash
# Deploy to staging
export SUPABASE_URL="https://staging.supabase.co"
export ADMIN_SEED_KEY="$STAGING_ADMIN_KEY"
./test-admin-seed.sh "Staging Test" seed.sql

# Verify in staging UI
# Run tests

# Deploy to production
export SUPABASE_URL="https://production.supabase.co"
export ADMIN_SEED_KEY="$PRODUCTION_ADMIN_KEY"
./test-admin-seed.sh "Production v1" seed.sql
```

---

## 📊 Monitoring

### View Deployment Logs

1. Supabase Dashboard
2. **Edge Functions** → **admin-seed** → **Logs**
3. Filter by date/status

### Track Seed History

```sql
-- All deployments
SELECT
  name,
  publisher,
  release_date,
  created_at
FROM evidence_version_sets
ORDER BY created_at DESC;

-- Recent deployments (last 7 days)
SELECT * FROM evidence_version_sets
WHERE created_at > NOW() - INTERVAL '7 days';

-- Count seeds by date
SELECT
  DATE(created_at) as deploy_date,
  COUNT(*) as seed_count
FROM evidence_version_sets
GROUP BY DATE(created_at)
ORDER BY deploy_date DESC;
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Store admin key in environment variables
- Use different keys for staging/production
- Rotate keys periodically
- Monitor deployment logs
- Use semantic versioning for seed names

### ❌ DON'T:
- Commit admin keys to git
- Share keys in chat/email
- Use weak/short keys
- Reuse same key across projects
- Expose keys in client-side code

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `test-admin-seed.html` | Browser UI for testing |
| `test-admin-seed.sh` | Shell script for CLI |
| `ADMIN_SEED_ENDPOINT.md` | Complete API docs |
| `seed_bundle.example.sql` | SQL template |

---

## 🎯 Quick Commands

```bash
# Deploy with defaults
./test-admin-seed.sh

# Deploy custom seed
./test-admin-seed.sh "My Bundle" my_seed.sql

# Test in browser
open test-admin-seed.html

# View endpoint logs
# Dashboard → Edge Functions → admin-seed → Logs

# Check deployed seeds
curl "$SUPABASE_URL/rest/v1/evidence_version_sets?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" | jq .
```

---

## ✨ What You Get

After successful deployment:

✅ Evidence authorities for each domain
✅ Research sources with tier classifications
✅ Evidence claims with confidence scores
✅ Clinical rules with trigger logic
✅ Care pathway templates
✅ Full citation traceability
✅ Audit trail in `evidence_version_sets`

All filtered by domain and ready for CDS endpoint to query!

---

## 🚀 Next Steps

1. ✅ Deploy first evidence pack
2. ✅ Verify in Evidence Overlay UI
3. ✅ Test CDS endpoint returns results
4. Add more domains as needed
5. Set up automated deployments
6. Monitor usage and performance

---

**Questions?** Check the full docs in `ADMIN_SEED_ENDPOINT.md`
