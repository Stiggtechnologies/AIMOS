import { supabase } from '../lib/supabase';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<any>;
  result?: any;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'utilization-crisis',
    name: '🚨 Utilization Crisis Chain Reaction',
    description: 'Shows how the system detects, diagnoses, and auto-corrects a utilization drop',
    steps: []
  },
  {
    id: 'credential-gap',
    name: '⚠️ Credential Compliance Gap',
    description: 'Demonstrates automatic detection and playbook activation for credential gaps',
    steps: []
  },
  {
    id: 'launch-delay',
    name: '🚀 New Clinic Launch Intervention',
    description: 'Shows how the system prevents launch delays through early detection',
    steps: []
  },
  {
    id: 'comparative-learning',
    name: '📊 Cross-Clinic Pattern Recognition',
    description: 'Demonstrates how the system learns from top performers',
    steps: []
  },
  {
    id: 'management-enforcement',
    name: '👔 Management Cadence Enforcement',
    description: 'Shows automatic escalation when managers miss cadences',
    steps: []
  }
];

export class ExcellenceDemoService {

  // SCENARIO 1: Utilization Crisis Chain Reaction
  async runUtilizationCrisisDemo() {
    const steps: DemoStep[] = [];
    const results: any[] = [];

    // Step 1: Create baseline deviation
    steps.push({
      id: 'detect-deviation',
      title: 'System Detects Utilization Drop',
      description: 'Downtown Toronto Clinic drops to 55% utilization (baseline: 70-80%)',
      action: async () => {
        // Get the baseline ID
        const { data: baseline } = await supabase
          .from('excellence_baselines')
          .select('id')
          .eq('metric_key', 'clinician_utilization')
          .single();

        const { data, error } = await supabase
          .from('performance_deviations')
          .insert({
            clinic_id: '11111111-1111-1111-1111-111111111111',
            baseline_id: baseline?.id,
            metric_key: 'clinician_utilization',
            actual_value: 55,
            target_value: 75,
            severity: 'red',
            deviation_percent: -26.67,
            detected_at: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    // Step 2: Root cause analysis
    steps.push({
      id: 'analyze-root-cause',
      title: 'AI Performs Root Cause Analysis',
      description: 'System builds causal chain to identify underlying issues',
      action: async () => {
        const { data: analysis, error } = await supabase
          .from('root_cause_analyses')
          .insert({
            deviation_id: results[0]?.id,
            clinic_id: '11111111-1111-1111-1111-111111111111',
            issue_description: 'Clinician utilization dropped from 78% to 55%',
            analysis_status: 'completed',
            primary_root_cause: 'Staffing shortage due to credential delays',
            confidence_score: 0.87
          })
          .select()
          .single();

        if (error) throw error;

        // Add causal chain
        await supabase.from('causal_chains').insert([
          {
            analysis_id: analysis.id,
            sequence_order: 1,
            cause_description: 'Two senior clinicians credentials expired',
            effect_description: 'Unable to schedule patient appointments',
            evidence: 'Credentials table shows 2 expired entries'
          },
          {
            analysis_id: analysis.id,
            sequence_order: 2,
            cause_description: 'Credential renewal process delayed 3 weeks',
            effect_description: 'Clinicians unable to see patients',
            evidence: 'Average renewal time: 21 days vs target 7 days'
          },
          {
            analysis_id: analysis.id,
            sequence_order: 3,
            cause_description: 'No backup staffing protocol',
            effect_description: 'Utilization drops below 60%',
            evidence: 'No contingency plan documented'
          }
        ]);

        // Add hypotheses with confidence scores
        await supabase.from('causal_hypotheses').insert([
          {
            analysis_id: analysis.id,
            hypothesis: 'Credential renewal process lacks automation',
            confidence_score: 0.92,
            supporting_evidence: ['Manual tracking', 'No renewal reminders', 'Historical delays'],
            recommended_actions: ['Implement automated renewal tracking', 'Add 30-day advance alerts']
          },
          {
            analysis_id: analysis.id,
            hypothesis: 'Insufficient cross-training for clinic coverage',
            confidence_score: 0.78,
            supporting_evidence: ['No float pool', 'Single-skill clinicians'],
            recommended_actions: ['Build float pool', 'Cross-train staff']
          }
        ]);

        return analysis;
      }
    });

    // Step 3: Auto-trigger playbook
    steps.push({
      id: 'trigger-playbook',
      title: 'System Auto-Triggers Corrective Playbook',
      description: '"Utilization Recovery Protocol" playbook activates automatically',
      action: async () => {
        // Get a playbook template
        const { data: template } = await supabase
          .from('growth_playbook_templates')
          .select('id')
          .limit(1)
          .maybeSingle();

        const { data, error } = await supabase
          .from('playbook_executions')
          .insert({
            playbook_template_id: template?.id,
            clinic_id: '11111111-1111-1111-1111-111111111111',
            execution_name: 'Utilization Recovery Protocol',
            status: 'in_progress',
            start_date: new Date().toISOString().split('T')[0],
            planned_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            owner_id: (await supabase.auth.getUser()).data.user?.id,
            notes: 'Auto-triggered due to utilization below 60% threshold'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    // Step 4: Management cadence enforced
    steps.push({
      id: 'enforce-cadence',
      title: 'Management OS Enforces Daily Check-In',
      description: 'Clinic Manager required to review and update daily',
      action: async () => {
        // Get a management cadence
        const { data: cadence } = await supabase
          .from('management_cadences')
          .select('id')
          .limit(1)
          .maybeSingle();

        const userId = (await supabase.auth.getUser()).data.user?.id;

        const { data, error } = await supabase
          .from('cadence_executions')
          .insert({
            cadence_id: cadence?.id,
            clinic_id: '11111111-1111-1111-1111-111111111111',
            manager_id: userId,
            execution_date: new Date().toISOString().split('T')[0],
            due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            notes: 'Daily operational review - automatically scheduled'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    // Step 5: Track resolution
    steps.push({
      id: 'track-resolution',
      title: 'System Monitors Resolution Progress',
      description: 'Real-time tracking of playbook completion and utilization recovery',
      action: async () => {
        return {
          status: 'monitoring',
          message: 'Resolution tracking active',
          playbook_id: results[2]?.id,
          cadence_id: results[3]?.id,
          deviation_id: results[0]?.id
        };
      }
    });

    // Execute all steps
    for (const step of steps) {
      const result = await step.action();
      results.push(result);
      step.result = result;
    }

    return { steps, results };
  }

  // SCENARIO 2: Credential Gap Detection
  async runCredentialGapDemo() {
    const steps: DemoStep[] = [];
    const results: any[] = [];

    steps.push({
      id: 'detect-credential-gap',
      title: 'System Detects Credential Compliance Drop',
      description: 'Mississauga Clinic drops to 85% compliance (target: 100%)',
      action: async () => {
        // Get the baseline ID
        const { data: baseline } = await supabase
          .from('excellence_baselines')
          .select('id')
          .eq('metric_key', 'credential_compliance_rate')
          .single();

        const { data, error } = await supabase
          .from('performance_deviations')
          .insert({
            clinic_id: '22222222-2222-2222-2222-222222222222',
            baseline_id: baseline?.id,
            metric_key: 'credential_compliance_rate',
            actual_value: 85,
            target_value: 100,
            severity: 'yellow',
            deviation_percent: -15,
            detected_at: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'trigger-credential-playbook',
      title: 'Auto-Trigger: Credential Recovery Playbook',
      description: 'System immediately activates credential compliance protocol',
      action: async () => {
        // Get a playbook template
        const { data: template } = await supabase
          .from('growth_playbook_templates')
          .select('id')
          .limit(1)
          .maybeSingle();

        const { data, error } = await supabase
          .from('playbook_executions')
          .insert({
            playbook_template_id: template?.id,
            clinic_id: '22222222-2222-2222-2222-222222222222',
            execution_name: 'Credential Compliance Recovery',
            status: 'in_progress',
            start_date: new Date().toISOString().split('T')[0],
            planned_end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            owner_id: (await supabase.auth.getUser()).data.user?.id,
            notes: 'Auto-triggered due to credential compliance below 100%'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    for (const step of steps) {
      const result = await step.action();
      results.push(result);
      step.result = result;
    }

    return { steps, results };
  }

  // SCENARIO 3: Cross-Clinic Pattern Recognition
  async runComparativeLearningDemo() {
    const steps: DemoStep[] = [];
    const results: any[] = [];

    steps.push({
      id: 'generate-rankings',
      title: 'System Generates Clinic Rankings',
      description: 'All clinics ranked by utilization performance',
      action: async () => {
        const { data, error } = await supabase
          .from('clinic_rankings')
          .select('*')
          .eq('metric_type', 'utilization')
          .order('rank', { ascending: true })
          .limit(10);

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'detect-patterns',
      title: 'AI Detects Success Patterns',
      description: 'System identifies what top performers do differently',
      action: async () => {
        const { data, error } = await supabase
          .from('performance_patterns')
          .insert({
            pattern_type: 'success',
            metric_category: 'utilization',
            pattern_description: 'Top quartile clinics use automated scheduling and have float pools',
            frequency: 8,
            impact_score: 0.92,
            clinics_affected: 8,
            first_detected: new Date().toISOString(),
            validation_status: 'confirmed'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'generate-insights',
      title: 'System Generates Actionable Insights',
      description: 'Recommendations pushed to underperforming clinics',
      action: async () => {
        const { data, error } = await supabase
          .from('comparative_insights')
          .insert({
            insight_type: 'opportunity',
            title: 'Float pool implementation correlates with 15% higher utilization',
            description: 'Top 3 clinics all maintain float pools. Bottom quartile has none.',
            affected_clinics: ['11111111-1111-1111-1111-111111111111'],
            recommended_actions: ['Build float pool', 'Cross-train clinicians', 'Implement automated scheduling'],
            potential_impact: 'High',
            priority: 'high'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    for (const step of steps) {
      const result = await step.action();
      results.push(result);
      step.result = result;
    }

    return { steps, results };
  }

  // SCENARIO 4: Management Cadence Enforcement
  async runManagementEnforcementDemo() {
    const steps: DemoStep[] = [];
    const results: any[] = [];

    steps.push({
      id: 'schedule-cadence',
      title: 'System Schedules Daily Manager Review',
      description: 'Mandatory daily ops review for all clinic managers',
      action: async () => {
        // Get a management cadence
        const { data: cadence } = await supabase
          .from('management_cadences')
          .select('id')
          .limit(1)
          .maybeSingle();

        const userId = (await supabase.auth.getUser()).data.user?.id;

        const { data, error } = await supabase
          .from('cadence_executions')
          .insert({
            cadence_id: cadence?.id,
            clinic_id: '11111111-1111-1111-1111-111111111111',
            manager_id: userId,
            execution_date: new Date().toISOString().split('T')[0],
            due_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
            status: 'pending',
            notes: 'Daily operational review - mandatory'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'detect-miss',
      title: 'System Detects Missed Cadence',
      description: 'Manager fails to complete review by deadline',
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data, error } = await supabase
          .from('cadence_executions')
          .update({
            status: 'missed',
            late_by_minutes: 120
          })
          .eq('id', results[0]?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'auto-escalate',
      title: 'Auto-Escalation to Regional Director',
      description: 'System automatically escalates missed cadence to supervisor',
      action: async () => {
        const { data, error } = await supabase
          .from('cadence_executions')
          .update({
            escalated_at: new Date().toISOString(),
            notes: 'ESCALATED: Daily review missed by 2 hours - no completion recorded'
          })
          .eq('id', results[0]?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    });

    steps.push({
      id: 'update-effectiveness',
      title: 'Impact on Manager Effectiveness Score',
      description: 'Missed cadence reduces manager effectiveness rating',
      action: async () => {
        return {
          status: 'tracked',
          message: 'Manager effectiveness score reduced by 10 points',
          impact: 'Cadence compliance rate decreased',
          escalation_count: 1
        };
      }
    });

    for (const step of steps) {
      const result = await step.action();
      results.push(result);
      step.result = result;
    }

    return { steps, results };
  }

  // Master demo runner
  async runAllDemos() {
    const results = {
      utilizationCrisis: await this.runUtilizationCrisisDemo(),
      credentialGap: await this.runCredentialGapDemo(),
      comparativeLearning: await this.runComparativeLearningDemo(),
      managementEnforcement: await this.runManagementEnforcementDemo()
    };

    return results;
  }

  // Get current system state
  async getSystemState() {
    const [deviations, playbooks, cadences, patterns] = await Promise.all([
      supabase.from('performance_deviations').select('*').eq('status', 'active'),
      supabase.from('playbook_executions').select('*').eq('status', 'in_progress'),
      supabase.from('cadence_executions').select('*').eq('status', 'pending'),
      supabase.from('performance_patterns').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    return {
      activeDeviations: deviations.data?.length || 0,
      activePlaybooks: playbooks.data?.length || 0,
      pendingCadences: cadences.data?.length || 0,
      recentPatterns: patterns.data?.length || 0,
      deviations: deviations.data,
      playbooks: playbooks.data,
      cadences: cadences.data,
      patterns: patterns.data
    };
  }
}

export const excellenceDemoService = new ExcellenceDemoService();
