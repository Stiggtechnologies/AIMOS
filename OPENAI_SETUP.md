# OpenAI Integration Setup

## Overview
Your AIM OS system now has OpenAI integration for advanced AI capabilities including:
- Natural language queries and conversations
- Financial data analysis and insights
- Document analysis and extraction
- Predictive analytics for revenue and operations
- Executive summaries and reporting

## Setup Instructions

### 1. Get Your OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-...`)

### 2. Add API Key to Supabase
You need to add your OpenAI API key as a secret in Supabase:

**Option A: Using Supabase CLI** (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref tfnoogotbyshsznpjspk

# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Option B: Using Supabase Dashboard**
1. Go to [https://supabase.com/dashboard/project/tfnoogotbyshsznpjspk/settings/vault/secrets](https://supabase.com/dashboard/project/tfnoogotbyshsznpjspk/settings/vault/secrets)
2. Click "New Secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (starts with `sk-...`)
5. Click "Create"

### 3. Verify Setup
Once configured, the AI features will automatically work. You can test by:
1. Go to **AI Assistant Dashboard**
2. Click "Chat with AI Assistant"
3. Ask a question like "Analyze our December revenue"

## Features Available

### 1. AI Assistant Chat
- Natural language conversations about your business
- Ask questions about financial data, operations, staff, etc.
- Get recommendations and insights

### 2. Financial Analysis
- Automated analysis of revenue and expense trends
- Identification of financial risks
- Cash flow predictions
- Budget variance analysis

### 3. Operational Insights
- Capacity utilization recommendations
- Staffing optimization suggestions
- Patient flow improvements
- No-show rate reduction strategies

### 4. Intake Optimization
- AI-powered lead scoring
- Conversion rate improvement suggestions
- Automated follow-up recommendations
- Priority routing based on patient data

### 5. Revenue Risk Detection
- Denial pattern analysis
- AR aging insights
- Payer performance tracking
- Coding accuracy recommendations

### 6. Document Analysis
- Extract key information from uploaded documents
- Analyze contracts and agreements
- Process financial statements
- Review clinical documentation

## Cost Management

### Model Options
- **gpt-4o-mini** (Default): Fast and cost-effective ($0.15/1M input tokens)
- **gpt-4o**: Most capable ($2.50/1M input tokens)
- **gpt-4-turbo**: Balanced performance ($10/1M input tokens)

### Estimated Costs
Based on typical usage:
- **Light usage** (100 queries/month): ~$1-3/month
- **Medium usage** (500 queries/month): ~$5-15/month
- **Heavy usage** (2000 queries/month): ~$20-50/month

### Cost Tracking
- All API calls log token usage to console
- Monitor usage in OpenAI dashboard: [https://platform.openai.com/usage](https://platform.openai.com/usage)
- Set spending limits in OpenAI dashboard to prevent overages

## Security Notes

✅ **Your API key is secure:**
- Stored as a Supabase secret (encrypted)
- Never exposed to client-side code
- All requests go through authenticated edge functions
- Only authenticated users can access AI features

## Troubleshooting

### "OpenAI API key not configured" Error
- Verify you've added the secret to Supabase
- Check the secret name is exactly: `OPENAI_API_KEY`
- Wait 1-2 minutes after adding secret for it to propagate
- Restart your edge functions if needed

### "Authentication required" Error
- Make sure you're logged in to the application
- Check your session hasn't expired
- Try logging out and back in

### API Request Fails
- Check your OpenAI account has credits/billing set up
- Verify your API key is active in OpenAI dashboard
- Check OpenAI status: [https://status.openai.com](https://status.openai.com)

## Support
For issues or questions:
- OpenAI API Docs: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- Supabase Edge Functions: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
