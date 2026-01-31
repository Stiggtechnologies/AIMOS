import { supabase } from '../lib/supabase';

export interface OutcomeAttribution {
  id: string;
  pilot_id: string;
  sop_version: string;
  evidence_id: string;
  measurement_period: string;
  outcome_metrics: Record<string, any>;
  pre_metrics: Record<string, any>;
  post_metrics: Record<string, any>;
  improvement_percentage: number;
  statistically_significant: boolean;
  confidence_interval: string;
  attribution_status: string;
}

class OutcomeAttributionService {
  async capturePreMetrics(
    pilotId: string,
    clinicIds: string[]
  ): Promise<Record<string, any>> {
    const preMetrics: Record<string, any> = {};

    for (const clinicId of clinicIds) {
      const { data: metrics } = await supabase.rpc('get_clinic_outcome_metrics', {
        p_clinic_id: clinicId,
        p_timeframe_days: 30
      });

      if (metrics) {
        preMetrics[clinicId] = {
          days_to_rtw: metrics.avg_days_to_rtw,
          claim_acceptance_rate: metrics.claim_acceptance_rate,
          visits_per_case: metrics.avg_visits_per_case,
          patient_satisfaction: metrics.avg_patient_satisfaction,
          capture_date: new Date().toISOString()
        };
      }
    }

    return preMetrics;
  }

  async capturePostMetrics(
    pilotId: string,
    clinicIds: string[]
  ): Promise<Record<string, any>> {
    const postMetrics: Record<string, any> = {};

    for (const clinicId of clinicIds) {
      const { data: metrics } = await supabase.rpc('get_clinic_outcome_metrics', {
        p_clinic_id: clinicId,
        p_timeframe_days: 30
      });

      if (metrics) {
        postMetrics[clinicId] = {
          days_to_rtw: metrics.avg_days_to_rtw,
          claim_acceptance_rate: metrics.claim_acceptance_rate,
          visits_per_case: metrics.avg_visits_per_case,
          patient_satisfaction: metrics.avg_patient_satisfaction,
          capture_date: new Date().toISOString()
        };
      }
    }

    return postMetrics;
  }

  async attributeOutcomesToPilot(
    pilotId: string,
    evidenceId: string,
    sopVersion: string
  ): Promise<OutcomeAttribution | null> {
    const { data: pilot, error: pilotError } = await supabase
      .from('practice_pilots')
      .select('*')
      .eq('id', pilotId)
      .maybeSingle();

    if (pilotError || !pilot) {
      console.error('Error loading pilot:', pilotError);
      return null;
    }

    const preMetrics = pilot.baseline_metrics || {};

    const postMetrics = await this.capturePostMetrics(
      pilotId,
      pilot.pilot_clinics || []
    );

    const improvements = this.calculateImprovements(preMetrics, postMetrics);

    const { data: attribution, error: attrError } = await supabase
      .from('outcome_attributions')
      .insert({
        pilot_id: pilotId,
        evidence_id: evidenceId,
        sop_version: sopVersion,
        measurement_period: `${new Date(pilot.started_at).toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
        pre_metrics: preMetrics,
        post_metrics: postMetrics,
        outcome_metrics: improvements.metrics,
        improvement_percentage: improvements.overallImprovement,
        statistically_significant:
          improvements.overallImprovement >= improvements.minimumSignificance,
        confidence_interval: `${(improvements.overallImprovement - 2).toFixed(2)}% to ${(improvements.overallImprovement + 2).toFixed(2)}%`,
        attribution_status: 'preliminary'
      })
      .select()
      .single();

    if (attrError) {
      console.error('Error creating attribution:', attrError);
      return null;
    }

    return attribution;
  }

  private calculateImprovements(
    preMetrics: Record<string, any>,
    postMetrics: Record<string, any>
  ): {
    metrics: Record<string, number>;
    overallImprovement: number;
    minimumSignificance: number;
  } {
    const improvementMap: Record<string, number[]> = {};

    for (const clinic of Object.keys(preMetrics)) {
      if (!postMetrics[clinic]) continue;

      const pre = preMetrics[clinic];
      const post = postMetrics[clinic];

      for (const metric of Object.keys(pre)) {
        if (metric === 'capture_date' || !post[metric]) continue;

        const preValue = parseFloat(pre[metric]) || 0;
        const postValue = parseFloat(post[metric]) || 0;

        if (preValue === 0) continue;

        const improvement = ((preValue - postValue) / preValue) * 100;

        if (!improvementMap[metric]) {
          improvementMap[metric] = [];
        }
        improvementMap[metric].push(improvement);
      }
    }

    const metrics: Record<string, number> = {};
    let totalImprovement = 0;
    let metricCount = 0;

    for (const [metric, improvements] of Object.entries(improvementMap)) {
      const avgImprovement =
        improvements.reduce((a, b) => a + b, 0) / improvements.length;
      metrics[metric] = parseFloat(avgImprovement.toFixed(2));

      if (
        metric === 'days_to_rtw' ||
        metric === 'claim_acceptance_rate' ||
        metric === 'visits_per_case'
      ) {
        totalImprovement += avgImprovement;
        metricCount++;
      }
    }

    const overallImprovement =
      metricCount > 0
        ? parseFloat((totalImprovement / metricCount).toFixed(2))
        : 0;

    return {
      metrics,
      overallImprovement,
      minimumSignificance: 5
    };
  }

  async getAttributionReport(pilotId: string) {
    const { data: attribution, error } = await supabase
      .from('outcome_attributions')
      .select(
        `
        *,
        pilot:practice_pilots (
          id,
          status,
          duration_days,
          started_at,
          ended_at
        ),
        evidence:evidence_flags (
          evidence_theme,
          confidence_score
        )
      `
      )
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error loading attribution:', error);
      return null;
    }

    if (!attribution) {
      return null;
    }

    return {
      pilotId: attribution.pilot_id,
      evidenceTheme: attribution.evidence?.evidence_theme || '',
      sopVersion: attribution.sop_version,
      measurementPeriod: attribution.measurement_period,
      preMetrics: attribution.pre_metrics,
      postMetrics: attribution.post_metrics,
      outcomes: attribution.outcome_metrics,
      improvementPercentage: attribution.improvement_percentage,
      isSignificant: attribution.statistically_significant,
      confidenceInterval: attribution.confidence_interval,
      status: attribution.attribution_status
    };
  }

  async compareOutcomeAcrossClinics(pilotId: string) {
    const { data: attribution, error } = await supabase
      .from('outcome_attributions')
      .select('*')
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !attribution) {
      console.error('Error loading attribution:', error);
      return null;
    }

    const clinicComparison: Record<string, any> = {};

    for (const clinic of Object.keys(attribution.pre_metrics)) {
      const pre = attribution.pre_metrics[clinic];
      const post = attribution.post_metrics[clinic] || {};

      const improvements: Record<string, number> = {};

      for (const metric of Object.keys(pre)) {
        if (metric === 'capture_date') continue;

        const preValue = parseFloat(pre[metric]) || 0;
        const postValue = parseFloat(post[metric]) || 0;

        if (preValue === 0) continue;

        improvements[metric] = parseFloat(
          (((preValue - postValue) / preValue) * 100).toFixed(2)
        );
      }

      clinicComparison[clinic] = {
        preMetrics: pre,
        postMetrics: post,
        improvements,
        overallImprovement:
          Object.values(improvements).reduce((a: number, b: any) => a + b, 0) /
          Object.keys(improvements).length
      };
    }

    return clinicComparison;
  }

  async getOutcomeTimeseries(pilotId: string, metric: string) {
    const { data: observations, error } = await supabase
      .from('pilot_observations')
      .select('observation_date, observation_data')
      .eq('pilot_id', pilotId)
      .order('observation_date', { ascending: true });

    if (error) {
      console.error('Error loading observations:', error);
      return [];
    }

    const timeseries = (observations || [])
      .map((obs: any) => ({
        date: obs.observation_date,
        value:
          obs.observation_data[metric] ||
          obs.observation_data[`avg_${metric}`] ||
          null
      }))
      .filter((ts: any) => ts.value !== null);

    return timeseries;
  }

  async finalizeAttribution(attributionId: string, finalStatus: string): Promise<boolean> {
    const { error } = await supabase
      .from('outcome_attributions')
      .update({
        attribution_status: finalStatus,
        finalized_at: new Date().toISOString()
      })
      .eq('id', attributionId);

    if (error) {
      console.error('Error finalizing attribution:', error);
      return false;
    }

    return true;
  }

  async getOutcomesSummary(limit = 10) {
    const { data, error } = await supabase
      .from('outcome_attributions')
      .select(
        `
        *,
        pilot:practice_pilots (
          id,
          status
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading outcomes:', error);
      return [];
    }

    return (data || []).map((attr) => ({
      id: attr.id,
      pilotId: attr.pilot_id,
      sopVersion: attr.sop_version,
      improvement: attr.improvement_percentage,
      isSignificant: attr.statistically_significant,
      status: attr.attribution_status,
      pilotStatus: attr.pilot?.status
    }));
  }
}

export const outcomeAttributionService = new OutcomeAttributionService();
