#!/bin/bash

# Verification script for CDS endpoint
# Tests the /functions/v1/cds-match endpoint with all three domains

set -e

SUPABASE_URL="${VITE_SUPABASE_URL:-https://xtdewfoxawxqcnzjqkgx.supabase.co}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZGV3Zm94YXd4cWNuempxa2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MjcxMzEsImV4cCI6MjA1MTQwMzEzMX0.HCzgHl1LNDlJQn9G21WJ9Bb_ynP9jVtzEHbkMFQCBXE}"

ENDPOINT="${SUPABASE_URL}/functions/v1/cds-match"

echo "🔍 Verifying CDS Endpoint"
echo "Endpoint: ${ENDPOINT}"
echo ""

# Test 1: Chronic Pain
echo "1️⃣  Testing Chronic Pain domain..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -d '{"domain":"chronic_pain","preferences":{"limit_claims":5}}')

CLAIM_COUNT=$(echo $RESPONSE | grep -o '"returned_claims":[0-9]*' | cut -d: -f2)
if [ "$CLAIM_COUNT" -gt 0 ]; then
  echo "   ✅ Success: $CLAIM_COUNT claims returned"
else
  echo "   ❌ Failed: No claims returned"
  echo "   Response: $RESPONSE"
fi
echo ""

# Test 2: ACL
echo "2️⃣  Testing ACL domain..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -d '{"domain":"acl","preferences":{"limit_claims":5}}')

CLAIM_COUNT=$(echo $RESPONSE | grep -o '"returned_claims":[0-9]*' | cut -d: -f2)
if [ "$CLAIM_COUNT" -gt 0 ]; then
  echo "   ✅ Success: $CLAIM_COUNT claims returned"
else
  echo "   ❌ Failed: No claims returned"
  echo "   Response: $RESPONSE"
fi
echo ""

# Test 3: Neuro
echo "3️⃣  Testing Neuro domain..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -d '{"domain":"neuro","preferences":{"limit_claims":5}}')

CLAIM_COUNT=$(echo $RESPONSE | grep -o '"returned_claims":[0-9]*' | cut -d: -f2)
if [ "$CLAIM_COUNT" -gt 0 ]; then
  echo "   ✅ Success: $CLAIM_COUNT claims returned"
else
  echo "   ❌ Failed: No claims returned"
  echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: With preferences
echo "4️⃣  Testing with tags and outcomes..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -d '{"domain":"chronic_pain","preferences":{"tags":["sleep","exercise"],"outcome_focus":["function"],"limit_claims":3}}')

CLAIM_COUNT=$(echo $RESPONSE | grep -o '"returned_claims":[0-9]*' | cut -d: -f2)
if [ "$CLAIM_COUNT" -gt 0 ]; then
  echo "   ✅ Success: $CLAIM_COUNT claims returned with filtering"
else
  echo "   ⚠️  Warning: No claims matched filters"
fi
echo ""

echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "  - Open test-cds-endpoint.html for interactive testing"
echo "  - Review CDS_QUICK_START.md for usage examples"
echo "  - Check CDS_ENDPOINT_AND_SEED_GUIDE.md for full documentation"
