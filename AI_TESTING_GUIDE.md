# AI Features Testing Guide

## Quick Start

You've configured the OpenAI API key in Supabase. Now let's test that everything works!

## Testing Methods

### Method 1: Browser Test Suite (Recommended)

This is the easiest and most comprehensive way to test all AI features.

**Steps:**

1. **Open the test page**:
   ```
   Open: test-ai-functions.html
   ```
   You can drag this file into your browser or serve it locally.

2. **Login**:
   - Email: `jennifer.clinician@aimrehab.ca`
   - Password: `Demo2026!Clinician`
   - Click "Login" button
   - Wait for green checkmark

3. **Run Tests**:
   - Click "Run All Tests" button at the bottom
   - OR click individual test buttons to test specific features

4. **Review Results**:
   - Green badges = Success ✅
   - Red badges = Failed ❌
   - Each test shows detailed AI responses

**Expected Results:**
- Test 1: Basic connectivity - Should return "Hello from AIM OS!"
- Test 2: Schedule optimization - Should provide 3-5 recommendations
- Test 3: Scheduling recommendations - Should suggest specific actions
- Test 4: Financial analysis - Should identify trends and insights
- Test 5: Operational metrics - Should recommend improvements

**Total Time**: ~30-60 seconds for all tests

---

### Method 2: Test in Actual Scheduler

Test the AI features in the real application:

**Steps:**

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Login to the application**:
   - Go to: http://localhost:5173
   - Email: `jennifer.clinician@aimrehab.ca`
   - Password: `Demo2026!Clinician`

3. **Navigate to Scheduler**:
   - Click on "AIM OS" in the sidebar
   - Click "Scheduler" in the AIM OS menu

4. **Select a date with appointments**:
   - Use the date picker to select: February 3, 2026
   - Or any other date where you've seeded appointments

5. **Test AI Insights**:
   - Look for the right sidebar: "Scheduling Intelligence"
   - Find the purple "Get AI Insights" button with brain icon 🧠
   - Click the button
   - Wait 3-10 seconds for AI analysis

6. **Review AI Analysis**:
   You should see two sections:
   - **Analysis**: Comprehensive schedule review
   - **Recommendations**: Specific actionable suggestions

**Example AI Output:**

```
Analysis:
Based on the schedule for February 3, 2026:

1. Current utilization is 75%, indicating room for improvement
2. 2-hour lunch gap presents revenue opportunity
3. Appointments are well-distributed throughout the day
4. Morning slots are fully booked (good)
5. Afternoon has availability for add-ons

Recommendations:
1. Fill the 12:00-13:00 gap with short follow-ups or assessments
2. Add a standby list for same-day bookings
3. Consider extending operating hours by 30 minutes
4. Monitor no-show patterns for 9:15 time slot
5. Implement automated reminders 24h before appointments
```

---

### Method 3: Command Line Test (Advanced)

For developers who want to test the API directly:

**Test with curl:**

```bash
# First, get an auth token
AUTH_RESPONSE=$(curl -X POST "https://tfnoogotbyshsznpjspk.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M" \
  -H "Content-Type: application/json" \
  -d '{"email":"jennifer.clinician@aimrehab.ca","password":"Demo2026!Clinician"}')

# Extract access token
ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Test the AI function
curl -X POST "https://tfnoogotbyshsznpjspk.supabase.co/functions/v1/openai-assistant" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ],
    "model": "gpt-4o-mini"
  }'
```

---

## Troubleshooting

### Issue: "AI analysis unavailable"

**Cause**: OpenAI API key not configured or incorrect

**Solution**:
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Secrets
3. Verify `OPENAI_API_KEY` secret exists
4. Value should start with `sk-proj-`
5. Click Save if you made changes
6. Wait 30 seconds for edge function to reload

### Issue: "Not authenticated" error

**Cause**: Not logged in or session expired

**Solution**:
1. Logout and login again
2. Check credentials are correct
3. Clear browser cache if needed

### Issue: "OpenAI API quota exceeded"

**Cause**: API usage limits reached

**Solution**:
1. Check OpenAI account: https://platform.openai.com/account/usage
2. Add billing/credits to your OpenAI account
3. Or wait for quota reset (if on free tier)

### Issue: AI analysis is very slow (>30 seconds)

**Cause**: Large prompts or OpenAI API delays

**Solution**:
1. This is normal during high load
2. Try again in a few minutes
3. Consider using cached results (refresh after 1 hour)

### Issue: Responses are generic or unhelpful

**Cause**: Insufficient context in prompts

**Solution**:
1. Ensure you have appointments loaded for the selected date
2. Try a different date with more appointment data
3. Check that providers are properly loaded

---

## Verifying Success

### ✅ Checklist

- [ ] Test suite HTML page loads without errors
- [ ] Can login successfully
- [ ] Test 1 (Basic Connectivity) passes
- [ ] Test 2 (Schedule Optimization) passes
- [ ] Test 3 (Scheduling Recommendations) passes
- [ ] Test 4 (Financial Analysis) passes
- [ ] Test 5 (Operational Metrics) passes
- [ ] Can see AI Insights button in actual scheduler
- [ ] Clicking button triggers analysis (shows loading state)
- [ ] AI analysis displays within 10 seconds
- [ ] Recommendations are relevant and actionable

### Expected Token Usage

For cost monitoring:

| Test | Approximate Tokens | Estimated Cost |
|------|-------------------|----------------|
| Basic Connectivity | 50-100 | <$0.001 |
| Schedule Optimization | 800-1200 | $0.001-0.002 |
| Scheduling Recommendations | 600-1000 | $0.001-0.002 |
| Financial Analysis | 700-1000 | $0.001-0.002 |
| Operational Metrics | 700-1000 | $0.001-0.002 |
| **Total (All Tests)** | **~3000-4300** | **~$0.005-0.010** |

Single analysis in production scheduler: $0.01-0.03

---

## API Key Security

### Important Notes

- ✅ API key is stored in Supabase secrets (secure)
- ✅ API key is NOT exposed to client-side code
- ✅ Edge function handles all OpenAI communication
- ✅ Users can only access AI via authenticated requests
- ❌ Never commit API keys to git
- ❌ Never log API keys in console
- ❌ Never expose API keys in client code

The current implementation is **secure** - API key stays server-side only.

---

## Cost Management Tips

### Setting Limits

1. **OpenAI Dashboard**:
   - Go to: https://platform.openai.com/account/limits
   - Set monthly spending limit
   - Enable email alerts at 75% usage

2. **Application-Level**:
   - Implement daily per-user limits (e.g., 10 analyses)
   - Cache results for 1 hour
   - Use gpt-4o-mini (cheaper) instead of gpt-4o

3. **Monitoring**:
   - Check Supabase Edge Function logs
   - Review OpenAI usage dashboard weekly
   - Track tokens per request

### Estimated Monthly Costs

Based on typical usage:

| Scenario | Daily AI Requests | Monthly Cost |
|----------|------------------|--------------|
| Light (5 clinics) | 50 | $15-30 |
| Medium (15 clinics) | 150 | $45-90 |
| Heavy (30 clinics) | 300 | $90-180 |

*Assumes average $0.01-0.02 per analysis*

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark AI features as production-ready
2. 📚 Train users on "Get AI Insights" button
3. 📊 Monitor usage and costs for first week
4. 🎯 Gather feedback on AI recommendation quality
5. 🔧 Fine-tune prompts based on user feedback
6. 📈 Expand AI features to other modules

---

## Support Resources

- **OpenAI Status**: https://status.openai.com
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Project Documentation**: See AI_FEATURES_SETUP.md

---

**Last Updated**: January 31, 2026
**Version**: 1.0
