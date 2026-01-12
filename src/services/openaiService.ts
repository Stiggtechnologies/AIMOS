import { supabase } from '../lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIRequest {
  messages: ChatMessage[];
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature?: number;
  max_tokens?: number;
  context?: any;
}

export interface OpenAIResponse {
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

export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-assistant`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: request.messages,
      model: request.model || 'gpt-4o-mini',
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      context: request.context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OpenAI request failed');
  }

  return response.json();
}

export async function analyzeFinancialData(financialData: any): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Analyze this financial data and provide key insights, trends, and recommendations:\n\n${JSON.stringify(financialData, null, 2)}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 1500,
    context: { type: 'financial_analysis', data: financialData }
  });

  return response.choices[0].message.content;
}

export async function generateIntakeSuggestion(intakeData: any): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Based on this patient intake data, provide specific recommendations for optimal patient conversion and scheduling:\n\n${JSON.stringify(intakeData, null, 2)}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.6,
    max_tokens: 800,
    context: { type: 'intake_optimization', data: intakeData }
  });

  return response.choices[0].message.content;
}

export async function analyzeOperationalMetrics(metricsData: any): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Analyze these operational metrics and identify improvement opportunities:\n\n${JSON.stringify(metricsData, null, 2)}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 1200,
    context: { type: 'operational_analysis', data: metricsData }
  });

  return response.choices[0].message.content;
}

export async function predictRevenueRisk(revenueData: any): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Analyze this revenue data and identify potential risks, payment delays, and denial patterns:\n\n${JSON.stringify(revenueData, null, 2)}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 1200,
    context: { type: 'revenue_risk_analysis', data: revenueData }
  });

  return response.choices[0].message.content;
}

export async function chatWithAssistant(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: any
): Promise<string> {
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await callOpenAI({
    messages,
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    context
  });

  return response.choices[0].message.content;
}

export async function analyzeDocument(documentText: string, analysisType: string): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Analyze this ${analysisType} document and extract key information:\n\n${documentText}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 1500,
    context: { type: 'document_analysis', analysis_type: analysisType }
  });

  return response.choices[0].message.content;
}

export async function generateExecutiveSummary(data: any): Promise<string> {
  const response = await callOpenAI({
    messages: [
      {
        role: 'user',
        content: `Create a concise executive summary of this data, highlighting the most important insights and action items:\n\n${JSON.stringify(data, null, 2)}`
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.6,
    max_tokens: 1000,
    context: { type: 'executive_summary' }
  });

  return response.choices[0].message.content;
}
