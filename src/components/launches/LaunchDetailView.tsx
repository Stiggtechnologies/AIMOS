import React, { useState, useEffect } from 'react';
import { ArrowLeft, Rocket, CircleCheck as CheckCircle2, Circle, TriangleAlert as AlertTriangle, Calendar, Target, DollarSign, TrendingUp, Users, ListChecks, FileText, ChartBar as BarChart3, Clock, Play, Check, X, ChevronDown, ChevronRight, Flag, Award, Activity } from 'lucide-react';
import { launchService, type ClinicLaunch } from '../../services/launchService';

interface LaunchDetailViewProps {
  launchId: string;
  onBack: () => void;
}

type TabType = 'overview' | 'wbs' | 'tasks' | 'timeline' | 'deliverables' | 'metrics';

export default function LaunchDetailView({ launchId, onBack }: LaunchDetailViewProps) {
  const [launch, setLaunch] = useState<ClinicLaunch | null>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLaunchData();
  }, [launchId]);

  const loadLaunchData = async () => {
    try {
      setLoading(true);
      const [launchData, phasesData, workstreamsData, tasksData, weeksData] = await Promise.all([
        launchService.getLaunch(launchId),
        launchService.getPhases(launchId),
        launchService.getWorkstreams(launchId),
        launchService.getTasks(launchId),
        launchService.getWeeks(launchId)
      ]);

      setLaunch(launchData);
      setPhases(phasesData);
      setWorkstreams(workstreamsData);
      setTasks(tasksData);
      setWeeks(weeksData);

      // Load deliverables for each week
      const allDeliverables: any[] = [];
      for (const week of weeksData) {
        const weekDeliverables = await launchService.getDeliverables(launchId, week.id);
        allDeliverables.push(...weekDeliverables);
      }
      setDeliverables(allDeliverables);

      // Load metrics
      const metricsData = await launchService.getAllMetrics(launchId);
      setMetrics(metricsData);

    } catch (error) {
      console.error('Failed to load launch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await launchService.updateTask(taskId, { status: 'in_progress' });
      await loadLaunchData();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await launchService.updateTask(taskId, {
        status: 'completed',
        completion_pct: 100,
        completed_at: new Date().toISOString()
      });
      await loadLaunchData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleCompleteDeliverable = async (deliverableId: string) => {
    try {
      await launchService.updateDeliverable(deliverableId, {
        status: 'completed'
      });
      await loadLaunchData();
    } catch (error) {
      console.error('Failed to complete deliverable:', error);
    }
  };

  const togglePhaseExpand = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleWorkstreamExpand = (workstreamId: string) => {
    const newExpanded = new Set(expandedWorkstreams);
    if (newExpanded.has(workstreamId)) {
      newExpanded.delete(workstreamId);
    } else {
      newExpanded.add(workstreamId);
    }
    setExpandedWorkstreams(newExpanded);
  };

  const getPhaseColor = (phaseName: string) => {
    if (phaseName.includes('phase_0')) return 'blue';
    if (phaseName.includes('phase_1')) return 'green';
    if (phaseName.includes('phase_2')) return 'orange';
    if (phaseName.includes('phase_3')) return 'red';
    if (phaseName.includes('phase_4')) return 'purple';
    if (phaseName.includes('phase_5')) return 'pink';
    return 'gray';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'in_progress') return <Play className="w-5 h-5 text-blue-600" />;
    if (status === 'blocked') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!launch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Launch not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentDay = launch.actual_start_date
    ? Math.floor((new Date().getTime() - new Date(launch.actual_start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Rocket },
    { id: 'wbs', label: 'Work Breakdown', icon: ListChecks },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'deliverables', label: 'Deliverables', icon: FileText },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{launch.launch_name}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded ${
              launch.status === 'completed' ? 'bg-green-100 text-green-800' :
              launch.status === 'at_risk' ? 'bg-red-100 text-red-800' :
              launch.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {launch.status.replace('_', ' ').toUpperCase()}
            </span>
            {launch.is_partner_clinic && (
              <span className="px-3 py-1 text-sm font-medium rounded bg-purple-100 text-purple-800">
                PARTNER CLINIC
              </span>
            )}
          </div>
          <p className="text-gray-600">{launch.launch_code}</p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Current Phase</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {launch.current_phase.replace('phase_', 'Phase ').replace('_', ' ')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Day</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {currentDay} / 90
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Progress</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {launch.overall_completion_pct.toFixed(0)}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <ListChecks className="w-4 h-4" />
            <span className="text-sm">Tasks Complete</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Flag className="w-4 h-4" />
            <span className="text-sm">Gates Passed</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {phases.filter(p => p.gate_passed).length} / {phases.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Charter */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Charter</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-600">Launch Owner</dt>
                      <dd className="text-sm font-medium text-gray-900">{launch.launch_owner_role || 'Not Assigned'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Target Open Date</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(launch.target_open_date).toLocaleDateString()}
                      </dd>
                    </div>
                    {launch.actual_start_date && (
                      <div>
                        <dt className="text-sm text-gray-600">Actual Start Date</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(launch.actual_start_date).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {launch.approved_budget && (
                      <div>
                        <dt className="text-sm text-gray-600">Approved Budget</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          ${(launch.approved_budget / 1000).toFixed(0)}K
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-600">Launch Plan Type</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {launch.launch_plan_type?.replace('_', ' ').toUpperCase()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Phase Summary */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Status</h3>
                  <div className="space-y-3">
                    {phases.map((phase) => (
                      <div key={phase.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(phase.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {phase.phase_name.replace('phase_', 'Phase ').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{phase.completion_pct.toFixed(0)}%</span>
                          {phase.gate_passed && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workstreams Overview */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workstreams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workstreams.map((ws) => (
                    <div key={ws.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{ws.workstream_name}</h4>
                        <span className="text-sm text-gray-600">{ws.completion_pct.toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ws.description}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">
                          Owner: {ws.owner_role}
                        </span>
                        <span className="text-gray-600">
                          {ws.completed_tasks}/{ws.total_tasks} tasks
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${ws.completion_pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Work Breakdown Structure Tab */}
          {activeTab === 'wbs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Work Breakdown Structure</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedPhases(new Set(phases.map(p => p.id)))}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedPhases(new Set())}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {phases.map((phase) => {
                const phaseTasks = tasks.filter(t => t.phase_name === phase.phase_name);
                const phaseWorkstreams = workstreams.filter(ws =>
                  phaseTasks.some(t => t.workstream_id === ws.id)
                );
                const isExpanded = expandedPhases.has(phase.id);
                const color = getPhaseColor(phase.phase_name);

                return (
                  <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => togglePhaseExpand(phase.id)}
                      className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        {getStatusIcon(phase.status)}
                        <span className="font-semibold text-gray-900">
                          {phase.phase_name.replace('phase_', 'Phase ').replace(/_/g, ' ')}
                        </span>
                        {phase.gate_passed && (
                          <Award className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {phaseTasks.filter(t => t.status === 'completed').length}/{phaseTasks.length} tasks
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {phase.completion_pct.toFixed(0)}%
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {phaseWorkstreams.map((ws) => {
                          const wsTasks = phaseTasks.filter(t => t.workstream_id === ws.id);
                          const isWSExpanded = expandedWorkstreams.has(ws.id);

                          return (
                            <div key={ws.id} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => toggleWorkstreamExpand(ws.id)}
                                className="w-full bg-white px-4 py-2 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  {isWSExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  <Users className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {ws.workstream_name}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">
                                  {wsTasks.filter(t => t.status === 'completed').length}/{wsTasks.length}
                                </span>
                              </button>

                              {isWSExpanded && wsTasks.length > 0 && (
                                <div className="border-t border-gray-200">
                                  {wsTasks.map((task) => (
                                    <div key={task.id} className="px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          {getStatusIcon(task.status)}
                                          <span className="text-sm text-gray-900">{task.task_name}</span>
                                          {task.is_gate_blocker && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                              GATE BLOCKER
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Tasks ({tasks.length})</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Phases</option>
                    {phases.map(p => (
                      <option key={p.id} value={p.phase_name}>
                        {p.phase_name.replace('phase_', 'Phase ').replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                            {task.is_required && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                REQUIRED
                              </span>
                            )}
                            {task.is_gate_blocker && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                GATE BLOCKER
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Phase: {task.phase_name?.replace('phase_', '').replace(/_/g, ' ')}</span>
                            <span>Owner: {task.assigned_role}</span>
                            {task.due_date && (
                              <span className={new Date(task.due_date) < new Date() ? 'text-red-600 font-medium' : ''}>
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 relative z-10">
                        {task.status === 'not_started' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleStartTask(task.id);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            Start
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCompleteTask(task.id);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-sm font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                    {task.completion_pct > 0 && task.status !== 'completed' && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${task.completion_pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Launch Timeline</h3>

              {/* Phases Timeline */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Phases</h4>
                {phases.map((phase, index) => {
                  const startDate = phase.planned_start_date ? new Date(phase.planned_start_date) : null;
                  const endDate = phase.planned_end_date ? new Date(phase.planned_end_date) : null;

                  return (
                    <div key={phase.id} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-sm text-gray-600">
                          {phase.phase_name.replace('phase_', 'Phase ').replace(/_/g, ' ')}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-full h-8 relative">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                phase.gate_passed ? 'bg-green-500' :
                                phase.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}
                              style={{ width: `${phase.completion_pct}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {phase.completion_pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          {startDate && endDate && (
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{startDate.toLocaleDateString()}</span>
                              <span>{endDate.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-24 text-right">
                          {phase.gate_passed ? (
                            <span className="text-sm text-green-600 font-medium flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Passed
                            </span>
                          ) : phase.status === 'in_progress' ? (
                            <span className="text-sm text-blue-600 font-medium">In Progress</span>
                          ) : (
                            <span className="text-sm text-gray-500">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weeks Timeline */}
              <div className="space-y-3 mt-8">
                <h4 className="font-medium text-gray-700">Key Weeks</h4>
                {weeks.map((week) => (
                  <div key={week.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{week.week_label}</span>
                        {week.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        Day {week.start_day_number} - {week.end_day_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{week.objectives}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverables Tab */}
          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Launch Deliverables ({deliverables.length})</h3>
              <div className="space-y-2">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(deliverable.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{deliverable.deliverable_name}</h4>
                            {deliverable.is_critical && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                CRITICAL
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{deliverable.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Due: Day {deliverable.due_day}</span>
                            {deliverable.owner_role && <span>Owner: {deliverable.owner_role}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 relative z-10">
                        {deliverable.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleCompleteDeliverable(deliverable.id);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        {deliverable.status === 'completed' && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-sm font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Daily Metrics Tracking</h3>
              {metrics.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No metrics logged yet</p>
                  <p className="text-sm mt-1">Start tracking daily metrics once the launch begins</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.slice(0, 10).map((metric) => (
                    <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Day {metric.day_number} - {new Date(metric.metric_date).toLocaleDateString()}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Patients Today</p>
                          <p className="text-lg font-bold text-gray-900">{metric.patients_treated_today}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Cumulative</p>
                          <p className="text-lg font-bold text-gray-900">{metric.cumulative_patients}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Utilization</p>
                          <p className="text-lg font-bold text-gray-900">{metric.clinician_utilization_pct?.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Data Completeness</p>
                          <p className="text-lg font-bold text-gray-900">{metric.data_completeness_pct?.toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
