import { useEffect, useState } from 'react';
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Target,
  Lightbulb,
  AlertCircle,
  BarChart3,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import {
  getAIAssistantDashboard,
  AIAssistantDashboard as AIAssistantDashboardType,
  IntakeSuggestion,
  CapacityAlert,
  OpsInsight,
  RevenueRiskFlag
} from '../services/aiAssistantService';
import AIChatAssistant from './AIChatAssistant';

export default function AIAssistantDashboard() {
  const [dashboard, setDashboard] = useState<AIAssistantDashboardType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'intake' | 'capacity' | 'insights' | 'risks' | 'chat'>('overview');
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getAIAssistantDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load AI assistant dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p>Unable to load AI assistant</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          </div>
          <p className="text-gray-600 mt-1">Intelligent insights, recommendations, and alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowChatModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat with AI</span>
          </button>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <AIChatAssistant
              context={{
                dashboard_summary: dashboard.summary,
                active_alerts: dashboard.capacity_alerts.length + dashboard.revenue_risk_flags.length
              }}
              onClose={() => setShowChatModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-6 w-6" />
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">ALERTS</span>
          </div>
          <div className="text-3xl font-bold mb-1">{dashboard.summary.total_alerts}</div>
          <div className="text-red-100 text-sm">Active alerts requiring attention</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-6 w-6" />
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">CRITICAL</span>
          </div>
          <div className="text-3xl font-bold mb-1">{dashboard.summary.critical_items}</div>
          <div className="text-orange-100 text-sm">Critical items need immediate action</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-6 w-6" />
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">OPPORTUNITIES</span>
          </div>
          <div className="text-3xl font-bold mb-1">{dashboard.summary.actionable_opportunities}</div>
          <div className="text-green-100 text-sm">High-impact opportunities identified</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-6 w-6" />
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">RISK</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            ${(dashboard.summary.estimated_revenue_at_risk / 1000).toFixed(0)}K
          </div>
          <div className="text-blue-100 text-sm">Revenue at risk this month</div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'intake', label: `Intake (${dashboard.intake_suggestions.length})`, icon: Users },
            { key: 'capacity', label: `Capacity (${dashboard.capacity_alerts.length})`, icon: TrendingUp },
            { key: 'insights', label: `Insights (${dashboard.ops_insights.length})`, icon: Lightbulb },
            { key: 'risks', label: `Risks (${dashboard.revenue_risk_flags.length})`, icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab dashboard={dashboard} setActiveTab={setActiveTab} />}
      {activeTab === 'intake' && <IntakeTab suggestions={dashboard.intake_suggestions} />}
      {activeTab === 'capacity' && <CapacityTab alerts={dashboard.capacity_alerts} />}
      {activeTab === 'insights' && <InsightsTab insights={dashboard.ops_insights} />}
      {activeTab === 'risks' && <RisksTab flags={dashboard.revenue_risk_flags} />}
    </div>
  );
}

function OverviewTab({ dashboard, setActiveTab }: { dashboard: AIAssistantDashboard; setActiveTab: (tab: any) => void }) {
  return (
    <div className="space-y-6">
      {dashboard.summary.critical_items > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Critical Items Require Immediate Attention</h3>
              <p className="text-red-800 mb-4">
                {dashboard.summary.critical_items} critical alert{dashboard.summary.critical_items !== 1 ? 's' : ''} detected that could impact revenue, operations, or patient care.
              </p>
              <div className="flex flex-wrap gap-3">
                {dashboard.capacity_alerts.filter(a => a.severity === 'critical').length > 0 && (
                  <button
                    onClick={() => setActiveTab('capacity')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    View Capacity Alerts
                  </button>
                )}
                {dashboard.revenue_risk_flags.filter(r => r.severity === 'critical').length > 0 && (
                  <button
                    onClick={() => setActiveTab('risks')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    View Revenue Risks
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Top Intake Suggestions
            </h3>
            <button onClick={() => setActiveTab('intake')} className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.intake_suggestions.slice(0, 5).map(suggestion => (
              <div key={suggestion.id} className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{suggestion.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{suggestion.patient_name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    suggestion.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                    suggestion.urgency === 'same_day' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {suggestion.urgency.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Capacity Alerts
            </h3>
            <button onClick={() => setActiveTab('capacity')} className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.capacity_alerts.slice(0, 4).map(alert => (
              <div key={alert.id} className={`border-l-4 p-3 rounded-r ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'warning' ? 'border-orange-500 bg-orange-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{alert.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{alert.clinic_name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              Operational Insights
            </h3>
            <button onClick={() => setActiveTab('insights')} className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.ops_insights.slice(0, 3).map(insight => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm flex-1">{insight.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{insight.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Revenue Risk Flags
            </h3>
            <button onClick={() => setActiveTab('risks')} className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.revenue_risk_flags.slice(0, 3).map(flag => (
              <div key={flag.id} className={`border-l-4 p-3 rounded-r ${
                flag.severity === 'critical' ? 'border-red-500 bg-red-50' :
                flag.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm flex-1">{flag.title}</h4>
                  {flag.time_sensitive && (
                    <Clock className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600 mb-1">{flag.description}</div>
                <div className="text-xs font-semibold text-red-700">
                  Exposure: ${flag.financial_exposure.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntakeTab({ suggestions }: { suggestions: IntakeSuggestion[] }) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200';
      case 'same_day': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'next_day': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Brain className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">AI-Powered Intake Optimization</p>
            <p className="text-blue-800">
              These suggestions are generated by analyzing intake pipeline data, conversion patterns, and best practices.
              Acting on these recommendations can improve conversion rates by 20-40%.
            </p>
          </div>
        </div>
      </div>

      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getUrgencyColor(suggestion.urgency)}`}>
                  {suggestion.urgency.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">{suggestion.patient_name}</div>
              <div className="text-xs text-gray-500">Type: {suggestion.suggestion_type.replace('_', ' ')}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Impact</div>
              <div className={`text-sm font-bold ${getImpactColor(suggestion.impact_level)}`}>
                {suggestion.impact_level.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 mt-2">Confidence</div>
              <div className="text-sm font-semibold text-gray-900">{(suggestion.confidence_score * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-semibold text-gray-700 mb-2">Description</div>
              <p className="text-sm text-gray-900">{suggestion.description}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs font-semibold text-gray-700 mb-2">Why This Matters</div>
              <p className="text-sm text-gray-900">{suggestion.reasoning}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ArrowRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-blue-900 mb-1">Recommended Action</div>
                <p className="text-sm text-blue-900">{suggestion.recommended_action}</p>
              </div>
            </div>
          </div>

          {Object.keys(suggestion.data_points).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Data Points</div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                {Object.entries(suggestion.data_points).map(([key, value]) => (
                  value && (
                    <span key={key} className="bg-gray-100 px-2 py-1 rounded">
                      <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CapacityTab({ alerts }: { alerts: CapacityAlert[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-4">
      {alerts.map(alert => (
        <div key={alert.id} className={`bg-white rounded-lg border-l-4 p-6 ${getSeverityColor(alert.severity)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="h-6 w-6 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">{alert.clinic_name}</div>
            </div>
            {alert.estimated_revenue_impact && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Revenue Impact</div>
                <div className="text-lg font-bold text-red-600">
                  ${alert.estimated_revenue_impact.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <p className="text-gray-900 mb-4">{alert.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {alert.current_metrics.utilization_rate !== undefined && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Utilization Rate</div>
                <div className="text-xl font-bold text-gray-900">{alert.current_metrics.utilization_rate.toFixed(0)}%</div>
              </div>
            )}
            {alert.current_metrics.waitlist_count !== undefined && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Waitlist</div>
                <div className="text-xl font-bold text-gray-900">{alert.current_metrics.waitlist_count}</div>
              </div>
            )}
            {alert.current_metrics.available_hours !== undefined && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Available Hours</div>
                <div className="text-xl font-bold text-gray-900">{alert.current_metrics.available_hours.toFixed(0)}</div>
              </div>
            )}
            {alert.current_metrics.booked_hours !== undefined && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Booked Hours</div>
                <div className="text-xl font-bold text-gray-900">{alert.current_metrics.booked_hours.toFixed(0)}</div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-1">Threshold Violated</div>
            <p className="text-sm text-red-700">{alert.threshold_violated}</p>
          </div>

          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-1">Impact</div>
            <p className="text-sm text-gray-700">{alert.impact}</p>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions</div>
            <ul className="space-y-2">
              {alert.recommended_actions.map((action, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsTab({ insights }: { insights: OpsInsight[] }) {
  return (
    <div className="space-y-6">
      {insights.map(insight => (
        <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{insight.summary}</div>
              <div className="flex flex-wrap gap-2">
                {insight.affected_areas.map((area, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <div className={`text-sm font-semibold ${
                insight.confidence_level === 'high' ? 'text-green-600' :
                insight.confidence_level === 'medium' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {insight.confidence_level.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Detailed Analysis</div>
            <p className="text-sm text-gray-700">{insight.detailed_analysis}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Key Findings</div>
              <ul className="space-y-1">
                {insight.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-blue-600 flex-shrink-0">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Metrics</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-semibold text-gray-900">{insight.metrics.current_value.toFixed(1)}</span>
                </div>
                {insight.metrics.benchmark_value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Benchmark:</span>
                    <span className="font-semibold text-gray-900">{insight.metrics.benchmark_value.toFixed(1)}</span>
                  </div>
                )}
                {insight.metrics.variance_percentage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Variance:</span>
                    <span className={`font-semibold ${
                      insight.metrics.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {insight.metrics.variance_percentage > 0 ? '+' : ''}{insight.metrics.variance_percentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Actionable Recommendations</div>
            <div className="space-y-3">
              {insight.actionable_recommendations.map((rec, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{rec.recommendation}</p>
                    <div className="flex space-x-2 ml-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.effort === 'low' ? 'bg-green-100 text-green-800' :
                        rec.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rec.effort} effort
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.impact === 'high' ? 'bg-green-100 text-green-800' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.impact} impact
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">Timeline: {rec.timeline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RisksTab({ flags }: { flags: RevenueRiskFlag[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getIndicatorColor = (status: string) => {
    switch (status) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {flags.map(flag => (
        <div key={flag.id} className={`bg-white rounded-lg border-l-4 p-6 ${getSeverityColor(flag.severity)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">{flag.title}</h3>
                {flag.time_sensitive && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    TIME SENSITIVE
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">{flag.description}</div>
            </div>
            <div className="text-right ml-4">
              <div className="text-xs text-gray-500 mb-1">Financial Exposure</div>
              <div className="text-xl font-bold text-red-600">
                ${flag.financial_exposure.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">Annual Impact</div>
              <div className="text-sm font-semibold text-gray-700">
                ${flag.annualized_impact.toLocaleString()}
              </div>
            </div>
          </div>

          {flag.days_to_critical && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-red-900">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">
                  Becomes critical in {flag.days_to_critical} days if not addressed
                </span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Risk Indicators</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flag.risk_indicators.map((indicator, idx) => (
                <div key={idx} className={`border rounded-lg p-3 ${getIndicatorColor(indicator.status)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{indicator.indicator}</span>
                    <span className="text-xs font-bold">{indicator.status.toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-1">
                    Threshold: {indicator.threshold}
                  </div>
                  <div className="text-sm font-semibold">Current: {indicator.current_value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Root Causes</div>
              <ul className="space-y-1">
                {flag.root_causes.map((cause, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Mitigation Steps</div>
              <ul className="space-y-1">
                {flag.mitigation_steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Prevention</div>
              <ul className="space-y-1">
                {flag.prevention_strategies.map((strategy, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {(flag.affected_services || flag.affected_payers) && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-2">Affected Areas</div>
              <div className="flex flex-wrap gap-2">
                {flag.affected_services?.map((service, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Service: {service}
                  </span>
                ))}
                {flag.affected_payers?.map((payer, idx) => (
                  <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Payer: {payer}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
