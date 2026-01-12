import { supabase } from '../lib/supabase';
import type { Agent, AgentEvent, Task } from '../types';

export const agentService = {
  async getAllAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getAgentByName(name: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateAgentStatus(id: string, status: Agent['status']): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .update({ status, last_heartbeat_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getPendingEvents(limit: number = 50): Promise<AgentEvent[]> {
    const { data, error } = await supabase
      .from('agent_events')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async createEvent(event: Partial<AgentEvent>): Promise<AgentEvent> {
    const { data, error } = await supabase
      .from('agent_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEventStatus(
    id: string,
    status: AgentEvent['status'],
    error_message?: string,
    execution_time_ms?: number
  ): Promise<void> {
    const updates: any = {
      status,
      error_message
    };

    if (status === 'processing') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
      if (execution_time_ms) {
        updates.execution_time_ms = execution_time_ms;
      }
    }

    const { error } = await supabase
      .from('agent_events')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async logExecution(execution: {
    agent_name: string;
    event_id?: string;
    action_taken: string;
    input_data?: any;
    output_data?: any;
    success: boolean;
    error_message?: string;
    execution_time_ms?: number;
    decisions_made?: any[];
  }): Promise<void> {
    const { error } = await supabase
      .from('agent_executions')
      .insert(execution);

    if (error) throw error;
  },

  async getPendingTasks(agentName?: string): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'assigned'])
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (agentName) {
      query = query.eq('assigned_agent', agentName);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async updateTaskStatus(
    id: string,
    status: Task['status'],
    result?: any,
    error_message?: string
  ): Promise<void> {
    const updates: any = { status };

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.result = result;
    } else if (status === 'failed') {
      updates.error_message = error_message;
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
  },

  async getAgentMemory(agentName: string, memoryKey: string): Promise<any> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('memory_value')
      .eq('agent_name', agentName)
      .eq('memory_key', memoryKey)
      .maybeSingle();

    if (error) throw error;
    return data?.memory_value;
  },

  async setAgentMemory(
    agentName: string,
    memoryKey: string,
    memoryValue: any,
    expiresAt?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('agent_memory')
      .upsert({
        agent_name: agentName,
        memory_key: memoryKey,
        memory_value: memoryValue,
        expires_at: expiresAt,
        last_accessed_at: new Date().toISOString()
      });

    if (error) throw error;
  }
};
