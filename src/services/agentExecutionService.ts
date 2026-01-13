import { supabase } from '../lib/supabase';
import { callOpenAI, type ChatMessage } from './openaiService';

export interface AgentExecutionRequest {
  agentSlug: string;
  userInput: string;
  context?: Record<string, any>;
  userId: string;
}

export interface AgentExecutionResult {
  success: boolean;
  decision_id: string;
  agent_name: string;
  recommendation: string;
  confidence_score: number;
  rationale: string;
  identified_risks: string[];
  escalation_required: boolean;
  escalation_reason?: string;
  raw_output: string;
}

export interface HITLEscalation {
  id: string;
  agent_id: string;
  agent_name: string;
  decision_id: string;
  user_input: string;
  recommendation: string;
  confidence_score: number;
  escalation_reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  created_at: string;
}

class AgentExecutionService {
  /**
   * Execute an AI agent with the given input
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    try {
      // 1. Get agent configuration
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select(`
          *,
          agent_domains (
            name,
            executive_owner
          )
        `)
        .eq('slug', request.agentSlug)
        .eq('active', true)
        .maybeSingle();

      if (agentError || !agent) {
        throw new Error(`Agent not found or inactive: ${request.agentSlug}`);
      }

      // 2. Check if agent is within operational hours (optional - add later)
      // 3. Check if agent has reached daily execution limits (optional - add later)

      // 4. Prepare the execution prompt
      const executionPrompt = this.buildExecutionPrompt(
        agent.system_prompt,
        request.userInput,
        request.context
      );

      // 5. Call OpenAI API
      const messages: ChatMessage[] = [
        { role: 'system', content: agent.system_prompt },
        { role: 'user', content: executionPrompt }
      ];

      const openaiResponse = await callOpenAI({
        messages,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = openaiResponse.choices[0].message.content;

      // 6. Parse AI response
      const parsedResult = this.parseAgentResponse(aiResponse, agent);

      // 7. Check if escalation is required
      const escalationCheck = this.checkEscalationRequired(
        agent,
        parsedResult.confidence_score,
        parsedResult.identified_risks
      );

      // 8. Log the decision
      const { data: decision, error: decisionError } = await supabase
        .from('agent_decisions')
        .insert({
          agent_id: agent.id,
          input_data: {
            user_input: request.userInput,
            context: request.context
          },
          output_data: {
            recommendation: parsedResult.recommendation,
            confidence_score: parsedResult.confidence_score,
            rationale: parsedResult.rationale,
            identified_risks: parsedResult.identified_risks
          },
          confidence_score: parsedResult.confidence_score,
          execution_time_ms: 0, // Track this if needed
          escalated_to_human: escalationCheck.required,
          escalation_reason: escalationCheck.reason,
          outcome: escalationCheck.required ? 'escalated' : 'executed'
        })
        .select()
        .single();

      if (decisionError) {
        console.error('Failed to log decision:', decisionError);
      }

      // 9. If escalation required, create HITL record
      if (escalationCheck.required && decision) {
        await this.createHITLEscalation({
          agent_id: agent.id,
          decision_id: decision.id,
          user_input: request.userInput,
          recommendation: parsedResult.recommendation,
          confidence_score: parsedResult.confidence_score,
          escalation_reason: escalationCheck.reason || 'Unknown',
          assigned_to: null // Will be assigned by supervisor
        });
      }

      // 10. Track agent KPIs
      await this.updateAgentKPIs(agent.id, parsedResult.confidence_score);

      return {
        success: true,
        decision_id: decision?.id || 'unknown',
        agent_name: agent.name,
        recommendation: parsedResult.recommendation,
        confidence_score: parsedResult.confidence_score,
        rationale: parsedResult.rationale,
        identified_risks: parsedResult.identified_risks,
        escalation_required: escalationCheck.required,
        escalation_reason: escalationCheck.reason,
        raw_output: aiResponse
      };

    } catch (error: any) {
      console.error('Agent execution failed:', error);
      throw new Error(`Agent execution failed: ${error.message}`);
    }
  }

  /**
   * Build the execution prompt combining system prompt and user input
   */
  private buildExecutionPrompt(
    systemPrompt: string,
    userInput: string,
    context?: Record<string, any>
  ): string {
    let prompt = `USER REQUEST:\n${userInput}\n\n`;

    if (context && Object.keys(context).length > 0) {
      prompt += `CONTEXT:\n${JSON.stringify(context, null, 2)}\n\n`;
    }

    prompt += `Please analyze this request and provide your response in the following structured format:

RECOMMENDATION:
[Your specific recommendation or action]

CONFIDENCE SCORE:
[0-100]

RATIONALE:
[Detailed explanation of your reasoning]

IDENTIFIED RISKS:
[Comma-separated list of risks, or "None"]

Ensure your response follows this exact format so it can be parsed correctly.`;

    return prompt;
  }

  /**
   * Parse the AI response into structured format
   */
  private parseAgentResponse(rawResponse: string, agent: any): {
    recommendation: string;
    confidence_score: number;
    rationale: string;
    identified_risks: string[];
  } {
    // Simple parsing logic - can be enhanced with better extraction
    const lines = rawResponse.split('\n');
    let recommendation = '';
    let confidence_score = 75; // default
    let rationale = '';
    let identified_risks: string[] = [];

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('RECOMMENDATION:')) {
        currentSection = 'recommendation';
        continue;
      } else if (trimmed.startsWith('CONFIDENCE SCORE:')) {
        currentSection = 'confidence';
        continue;
      } else if (trimmed.startsWith('RATIONALE:')) {
        currentSection = 'rationale';
        continue;
      } else if (trimmed.startsWith('IDENTIFIED RISKS:')) {
        currentSection = 'risks';
        continue;
      }

      if (currentSection === 'recommendation' && trimmed) {
        recommendation += trimmed + ' ';
      } else if (currentSection === 'confidence' && trimmed) {
        const match = trimmed.match(/(\d+)/);
        if (match) {
          confidence_score = parseInt(match[1], 10);
        }
      } else if (currentSection === 'rationale' && trimmed) {
        rationale += trimmed + ' ';
      } else if (currentSection === 'risks' && trimmed) {
        if (trimmed.toLowerCase() !== 'none') {
          identified_risks = trimmed.split(',').map(r => r.trim()).filter(r => r);
        }
      }
    }

    // Fallback if parsing fails - use the raw response
    if (!recommendation) {
      recommendation = rawResponse.substring(0, 500);
    }

    return {
      recommendation: recommendation.trim(),
      confidence_score: Math.min(100, Math.max(0, confidence_score)),
      rationale: rationale.trim() || 'No detailed rationale provided',
      identified_risks
    };
  }

  /**
   * Check if HITL escalation is required based on agent config and output
   */
  private checkEscalationRequired(
    agent: any,
    confidenceScore: number,
    identifiedRisks: string[]
  ): { required: boolean; reason?: string } {
    // 1. Check if agent always requires HITL
    if (agent.requires_hitl) {
      return {
        required: true,
        reason: 'Agent configuration requires human-in-the-loop approval'
      };
    }

    // 2. Check confidence threshold
    if (confidenceScore < agent.hitl_confidence_threshold) {
      return {
        required: true,
        reason: `Confidence score (${confidenceScore}%) below threshold (${agent.hitl_confidence_threshold}%)`
      };
    }

    // 3. Check if any critical risks identified
    if (identifiedRisks.length > 0) {
      const criticalKeywords = ['safety', 'compliance', 'breach', 'violation', 'crisis', 'emergency'];
      const hasCriticalRisk = identifiedRisks.some(risk =>
        criticalKeywords.some(keyword => risk.toLowerCase().includes(keyword))
      );

      if (hasCriticalRisk) {
        return {
          required: true,
          reason: `Critical risks identified: ${identifiedRisks.join(', ')}`
        };
      }
    }

    return { required: false };
  }

  /**
   * Create HITL escalation record
   */
  private async createHITLEscalation(data: {
    agent_id: string;
    decision_id: string;
    user_input: string;
    recommendation: string;
    confidence_score: number;
    escalation_reason: string;
    assigned_to: string | null;
  }): Promise<void> {
    const { error } = await supabase
      .from('agent_hitl_queue')
      .insert({
        ...data,
        status: 'pending',
        escalated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create HITL escalation:', error);
    }
  }

  /**
   * Update agent KPIs after execution
   */
  private async updateAgentKPIs(agentId: string, confidenceScore: number): Promise<void> {
    // Get current metrics
    const { data: metrics } = await supabase
      .from('agent_execution_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (metrics) {
      // Update existing metrics
      const newExecutionCount = (metrics.total_executions || 0) + 1;
      const newAvgConfidence =
        ((metrics.avg_confidence_score || 0) * (metrics.total_executions || 0) + confidenceScore) / newExecutionCount;

      await supabase
        .from('agent_execution_metrics')
        .update({
          total_executions: newExecutionCount,
          avg_confidence_score: newAvgConfidence,
          last_execution_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);
    } else {
      // Create initial metrics
      await supabase
        .from('agent_execution_metrics')
        .insert({
          agent_id: agentId,
          total_executions: 1,
          successful_executions: 1,
          failed_executions: 0,
          avg_confidence_score: confidenceScore,
          avg_execution_time_ms: 0,
          escalation_rate: 0,
          override_rate: 0,
          last_execution_at: new Date().toISOString()
        });
    }
  }

  /**
   * Get all pending HITL escalations
   */
  async getPendingEscalations(userId?: string): Promise<HITLEscalation[]> {
    let query = supabase
      .from('agent_hitl_queue')
      .select(`
        *,
        ai_agents (
          name,
          slug,
          domain_id
        )
      `)
      .eq('status', 'pending')
      .order('escalated_at', { ascending: true });

    if (userId) {
      query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get escalations:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      agent_id: item.agent_id,
      agent_name: item.ai_agents?.name || 'Unknown',
      decision_id: item.decision_id,
      user_input: item.user_input,
      recommendation: item.recommendation,
      confidence_score: item.confidence_score,
      escalation_reason: item.escalation_reason,
      status: item.status,
      created_at: item.escalated_at
    }));
  }

  /**
   * Resolve HITL escalation
   */
  async resolveEscalation(
    escalationId: string,
    resolution: 'approved' | 'rejected' | 'modified',
    reviewerId: string,
    notes?: string,
    modifiedRecommendation?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('agent_hitl_queue')
      .update({
        status: resolution,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes,
        modified_recommendation: modifiedRecommendation
      })
      .eq('id', escalationId);

    if (error) {
      throw new Error(`Failed to resolve escalation: ${error.message}`);
    }

    // Update the original decision record
    const { data: escalation } = await supabase
      .from('agent_hitl_queue')
      .select('decision_id')
      .eq('id', escalationId)
      .single();

    if (escalation) {
      await supabase
        .from('agent_decisions')
        .update({
          human_override: resolution !== 'approved',
          override_reason: notes,
          outcome: resolution === 'approved' ? 'executed' : 'rejected'
        })
        .eq('id', escalation.decision_id);
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentSlug: string): Promise<any> {
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('slug', agentSlug)
      .single();

    if (!agent) return null;

    const { data: metrics } = await supabase
      .from('agent_execution_metrics')
      .select('*')
      .eq('agent_id', agent.id)
      .maybeSingle();

    return metrics;
  }
}

export const agentExecutionService = new AgentExecutionService();
