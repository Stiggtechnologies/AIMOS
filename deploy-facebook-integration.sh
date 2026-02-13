#!/bin/bash
# Facebook Ads Integration Deployment Script
# Created: 2026-02-12
# Run from AIMOS root directory

set -e

echo "🚀 Deploying Facebook Ads Integration to AIMOS..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo "❌ Error: Must run from AIMOS root directory"
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not installed"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

echo "📦 Step 1: Deploying database migration..."
supabase db push

echo ""
echo "⚡ Step 2: Deploying Edge Function..."
supabase functions deploy facebook-leads-webhook

echo ""
echo "🔐 Step 3: Setting environment variables..."
supabase secrets set FACEBOOK_WEBHOOK_VERIFY_TOKEN=aimos_fb_leads

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Get your webhook URL:"
echo "   https://[your-project-id].supabase.co/functions/v1/facebook-leads-webhook"
echo ""
echo "2. Set up Zapier integration (15 min):"
echo "   See: FACEBOOK_ADS_INTEGRATION.md → Setup Options → Option A"
echo ""
echo "3. Test with a real lead:"
echo "   Submit a test through your Facebook form"
echo "   Check AIMOS CRM → Live Lead Queue"
echo ""
echo "4. Add email notifications (5 min):"
echo "   Add Gmail/Email action in Zapier"
echo "   Send to: aim2recover@albertainjurymanagement.ca"
echo ""
echo "📖 Full documentation: FACEBOOK_ADS_INTEGRATION.md"
echo ""
