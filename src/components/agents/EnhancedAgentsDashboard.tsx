import { useState, useEffect } from 'react';
import { Brain, Bot, Play, Pause, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, Clock, Zap, Target, TrendingUp, Users, DollarSign, TriangleAlert as AlertTriangle, Calendar, FileText, Activity, Settings, History, ChevronRight, ChartBar as BarChart2, Shield, Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { operationalAIAgents, AgentAnalysis } from '../../services/operationalAIAgents';

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: 'operations' | 'clinical' | 'financial' | 'growth' | 'compliance';
  icon: typeof Brain;
  color: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  nextRun?: string;
  schedule?: string;
  metrics: {
    runs_today: number;
    avg_execution_time: number;
    success_rate: number;
    insights_generated: number;
  };
  action: () => Promise<AgentAnalysis>;
}

interface AgentExecution {
  id: string;
  agent_name: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  insights_count: number;
  execution_time_ms?: number;
  error_message?: string;
}

const AGENT_CONFIGS: Omit<AgentConfig, 'status' | 'lastRun' | 'nextRun' | 'metrics'>[] = [
  {
    id: 'intake-routing',
    name: 'Intake Routing Agent',
    description: 'Analyzes patient intake patterns and optimizes routing decisions',
    category: 'operations',
    icon: Users,
    color: 'blue',
    schedule: 'Every 30 minutes',
    action: () => operationalAIAgents.analyzeIntakeRouting()
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning Agent',
    description: 'Predicts staffing needs and identifies capacity gaps',
    category: 'operations',
    icon: TrendingUp,
    color: 'green',
    schedule: 'Every hour',
    action: () => operationalAIAgents.analyzeCapacity()
  },
  {
    id: 'revenue-cycle',
    name: 'Revenue Cycle Agent',
    description: 'Detects claim delays, denials, and revenue optimization opportunities',
    category: 'financial',
    icon: DollarSign,
    color: 'emerald',
    schedule: 'Every 2 hours',
    action: () => operationalAIAgents.analyzeRevenueCycle()
  },
  {
    id: 'bottleneck-detection',
    name: 'Bottleneck Detection Agent',
    description: 'Identifies operational inefficiencies across workflows',
    category: 'operations',
    icon: AlertTriangle,
    color: 'orange',
    schedule: 'Every 15 minutes',
    action: () => operationalAIAgents.detectOperationalBottlenecks()
  },
  {
    id: 'credential-monitor',
    name: 'Credential Monitor Agent',
    description: 'Tracks credential expirations and compliance requirements',
    category: 'compliance',
    icon: Shield,
    color: 'red',
    schedule: 'Daily at 6:00 AM',
    action: async () => ({
      agent_name: 'Credential Monitor',
      execution_time_ms: 1250,
      summary: 'Analyzed 47 staff credentials. Found 3 expiring within 30 days, 1 expired. Compliance rate: 97.8%',
      insights: [
        { insight: 'Dr. Smith\'s PT license expires in 12 days', recommendation: 'Send renewal reminder immediately', priority: 'high', confidence: 0.98, data_source: 'credentials_table', timestamp: new Date().toISOString() },
        { insight: 'Lisa Chen\'s CPR certification expired 3 days ago', recommendation: 'Schedule recertification training', priority: 'critical', confidence: 1.0, data_source: 'credentials_table', timestamp: new Date().toISOString() }
      ],
      metrics: { total_credentials: 47, expiring_soon: 3, expired: 1, compliance_rate: 97.8 }
    })
  },
  {
    id: 'appointment-optimizer',
    name: 'Appointment Optimizer Agent',
    description: 'Optimizes scheduling for better utilization and patient experience',
    category: 'operations',
    icon: Calendar,
    color: 'cyan',
    schedule: 'Every hour',
    action: async () => ({
      agent_name: 'Appointment Optimizer',
      execution_time_ms: 890,
      summary: 'Analyzed 156 appointments across 4 clinics. Found 23 optimization opportunities with potential 12% utilization improvement.',
      insights: [
        { insight: 'South Commons has 3 consecutive no-show slots on Tuesday afternoons', recommendation: 'Implement overbooking strategy for these slots', priority: 'medium', confidence: 0.87, data_source: 'appointments_table', timestamp: new Date().toISOString() },
        { insight: 'Dr. Johnson consistently runs 15 min behind schedule', recommendation: 'Adjust appointment durations or add buffer time', priority: 'medium', confidence: 0.92, data_source: 'appointments_table', timestamp: new Date().toISOString() }
      ],
      metrics: { appointments_analyzed: 156, optimization_opportunities: 23, potential_improvement: 12 }
    })
  },
  {
    id: 'clinical-quality',
    name: 'Clinical Quality Agent',
    description: 'Monitors treatment outcomes and identifies quality improvement opportunities',
    category: 'clinical',
    icon: Activity,
    color: 'pink',
    schedule: 'Daily at 8:00 AM',
    action: async () => ({
      agent_name: 'Clinical Quality Agent',
      execution_time_ms: 2100,
      summary: 'Reviewed 89 active treatment plans. Average outcome score: 82.4%. Identified 7 cases requiring clinical review.',
      insights: [
        { insight: 'Chronic pain patients show 23% better outcomes with combined PT+massage protocol', recommendation: 'Consider expanding combined treatment protocols', priority: 'low', confidence: 0.76, data_source: 'treatment_outcomes', timestamp: new Date().toISOString() },
        { insight: 'Patient #4521 showing minimal progress after 8 visits', recommendation: 'Schedule case conference with treating clinician', priority: 'high', confidence: 0.88, data_source: 'patient_progress', timestamp: new Date().toISOString() }
      ],
      metrics: { plans_reviewed: 89, avg_outcome_score: 82.4, cases_flagged: 7, improvement_rate: 78 }
    })
  },
  {
    id: 'growth-insights',
    name: 'Growth Insights Agent',
    description: 'Analyzes market trends and identifies growth opportunities',
    category: 'growth',
    icon: Lightbulb,
    color: 'yellow',
    schedule: 'Weekly on Monday',
    action: async () => ({
      agent_name: 'Growth Insights Agent',
      execution_time_ms: 3400,
      summary: 'Analyzed market data and referral patterns. Identified 3 high-potential growth areas and 2 underperforming campaigns.',
      insights: [
        { insight: 'Employer wellness program inquiries up 45% this quarter', recommendation: 'Increase B2B marketing investment for corporate wellness', priority: 'high', confidence: 0.84, data_source: 'lead_analytics', timestamp: new Date().toISOString() },
        { insight: 'Google Ads campaign "back-pain-relief" has 0.8% conversion vs 2.1% benchmark', recommendation: 'Pause campaign and review landing page', priority: 'medium', confidence: 0.91, data_source: 'campaign_analytics', timestamp: new Date().toISOString() }
      ],
      metrics: { leads_analyzed: 234, conversion_rate: 4.2, growth_opportunities: 3, underperforming_campaigns: 2 }
    })
  }
];

export default function EnhancedAgentsDashboard() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<AgentExecution[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    initializeAgents();
    loadRecentExecutions();
  }, []);

  const initializeAgents = () => {
    const initializedAgents: AgentConfig[] = AGENT_CONFIGS.map(config => ({
      ...config,
      status: 'active' as const,
      lastRun: getRandomPastTime(),
      nextRun: getRandomFutureTime(),
      metrics: {
        runs_today: Math.floor(Math.random() * 20) + 5,
        avg_execution_time: Math.floor(Math.random() * 2000) + 500,
        success_rate: 95 + Math.random() * 5,
        insights_generated: Math.floor(Math.random() * 50) + 10
      }
    }));
    setAgents(initializedAgents);
  };

  const getRandomPastTime = (): string => {
    const minutes = Math.floor(Math.random() * 60) + 5;
    const date = new Date(Date.now() - minutes * 60 * 1000);
    return date.toISOString();
  };

  const getRandomFutureTime = (): string => {
    const minutes = Math.floor(Math.random() * 30) + 5;
    const date = new Date(Date.now() + minutes * 60 * 1000);
    return date.toISOString();
  };

  const loadRecentExecutions = async () => {
    const mockExecutions: AgentExecution[] = [
      { id: '1', agent_name: 'Intake Routing Agent', started_at: new Date(Date.now() - 5 * 60000).toISOString(), completed_at: new Date(Date.now() - 4 * 60000).toISOString(), status: 'completed', insights_count: 3, execution_time_ms: 1240 },
      { id: '2', agent_name: 'Capacity Planning Agent', started_at: new Date(Date.now() - 15 * 60000).toISOString(), completed_at: new Date(Date.now() - 14 * 60000).toISOString(), status: 'completed', insights_count: 5, execution_time_ms: 2100 },
      { id: '3', agent_name: 'Revenue Cycle Agent', started_at: new Date(Date.now() - 30 * 60000).toISOString(), completed_at: new Date(Date.now() - 28 * 60000).toISOString(), status: 'completed', insights_count: 2, execution_time_ms: 890 },
      { id: '4', agent_name: 'Bottleneck Detection Agent', started_at: new Date(Date.now() - 45 * 60000).toISOString(), status: 'failed', insights_count: 0, error_message: 'Timeout connecting to analytics service' },
      { id: '5', agent_name: 'Clinical Quality Agent', started_at: new Date(Date.now() - 60 * 60000).toISOString(), completed_at: new Date(Date.now() - 58 * 60000).toISOString(), status: 'completed', insights_count: 7, execution_time_ms: 3400 }
    ];
    setRecentExecutions(mockExecutions);
  };

  const runAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || runningAgents.has(agentId)) return;

    setRunningAgents(prev => new Set([...prev, agentId]));
    setSelectedAgent(agentId);
    setAnalysis(null);

    try {
      const result = await agent.action();
      setAnalysis(result);

      setAgents(prev => prev.map(a =>
        a.id === agentId
          ? {
              ...a,
              lastRun: new Date().toISOString(),
              metrics: {
                ...a.metrics,
                runs_today: a.metrics.runs_today + 1,
                insights_generated: a.metrics.insights_generated + result.insights.length
              }
            }
          : a
      ));

      const newExecution: AgentExecution = {
        id: Date.now().toString(),
        agent_name: agent.name,
        started_at: new Date(Date.now() - result.execution_time_ms).toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        insights_count: result.insights.length,
        execution_time_ms: result.execution_time_ms
      };
      setRecentExecutions(prev => [newExecution, ...prev.slice(0, 9)]);

    } catch (error: any) {
      console.error('Agent execution failed:', error);
      const failedExecution: AgentExecution = {
        id: Date.now().toString(),
        agent_name: agent.name,
        started_at: new Date().toISOString(),
        status: 'failed',
        insights_count: 0,
        error_message: error.message
      };
      setRecentExecutions(prev => [failedExecution, ...prev.slice(0, 9)]);
    } finally {
      setRunningAgents(prev => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
    }
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; light: string }> = {
      blue: { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-50' },
      green: { bg: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-50' },
      emerald: { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-50' },
      orange: { bg: 'bg-orange-600', border: 'border-orange-200', text: 'text-orange-600', light: 'bg-orange-50' },
      red: { bg: 'bg-red-600', border: 'border-red-200', text: 'text-red-600', light: 'bg-red-50' },
      cyan: { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-600', light: 'bg-cyan-50' },
      pink: { bg: 'bg-pink-600', border: 'border-pink-200', text: 'text-pink-600', light: 'bg-pink-50' },
      yellow: { bg: 'bg-yellow-600', border: 'border-yellow-200', text: 'text-yellow-600', light: 'bg-yellow-50' }
    };
    return colors[color] || colors.blue;
  };

  const formatTime = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredAgents = filterCategory === 'all'
    ? agents
    : agents.filter(a => a.category === filterCategory);

  const totalInsightsToday = agents.reduce((sum, a) => sum + a.metrics.insights_generated, 0);
  const totalRunsToday = agents.reduce((sum, a) => sum + a.metrics.runs_today, 0);
  const avgSuccessRate = agents.reduce((sum, a) => sum + a.metrics.success_rate, 0) / agents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-sm text-gray-600">Autonomous operational intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="operations">Operations</option>
            <option value="clinical">Clinical</option>
            <option value="financial">Financial</option>
            <option value="growth">Growth</option>
            <option value="compliance">Compliance</option>
          </select>
          <button
            onClick={() => agents.forEach(a => a.status === 'active' && runAgent(a.id))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Run All Active</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Active Agents</div>
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {agents.filter(a => a.status === 'active').length}/{agents.length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Runs Today</div>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalRunsToday}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Insights Generated</div>
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalInsightsToday}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Success Rate</div>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{avgSuccessRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900 text-sm">AI Governance Mode: Assistive Only</h3>
          <p className="text-blue-800 text-sm mt-1">
            These agents analyze data and generate recommendations. They do not take autonomous actions.
            All insights require human review before implementation. Executions are logged to the audit trail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Agent Fleet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgents.map(agent => {
              const Icon = agent.icon;
              const colors = getColorClasses(agent.color);
              const isRunning = runningAgents.has(agent.id);
              const isSelected = selectedAgent === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`bg-white border-2 rounded-lg p-4 transition-all ${
                    isSelected ? `${colors.border} ring-2 ring-offset-1 ring-blue-400` : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${colors.light}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          agent.status === 'active' ? 'bg-green-100 text-green-700' :
                          agent.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleAgentStatus(agent.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title={agent.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => runAgent(agent.id)}
                        disabled={isRunning || agent.status !== 'active'}
                        className={`p-1.5 rounded ${
                          isRunning ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Run Now"
                      >
                        {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{agent.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-500">Runs Today</div>
                      <div className="font-semibold text-gray-900">{agent.metrics.runs_today}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-gray-500">Insights</div>
                      <div className="font-semibold text-gray-900">{agent.metrics.insights_generated}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {agent.lastRun ? formatTime(agent.lastRun) : 'Never'}
                    </span>
                    <span>{agent.schedule}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {recentExecutions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent executions</p>
              </div>
            ) : (
              recentExecutions.map(exec => (
                <div key={exec.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {exec.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : exec.status === 'running' ? (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm text-gray-900">{exec.agent_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(exec.started_at)}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                    {exec.status === 'completed' && (
                      <>
                        <span>{exec.insights_count} insights</span>
                        <span>{exec.execution_time_ms}ms</span>
                      </>
                    )}
                    {exec.status === 'failed' && (
                      <span className="text-red-600">{exec.error_message}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{analysis.agent_name}</h3>
                <p className="text-sm text-gray-500">Completed in {analysis.execution_time_ms}ms</p>
              </div>
            </div>
            <button
              onClick={() => setAnalysis(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Brain className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">AI Summary</h4>
                <p className="text-sm text-blue-800">{analysis.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(analysis.metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            ))}
          </div>

          <h4 className="font-semibold text-gray-900 mb-3">
            Key Insights ({analysis.insights.length})
          </h4>

          {analysis.insights.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No critical insights detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    insight.priority === 'critical' ? 'border-red-200 bg-red-50' :
                    insight.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                    insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      insight.priority === 'critical' ? 'bg-red-200 text-red-800' :
                      insight.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                      insight.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {insight.priority}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-2">{insight.insight}</p>
                  <div className="bg-white bg-opacity-60 rounded p-2">
                    <span className="text-xs font-medium text-gray-700">Recommendation: </span>
                    <span className="text-xs text-gray-800">{insight.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
