import { supabase } from '../lib/supabase';
import { agentService } from './agentService';
import type { Workflow, AgentEvent } from '../types';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  trigger_type: 'manual' | 'scheduled' | 'event_based' | 'condition_based';
  trigger_config: Record<string, any>;
  is_active: boolean;
  is_system: boolean;
  version: number;
  clinic_id?: string;
  created_by?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  channel: 'email' | 'sms' | 'in_app' | 'push';
  subject_template?: string;
  body_template: string;
  variables: string[];
  default_priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  schedule_cron: string;
  function_name: string;
  function_params: Record<string, any>;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export const workflowService = {
  async getAllWorkflows(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getActiveWorkflows(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  async processEvent(eventType: string, payload: any): Promise<void> {
    const workflows = await this.getActiveWorkflows();

    for (const workflow of workflows) {
      if (workflow.trigger_type === 'event' && this.matchesTrigger(workflow, eventType, payload)) {
        await this.executeWorkflow(workflow, { eventType, payload });
      }
    }
  },

  matchesTrigger(workflow: Workflow, eventType: string, payload: any): boolean {
    const conditions = workflow.trigger_conditions || {};

    if (conditions.event_type && conditions.event_type !== eventType) {
      return false;
    }

    if (conditions.conditions) {
      for (const [key, condition] of Object.entries(conditions.conditions)) {
        const value = payload[key];
        if (typeof condition === 'object') {
          if ('gte' in condition && value < condition.gte) return false;
          if ('lte' in condition && value > condition.lte) return false;
          if ('eq' in condition && value !== condition.eq) return false;
        } else if (value !== condition) {
          return false;
        }
      }
    }

    return true;
  },

  async executeWorkflow(workflow: Workflow, triggerData: any): Promise<void> {
    const executionId = crypto.randomUUID();
    const actions = workflow.actions || [];

    await supabase.from('workflow_executions').insert({
      id: executionId,
      workflow_id: workflow.id,
      trigger_event: triggerData,
      status: 'processing',
      steps_total: actions.length
    });

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        await this.executeAction(action, triggerData);

        await supabase
          .from('workflow_executions')
          .update({ steps_completed: i + 1 })
          .eq('id', executionId);
      }

      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      await supabase
        .from('workflows')
        .update({
          execution_count: workflow.execution_count + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

    } catch (error) {
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', executionId);
    }
  },

  async executeAction(action: any, context: any): Promise<void> {
    if (action.wait_for) {
      return;
    }

    await agentService.createEvent({
      agent_name: action.agent,
      event_type: action.action,
      payload: { ...context, action_params: action },
      priority: action.priority === 'high' ? 8 : action.priority === 'urgent' ? 10 : 5,
      status: 'pending'
    });
  },

  async triggerJobCreatedWorkflow(jobId: string): Promise<void> {
    await this.processEvent('job.created', { job_id: jobId, status: 'active' });
  },

  async triggerApplicationReceivedWorkflow(applicationId: string): Promise<void> {
    await this.processEvent('application.created', { application_id: applicationId });
  },

  async triggerScreeningCompletedWorkflow(applicationId: string, score: number): Promise<void> {
    await this.processEvent('screening.completed', {
      application_id: applicationId,
      screening_score: score
    });
  },

  async triggerInterviewCompletedWorkflow(interviewId: string): Promise<void> {
    await this.processEvent('interview.completed', { interview_id: interviewId });
  },

  async triggerOfferAcceptedWorkflow(offerId: string): Promise<void> {
    await this.processEvent('offer.accepted', { offer_id: offerId });
  },

  async getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getScheduledTasks(): Promise<ScheduledTask[]> {
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async updateScheduledTask(id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask> {
    const { data, error} = await supabase
      .from('scheduled_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async triggerWorkflowProcessor(action: 'process_notifications' | 'generate_credential_alerts' | 'check_scheduled_tasks'): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/workflow-processor?action=${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger workflow processor');
    }

    return await response.json();
  },
};
