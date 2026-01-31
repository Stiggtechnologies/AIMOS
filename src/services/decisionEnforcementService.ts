import { supabase } from '../lib/supabase';

export interface RolloutDecision {
  id: string;
  pilot_id: string;
  attribution_id: string;
  decision: 'rollout' | 'rollback' | 'hold';
  decided_by: string;
  decided_at: string;
  decision_rationale: string;
  rollout_phase: string;
  rollout_timeline: Record<string, any>;
  learning_stored: boolean;
}

class DecisionEnforcementService {
  async evaluatePilotOutcome(
    pilotId: string,
    attributionId: string
  ): Promise<{ recommendation: string; reasoning: string }> {
    const { data: attribution, error: attrError } = await supabase
      .from('outcome_attributions')
      .select('*')
      .eq('id', attributionId)
      .maybeSingle();

    if (attrError || !attribution) {
      console.error('Error loading attribution:', attrError);
      return {
        recommendation: 'hold',
        reasoning: 'Unable to evaluate outcome'
      };
    }

    const improvement = attribution.improvement_percentage;
    const isSignificant = attribution.statistically_significant;

    let recommendation = 'hold';
    let reasoning = '';

    if (improvement >= attribution.locked_metrics?.success_threshold || 10) {
      if (isSignificant) {
        recommendation = 'rollout';
        reasoning =
          `Improvement of ${improvement}% exceeds success threshold and is statistically significant`;
      } else {
        recommendation = 'rollout';
        reasoning = `Improvement of ${improvement}% exceeds success threshold (clinical significance)`;
      }
    } else if (improvement >= (attribution.locked_metrics?.acceptable_threshold || 5)) {
      recommendation = 'rollout';
      reasoning =
        `Improvement of ${improvement}% meets acceptable threshold; proceeding with caution`;
    } else if (improvement >= (attribution.locked_metrics?.failure_threshold || -5)) {
      recommendation = 'hold';
      reasoning = `Neutral results (${improvement}% improvement); recommend further evaluation`;
    } else {
      recommendation = 'rollback';
      reasoning = `Negative results (${improvement}% improvement); rolling back change`;
    }

    return { recommendation, reasoning };
  }

  async recordDecision(
    pilotId: string,
    attributionId: string,
    decision: 'rollout' | 'rollback' | 'hold',
    userId: string,
    rationale: string
  ): Promise<RolloutDecision | null> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      console.error('Error loading pilot:', pilotError);
      return null;
    }

    const rolloutPlan = this.generateRolloutPlan(decision, pilot.pilot_clinics || []);

    const { data: rolloutDecision, error: decisionError } = await supabase
      .from('rollout_decisions')
      .insert({
        pilot_id: pilotId,
        attribution_id: attributionId,
        decision,
        decided_by: userId,
        decided_at: new Date().toISOString(),
        decision_rationale: rationale,
        rollout_phase: decision === 'rollout' ? 'phase_1' : 'none',
        rollout_timeline: rolloutPlan,
        learning_stored: false
      })
      .select()
      .single();

    if (decisionError) {
      console.error('Error recording decision:', decisionError);
      return null;
    }

    if (decision === 'rollout') {
      await this.initializeRollout(pilotId, rolloutDecision.id);
    } else if (decision === 'rollback') {
      await this.initializeRollback(pilotId, rolloutDecision.id);
    }

    return rolloutDecision;
  }

  private generateRolloutPlan(
    decision: string,
    clinicIds: string[]
  ): Record<string, any> {
    if (decision === 'rollback') {
      return {
        phases: [
          {
            phase: 'immediate',
            action: 'Stop implementation across all pilot clinics',
            duration_days: 1,
            affected_clinics: clinicIds.length
          },
          {
            phase: 'rollback',
            action: 'Revert to previous SOP version',
            duration_days: 7,
            affected_clinics: clinicIds.length
          },
          {
            phase: 'monitoring',
            action: 'Monitor metrics for stabilization',
            duration_days: 30,
            affected_clinics: clinicIds.length
          }
        ]
      };
    }

    const phaseSize = Math.ceil(clinicIds.length / 3);

    return {
      phases: [
        {
          phase: 'phase_1',
          name: 'Early Adopters',
          duration_days: 14,
          affected_clinics: phaseSize,
          percentage: '33%',
          start_offset_days: 0
        },
        {
          phase: 'phase_2',
          name: 'Majority',
          duration_days: 14,
          affected_clinics: phaseSize,
          percentage: '33%',
          start_offset_days: 14,
          dependencies: ['phase_1_stable']
        },
        {
          phase: 'phase_3',
          name: 'Full Rollout',
          duration_days: 7,
          affected_clinics: clinicIds.length - phaseSize * 2,
          percentage: '34%',
          start_offset_days: 28,
          dependencies: ['phase_2_stable']
        }
      ],
      total_duration_days: 35,
      monitoring_frequency: 'daily',
      rollback_trigger: 'negative_trend_detected'
    };
  }

  private async initializeRollout(pilotId: string, decisionId: string): Promise<void> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      return;
    }

    const clinics = pilot.pilot_clinics || [];
    const phaseSize = Math.ceil(clinics.length / 3);

    const phases = [
      {
        phase: 'phase_1',
        clinics: clinics.slice(0, phaseSize),
        start_days_offset: 0
      },
      {
        phase: 'phase_2',
        clinics: clinics.slice(phaseSize, phaseSize * 2),
        start_days_offset: 14
      },
      {
        phase: 'phase_3',
        clinics: clinics.slice(phaseSize * 2),
        start_days_offset: 28
      }
    ];

    for (const phaseData of phases) {
      for (const clinicId of phaseData.clinics) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + phaseData.start_days_offset);

        await supabase
          .from('clinic_rollout_plans')
          .insert({
            clinic_id: clinicId,
            decision_id: decisionId,
            phase: phaseData.phase,
            scheduled_start: startDate.toISOString(),
            status: 'scheduled'
          });
      }
    }
  }

  private async initializeRollback(pilotId: string, decisionId: string): Promise<void> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      return;
    }

    for (const clinicId of pilot.pilot_clinics || []) {
      await supabase
        .from('clinic_rollback_plans')
        .insert({
          clinic_id: clinicId,
          decision_id: decisionId,
          scheduled_start: new Date().toISOString(),
          status: 'scheduled'
        });
    }
  }

  async executePhaseRollout(phaseId: string): Promise<boolean> {
    const { data: plans, error: plansError } = await supabase
      .from('clinic_rollout_plans')
      .select('*')
      .eq('phase', phaseId)
      .eq('status', 'scheduled')
      .lte('scheduled_start', new Date().toISOString());

    if (plansError || !plans) {
      console.error('Error loading phase plans:', plansError);
      return false;
    }

    for (const plan of plans) {
      const { error: updateError } = await supabase
        .from('clinic_rollout_plans')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', plan.id);

      if (updateError) {
        console.error('Error updating rollout plan:', updateError);
        continue;
      }

      await supabase
        .from('clinic_rollout_status')
        .insert({
          clinic_id: plan.clinic_id,
          decision_id: plan.decision_id,
          phase: phaseId,
          status: 'implementing',
          started_at: new Date().toISOString()
        });
    }

    return true;
  }

  async executeRollback(decisionId: string): Promise<boolean> {
    const { data: plans, error: plansError } = await supabase
      .from('clinic_rollback_plans')
      .select('*')
      .eq('decision_id', decisionId);

    if (plansError || !plans) {
      console.error('Error loading rollback plans:', plansError);
      return false;
    }

    for (const plan of plans) {
      const { error: updateError } = await supabase
        .from('clinic_rollback_plans')
        .update({
          status: 'executing',
          started_at: new Date().toISOString()
        })
        .eq('id', plan.id);

      if (updateError) {
        console.error('Error executing rollback:', updateError);
        continue;
      }
    }

    return true;
  }

  async storeLearning(decisionId: string, findings: Record<string, any>): Promise<boolean> {
    const { data: decision, error: decError } = await supabase
      .from('rollout_decisions')
      .select('*')
      .eq('id', decisionId)
      .maybeSingle();

    if (decError || !decision) {
      console.error('Error loading decision:', decError);
      return false;
    }

    const { error: learningError } = await supabase
      .from('cii_learning_repository')
      .insert({
        decision_id: decisionId,
        pilot_id: decision.pilot_id,
        decision: decision.decision,
        outcome_findings: findings,
        lessons_learned: this.extractLessons(decision.decision, findings),
        applicable_contexts: this.inferApplicableContexts(findings),
        stored_at: new Date().toISOString(),
        searchable: true
      });

    if (learningError) {
      console.error('Error storing learning:', learningError);
      return false;
    }

    const { error: markError } = await supabase
      .from('rollout_decisions')
      .update({
        learning_stored: true
      })
      .eq('id', decisionId);

    if (markError) {
      console.error('Error marking learning stored:', markError);
      return false;
    }

    return true;
  }

  private extractLessons(decision: string, findings: Record<string, any>): string[] {
    const lessons: string[] = [];

    if (decision === 'rollout') {
      lessons.push(
        `Success factors: Implementation complexity was manageable with proper training`
      );
      lessons.push(`Staff adoption rate exceeded expectations`);
    } else if (decision === 'rollback') {
      lessons.push(`Implementation approach needs revision`);
      lessons.push(`Additional mitigation strategies required`);
    }

    if (findings.unexpected_benefit) {
      lessons.push(`Unexpected benefit identified: ${findings.unexpected_benefit}`);
    }

    if (findings.implementation_barrier) {
      lessons.push(`Barrier encountered: ${findings.implementation_barrier}`);
    }

    return lessons;
  }

  private inferApplicableContexts(findings: Record<string, any>): string[] {
    const contexts: string[] = [];

    if (findings.clinic_size) {
      contexts.push(`Clinic Size: ${findings.clinic_size}`);
    }

    if (findings.staff_experience) {
      contexts.push(`Staff Experience: ${findings.staff_experience}`);
    }

    contexts.push('Evidence-Driven Practice');
    contexts.push('Clinical Operations');

    return contexts;
  }

  async getRolloutStatus(decisionId: string) {
    const { data: decision, error: decError } = await supabase
      .from('rollout_decisions')
      .select('*')
      .eq('id', decisionId)
      .maybeSingle();

    if (decError || !decision) {
      console.error('Error loading decision:', decError);
      return null;
    }

    const { data: rolloutPlans } = await supabase
      .from('clinic_rollout_plans')
      .select('*')
      .eq('decision_id', decisionId);

    const { data: rolloutStatus } = await supabase
      .from('clinic_rollout_status')
      .select('*')
      .eq('decision_id', decisionId);

    const totalClinics = rolloutPlans?.length || 0;
    const activeCount = rolloutStatus?.filter((r: any) => r.status === 'implementing').length || 0;
    const completedCount = rolloutStatus?.filter((r: any) => r.status === 'completed').length || 0;

    return {
      decision: decision.decision,
      totalClinics,
      activeCount,
      completedCount,
      completionPercentage: totalClinics > 0 ? (completedCount / totalClinics) * 100 : 0,
      timeline: decision.rollout_timeline
    };
  }

  async getPendingRolloutDecisions(limit = 10) {
    const { data, error } = await supabase
      .from('rollout_decisions')
      .select('*')
      .is('learning_stored', false)
      .order('decided_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading pending decisions:', error);
      return [];
    }

    return data || [];
  }
}

export const decisionEnforcementService = new DecisionEnforcementService();
