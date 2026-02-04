import { supabase } from '../lib/supabase';

export interface PilotSuccessPrediction {
  pilotId: string;
  successProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  keySuccessFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  riskFactors: Array<{
    factor: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  recommendation: string;
  predictionDate: string;
}

export interface TranslationImpactForecast {
  translationId: string;
  predictedOutcomes: {
    visitReduction: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
    rtwImprovement: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
    claimAcceptance: {
      predicted: number;
      confidence: number;
      range: { min: number; max: number };
    };
  };
  implementationRisk: 'low' | 'medium' | 'high';
  recommendedApproach: string;
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  velocityPerMonth: number;
  projectedValue3Month: number;
  projectedValue6Month: number;
  projectedValue12Month: number;
  confidence: number;
}

class PredictiveAnalyticsService {

  async predictPilotSuccess(pilotId: string): Promise<PilotSuccessPrediction> {
    try {
      const { data: pilot, error } = await supabase
        .from('practice_pilots')
        .select(`
          *,
          practice_translations (
            change_type,
            implementation_complexity,
            estimated_training_hours,
            expected_visit_reduction,
            expected_rtw_improvement_days
          )
        `)
        .eq('id', pilotId)
        .single();

      if (error) throw error;

      let successScore = 50;
      const keyFactors: PilotSuccessPrediction['keySuccessFactors'] = [];
      const risks: PilotSuccessPrediction['riskFactors'] = [];

      if (pilot.practice_translations.implementation_complexity === 'low') {
        successScore += 20;
        keyFactors.push({
          factor: 'Low Complexity',
          impact: 20,
          description: 'Simple implementation reduces failure risk'
        });
      } else if (pilot.practice_translations.implementation_complexity === 'high') {
        successScore -= 15;
        risks.push({
          factor: 'High Complexity',
          severity: 'high',
          mitigation: 'Increase training hours and provide additional support'
        });
      }

      if (pilot.practice_translations.estimated_training_hours < 5) {
        successScore += 10;
        keyFactors.push({
          factor: 'Minimal Training Required',
          impact: 10,
          description: 'Quick adoption with minimal disruption'
        });
      } else if (pilot.practice_translations.estimated_training_hours > 20) {
        successScore -= 10;
        risks.push({
          factor: 'Extensive Training Required',
          severity: 'medium',
          mitigation: 'Stagger implementation and provide ongoing support'
        });
      }

      if (pilot.practice_translations.expected_visit_reduction > 0.2) {
        successScore += 15;
        keyFactors.push({
          factor: 'High Expected Impact',
          impact: 15,
          description: 'Significant efficiency gains expected'
        });
      }

      const { data: clinicHistory } = await supabase
        .from('practice_adoptions')
        .select('status')
        .eq('pilot_id', pilotId)
        .limit(10);

      if (clinicHistory && clinicHistory.length > 0) {
        const successRate = clinicHistory.filter(a => a.status === 'validated').length / clinicHistory.length;
        if (successRate > 0.7) {
          successScore += 15;
          keyFactors.push({
            factor: 'Strong Historical Performance',
            impact: 15,
            description: 'Similar implementations have succeeded'
          });
        }
      }

      successScore = Math.max(0, Math.min(100, successScore));

      const confidenceLevel: PilotSuccessPrediction['confidenceLevel'] =
        keyFactors.length + risks.length >= 5 ? 'high' :
        keyFactors.length + risks.length >= 3 ? 'medium' : 'low';

      let recommendation = '';
      if (successScore >= 70) {
        recommendation = 'High probability of success. Proceed with standard implementation timeline.';
      } else if (successScore >= 50) {
        recommendation = 'Moderate probability. Consider phased rollout and additional monitoring.';
      } else {
        recommendation = 'High risk. Recommend postponing until mitigation strategies are in place.';
      }

      return {
        pilotId,
        successProbability: successScore / 100,
        confidenceLevel,
        keySuccessFactors: keyFactors,
        riskFactors: risks,
        recommendation,
        predictionDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error predicting pilot success:', error);
      return {
        pilotId,
        successProbability: 0.5,
        confidenceLevel: 'low',
        keySuccessFactors: [],
        riskFactors: [],
        recommendation: 'Insufficient data for prediction',
        predictionDate: new Date().toISOString()
      };
    }
  },

  async forecastTranslationImpact(translationId: string): Promise<TranslationImpactForecast | null> {
    try {
      const { data: translation, error } = await supabase
        .from('practice_translations')
        .select('*')
        .eq('id', translationId)
        .single();

      if (error) throw error;

      const visitReduction = translation.expected_visit_reduction || 0;
      const rtwImprovement = translation.expected_rtw_improvement_days || 0;
      const claimIncrease = translation.expected_claim_acceptance_increase || 0;

      const complexity = translation.implementation_complexity || 'medium';
      const confidenceMultiplier = complexity === 'low' ? 0.9 : complexity === 'medium' ? 0.75 : 0.6;

      const implementationRisk =
        complexity === 'low' && translation.estimated_training_hours < 10 ? 'low' :
        complexity === 'high' || translation.estimated_training_hours > 30 ? 'high' : 'medium';

      return {
        translationId,
        predictedOutcomes: {
          visitReduction: {
            predicted: visitReduction,
            confidence: confidenceMultiplier,
            range: {
              min: visitReduction * 0.7,
              max: visitReduction * 1.3
            }
          },
          rtwImprovement: {
            predicted: rtwImprovement,
            confidence: confidenceMultiplier,
            range: {
              min: Math.floor(rtwImprovement * 0.6),
              max: Math.ceil(rtwImprovement * 1.4)
            }
          },
          claimAcceptance: {
            predicted: claimIncrease,
            confidence: confidenceMultiplier * 0.85,
            range: {
              min: claimIncrease * 0.5,
              max: claimIncrease * 1.5
            }
          }
        },
        implementationRisk,
        recommendedApproach: implementationRisk === 'low'
          ? 'Full rollout recommended'
          : implementationRisk === 'medium'
          ? 'Phased implementation with monitoring'
          : 'Pilot at single clinic first'
      };
    } catch (error) {
      console.error('Error forecasting translation impact:', error);
      return null;
    }
  },

  async analyzeTrends(metric: string, clinicId?: string, months: number = 6): Promise<TrendAnalysis | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('research_outcomes')
        .select('visits_per_case_post, days_to_rtw_post, updated_at')
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString())
        .order('updated_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length < 2) return null;

      const values = data.map(d =>
        metric === 'visits' ? d.visits_per_case_post :
        metric === 'rtw_days' ? d.days_to_rtw_post : 0
      ).filter(v => v !== null && v !== undefined);

      if (values.length < 2) return null;

      const currentValue = values[values.length - 1];
      const firstValue = values[0];
      const totalChange = currentValue - firstValue;
      const velocityPerMonth = totalChange / months;

      const trend: TrendAnalysis['trend'] =
        Math.abs(velocityPerMonth) < 0.05 ? 'stable' :
        velocityPerMonth > 0 ? 'increasing' : 'decreasing';

      const variance = values.reduce((sum, v) => sum + Math.pow(v - currentValue, 2), 0) / values.length;
      const confidence = Math.max(0.3, 1 - (Math.sqrt(variance) / currentValue));

      return {
        metric,
        currentValue,
        trend,
        velocityPerMonth,
        projectedValue3Month: currentValue + (velocityPerMonth * 3),
        projectedValue6Month: currentValue + (velocityPerMonth * 6),
        projectedValue12Month: currentValue + (velocityPerMonth * 12),
        confidence
      };
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return null;
    }
  },

  async identifyHighImpactResearchGaps(): Promise<Array<{
    topic: string;
    priority: number;
    potentialImpact: string;
    currentGap: string;
  }>> {
    try {
      const { data: priorities, error: prioritiesError } = await supabase
        .from('research_priorities')
        .select('condition_name, outcome_type, priority_score')
        .eq('is_active', true)
        .order('priority_score', { ascending: false })
        .limit(10);

      if (prioritiesError) throw prioritiesError;

      const { data: papers, error: papersError } = await supabase
        .from('research_papers')
        .select('condition_tag')
        .gte('ingestion_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (papersError) throw papersError;

      const conditionCounts = papers.reduce((acc, paper) => {
        if (paper.condition_tag) {
          acc[paper.condition_tag] = (acc[paper.condition_tag] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const gaps = priorities?.map(p => {
        const paperCount = conditionCounts[p.condition_name] || 0;
        const gapScore = p.priority_score - (paperCount * 5);

        return {
          topic: `${p.condition_name} - ${p.outcome_type}`,
          priority: p.priority_score,
          potentialImpact: gapScore > 80 ? 'Very High' : gapScore > 60 ? 'High' : gapScore > 40 ? 'Medium' : 'Low',
          currentGap: paperCount < 3 ? 'Critical - Very few studies' :
                     paperCount < 10 ? 'Significant - Limited evidence' :
                     'Moderate - Some evidence available'
        };
      }) || [];

      return gaps.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Error identifying research gaps:', error);
      return [];
    }
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
