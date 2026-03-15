import { useState, useEffect } from 'react';
import {
  ArrowLeft, Rocket, CircleCheck as CheckCircle2, Circle,
  TriangleAlert as AlertTriangle, Calendar, Target, TrendingUp,
  Users, ListChecks, FileText, ChartBar as BarChart3, Clock,
  Play, Check, ChevronDown, ChevronRight, Flag, Award, Activity,
  RefreshCw
} from 'lucide-react';
import {
  launchService,
  type ClinicLaunch,
  type LaunchPhase,
  type LaunchWorkstream,
  type LaunchTask,
  type LaunchWeek,
  type LaunchDeliverable,
  type LaunchDailyMetric
} from '../../services/launchService';

interface LaunchDetailViewProps {
  launchId?: string;
  onBack?: () => void;
}

type TabType = 'overview' | 'wbs' | 'tasks' | 'timeline' | 'deliverables' | 'metrics';

export default function LaunchDetailView({ launchId = '', onBack }: LaunchDetailViewProps) {
  const [launch, setLaunch] = useState<ClinicLaunch | null>(null);
  const [phases, setPhases] = useState<LaunchPhase[]>([]);
  const [workstreams, setWorkstreams] = useState<LaunchWorkstream[]>([]);
  const [tasks, setTasks] = useState<LaunchTask[]>([]);
  const [weeks, setWeeks] = useState<LaunchWeek[]>([]);
  const [deliverables, setDeliverables] = useState<LaunchDeliverable[]>([]);
  const [metrics, setMetrics] = useState<LaunchDailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (launchId) loadLaunchData();
  }, [launchId]);

  const loadLaunchData = async () => {
    try {
      setLoading(true);
      setError(null);
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

      const allDeliverables: LaunchDeliverable[] = [];
      for (const week of weeksData) {
        const weekDeliverables = await launchService.getDeliverables(launchId, week.id);
        allDeliverables.push(...weekDeliverables);
      }
      setDeliverables(allDeliverables);

      const metricsData = await launchService.getAllMetrics(launchId);
      setMetrics(metricsData);
    } catch (err) {
      setError('Failed to load launch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      await launchService.updateTask(taskId, { status: 'in_progress' });
      await loadLaunchData();
    } catch {
      setError('Failed to start task.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setActionLoading(taskId);
      await launchService.updateTask(taskId, {
        status: 'completed',
        completion_pct: 100,
        completed_date: new Date().toISOString().split('T')[0]
      });
      await loadLaunchData();
    } catch {
      setError('Failed to complete task.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteDeliverable = async (deliverableId: string) => {
    try {
      setActionLoading(deliverableId);
      await launchService.updateDeliverable(deliverableId, { status: 'completed' });
      await loadLaunchData();
    } catch {
      setError('Failed to complete deliverable.');
    } finally {
      setActionLoading(null);
    }
  };

  const togglePhaseExpand = (phaseId: string) => {
    const next = new Set(expandedPhases);
    next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
    setExpandedPhases(next);
  };

  const toggleWorkstreamExpand = (workstreamId: string) => {
    const next = new Set(expandedWorkstreams);
    next.has(workstreamId) ? next.delete(workstreamId) : next.add(workstreamId);
    setExpandedWorkstreams(next);
  };

  const getStatusIcon = (status: string, size = 'w-5 h-5') => {
    if (status === 'completed') return <CheckCircle2 className={`${size} text-green-600`} />;
    if (status === 'in_progress') return <Play className={`${size} text-blue-600`} />;
    if (status === 'blocked') return <AlertTriangle className={`${size} text-red-600`} />;
    return <Circle className={`${size} text-gray-400`} />;
  };

  const formatPhaseName = (name: string) =>
    name.replace('phase_', 'Phase ').replace(/_/g, ' ');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !launch) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{error}</p>
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={loadLaunchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!launch) {
    return (
      <div className="text-center py-16">
        <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Launch not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  const currentDay = launch.actual_start_date
    ? Math.floor((Date.now() - new Date(launch.actual_start_date).getTime()) / 86400000)
    : 0;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Rocket },
    { id: 'wbs', label: 'Work Breakdown', icon: ListChecks },
    { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckCircle2 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'deliverables', label: `Deliverables (${deliverables.length})`, icon: FileText },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 }
  ];

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    at_risk: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    delayed: 'bg-amber-100 text-amber-800',
    planning: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-xs">Dismiss</button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{launch.launch_name}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[launch.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {launch.status.replace(/_/g, ' ').toUpperCase()}
            </span>
            {launch.is_partner_clinic && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap">
                PARTNER
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{launch.launch_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Current Phase', value: formatPhaseName(launch.current_phase ?? 'phase_0'), icon: <Target className="w-4 h-4" /> },
          { label: 'Day', value: `${currentDay} / 90`, icon: <Calendar className="w-4 h-4" /> },
          { label: 'Progress', value: `${(launch.overall_completion_pct ?? 0).toFixed(0)}%`, icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Tasks Done', value: `${tasks.filter(t => t.status === 'completed').length} / ${tasks.length}`, icon: <ListChecks className="w-4 h-4" /> },
          { label: 'Gates Passed', value: `${phases.filter(p => p.gate_passed).length} / ${phases.length}`, icon: <Flag className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1 text-xs">{s.icon}<span>{s.label}</span></div>
            <p className="text-base font-bold text-gray-900 leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Project Charter</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Launch Owner</dt>
                      <dd className="text-sm font-medium text-gray-900">{launch.launch_owner_role || 'Not Assigned'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Target Open Date</dt>
                      <dd className="text-sm font-medium text-gray-900">{new Date(launch.target_open_date).toLocaleDateString()}</dd>
                    </div>
                    {launch.actual_start_date && (
                      <div>
                        <dt className="text-xs text-gray-500 mb-0.5">Actual Start Date</dt>
                        <dd className="text-sm font-medium text-gray-900">{new Date(launch.actual_start_date).toLocaleDateString()}</dd>
                      </div>
                    )}
                    {launch.approved_budget && (
                      <div>
                        <dt className="text-xs text-gray-500 mb-0.5">Approved Budget</dt>
                        <dd className="text-sm font-medium text-gray-900">${(launch.approved_budget / 1000).toFixed(0)}K</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Launch Type</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {launch.launch_plan_type?.replace(/_/g, ' ').toUpperCase() ?? 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Phase Status</h3>
                  {phases.length === 0 ? (
                    <p className="text-sm text-gray-500">No phases loaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {phases.map(phase => (
                        <div key={phase.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(phase.status, 'w-4 h-4')}
                            <span className="text-sm text-gray-900">{formatPhaseName(phase.phase_name)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{phase.completion_pct.toFixed(0)}%</span>
                            {phase.gate_passed && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {workstreams.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Workstreams</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workstreams.map(ws => (
                      <div key={ws.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{ws.workstream_name}</h4>
                          <span className="text-xs text-gray-500">{ws.completion_pct.toFixed(0)}%</span>
                        </div>
                        {ws.description && <p className="text-xs text-gray-600 mb-2">{ws.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span>Owner: {ws.owner_role ?? 'Unassigned'}</span>
                          <span>{ws.completed_tasks}/{ws.total_tasks} tasks</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${ws.completion_pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wbs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Work Breakdown Structure</h3>
                <div className="flex gap-2">
                  <button onClick={() => setExpandedPhases(new Set(phases.map(p => p.id)))} className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200">
                    Expand All
                  </button>
                  <button onClick={() => setExpandedPhases(new Set())} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
                    Collapse All
                  </button>
                </div>
              </div>

              {phases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No phases available for this launch</p>
                </div>
              ) : phases.map(phase => {
                const phaseTasks = tasks.filter(t => t.phase_name === phase.phase_name);
                const phaseWorkstreams = workstreams.filter(ws => phaseTasks.some(t => t.workstream_id === ws.id));
                const isExpanded = expandedPhases.has(phase.id);

                return (
                  <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => togglePhaseExpand(phase.id)}
                      className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        {getStatusIcon(phase.status, 'w-4 h-4')}
                        <span className="font-medium text-gray-900 text-sm">{formatPhaseName(phase.phase_name)}</span>
                        {phase.gate_passed && <Award className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{phaseTasks.filter(t => t.status === 'completed').length}/{phaseTasks.length} tasks</span>
                        <span className="font-semibold text-gray-700">{phase.completion_pct.toFixed(0)}%</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 space-y-2 bg-white">
                        {phaseWorkstreams.length === 0 ? (
                          <p className="text-xs text-gray-400 pl-4">No workstreams for this phase</p>
                        ) : phaseWorkstreams.map(ws => {
                          const wsTasks = phaseTasks.filter(t => t.workstream_id === ws.id);
                          const isWSExpanded = expandedWorkstreams.has(ws.id);

                          return (
                            <div key={ws.id} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => toggleWorkstreamExpand(ws.id)}
                                className="w-full bg-white px-4 py-2.5 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  {isWSExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                  <Users className="w-3.5 h-3.5 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-800">{ws.workstream_name}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {wsTasks.filter(t => t.status === 'completed').length}/{wsTasks.length}
                                </span>
                              </button>

                              {isWSExpanded && wsTasks.length > 0 && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                  {wsTasks.map(task => (
                                    <div key={task.id} className="px-5 py-2 flex items-center gap-2 hover:bg-gray-50">
                                      {getStatusIcon(task.status, 'w-3.5 h-3.5')}
                                      <span className="text-sm text-gray-800 flex-1">{task.task_name}</span>
                                      {task.is_gate_blocker && (
                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">GATE BLOCKER</span>
                                      )}
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

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">All Tasks</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
                    <option value="all">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
                    <option value="all">All Phases</option>
                    {phases.map(p => (
                      <option key={p.id} value={p.phase_name}>{formatPhaseName(p.phase_name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No tasks found for this launch</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getStatusIcon(task.status, 'w-4 h-4')}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">{task.task_name}</h4>
                              {task.is_required && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">REQUIRED</span>
                              )}
                              {task.is_gate_blocker && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">GATE BLOCKER</span>
                              )}
                            </div>
                            {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}
                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                              {task.phase_name && <span>Phase: {task.phase_name.replace('phase_', '').replace(/_/g, ' ')}</span>}
                              {task.assigned_role && <span>Owner: {task.assigned_role}</span>}
                              {task.due_date && (
                                <span className={new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {task.status === 'not_started' && (
                            <button
                              type="button"
                              disabled={actionLoading === task.id}
                              onClick={() => handleStartTask(task.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                            >
                              {actionLoading === task.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              type="button"
                              disabled={actionLoading === task.id}
                              onClick={() => handleCompleteTask(task.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                            >
                              {actionLoading === task.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Complete
                            </button>
                          )}
                          {task.status === 'completed' && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                      </div>
                      {task.completion_pct > 0 && task.status !== 'completed' && (
                        <div className="mt-3 ml-7">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${task.completion_pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Phase Progress</h3>
                {phases.length === 0 ? (
                  <p className="text-sm text-gray-500">No phases available.</p>
                ) : (
                  <div className="space-y-3">
                    {phases.map(phase => (
                      <div key={phase.id} className="flex items-center gap-4">
                        <div className="w-36 text-xs text-gray-600 flex-shrink-0">{formatPhaseName(phase.phase_name)}</div>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-full h-7 relative overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                                phase.gate_passed ? 'bg-green-500' : phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${phase.completion_pct}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-700 mix-blend-multiply">{phase.completion_pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          {phase.planned_start_date && phase.planned_end_date && (
                            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                              <span>{new Date(phase.planned_start_date).toLocaleDateString()}</span>
                              <span>{new Date(phase.planned_end_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-24 text-right flex-shrink-0">
                          {phase.gate_passed ? (
                            <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                            </span>
                          ) : phase.status === 'in_progress' ? (
                            <span className="text-xs text-blue-600 font-medium">In Progress</span>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {weeks.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                  <div className="space-y-3">
                    {weeks.map(week => (
                      <div key={week.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{week.week_label}</span>
                            {week.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          </div>
                          <span className="text-xs text-gray-500">
                            Day {week.start_day} – {week.end_day}
                          </span>
                        </div>
                        {week.week_objective && (
                          <p className="text-xs text-gray-600">{week.week_objective}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">Launch Deliverables</h3>
              {deliverables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No deliverables tracked yet</p>
                  <p className="text-xs mt-1">Deliverables are loaded from weekly schedule data</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deliverables.map(d => (
                    <div key={d.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {getStatusIcon(d.status, 'w-4 h-4')}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">{d.deliverable_name}</h4>
                              {d.is_critical && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">CRITICAL</span>
                              )}
                            </div>
                            {d.deliverable_description && (
                              <p className="text-xs text-gray-500 mb-1">{d.deliverable_description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              {d.due_day && <span>Due: Day {d.due_day}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {d.status !== 'completed' && (
                            <button
                              type="button"
                              disabled={actionLoading === d.id}
                              onClick={() => handleCompleteDeliverable(d.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                            >
                              {actionLoading === d.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Complete
                            </button>
                          )}
                          {d.status === 'completed' && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Daily Metrics Tracking</h3>
              {metrics.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No metrics logged yet</p>
                  <p className="text-xs mt-1">Daily metrics will appear here once the launch is active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.slice(0, 14).map(metric => (
                    <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Day {metric.day_number} · {new Date(metric.metric_date).toLocaleDateString()}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Patients Today', value: metric.patients_treated_today },
                          { label: 'Cumulative', value: metric.cumulative_patients },
                          { label: 'Utilization', value: metric.clinician_utilization_pct != null ? `${metric.clinician_utilization_pct.toFixed(0)}%` : '—' },
                          { label: 'Data Completeness', value: metric.data_completeness_pct != null ? `${metric.data_completeness_pct.toFixed(0)}%` : '—' },
                        ].map(m => (
                          <div key={m.label}>
                            <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                            <p className="text-lg font-bold text-gray-900">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {metrics.length > 14 && (
                    <p className="text-center text-xs text-gray-500 py-2">Showing 14 most recent of {metrics.length} entries</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
