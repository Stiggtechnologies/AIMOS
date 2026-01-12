# AI Implementation Guide
## Connecting Real Intelligence to the Autonomous Agent System

---

## Overview

This guide explains how to implement actual AI/LLM capabilities for each agent to make the system truly autonomous and intelligent.

---

## 1. LLM Integration Setup

### Option A: OpenAI

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateCompletion(prompt: string, systemPrompt?: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt || 'You are an AI assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  });

  return response.choices[0].message.content;
}
```

### Option B: Anthropic Claude

```typescript
// src/lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateCompletion(prompt: string, systemPrompt?: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text;
}
```

---

## 2. Agent Implementation Examples

### Strategy Agent: Workforce Forecasting

```typescript
// src/agents/strategyAgent.ts
import { generateCompletion } from '../lib/openai';
import { supabase } from '../lib/supabase';

export async function performWorkforceForecast(location: string, roleType: string) {
  // Get historical data
  const { data: historicalHires } = await supabase
    .from('applications')
    .select('*, job:jobs!inner(*)')
    .eq('job.location', location)
    .eq('job.role_type', roleType)
    .eq('status', 'accepted')
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

  const { data: clinicalVolume } = await supabase
    .from('clinical_metrics')
    .select('*')
    .eq('location', location)
    .order('date', { ascending: false })
    .limit(90);

  const prompt = `
    Analyze workforce needs for ${roleType} position in ${location}.

    Historical hiring data:
    ${JSON.stringify(historicalHires, null, 2)}

    Clinical volume trends:
    ${JSON.stringify(clinicalVolume, null, 2)}

    Based on this data:
    1. Predict staffing needs for the next 90 days
    2. Identify shortage risks
    3. Recommend optimal headcount
    4. Suggest timing for job postings

    Respond in JSON format:
    {
      "predicted_demand": <number>,
      "current_capacity": <number>,
      "shortage_gap": <number>,
      "recommended_hires": <number>,
      "urgency": "low|medium|high",
      "optimal_posting_date": "YYYY-MM-DD",
      "rationale": "explanation"
    }
  `;

  const systemPrompt = `You are a workforce planning AI specialist for healthcare talent acquisition in Alberta, Canada. Analyze trends, seasonality, and growth patterns to make data-driven hiring recommendations.`;

  const response = await generateCompletion(prompt, systemPrompt);
  const forecast = JSON.parse(response);

  // Store forecast
  await supabase.from('forecasts').insert({
    forecast_type: 'workforce_demand',
    location,
    role_type: roleType,
    period_start: new Date().toISOString(),
    period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    predicted_demand: forecast.predicted_demand,
    predicted_supply: forecast.current_capacity,
    shortage_gap: forecast.shortage_gap,
    confidence_score: 8.5,
    recommendations: [forecast.rationale],
    created_by_agent: 'strategy-agent'
  });

  // Auto-create job if urgent
  if (forecast.urgency === 'high' && forecast.shortage_gap > 0) {
    await createJobRequisition(location, roleType, forecast);
  }

  return forecast;
}

async function createJobRequisition(location: string, roleType: string, forecast: any) {
  const jobDescription = await generateJobDescription(roleType, location);
  const compensation = await calibrateCompensation(roleType, location);

  await supabase.from('jobs').insert({
    title: `${roleType} - ${location}`,
    role_type: roleType,
    location,
    status: 'active',
    compensation_min: compensation.min,
    compensation_max: compensation.max,
    job_description: jobDescription,
    priority_score: forecast.urgency === 'high' ? 9.0 : 7.0,
    target_fill_date: forecast.optimal_posting_date,
    created_by_agent: 'strategy-agent'
  });
}
```

---

### Screening Agent: Resume Analysis

```typescript
// src/agents/screeningAgent.ts
import { generateCompletion } from '../lib/openai';
import { supabase } from '../lib/supabase';

export async function screenCandidate(applicationId: string) {
  const { data: application } = await supabase
    .from('applications')
    .select('*, candidate:candidates(*), job:jobs(*)')
    .eq('id', applicationId)
    .single();

  const resumeText = application.candidate.resume_text;
  const jobRequirements = application.job.requirements;

  const prompt = `
    Evaluate this candidate for the position.

    Job: ${application.job.title}
    Location: ${application.job.location}

    Requirements:
    ${JSON.stringify(jobRequirements, null, 2)}

    Candidate Resume:
    ${resumeText}

    Provide a comprehensive evaluation:

    1. Qualification Match Score (0-100)
    2. Key Strengths (bullet points)
    3. Potential Concerns (bullet points)
    4. Red Flags (if any)
    5. Salary Fit (considering ${application.job.compensation_min}-${application.job.compensation_max} range)
    6. Recommendation: STRONG_YES | YES | MAYBE | NO | STRONG_NO
    7. Next Steps

    Respond in JSON format:
    {
      "overall_score": <0-100>,
      "qualification_score": <0-100>,
      "experience_score": <0-100>,
      "cultural_fit_score": <0-100>,
      "strengths": ["strength1", "strength2"],
      "concerns": ["concern1", "concern2"],
      "red_flags": ["flag1"],
      "salary_fit": "below|within|above",
      "recommendation": "STRONG_YES|YES|MAYBE|NO|STRONG_NO",
      "next_steps": "detailed recommendation",
      "rationale": "explanation"
    }
  `;

  const systemPrompt = `You are an expert healthcare talent screener specializing in physiotherapy, kinesiology, and rehabilitation professionals in Alberta, Canada. Evaluate candidates objectively based on qualifications, experience, and fit.`;

  const response = await generateCompletion(prompt, systemPrompt);
  const evaluation = JSON.parse(response);

  // Update application with screening results
  await supabase
    .from('applications')
    .update({
      screening_score: evaluation.overall_score,
      screening_notes: evaluation.rationale,
      technical_assessment_score: evaluation.qualification_score,
      cultural_fit_score: evaluation.cultural_fit_score,
      overall_assessment: evaluation,
      status: determineNextStatus(evaluation.recommendation)
    })
    .eq('id', applicationId);

  // Trigger appropriate workflow
  if (evaluation.recommendation === 'STRONG_YES' || evaluation.overall_score >= 85) {
    await scheduleInterview(applicationId, 'priority');
  } else if (evaluation.recommendation === 'NO' || evaluation.overall_score < 40) {
    await rejectApplication(applicationId, evaluation.rationale);
  }

  return evaluation;
}

function determineNextStatus(recommendation: string): string {
  switch (recommendation) {
    case 'STRONG_YES': return 'interview_scheduled';
    case 'YES': return 'screening';
    case 'MAYBE': return 'screening';
    case 'NO':
    case 'STRONG_NO': return 'rejected';
    default: return 'screening';
  }
}
```

---

### Sourcing Agent: Boolean Search Generation

```typescript
// src/agents/sourcingAgent.ts
import { generateCompletion } from '../lib/openai';

export async function generateBooleanSearchString(job: any) {
  const prompt = `
    Generate an advanced Boolean search string for LinkedIn Recruiter to find candidates for this position:

    Job Title: ${job.title}
    Role Type: ${job.role_type}
    Location: ${job.location}
    Requirements: ${JSON.stringify(job.requirements)}

    Create a search string that includes:
    1. Job title variations
    2. Required skills and certifications
    3. Experience level indicators
    4. Location targeting (Alberta, Canada)
    5. Exclude irrelevant profiles

    Use proper Boolean operators (AND, OR, NOT, parentheses).
    Optimize for LinkedIn's search syntax.

    Respond with just the search string, no explanation.
  `;

  const systemPrompt = `You are an expert Boolean search specialist for healthcare recruitment. Create precise, effective search strings for finding qualified candidates.`;

  const searchString = await generateCompletion(prompt, systemPrompt);

  return searchString.trim();
}

export async function generateOutreachMessage(candidate: any, job: any) {
  const prompt = `
    Write a personalized LinkedIn InMail to this candidate:

    Candidate: ${candidate.first_name} ${candidate.last_name}
    Current Role: ${candidate.enrichment_data?.current_title || 'Professional'}
    Experience: ${candidate.experience_years} years

    Job Opportunity: ${job.title} at Alberta Injury Management Inc.
    Location: ${job.location}

    Create a compelling, personalized message that:
    1. References their specific experience
    2. Highlights the opportunity value
    3. Mentions competitive compensation
    4. Includes a clear call-to-action
    5. Keeps it under 300 words
    6. Professional but warm tone

    Do not use generic templates. Make it personal and authentic.
  `;

  const systemPrompt = `You are an expert healthcare recruiter writing personalized outreach messages. Your messages have a 40% response rate because they're genuine, relevant, and respectful.`;

  const message = await generateCompletion(prompt, systemPrompt);

  return message;
}
```

---

### Interview Coordinator: Scheduling Intelligence

```typescript
// src/agents/interviewCoordinatorAgent.ts
import { generateCompletion } from '../lib/openai';

export async function findOptimalInterviewSlot(
  candidateAvailability: string[],
  interviewerCalendars: any[]
) {
  const prompt = `
    Find the best interview time slot considering:

    Candidate Availability:
    ${candidateAvailability.join('\n')}

    Interviewer Calendars:
    ${JSON.stringify(interviewerCalendars, null, 2)}

    Constraints:
    - Must be during business hours (8 AM - 5 PM Mountain Time)
    - Prefer mornings (better engagement)
    - Avoid back-to-back meetings (15 min buffer)
    - Consider time zones if remote

    Return top 3 optimal time slots with reasoning.

    Respond in JSON:
    {
      "recommended_slots": [
        {
          "datetime": "YYYY-MM-DDTHH:mm:ss",
          "score": <0-100>,
          "reasoning": "why this is optimal"
        }
      ]
    }
  `;

  const response = await generateCompletion(prompt);
  return JSON.parse(response);
}
```

---

### Offer Agent: Salary Negotiation

```typescript
// src/agents/offerAgent.ts
import { generateCompletion } from '../lib/openai';

export async function handleSalaryNegotiation(
  offerId: string,
  candidateCounterOffer: number,
  originalOffer: number,
  budget: { min: number; max: number }
) {
  const prompt = `
    Handle salary negotiation:

    Original Offer: $${originalOffer} CAD
    Candidate Counter: $${candidateCounterOffer} CAD
    Budget Range: $${budget.min} - $${budget.max} CAD

    Provide negotiation strategy:
    1. Should we accept, counter, or decline?
    2. If counter, what amount?
    3. What non-salary benefits can we offer?
    4. Risk assessment of losing candidate
    5. Negotiation talking points

    Respond in JSON:
    {
      "action": "accept|counter|decline",
      "counter_amount": <number or null>,
      "rationale": "explanation",
      "alternative_benefits": ["benefit1", "benefit2"],
      "risk_level": "low|medium|high",
      "talking_points": ["point1", "point2"]
    }
  `;

  const systemPrompt = `You are an expert HR negotiator specializing in healthcare compensation in Alberta. Balance candidate satisfaction with budget constraints.`;

  const response = await generateCompletion(prompt, systemPrompt);
  const strategy = JSON.parse(response);

  // Execute strategy
  if (strategy.action === 'accept') {
    await acceptCounterOffer(offerId, candidateCounterOffer);
  } else if (strategy.action === 'counter') {
    await sendCounterOffer(offerId, strategy.counter_amount, strategy.talking_points);
  }

  return strategy;
}
```

---

### Analytics Agent: Insight Generation

```typescript
// src/agents/analyticsAgent.ts
import { generateCompletion } from '../lib/openai';
import { supabase } from '../lib/supabase';

export async function generateOptimizationInsights() {
  // Gather all relevant metrics
  const { data: kpis } = await supabase.from('kpis').select('*');
  const { data: channels } = await supabase.from('sourcing_channels').select('*');
  const { data: applications } = await supabase
    .from('applications')
    .select('*, candidate:candidates(*), job:jobs(*)');

  const prompt = `
    Analyze talent acquisition performance and provide optimization recommendations:

    KPIs:
    ${JSON.stringify(kpis, null, 2)}

    Sourcing Channel Performance:
    ${JSON.stringify(channels, null, 2)}

    Recent Applications Summary:
    - Total: ${applications.length}
    - Screening: ${applications.filter(a => a.status === 'screening').length}
    - Interviewing: ${applications.filter(a => a.status === 'interviewing').length}
    - Conversion Rate: ${(applications.filter(a => a.status === 'accepted').length / applications.length * 100).toFixed(1)}%

    Provide:
    1. Key insights (3-5 bullet points)
    2. Performance bottlenecks
    3. Channel optimization recommendations
    4. Process improvements
    5. Predicted trends for next month

    Respond in JSON:
    {
      "insights": ["insight1", "insight2"],
      "bottlenecks": ["bottleneck1"],
      "channel_recommendations": {
        "increase": ["channel1"],
        "decrease": ["channel2"],
        "optimize": ["channel3"]
      },
      "process_improvements": ["improvement1"],
      "predictions": {
        "time_to_fill": <days>,
        "application_volume": <number>,
        "conversion_rate": <percent>
      }
    }
  `;

  const response = await generateCompletion(prompt);
  const insights = JSON.parse(response);

  // Store insights for dashboard
  await supabase.from('agent_memory').upsert({
    agent_name: 'analytics-agent',
    memory_key: 'latest_insights',
    memory_value: insights,
    memory_type: 'long_term'
  });

  return insights;
}
```

---

## 3. Real-time Event Processing

### Edge Function: Agent Orchestrator

```typescript
// supabase/functions/agent-orchestrator/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { performWorkforceForecast } from './agents/strategyAgent.ts';
import { screenCandidate } from './agents/screeningAgent.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (_req) => {
  const startTime = Date.now();

  try {
    // Fetch pending events
    const { data: events } = await supabase
      .from('agent_events')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .limit(10);

    const results = [];

    for (const event of events || []) {
      const result = await processEvent(event);
      results.push(result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        events_processed: results.length,
        execution_time_ms: Date.now() - startTime
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});

async function processEvent(event: any) {
  await supabase
    .from('agent_events')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', event.id);

  try {
    let result;

    // Route to appropriate agent
    switch (event.agent_name) {
      case 'strategy-agent':
        result = await handleStrategyAgent(event);
        break;
      case 'screening-agent':
        result = await handleScreeningAgent(event);
        break;
      // Add other agents...
      default:
        throw new Error(`Unknown agent: ${event.agent_name}`);
    }

    await supabase
      .from('agent_events')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', event.id);

    return { success: true, result };

  } catch (error) {
    await supabase
      .from('agent_events')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', event.id);

    return { success: false, error: error.message };
  }
}

async function handleScreeningAgent(event: any) {
  if (event.event_type === 'screen_candidate') {
    return await screenCandidate(event.payload.application_id);
  }
}
```

---

## 4. Integration Examples

### LinkedIn API Integration

```typescript
// src/integrations/linkedin.ts
export async function postJobToLinkedIn(job: any) {
  const response = await fetch('https://api.linkedin.com/v2/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: job.title,
      description: job.job_description,
      location: job.location,
      employmentType: 'FULL_TIME',
      // ... other fields
    })
  });

  return response.json();
}

export async function searchCandidates(searchString: string) {
  // Use LinkedIn Recruiter API
  const response = await fetch(
    `https://api.linkedin.com/v2/talentSearch?keywords=${encodeURIComponent(searchString)}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`
      }
    }
  );

  return response.json();
}
```

### Indeed API Integration

```typescript
// src/integrations/indeed.ts
export async function postJobToIndeed(job: any) {
  const response = await fetch('https://api.indeed.com/v2/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.INDEED_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: job.title,
      description: job.job_description,
      location: job.location,
      salary: {
        min: job.compensation_min,
        max: job.compensation_max,
        currency: 'CAD'
      }
    })
  });

  return response.json();
}
```

---

## 5. Testing AI Agents

### Unit Test Example

```typescript
// tests/agents/screeningAgent.test.ts
import { screenCandidate } from '../src/agents/screeningAgent';

describe('Screening Agent', () => {
  it('should score qualified candidate highly', async () => {
    const mockApplication = {
      id: 'test-123',
      candidate: {
        resume_text: 'Registered Physiotherapist with 5 years experience...',
        experience_years: 5
      },
      job: {
        title: 'Senior Physiotherapist',
        requirements: { years_experience: 3, license: 'Alberta' }
      }
    };

    const result = await screenCandidate(mockApplication.id);

    expect(result.overall_score).toBeGreaterThan(70);
    expect(result.recommendation).toBe('YES' | 'STRONG_YES');
  });
});
```

---

## 6. Deployment Checklist

- [ ] Set up OpenAI or Anthropic API key
- [ ] Configure LinkedIn API credentials
- [ ] Set up Indeed Publisher account
- [ ] Configure email service (SendGrid/Gmail)
- [ ] Set up Twilio for SMS
- [ ] Deploy Edge Function for agent orchestrator
- [ ] Configure cron schedule (every 1-5 minutes)
- [ ] Test each agent with real data
- [ ] Monitor agent execution logs
- [ ] Set up error alerting

---

## 7. Monitoring AI Performance

Track these metrics for each agent:
- Execution success rate
- Average processing time
- Token usage and costs
- Decision accuracy (human feedback loop)
- False positive/negative rates

---

**With these implementations, your agents will have real AI intelligence and autonomous decision-making capabilities!**
