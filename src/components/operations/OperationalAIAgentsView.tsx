import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Play,
  CheckCircle,
  Clock,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { operationalAIAgents, AgentAnalysis } from '../../services/operationalAIAgents';

type AgentType = 'intake' | 'capacity' | 'revenue' | 'bottleneck';

export default function OperationalAIAgentsView() {
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agents = [
    {
      id: 'intake' as AgentType,
      name: 'Intake Routing Agent',
      description: 'Optimize patient intake and routing decisions',
      icon: Users,
      color: 'blue',
      action: () => operationalAIAgents.analyzeIntakeRouting()
    },
    {
      id: 'capacity' as AgentType,
      name: 'Capacity Planning Agent',
      description: 'Predict staffing needs and capacity gaps',
      icon: TrendingUp,
      color: 'green',
      action: () => operationalAIAgents.analyzeCapacity()
    },
    {
      id: 'revenue' as AgentType,
      name: 'Revenue Cycle Agent',
      description: 'Detect claim delays and revenue risks',
      icon: DollarSign,
      color: 'purple',
      action: () => operationalAIAgents.analyzeRevenueCycle()
    },
    {
      id: 'bottleneck' as AgentType,
      name: 'Bottleneck Detection Agent',
      description: 'Identify operational inefficiencies',
      icon: AlertTriangle,
      color: 'orange',
      action: () => operationalAIAgents.detectOperationalBottlenecks()
    }
  ];

  async function runAgent(agent: typeof agents[0]) {
    try {
      setLoading(true);
      setError(null);
      setActiveAgent(agent.id);
      setAnalysis(null);

      const result = await agent.action();
      setAnalysis(result);
    } catch (err: any) {
      console.error('Agent execution error:', err);
      setError(err.message || 'Failed to execute agent');
    } finally {
      setLoading(false);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getAgentColor(color: string) {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
    };
    return colors[color] || colors.blue;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Operational AI Agents</h2>
        <p className="text-gray-600 mt-1">AI-powered insights for operational decision support</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Brain className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900 text-sm">Assistive AI Only</h3>
          <p className="text-blue-800 text-sm mt-1">
            These agents analyze operational data and provide recommendations. They do not take
            autonomous actions. All insights are logged to the audit trail and require human review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;

          return (
            <button
              key={agent.id}
              onClick={() => runAgent(agent)}
              disabled={loading}
              className={`text-left border-2 rounded-lg p-6 transition-all ${
                getAgentColor(agent.color)
              } ${isActive ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${
                loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${agent.color === 'blue' ? 'bg-blue-100' :
                    agent.color === 'green' ? 'bg-green-100' :
                    agent.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                  </div>
                </div>
                {loading && isActive ? (
                  <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0" />
                ) : (
                  <Play className="h-5 w-5 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 text-sm">Agent Execution Failed</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Running AI analysis...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{analysis.agent_name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>Completed in {analysis.execution_time_ms}ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Brain className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">AI Analysis Summary</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{analysis.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(analysis.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
              <span className="text-sm text-gray-500">
                {analysis.insights.length} insight{analysis.insights.length !== 1 ? 's' : ''}
              </span>
            </div>

            {analysis.insights.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No critical insights detected</p>
                <p className="text-sm text-gray-400 mt-1">All metrics are within normal ranges</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">{insight.priority} Priority</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Target className="h-3 w-3" />
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{insight.insight}</h4>

                    <div className="bg-white bg-opacity-50 rounded p-3 mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendation:</p>
                      <p className="text-sm text-gray-800">{insight.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Source: {insight.data_source}</span>
                      <span>{new Date(insight.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900 text-sm">Action Required</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  These insights are recommendations only. Review each suggestion carefully and
                  validate with your operational team before implementing changes. All agent
                  executions are logged in the audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
