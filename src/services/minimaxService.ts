import { supabase } from '../lib/supabase';

export type MinimaxModel = 'MiniMax-Text-01' | 'abab6.5s-chat' | 'abab6.5-chat' | 'abab6-chat';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MinimaxRequest {
  messages: ChatMessage[];
  model?: MinimaxModel;
  temperature?: number;
  max_tokens?: number;
  context?: any;
  stream?: boolean;
}

export interface MinimaxResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Authentication required');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function callMinimax(request: MinimaxRequest): Promise<MinimaxResponse> {
  const headers = await getAuthHeaders();
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/minimax-assistant`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: request.messages,
      model: request.model ?? 'MiniMax-Text-01',
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 1000,
      context: request.context,
      stream: request.stream ?? false,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Minimax request failed (${response.status})`);
  }

  return response.json();
}

export async function chatWithMinimax(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: any
): Promise<string> {
  const response = await callMinimax({
    messages: [...conversationHistory, { role: 'user', content: userMessage }],
    model: 'MiniMax-Text-01',
    temperature: 0.7,
    max_tokens: 1000,
    context,
  });
  return response.choices[0].message.content;
}

export async function analyzeFinancialDataMinimax(financialData: any): Promise<string> {
  const response = await callMinimax({
    messages: [
      {
        role: 'user',
        content: `Analyze this financial data and provide key insights, trends, and recommendations:\n\n${JSON.stringify(financialData, null, 2)}`,
      },
    ],
    model: 'MiniMax-Text-01',
    temperature: 0.5,
    max_tokens: 1500,
    context: { type: 'financial_analysis', data: financialData },
  });
  return response.choices[0].message.content;
}

export async function generateExecutiveSummaryMinimax(data: any): Promise<string> {
  const response = await callMinimax({
    messages: [
      {
        role: 'user',
        content: `Create a concise executive summary of this data, highlighting the most important insights and action items:\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
    model: 'MiniMax-Text-01',
    temperature: 0.6,
    max_tokens: 1000,
    context: { type: 'executive_summary' },
  });
  return response.choices[0].message.content;
}

export async function analyzeOperationalMetricsMinimax(metricsData: any): Promise<string> {
  const response = await callMinimax({
    messages: [
      {
        role: 'user',
        content: `Analyze these operational metrics and identify improvement opportunities:\n\n${JSON.stringify(metricsData, null, 2)}`,
      },
    ],
    model: 'MiniMax-Text-01',
    temperature: 0.5,
    max_tokens: 1200,
    context: { type: 'operational_analysis', data: metricsData },
  });
  return response.choices[0].message.content;
}

export async function generateSchedulingRecommendationsMinimax(data: {
  gaps: any[];
  underutilizedProviders: any[];
  overbookedSlots: any[];
}): Promise<string> {
  const response = await callMinimax({
    messages: [
      {
        role: 'system',
        content: 'You are a healthcare scheduling expert. Provide specific, actionable recommendations to optimize clinic operations.',
      },
      {
        role: 'user',
        content: `Based on this scheduling analysis, provide specific recommendations:\n\nSchedule Gaps: ${data.gaps.length}\nUnderutilized Providers: ${data.underutilizedProviders.length}\nOverbooked Slots: ${data.overbookedSlots.length}\n\nDetails:\n${JSON.stringify(data, null, 2)}\n\nProvide 3-5 prioritized recommendations that can be implemented today.`,
      },
    ],
    model: 'MiniMax-Text-01',
    temperature: 0.6,
    max_tokens: 1000,
    context: { type: 'scheduling_recommendations', data },
  });
  return response.choices[0].message.content;
}
