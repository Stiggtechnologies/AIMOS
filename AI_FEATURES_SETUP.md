# AI Features Setup Guide

This document explains how to configure and use the AI-powered features in the AIM OS Scheduler.

## Overview

The scheduler now includes advanced AI capabilities powered by OpenAI:

1. **Schedule Optimization Analysis** - AI analyzes your daily/weekly schedule and identifies optimization opportunities
2. **No-Show Risk Prediction** - Predicts likelihood of patient no-shows
3. **Capacity Gap Detection** - Identifies underutilized time slots
4. **Workload Balance Recommendations** - Suggests provider workload distribution improvements
5. **Revenue Optimization** - Recommends actions to maximize clinic revenue

## Prerequisites

- OpenAI API key (already added to `.env` file)
- Supabase project with Edge Functions enabled
- Authenticated user session

## Configuration

### Step 1: Set OpenAI API Key in Supabase

The OpenAI API key needs to be configured as a Supabase secret for the edge function to work:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Project Settings** > **Edge Functions** > **Secrets**
3. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: `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`
4. Click **Save**

#### Option B: Using Supabase CLI (if installed locally)
```bash
supabase secrets set OPENAI_API_KEY=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
```

### Step 2: Verify Edge Function Deployment

The `openai-assistant` edge function has been deployed. You can verify it's running:

1. Go to Supabase Dashboard > **Edge Functions**
2. Confirm `openai-assistant` is listed and deployed
3. The function endpoint: `https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/openai-assistant`

## Using AI Features

### In the Scheduler

1. **Navigate to Scheduler**: AIM OS > Scheduler
2. **Select Date**: Choose any date with appointments
3. **View AI Panel**: On the right sidebar under "Scheduling Intelligence"
4. **Click "Get AI Insights"**: The purple button with brain icon
5. **View Analysis**: AI will analyze the schedule and provide:
   - Schedule optimization recommendations
   - Utilization insights
   - Capacity gap opportunities
   - Provider workload balance suggestions

### AI Insights Include:

**Automatic Insights (always visible with AI Overlays enabled):**
- No-show risk indicators on appointments (orange borders)
- Overbooking alerts
- Capacity gaps between appointments
- Provider underutilization warnings

**On-Demand AI Analysis:**
- Comprehensive schedule analysis
- Actionable recommendations
- Revenue optimization opportunities
- Operational efficiency suggestions

## API Usage

The AI features use the OpenAI GPT-4o-mini model by default for cost-efficiency while maintaining high quality.

**Estimated costs:**
- Schedule analysis: ~$0.01-0.03 per analysis
- No-show prediction: ~$0.001 per appointment
- Daily usage for active clinic: ~$0.50-2.00/day

## Troubleshooting

### "AI analysis unavailable" error

**Cause**: OpenAI API key not configured in Supabase
**Solution**: Follow Step 1 above to set the secret

### "Failed to generate AI insights" error

**Causes:**
1. OpenAI API quota exceeded
2. Invalid API key
3. Network connectivity issues

**Solutions:**
1. Check OpenAI account credits: https://platform.openai.com/account/usage
2. Verify API key is correct and active
3. Check Supabase Edge Function logs for detailed errors

### No AI button visible

**Cause**: Component not rendering
**Solution**: Ensure you're logged in and have appropriate permissions

## Advanced Configuration

### Changing AI Model

To use a different OpenAI model, edit `src/services/openaiService.ts`:

```typescript
// Change from gpt-4o-mini to gpt-4o for higher quality (higher cost)
model: 'gpt-4o-mini'  // or 'gpt-4o', 'gpt-4-turbo'
```

### Customizing AI Prompts

Edit the system prompt in `supabase/functions/openai-assistant/index.ts`:

```typescript
const systemPrompt = `You are an AI assistant for Alberta Injury Management (AIM)...`
```

### Rate Limiting

Consider implementing rate limiting to control costs:
- Max AI analyses per user per day
- Caching results for repeated queries
- Using lower-cost models for non-critical insights

## Features Roadmap

Future AI enhancements planned:
- Real-time appointment rescheduling suggestions
- Patient communication optimization (SMS/email timing)
- Provider scheduling preference learning
- Predictive demand forecasting
- Automated waitlist management

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review OpenAI API status: https://status.openai.com
3. Consult project documentation
4. Contact development team

---

**Last Updated**: January 31, 2026
**Version**: 1.0
