import { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Flag,
  Zap,
} from 'lucide-react';
import {
  getStrategicPriorities,
  getObjectives,
  getActiveInitiatives,
  getClinicAlignments,
  calculateOKRMetrics,
  type StrategicPriority,
  type Objective,
  type Initiative,
  type ClinicAlignment,
} from '../../services/strategyOKRService';

export default function StrategyOKRView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'priorities' | 'objectives' | 'initiatives' | 'alignment'>('overview');

  const [priorities, setPriorities] = useState<StrategicPriority[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [alignments, setAlignments] = useState<ClinicAlignment[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [prioritiesData, objectivesData, initiativesData, alignmentsData, metricsData] = await Promise.all([
        getStrategicPriorities(),
        getObjectives(),
        getActiveInitiatives(),
        getClinicAlignments(),
        calculateOKRMetrics(),
      ]);

      setPriorities(prioritiesData);
      setObjectives(objectivesData);
      setInitiatives(initiativesData);
      setAlignments(alignmentsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading strategy OKR data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Strategy & OKRs...</p>
        </div>
      </div>
    );
  }

  const activePriorities = priorities.filter(p => ['active', 'on_track', 'at_risk'].includes(p.status));
  const activeObjectives = objectives.filter(o => o.status === 'active');
  const onTrackObjectives = activeObjectives.filter(o => o.confidence_level >= 7);
  const atRiskObjectives = activeObjectives.filter(o => o.confidence_level >= 4 && o.confidence_level < 7);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Strategy Deployment & OKRs</h2>
        <p className="text-sm text-gray-600 mt-1">
          Prevents execution drift through structured goal-setting
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Priorities</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.activePriorities}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.avgPriorityProgress.toFixed(0)}% complete</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Flag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Objectives</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.activeObjectives}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.onTrackObjectives} on track</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.avgConfidence.toFixed(1)}/10</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.atRiskObjectives} at risk</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Initiatives</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalInitiatives}</p>
                <p className="text-xs text-gray-500 mt-1">Driving results</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'priorities', label: 'Strategic Priorities', icon: Flag },
            { id: 'objectives', label: 'Objectives & KRs', icon: Target },
            { id: 'initiatives', label: 'Initiatives', icon: Zap },
            { id: 'alignment', label: 'Clinic Alignment', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Strategic Execution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total Priorities</span>
                    <span className="font-bold text-blue-900">{priorities.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Active Priorities</span>
                    <span className="font-bold text-blue-900">{activePriorities.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total Objectives</span>
                    <span className="font-bold text-blue-900">{objectives.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Active Initiatives</span>
                    <span className="font-bold text-blue-900">{initiatives.length}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-3">Objective Health</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">On Track</span>
                    <span className="font-bold text-green-900">{onTrackObjectives.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">At Risk</span>
                    <span className="font-bold text-amber-700">{atRiskObjectives.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Average Confidence</span>
                    <span className="font-bold text-green-900">{metrics?.avgConfidence.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Clinic Alignments</span>
                    <span className="font-bold text-green-900">{alignments.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {activePriorities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Strategic Priorities (FY {new Date().getFullYear()})</h3>
                <div className="space-y-3">
                  {activePriorities.slice(0, 5).map((priority) => (
                    <div key={priority.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{priority.title}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              priority.priority_level === 'p0_critical' ? 'bg-red-100 text-red-800' :
                              priority.priority_level === 'p1_high' ? 'bg-orange-100 text-orange-800' :
                              priority.priority_level === 'p2_medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {priority.priority_level.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              priority.status === 'on_track' ? 'bg-green-100 text-green-800' :
                              priority.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                              priority.status === 'behind' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {priority.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{priority.description}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{priority.percent_complete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              priority.status === 'on_track' ? 'bg-green-600' :
                              priority.status === 'at_risk' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${priority.percent_complete}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">{priority.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">FY</p>
                          <p className="font-semibold text-gray-900">{priority.fiscal_year}</p>
                        </div>
                        {priority.target_completion_date && (
                          <div>
                            <p className="text-gray-600">Target Date</p>
                            <p className="font-semibold text-gray-900">{new Date(priority.target_completion_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'priorities' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Priorities</h3>
              <p className="text-sm text-gray-600">Annual strategic priorities with progress tracking</p>
            </div>

            <div className="space-y-4">
              {priorities.map((priority) => (
                <div key={priority.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{priority.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          priority.priority_level === 'p0_critical' ? 'bg-red-100 text-red-800' :
                          priority.priority_level === 'p1_high' ? 'bg-orange-100 text-orange-800' :
                          priority.priority_level === 'p2_medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {priority.priority_level.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          priority.status === 'completed' ? 'bg-green-100 text-green-800' :
                          priority.status === 'on_track' ? 'bg-blue-100 text-blue-800' :
                          priority.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                          priority.status === 'behind' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {priority.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{priority.description}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{priority.percent_complete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${priority.percent_complete}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Priority #</p>
                          <p className="font-semibold text-gray-900">{priority.priority_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">{priority.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fiscal Year</p>
                          <p className="font-semibold text-gray-900">{priority.fiscal_year}</p>
                        </div>
                        {priority.target_completion_date && (
                          <div>
                            <p className="text-gray-600">Target Completion</p>
                            <p className="font-semibold text-gray-900">{new Date(priority.target_completion_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {priorities.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No strategic priorities defined</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Objectives & Key Results</h3>
              <p className="text-sm text-gray-600">Quarterly OKRs with confidence tracking</p>
            </div>

            <div className="space-y-4">
              {objectives.map((objective) => (
                <div key={objective.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{objective.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          objective.status === 'completed' ? 'bg-green-100 text-green-800' :
                          objective.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {objective.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{objective.description}</p>

                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full mx-0.5 ${
                                  i < objective.confidence_level
                                    ? objective.confidence_level >= 7 ? 'bg-green-500' :
                                      objective.confidence_level >= 4 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            Confidence: {objective.confidence_level}/10
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Objective #</p>
                          <p className="font-semibold text-gray-900">{objective.objective_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">{objective.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Period</p>
                          <p className="font-semibold text-gray-900">FY{objective.fiscal_year} Q{objective.fiscal_quarter}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-semibold text-gray-900">{new Date(objective.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {objectives.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No objectives defined</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'initiatives' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Initiatives</h3>
              <p className="text-sm text-gray-600">Projects and actions driving objective achievement</p>
            </div>

            <div className="space-y-4">
              {initiatives.map((initiative) => (
                <div key={initiative.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{initiative.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          initiative.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          initiative.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          initiative.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {initiative.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          initiative.status === 'completed' ? 'bg-green-100 text-green-800' :
                          initiative.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          initiative.status === 'blocked' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {initiative.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {initiative.description && (
                        <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                      )}

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{initiative.percent_complete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${initiative.percent_complete}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Initiative #</p>
                          <p className="font-semibold text-gray-900">{initiative.initiative_number}</p>
                        </div>
                        {initiative.effort_estimate && (
                          <div>
                            <p className="text-gray-600">Effort</p>
                            <p className="font-semibold text-gray-900">{initiative.effort_estimate}</p>
                          </div>
                        )}
                        {initiative.due_date && (
                          <div>
                            <p className="text-gray-600">Due Date</p>
                            <p className="font-semibold text-gray-900">{new Date(initiative.due_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {initiative.blockers && initiative.blockers.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs font-semibold text-red-900 mb-1">Blockers:</p>
                          <ul className="text-xs text-red-800 list-disc list-inside">
                            {initiative.blockers.map((blocker, idx) => (
                              <li key={idx}>{blocker}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {initiatives.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active initiatives</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alignment' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinic Alignment</h3>
              <p className="text-sm text-gray-600">How clinic objectives align with enterprise strategy</p>
            </div>

            <div className="space-y-4">
              {alignments.map((alignment) => (
                <div key={alignment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">FY{alignment.fiscal_year} Q{alignment.fiscal_quarter}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          alignment.alignment_strength === 'strong' ? 'bg-green-100 text-green-800' :
                          alignment.alignment_strength === 'moderate' ? 'bg-blue-100 text-blue-800' :
                          alignment.alignment_strength === 'weak' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alignment.alignment_strength.toUpperCase()}
                        </span>
                      </div>

                      {alignment.contribution_description && (
                        <p className="text-sm text-gray-600 mb-3">{alignment.contribution_description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Local Initiatives</p>
                          <p className="font-semibold text-gray-900">{alignment.local_initiatives_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Alignment Strength</p>
                          <p className="font-semibold text-gray-900">{alignment.alignment_strength}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {alignments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No clinic alignments tracked</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
