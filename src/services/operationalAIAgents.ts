import { supabase } from '../lib/supabase';
import { callOpenAI, ChatMessage } from './openaiService';

export interface AgentInsight {
  insight: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation: string;
  data_source: string;
  timestamp: string;
}

export interface AgentAnalysis {
  agent_name: string;
  summary: string;
  insights: AgentInsight[];
  metrics: Record<string, any>;
  execution_time_ms: number;
}

export class OperationalAIAgents {
  async analyzeIntakeRouting(): Promise<AgentAnalysis> {
    const startTime = Date.now();

    try {
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            department,
            location,
            employment_type
          )
        `)
        .eq('status', 'screening')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: workflowData } = await supabase
        .from('workflow_automation_history')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);

      const insights: AgentInsight[] = [];
      const metrics: Record<string, any> = {
        total_pending: applications?.length || 0,
        avg_time_in_screening: 0,
        workflow_success_rate: 0
      };

      if (applications && applications.length > 0) {
        const avgTime = applications.reduce((sum, app) => {
          const created = new Date(app.created_at).getTime();
          const now = Date.now();
          return sum + (now - created) / (1000 * 60 * 60 * 24);
        }, 0) / applications.length;

        metrics.avg_time_in_screening = Math.round(avgTime * 10) / 10;

        if (avgTime > 7) {
          insights.push({
            insight: `Applications spending ${metrics.avg_time_in_screening} days in screening on average`,
            priority: 'high',
            confidence: 0.92,
            recommendation: 'Consider implementing automated pre-screening filters or increasing reviewer capacity',
            data_source: 'applications',
            timestamp: new Date().toISOString()
          });
        }

        const departmentCounts = applications.reduce((acc, app) => {
          const dept = app.jobs?.department || 'Unknown';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const maxDept = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1])[0];
        if (maxDept && maxDept[1] > applications.length * 0.5) {
          insights.push({
            insight: `${maxDept[0]} department has ${maxDept[1]} pending applications (${Math.round(maxDept[1] / applications.length * 100)}% of total)`,
            priority: 'medium',
            confidence: 0.95,
            recommendation: `Prioritize ${maxDept[0]} applications or allocate additional screening resources`,
            data_source: 'applications',
            timestamp: new Date().toISOString()
          });
        }
      }

      if (workflowData && workflowData.length > 0) {
        const successCount = workflowData.filter(w => w.status === 'completed').length;
        metrics.workflow_success_rate = Math.round((successCount / workflowData.length) * 100);
      }

      const prompt = `Analyze this intake/application data and provide routing optimization suggestions:

Metrics:
- Total pending applications: ${metrics.total_pending}
- Average time in screening: ${metrics.avg_time_in_screening} days
- Workflow success rate: ${metrics.workflow_success_rate}%

Sample applications: ${JSON.stringify(applications?.slice(0, 5))}

Provide 2-3 actionable recommendations for optimizing the intake routing process.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are an operations optimization expert specializing in intake process efficiency. Provide concise, actionable recommendations.' },
        { role: 'user', content: prompt }
      ];

      const aiResponse = await callOpenAI({ messages, model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1000 });

      const summary = aiResponse.choices[0]?.message?.content || 'Unable to generate AI summary';

      await this.logAgentExecution('intake_agent', 'completed', metrics);

      return {
        agent_name: 'Intake Routing Agent',
        summary,
        insights,
        metrics,
        execution_time_ms: Date.now() - startTime
      };
    } catch (error) {
      console.error('Intake Agent error:', error);
      await this.logAgentExecution('intake_agent', 'failed', { error: String(error) });
      throw error;
    }
  }

  async analyzeCapacity(): Promise<AgentAnalysis> {
    const startTime = Date.now();

    try {
      const { data: schedules } = await supabase
        .from('ops_staff_schedules')
        .select(`
          *,
          staff:staff_profiles (
            id,
            user:users (
              first_name,
              last_name
            ),
            clinic:clinics (
              name
            )
          )
        `)
        .gte('schedule_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('schedule_date', { ascending: false });

      const { data: rooms } = await supabase
        .from('ops_treatment_rooms')
        .select('*');

      const { data: alerts } = await supabase
        .from('ops_credential_alerts')
        .select('*')
        .in('severity', ['critical', 'urgent'])
        .eq('resolved', false);

      const insights: AgentInsight[] = [];
      const metrics: Record<string, any> = {
        total_scheduled_shifts: schedules?.length || 0,
        total_available_rooms: rooms?.filter(r => r.is_available).length || 0,
        critical_credential_alerts: alerts?.length || 0,
        capacity_utilization: 0
      };

      if (schedules && schedules.length > 0) {
        const confirmedShifts = schedules.filter(s => s.status === 'confirmed').length;
        metrics.capacity_utilization = Math.round((confirmedShifts / schedules.length) * 100);

        if (metrics.capacity_utilization < 70) {
          insights.push({
            insight: `Low capacity utilization at ${metrics.capacity_utilization}%`,
            priority: 'high',
            confidence: 0.88,
            recommendation: 'Review scheduling patterns and identify gaps. Consider flexible shift arrangements or part-time hiring.',
            data_source: 'ops_staff_schedules',
            timestamp: new Date().toISOString()
          });
        }

        const clinicSchedules = schedules.reduce((acc, sched) => {
          const clinicName = sched.staff?.clinic?.name || 'Unknown';
          if (!acc[clinicName]) acc[clinicName] = [];
          acc[clinicName].push(sched);
          return acc;
        }, {} as Record<string, any[]>);

        Object.entries(clinicSchedules).forEach(([clinic, scheds]) => {
          const avgPerDay = scheds.length / 7;
          if (avgPerDay < 3) {
            insights.push({
              insight: `${clinic} averaging only ${avgPerDay.toFixed(1)} shifts per day`,
              priority: 'medium',
              confidence: 0.85,
              recommendation: `Increase staffing at ${clinic} or adjust service offerings`,
              data_source: 'ops_staff_schedules',
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      if (alerts && alerts.length > 0) {
        insights.push({
          insight: `${alerts.length} critical credential alerts affecting staffing availability`,
          priority: 'critical',
          confidence: 0.98,
          recommendation: 'Immediately address credential renewals to prevent staffing gaps',
          data_source: 'ops_credential_alerts',
          timestamp: new Date().toISOString()
        });
      }

      const prompt = `Analyze this capacity and staffing data:

Metrics:
- Scheduled shifts (last 7 days): ${metrics.total_scheduled_shifts}
- Available treatment rooms: ${metrics.total_available_rooms}
- Capacity utilization: ${metrics.capacity_utilization}%
- Critical credential alerts: ${metrics.critical_credential_alerts}

Provide 2-3 recommendations for optimizing capacity and preventing staffing shortages.`;

      const messages2: ChatMessage[] = [
        { role: 'system', content: 'You are a healthcare operations expert specializing in capacity planning and resource optimization.' },
        { role: 'user', content: prompt }
      ];

      const aiResponse2 = await callOpenAI({ messages: messages2, model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1000 });

      const summary = aiResponse2.choices[0]?.message?.content || 'Unable to generate AI summary';

      await this.logAgentExecution('capacity_agent', 'completed', metrics);

      return {
        agent_name: 'Capacity Planning Agent',
        summary,
        insights,
        metrics,
        execution_time_ms: Date.now() - startTime
      };
    } catch (error) {
      console.error('Capacity Agent error:', error);
      await this.logAgentExecution('capacity_agent', 'failed', { error: String(error) });
      throw error;
    }
  }

  async analyzeRevenueCycle(): Promise<AgentAnalysis> {
    const startTime = Date.now();

    try {
      const { data: contracts } = await supabase
        .from('pricing_payor_contracts')
        .select('*')
        .order('revenue_last_12_months', { ascending: false });

      const { data: renewalAlerts } = await supabase
        .from('contract_renewal_alerts')
        .select('*')
        .eq('status', 'active')
        .order('days_until_renewal', { ascending: true });

      const { data: margins } = await supabase
        .from('service_line_margins')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(10);

      const insights: AgentInsight[] = [];
      const metrics: Record<string, any> = {
        total_contract_value: 0,
        contracts_at_risk: 0,
        avg_margin_percentage: 0,
        concentration_risk_count: 0
      };

      if (contracts && contracts.length > 0) {
        metrics.total_contract_value = contracts.reduce((sum, c) => sum + c.revenue_last_12_months, 0);
        metrics.concentration_risk_count = contracts.filter(c => c.revenue_percentage > 30).length;

        if (metrics.concentration_risk_count > 0) {
          const riskContracts = contracts.filter(c => c.revenue_percentage > 30);
          insights.push({
            insight: `${metrics.concentration_risk_count} payer(s) represent over 30% of revenue each`,
            priority: 'critical',
            confidence: 0.95,
            recommendation: `High concentration risk detected. Diversify payer mix to reduce exposure: ${riskContracts.map(c => c.payer_name).join(', ')}`,
            data_source: 'pricing_payor_contracts',
            timestamp: new Date().toISOString()
          });
        }
      }

      if (renewalAlerts && renewalAlerts.length > 0) {
        const urgentRenewals = renewalAlerts.filter(r => r.days_until_renewal < 90);
        metrics.contracts_at_risk = urgentRenewals.length;

        if (urgentRenewals.length > 0) {
          insights.push({
            insight: `${urgentRenewals.length} contracts require renewal action within 90 days`,
            priority: 'high',
            confidence: 0.92,
            recommendation: `Prioritize renewal negotiations for: ${urgentRenewals.slice(0, 3).map(r => `${r.days_until_renewal} days`).join(', ')}`,
            data_source: 'contract_renewal_alerts',
            timestamp: new Date().toISOString()
          });
        }
      }

      if (margins && margins.length > 0) {
        const avgMargin = margins.reduce((sum, m) => sum + m.gross_margin_percentage, 0) / margins.length;
        metrics.avg_margin_percentage = Math.round(avgMargin * 10) / 10;

        const lowMarginServices = margins.filter(m => m.gross_margin_percentage < 40);
        if (lowMarginServices.length > 0) {
          insights.push({
            insight: `${lowMarginServices.length} service line(s) operating below 40% margin`,
            priority: 'medium',
            confidence: 0.87,
            recommendation: `Review pricing and cost structure for: ${lowMarginServices.map(s => s.service_line_name).join(', ')}`,
            data_source: 'service_line_margins',
            timestamp: new Date().toISOString()
          });
        }
      }

      const prompt = `Analyze this revenue cycle and contract data:

Metrics:
- Total contract value: $${(metrics.total_contract_value / 1000000).toFixed(1)}M
- Contracts at risk: ${metrics.contracts_at_risk}
- Average margin: ${metrics.avg_margin_percentage}%
- High concentration risk: ${metrics.concentration_risk_count} payers

Provide 2-3 recommendations for revenue optimization and risk mitigation.`;

      const messages3: ChatMessage[] = [
        { role: 'system', content: 'You are a healthcare revenue cycle expert specializing in payer contracting and financial risk management.' },
        { role: 'user', content: prompt }
      ];

      const aiResponse3 = await callOpenAI({ messages: messages3, model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1000 });

      const summary = aiResponse3.choices[0]?.message?.content || 'Unable to generate AI summary';

      await this.logAgentExecution('revenue_agent', 'completed', metrics);

      return {
        agent_name: 'Revenue Cycle Agent',
        summary,
        insights,
        metrics,
        execution_time_ms: Date.now() - startTime
      };
    } catch (error) {
      console.error('Revenue Agent error:', error);
      await this.logAgentExecution('revenue_agent', 'failed', { error: String(error) });
      throw error;
    }
  }

  async detectOperationalBottlenecks(): Promise<AgentAnalysis> {
    const startTime = Date.now();

    try {
      const { data: credentialAlerts } = await supabase
        .from('ops_credential_alerts')
        .select('*')
        .eq('resolved', false);

      const { data: workflowHistory } = await supabase
        .from('workflow_automation_history')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);

      const { data: incidents } = await supabase
        .from('incident_events')
        .select('*')
        .gte('occurred_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('occurred_at', { ascending: false });

      const { data: applications } = await supabase
        .from('applications')
        .select('status')
        .in('status', ['screening', 'interviewing', 'offer']);

      const insights: AgentInsight[] = [];
      const metrics: Record<string, any> = {
        unresolved_credential_alerts: credentialAlerts?.length || 0,
        workflow_failures: 0,
        recent_incidents: incidents?.length || 0,
        hiring_pipeline_size: applications?.length || 0
      };

      if (workflowHistory && workflowHistory.length > 0) {
        const failures = workflowHistory.filter(w => w.status === 'failed');
        metrics.workflow_failures = failures.length;

        if (metrics.workflow_failures > 5) {
          insights.push({
            insight: `${metrics.workflow_failures} workflow failures in recent activity`,
            priority: 'high',
            confidence: 0.91,
            recommendation: 'Review workflow configurations and error logs. Consider adding retry logic or fallback mechanisms.',
            data_source: 'workflow_automation_history',
            timestamp: new Date().toISOString()
          });
        }
      }

      if (credentialAlerts && credentialAlerts.length > 10) {
        insights.push({
          insight: `Credential compliance backlog: ${credentialAlerts.length} unresolved alerts`,
          priority: 'critical',
          confidence: 0.96,
          recommendation: 'Allocate resources to clear credential backlog immediately. Consider hiring compliance specialist.',
          data_source: 'ops_credential_alerts',
          timestamp: new Date().toISOString()
        });
      }

      if (incidents && incidents.length > 5) {
        const incidentTypes = incidents.reduce((acc, inc) => {
          acc[inc.category] = (acc[inc.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topIncident = Object.entries(incidentTypes).sort((a, b) => b[1] - a[1])[0];
        if (topIncident) {
          insights.push({
            insight: `Recurring incident pattern: ${topIncident[1]} ${topIncident[0]} incidents in last 30 days`,
            priority: 'medium',
            confidence: 0.84,
            recommendation: `Investigate root cause of ${topIncident[0]} incidents. Implement preventive measures.`,
            data_source: 'incident_events',
            timestamp: new Date().toISOString()
          });
        }
      }

      if (applications && applications.length > 50) {
        insights.push({
          insight: `Large hiring pipeline: ${applications.length} active applications`,
          priority: 'low',
          confidence: 0.78,
          recommendation: 'Ensure adequate HR resources to process applications. Consider streamlining interview process.',
          data_source: 'applications',
          timestamp: new Date().toISOString()
        });
      }

      const prompt = `Analyze operational bottlenecks across the organization:

Metrics:
- Unresolved credential alerts: ${metrics.unresolved_credential_alerts}
- Workflow failures: ${metrics.workflow_failures}
- Recent incidents (30 days): ${metrics.recent_incidents}
- Hiring pipeline: ${metrics.hiring_pipeline_size} applications

Identify top 2-3 operational bottlenecks and provide actionable recommendations.`;

      const messages4: ChatMessage[] = [
        { role: 'system', content: 'You are an operational excellence expert specializing in identifying and resolving organizational bottlenecks.' },
        { role: 'user', content: prompt }
      ];

      const aiResponse4 = await callOpenAI({ messages: messages4, model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1000 });

      const summary = aiResponse4.choices[0]?.message?.content || 'Unable to generate AI summary';

      await this.logAgentExecution('ops_agent', 'completed', metrics);

      return {
        agent_name: 'Operations Bottleneck Agent',
        summary,
        insights,
        metrics,
        execution_time_ms: Date.now() - startTime
      };
    } catch (error) {
      console.error('Ops Agent error:', error);
      await this.logAgentExecution('ops_agent', 'failed', { error: String(error) });
      throw error;
    }
  }

  private async logAgentExecution(agentName: string, status: string, metadata: Record<string, any>) {
    try {
      await supabase.from('audit_events').insert({
        event_type: 'ai_agent_execution',
        action: agentName,
        status,
        metadata: {
          agent: agentName,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log agent execution:', error);
    }
  }
}

export const operationalAIAgents = new OperationalAIAgents();
