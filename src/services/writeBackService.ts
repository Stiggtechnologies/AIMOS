import { supabase } from '../lib/supabase';
import { ScheduleIntelligence, SchedulerAppointment } from './schedulerService';

export interface WriteBackRecommendation {
  id: string;
  clinic_id: string;
  appointment_id: string;
  recommendation_type: 'status_update' | 'waitlist_fill' | 'overbook_suggestion' | 'reschedule' | 'block_insertion';
  confidence_score: number;
  required_threshold: number;
  title: string;
  description: string;
  rationale: string;
  expected_impact: Record<string, any>;
  proposed_action: Record<string, any>;
  is_approved: boolean | null;
  is_executed: boolean;
  created_by: string | null;
  created_at: string;
  expires_at: string;
}

export interface WriteBackApproval {
  id: string;
  recommendation_id: string;
  approver_id: string;
  approver_role: string;
  decision: 'approved' | 'rejected';
  approval_note?: string;
  confidence_check_passed: boolean;
  role_authorized: boolean;
  data_freshness_check: boolean;
  approved_at: string;
}

export interface ExecutionResult {
  success: boolean;
  recommendation_id: string;
  approval_id: string;
  execution_status: 'success' | 'failed' | 'rolled_back';
  error_message?: string;
  pp_action_id?: string;
  executed_at: string;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  recommendation_id?: string;
  actor_id?: string;
  actor_role?: string;
  action_description: string;
  ai_confidence?: number;
  outcome?: Record<string, any>;
  recorded_at: string;
}

interface ConfidenceThresholds {
  status_update: number;
  waitlist_fill: number;
  overbook_suggestion: number;
  reschedule: number;
  block_insertion: number;
}

class WriteBackService {
  private confidenceThresholds: ConfidenceThresholds = {
    status_update: 95,
    waitlist_fill: 85,
    overbook_suggestion: 80,
    reschedule: 75,
    block_insertion: 90,
  };

  async generateRecommendation(
    clinicId: string,
    appointment: SchedulerAppointment,
    insight: ScheduleIntelligence,
    createdBy: string
  ): Promise<WriteBackRecommendation | null> {
    const typeMap: Record<string, 'status_update' | 'waitlist_fill' | 'overbook_suggestion' | 'reschedule' | 'block_insertion' | null> = {
      'no_show_risk': 'waitlist_fill',
      'capacity_gap': 'block_insertion',
      'overbooking': 'overbook_suggestion',
      'underutilization': 'reschedule',
    };

    const recommendationType = typeMap[insight.type];
    if (!recommendationType) {
      console.warn('[WriteBackService] Unsupported insight type:', insight.type);
      return null;
    }

    const requiredThreshold = this.confidenceThresholds[recommendationType];

    if (insight.confidence < requiredThreshold) {
      console.log(`[WriteBackService] Confidence ${insight.confidence} below threshold ${requiredThreshold}. Insight only.`);
      return null;
    }

    const recommendation: Partial<WriteBackRecommendation> = {
      clinic_id: clinicId,
      appointment_id: appointment.id,
      recommendation_type: recommendationType,
      confidence_score: insight.confidence,
      required_threshold: requiredThreshold,
      title: insight.title,
      description: insight.description,
      rationale: insight.suggested_action || '',
      expected_impact: {
        type: insight.type,
        severity: insight.severity,
        confidence_pct: insight.confidence,
      },
      proposed_action: this.buildProposedAction(recommendationType, appointment, insight),
      created_by: createdBy,
    };

    console.log('[WriteBackService] Generated recommendation:', recommendation);
    return recommendation as WriteBackRecommendation;
  }

  private buildProposedAction(
    type: string,
    appointment: SchedulerAppointment,
    insight: ScheduleIntelligence
  ): Record<string, any> {
    const baseAction = {
      appointment_id: appointment.id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      patient_name: appointment.patient_name,
    };

    switch (type) {
      case 'waitlist_fill':
        return {
          ...baseAction,
          action: 'fill_no_show_risk',
          instruction: `Fill this slot with standby patient due to ${appointment.no_show_risk}% no-show risk`,
        };
      case 'reschedule':
        return {
          ...baseAction,
          action: 'reschedule_appointment',
          instruction: 'Move this appointment to higher-utilization time slot',
        };
      case 'overbook_suggestion':
        return {
          ...baseAction,
          action: 'accept_overbooking',
          instruction: 'Consider allowing additional appointment during high-demand time',
        };
      case 'block_insertion':
        return {
          ...baseAction,
          action: 'insert_buffer_block',
          instruction: 'Add break or buffer block in scheduling gap',
        };
      case 'status_update':
        return {
          ...baseAction,
          action: 'update_status',
          instruction: 'Update appointment status based on check-in',
        };
      default:
        return baseAction;
    }
  }

  async saveRecommendation(
    clinicId: string,
    recommendation: Partial<WriteBackRecommendation>
  ): Promise<WriteBackRecommendation> {
    const { data, error } = await supabase
      .from('scheduler_recommendations')
      .insert({
        clinic_id: clinicId,
        appointment_id: recommendation.appointment_id,
        recommendation_type: recommendation.recommendation_type,
        confidence_score: recommendation.confidence_score,
        required_threshold: recommendation.required_threshold,
        title: recommendation.title,
        description: recommendation.description,
        rationale: recommendation.rationale,
        expected_impact: recommendation.expected_impact,
        proposed_action: recommendation.proposed_action,
        created_by: recommendation.created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('[WriteBackService] Error saving recommendation:', error);
      throw error;
    }

    console.log('[WriteBackService] Recommendation saved:', data.id);
    return data;
  }

  async getPendingRecommendations(clinicId: string): Promise<WriteBackRecommendation[]> {
    const { data, error } = await supabase
      .from('scheduler_recommendations')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('is_approved', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[WriteBackService] Error fetching pending recommendations:', error);
      throw error;
    }

    return data || [];
  }

  async checkUserPermissions(
    userId: string,
    clinicId: string,
    recommendationType: string
  ): Promise<boolean> {
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[WriteBackService] Error fetching user profile:', profileError);
      return false;
    }

    const { data: permission, error: permError } = await supabase
      .from('write_back_permissions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('role_name', userProfile?.role || 'staff')
      .maybeSingle();

    if (permError) {
      console.error('[WriteBackService] Error fetching permissions:', permError);
      return false;
    }

    if (!permission) {
      console.warn('[WriteBackService] No permissions found for role:', userProfile?.role);
      return false;
    }

    const permissionMap: Record<string, keyof typeof permission> = {
      'status_update': 'can_approve_status_update',
      'waitlist_fill': 'can_approve_waitlist_fill',
      'overbook_suggestion': 'can_approve_overbook',
      'reschedule': 'can_approve_reschedule',
      'block_insertion': 'can_approve_block_insertion',
    };

    const requiredPermission = permissionMap[recommendationType];
    return permission[requiredPermission] || false;
  }

  async createApproval(
    recommendationId: string,
    clinicId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    note?: string
  ): Promise<WriteBackApproval> {
    const { data: recommendation, error: recError } = await supabase
      .from('scheduler_recommendations')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (recError) throw recError;

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', approverId)
      .single();

    const isAuthorized = await this.checkUserPermissions(
      approverId,
      clinicId,
      recommendation.recommendation_type
    );

    const confidencePassed = recommendation.confidence_score >= recommendation.required_threshold;

    const { data, error } = await supabase
      .from('scheduler_approvals')
      .insert({
        recommendation_id: recommendationId,
        clinic_id: clinicId,
        approver_id: approverId,
        approver_role: userProfile?.role || 'staff',
        decision,
        approval_note: note,
        confidence_check_passed: confidencePassed,
        role_authorized: isAuthorized,
        data_freshness_check: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[WriteBackService] Error creating approval:', error);
      throw error;
    }

    await this.updateRecommendationApprovalStatus(recommendationId, decision === 'approved');

    console.log('[WriteBackService] Approval recorded:', data.id);
    return data;
  }

  private async updateRecommendationApprovalStatus(
    recommendationId: string,
    isApproved: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('scheduler_recommendations')
      .update({ is_approved: isApproved })
      .eq('id', recommendationId);

    if (error) {
      console.error('[WriteBackService] Error updating recommendation status:', error);
      throw error;
    }
  }

  async recordExecution(
    approvalId: string,
    recommendationId: string,
    clinicId: string,
    executedBy: string,
    ppActionId: string,
    ppResponse: Record<string, any>
  ): Promise<ExecutionResult> {
    const { data, error } = await supabase
      .from('scheduler_execution_log')
      .insert({
        approval_id: approvalId,
        recommendation_id: recommendationId,
        clinic_id: clinicId,
        action_type: 'practice_perfect_sync',
        pp_action_id: ppActionId,
        execution_status: 'success',
        pp_response: ppResponse,
        executed_by: executedBy,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[WriteBackService] Error recording execution:', error);
      throw error;
    }

    await this.updateRecommendationExecutionStatus(recommendationId, true);

    console.log('[WriteBackService] Execution logged:', data.id);
    return {
      success: true,
      recommendation_id: recommendationId,
      approval_id: approvalId,
      execution_status: 'success',
      pp_action_id: ppActionId,
      executed_at: data.executed_at,
    };
  }

  private async updateRecommendationExecutionStatus(
    recommendationId: string,
    isExecuted: boolean
  ): Promise<void> {
    const { error } = await supabase
      .from('scheduler_recommendations')
      .update({ is_executed: isExecuted })
      .eq('id', recommendationId);

    if (error) {
      console.error('[WriteBackService] Error updating execution status:', error);
      throw error;
    }
  }

  async recordAuditEvent(
    clinicId: string,
    eventType: string,
    description: string,
    actorId?: string,
    actorRole?: string,
    recommendationId?: string,
    approvalId?: string,
    executionId?: string,
    aiConfidence?: number,
    outcome?: Record<string, any>
  ): Promise<AuditEntry> {
    const { data, error } = await supabase
      .from('scheduler_audit_log')
      .insert({
        clinic_id: clinicId,
        event_type: eventType,
        recommendation_id: recommendationId,
        approval_id: approvalId,
        execution_id: executionId,
        actor_id: actorId,
        actor_role: actorRole,
        action_description: description,
        ai_confidence: aiConfidence,
        outcome: outcome || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[WriteBackService] Error recording audit event:', error);
      throw error;
    }

    console.log('[WriteBackService] Audit event recorded:', eventType);
    return data;
  }

  async getApprovalHistory(clinicId: string, limit: number = 50): Promise<AuditEntry[]> {
    const { data, error } = await supabase
      .from('scheduler_audit_log')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[WriteBackService] Error fetching approval history:', error);
      throw error;
    }

    return data || [];
  }

  isFeatureEnabled(featureName: 'aim_scheduler_writeback_phase2'): boolean {
    const featureFlags: Record<string, boolean> = {
      aim_scheduler_writeback_phase2: true,
    };

    const value = localStorage.getItem(`feature_${featureName}`);
    if (value !== null) {
      return value === 'true';
    }

    return featureFlags[featureName] ?? false;
  }

  setFeatureFlag(featureName: 'aim_scheduler_writeback_phase2', enabled: boolean) {
    localStorage.setItem(`feature_${featureName}`, String(enabled));
    console.log(`[WriteBackService] Feature flag "${featureName}" set to ${enabled}`);
  }
}

export const writeBackService = new WriteBackService();
