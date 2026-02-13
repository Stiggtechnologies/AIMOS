#!/bin/bash
# Cleanup Test/Demo Users from Supabase Auth
# Created: 2026-02-12
# Run AFTER the database migration to remove auth.users entries

set -e

echo "🧹 AIMOS Test Data Cleanup - Auth Users"
echo "========================================"
echo ""
echo "This script removes demo user accounts from Supabase Auth."
echo ""
echo "⚠️  WARNING: This will permanently delete the following accounts:"
echo ""
echo "  - sarah.executive@aimrehab.ca"
echo "  - michael.manager@aimrehab.ca"
echo "  - jennifer.clinician@aimrehab.ca"
echo "  - david.admin@aimrehab.ca"
echo "  - amanda.contractor@aimrehab.ca"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "📋 Step 1: Getting demo user IDs from Supabase..."

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed"
    echo "Install with: brew install jq"
    exit 1
fi

# Get Supabase project details
echo ""
echo "Enter your Supabase project details:"
read -p "Project URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
read -sp "Service Role Key: " SERVICE_KEY
echo ""

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: Project URL and Service Role Key are required"
    exit 1
fi

# List of demo emails
DEMO_EMAILS=(
    "sarah.executive@aimrehab.ca"
    "michael.manager@aimrehab.ca"
    "jennifer.clinician@aimrehab.ca"
    "david.admin@aimrehab.ca"
    "amanda.contractor@aimrehab.ca"
)

echo ""
echo "🔍 Finding and deleting demo users..."
echo ""

deleted_count=0
error_count=0

for email in "${DEMO_EMAILS[@]}"; do
    echo "Processing: $email"
    
    # Get user ID by email
    user_data=$(curl -s -X GET \
        "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        | jq -r ".users[] | select(.email==\"${email}\") | .id" 2>/dev/null || echo "")
    
    if [ -z "$user_data" ]; then
        echo "  ℹ️  Not found (may already be deleted)"
        continue
    fi
    
    user_id="$user_data"
    echo "  Found: $user_id"
    
    # Delete the user
    response=$(curl -s -X DELETE \
        "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -w "\n%{http_code}" || echo "000")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        echo "  ✅ Deleted successfully"
        ((deleted_count++))
    else
        echo "  ❌ Failed (HTTP $http_code)"
        ((error_count++))
    fi
    
    echo ""
done

echo "========================================"
echo "📊 Summary:"
echo "  Deleted: $deleted_count users"
echo "  Errors: $error_count"
echo ""

if [ $error_count -gt 0 ]; then
    echo "⚠️  Some users could not be deleted. You may need to:"
    echo "  1. Verify your Service Role Key has admin privileges"
    echo "  2. Check Supabase Dashboard → Authentication → Users"
    echo "  3. Manually delete remaining test users"
else
    echo "✅ All demo users removed successfully!"
fi

echo ""
echo "🔍 Next steps:"
echo "  1. Verify in Supabase Dashboard → Authentication → Users"
echo "  2. Check CRM leads: SELECT * FROM crm_leads;"
echo "  3. Deploy Facebook Ads integration: ./deploy-facebook-integration.sh"
echo ""
