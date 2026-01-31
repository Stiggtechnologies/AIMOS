import { supabase } from '../lib/supabase';

export interface PilotSchedule {
  id: string;
  proposal_id: string;
  pilot_clinics: string[];
  start_date: string;
  end_date: string;
  duration_days: number;
  locked_metrics: Record<string, any>;
  baseline_metrics: Record<string, any>;
  status: string;
  created_at: string;
}

class PilotManagementService {
  async definePilot(proposalId: string, clinicIds: string[], durationDays: number = 90): Promise<PilotSchedule | null> {
    const { data: proposal, error: propError } = await supabase
      .from('practice_translations')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();

    if (propError || !proposal) {
      console.error('Error loading proposal:', propError);
      return null;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const baselineMetrics = await this.captureBaselineMetrics(clinicIds);

    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .insert({
        practice_translation_id: proposalId,
        pilot_clinics: clinicIds,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_days: durationDays,
        baseline_metrics: baselineMetrics,
        status: 'planned'
      })
      .select()
      .single();

    if (pilotError) {
      console.error('Error creating pilot:', pilotError);
      return null;
    }

    return pilot;
  }

  private async captureBaselineMetrics(clinicIds: string[]): Promise<Record<string, any>> {
    const baselineData: Record<string, any> = {};

    for (const clinicId of clinicIds) {
      const { data: clinicStats } = await supabase
        .rpc('get_clinic_baseline_metrics', { p_clinic_id: clinicId });

      if (clinicStats) {
        baselineData[clinicId] = clinicStats;
      }
    }

    return baselineData;
  }

  async lockSuccessMetrics(pilotId: string, metrics: Record<string, any>): Promise<boolean> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      console.error('Error loading pilot:', pilotError);
      return false;
    }

    if (pilot.locked_metrics) {
      console.warn('Metrics already locked for pilot:', pilotId);
      return false;
    }

    const lockedMetrics = {
      primary_outcome: metrics.primary_outcome || 'improved_time_to_rtw',
      success_threshold: metrics.success_threshold || 0.15,
      acceptable_threshold: metrics.acceptable_threshold || 0.05,
      failure_threshold: metrics.failure_threshold || -0.05,
      secondary_outcomes: metrics.secondary_outcomes || [
        'claim_acceptance_rate',
        'patient_satisfaction'
      ],
      monitoring_frequency: metrics.monitoring_frequency || 'weekly',
      locked_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('practice_pilots')
      .update({
        locked_metrics: lockedMetrics,
        metrics_locked_at: new Date().toISOString(),
        status: 'metrics_locked'
      })
      .eq('id', pilotId);

    if (updateError) {
      console.error('Error locking metrics:', updateError);
      return false;
    }

    return true;
  }

  async startPilot(pilotId: string): Promise<boolean> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      console.error('Error loading pilot:', pilotError);
      return false;
    }

    if (!pilot.locked_metrics) {
      console.error('Cannot start pilot without locked metrics');
      return false;
    }

    const { error: updateError } = await supabase
      .from('practice_pilots')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', pilotId);

    if (updateError) {
      console.error('Error starting pilot:', updateError);
      return false;
    }

    for (const clinicId of pilot.pilot_clinics) {
      await supabase
        .from('clinic_pilot_assignments')
        .insert({
          clinic_id: clinicId,
          pilot_id: pilotId,
          assigned_at: new Date().toISOString(),
          status: 'active'
        });
    }

    return true;
  }

  async recordPilotObservation(
    pilotId: string,
    clinicId: string,
    observation: Record<string, any>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('pilot_observations')
      .insert({
        pilot_id: pilotId,
        clinic_id: clinicId,
        observation_date: new Date().toISOString(),
        observation_data: observation
      });

    if (error) {
      console.error('Error recording observation:', error);
      return false;
    }

    return true;
  }

  async endPilot(pilotId: string, status: string): Promise<boolean> {
    const endDate = new Date();

    const { error: updateError } = await supabase
      .from('practice_pilots')
      .update({
        status,
        ended_at: endDate.toISOString()
      })
      .eq('id', pilotId);

    if (updateError) {
      console.error('Error ending pilot:', updateError);
      return false;
    }

    const { data: assignments, error: assignError } = await supabase
      .from('clinic_pilot_assignments')
      .select('*')
      .eq('pilot_id', pilotId);

    if (!assignError && assignments) {
      for (const assignment of assignments) {
        await supabase
          .from('clinic_pilot_assignments')
          .update({
            status: 'completed',
            completed_at: endDate.toISOString()
          })
          .eq('id', assignment.id);
      }
    }

    return true;
  }

  async getActivePilots(limit = 10) {
    const { data, error } = await supabase
      .from('practice_pilots')
      .select(
        `
        *,
        translation:practice_translations (
          change_title,
          change_type,
          expected_outcome_improvement
        ),
        clinics:clinic_pilot_assignments (
          clinic_id,
          status
        )
      `
      )
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading active pilots:', error);
      return [];
    }

    return data || [];
  }

  async getPilotStatus(pilotId: string) {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select(
        `
        *,
        observations:pilot_observations (
          observation_date,
          observation_data
        ),
        assignments:clinic_pilot_assignments (
          clinic_id,
          status
        )
      `
      )
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      console.error('Error loading pilot:', pilotError);
      return null;
    }

    const daysElapsed = pilot.started_at
      ? Math.floor(
          (new Date().getTime() - new Date(pilot.started_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const completionPercentage =
      pilot.status === 'active'
        ? Math.min(100, Math.round((daysElapsed / pilot.duration_days) * 100))
        : 100;

    return {
      ...pilot,
      daysElapsed,
      completionPercentage
    };
  }

  async checkPilotCompletion(pilotId: string): Promise<{
    isComplete: boolean;
    daysOverdue: number;
  }> {
    const { data: pilot, error } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (error || !pilot) {
      console.error('Error checking pilot completion:', error);
      return { isComplete: false, daysOverdue: 0 };
    }

    if (pilot.status !== 'active') {
      return { isComplete: true, daysOverdue: 0 };
    }

    const endDate = new Date(pilot.end_date);
    const now = new Date();

    if (now >= endDate) {
      const daysOverdue = Math.floor(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { isComplete: true, daysOverdue };
    }

    return { isComplete: false, daysOverdue: 0 };
  }

  async getPilotTimeline(pilotId: string) {
    const { data: pilot, error } = await supabase
      .from('practice_pilots')
      .select(
        `
        *,
        observations:pilot_observations (
          observation_date,
          observation_data
        )
      `
      )
      .eq('id', pilotId)
      .maybeSingle();

    if (error || !pilot) {
      console.error('Error loading pilot:', error);
      return null;
    }

    const observations = pilot.observations || [];
    const timeline = [
      {
        date: pilot.created_at,
        event: 'Pilot Created',
        type: 'creation'
      },
      {
        date: pilot.metrics_locked_at,
        event: 'Success Metrics Locked',
        type: 'metrics_locked'
      },
      {
        date: pilot.started_at,
        event: 'Pilot Started',
        type: 'start'
      }
    ];

    for (const obs of observations) {
      timeline.push({
        date: obs.observation_date,
        event: `Observation: ${Object.keys(obs.observation_data)[0]}`,
        type: 'observation'
      });
    }

    if (pilot.ended_at) {
      timeline.push({
        date: pilot.ended_at,
        event: `Pilot ${pilot.status}`,
        type: 'completion'
      });
    }

    return timeline.filter((t) => t.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getPilotMetricsProgress(pilotId: string) {
    const { data: pilot, error } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (error || !pilot) {
      console.error('Error loading pilot:', error);
      return null;
    }

    const metrics = pilot.locked_metrics || {};
    const progress = {
      primaryMetric: metrics.primary_outcome || 'Not Set',
      successThreshold: metrics.success_threshold || 0,
      currentProgress: 0,
      status: 'in_progress'
    };

    if (pilot.status === 'completed' || pilot.status === 'rolled_back') {
      progress.status = pilot.status;
    }

    return progress;
  }

  async schedulePilotCheckpoint(
    pilotId: string,
    checkpointDate: string,
    checkpointType: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('pilot_checkpoints')
      .insert({
        pilot_id: pilotId,
        checkpoint_date: checkpointDate,
        checkpoint_type: checkpointType,
        scheduled_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error scheduling checkpoint:', error);
      return false;
    }

    return true;
  }
}

export const pilotManagementService = new PilotManagementService();
