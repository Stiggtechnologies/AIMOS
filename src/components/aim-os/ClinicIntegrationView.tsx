import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Briefcase,
  Heart,
  BookOpen,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import { getIntegrationDashboard, getClinicIntegrations } from '../../services/integrationService';

export default function ClinicIntegrationView() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  useEffect(() => {
    if (selectedIntegration) {
      loadDashboard(selectedIntegration);
    }
  }, [selectedIntegration]);

  async function loadIntegrations() {
    try {
      const data = await getClinicIntegrations();
      setIntegrations(data || []);
      if (data && data.length > 0) {
        setSelectedIntegration(data[0].id);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(integrationId: string) {
    try {
      const data = await getIntegrationDashboard(integrationId);
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading integration data...</div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">M&A / Clinic Integration</h2>
          <p className="text-gray-600 mt-1">
            PE-grade acquisition integration with Day 0/30/90 milestones
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Integrations</h3>
          <p className="text-gray-600">
            Create an integration project to start tracking clinic acquisitions and roll-ups.
          </p>
        </div>
      </div>
    );
  }

  const getHealthColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRiskColor = (level?: string) => {
    if (level === 'low') return 'bg-green-100 text-green-800 border-green-200';
    if (level === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (status === 'blocked') return 'bg-red-100 text-red-800';
    if (status === 'on_track') return 'bg-green-100 text-green-800';
    if (status === 'at_risk') return 'bg-amber-100 text-amber-800';
    if (status === 'off_track') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">M&A / Clinic Integration</h2>
        <p className="text-gray-600 mt-1">
          PE-grade acquisition integration with Day 0/30/90 milestones
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Acquisition-Ready Platform</p>
            <p className="text-blue-800">
              Structured integration workflows, milestone checklists, SOP adoption tracking, and performance normalization for PE-grade roll-ups.
            </p>
          </div>
        </div>
      </div>

      {integrations.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Integration Project
          </label>
          <select
            value={selectedIntegration || ''}
            onChange={(e) => setSelectedIntegration(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {integrations.map((int) => (
              <option key={int.id} value={int.id}>
                {int.integration_code} - {int.clinic?.name || 'Unknown Clinic'} ({int.integration_status})
              </option>
            ))}
          </select>
        </div>
      )}

      {dashboard && dashboard.project && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {dashboard.project.clinic?.name || 'Integration Project'}
                  </h3>
                  <span className={`px-3 py-1 text-sm font-semibold rounded border ${getRiskColor(dashboard.project.risk_level)}`}>
                    {dashboard.project.risk_level} risk
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Started: {new Date(dashboard.project.integration_start_date).toLocaleDateString()}
                  </span>
                  {dashboard.project.target_completion_date && (
                    <span className="flex items-center gap-1">
                      <Flag className="w-4 h-4" />
                      Target: {new Date(dashboard.project.target_completion_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(dashboard.project.integration_status)}`}>
                    {dashboard.project.integration_status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getHealthColor(dashboard.project.health_score)}`}>
                  {dashboard.project.health_score || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Health Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{dashboard.summary.overall_completion}%</div>
                <div className="text-xs text-gray-600 mt-1">Overall Progress</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center mb-1">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${dashboard.project.deal_size_usd ? (dashboard.project.deal_size_usd / 1000000).toFixed(1) + 'M' : 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Deal Size</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{dashboard.project.target_staff_count || 0}</div>
                <div className="text-xs text-gray-600 mt-1">Staff Count</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{dashboard.summary.team_size}</div>
                <div className="text-xs text-gray-600 mt-1">Team Size</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-900">
                  {dashboard.project.integration_budget ? `$${(dashboard.project.integration_budget / 1000).toFixed(0)}K` : 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Budget</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-900">
                  {dashboard.project.actual_spend ? `$${(dashboard.project.actual_spend / 1000).toFixed(0)}K` : '$0'}
                </div>
                <div className="text-xs text-gray-600 mt-1">Actual Spend</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Milestone Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Day 0</h4>
                  {dashboard.project.day_0_completion_date ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {dashboard.checklists.day_0.length} checklists
                </div>
                <div className="text-xs text-gray-500">
                  {dashboard.project.day_0_completion_date
                    ? `Completed: ${new Date(dashboard.project.day_0_completion_date).toLocaleDateString()}`
                    : 'In progress'}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Day 30</h4>
                  {dashboard.project.day_30_completion_date ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {dashboard.checklists.day_30.length} checklists
                </div>
                <div className="text-xs text-gray-500">
                  {dashboard.project.day_30_completion_date
                    ? `Completed: ${new Date(dashboard.project.day_30_completion_date).toLocaleDateString()}`
                    : 'Pending'}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Day 90</h4>
                  {dashboard.project.day_90_completion_date ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {dashboard.checklists.day_90.length} checklists
                </div>
                <div className="text-xs text-gray-500">
                  {dashboard.project.day_90_completion_date
                    ? `Completed: ${new Date(dashboard.project.day_90_completion_date).toLocaleDateString()}`
                    : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Checklists Summary
              </h3>
              <div className="space-y-3">
                {[...dashboard.checklists.day_0, ...dashboard.checklists.day_30, ...dashboard.checklists.day_90].slice(0, 5).map((checklist: any) => (
                  <div key={checklist.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{checklist.checklist_name}</span>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            {checklist.milestone}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{checklist.category}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(checklist.status)}`}>
                        {checklist.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{checklist.completed_items} / {checklist.total_items} items</span>
                      <span className="font-semibold">{checklist.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${checklist.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                SOP Adoption
              </h3>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-teal-600">{dashboard.summary.adopted_sops}</div>
                  <div className="text-xs text-gray-600 mt-1">Adopted SOPs</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-amber-600">{dashboard.summary.critical_sops}</div>
                  <div className="text-xs text-gray-600 mt-1">Critical SOPs</div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboard.sop_adoption.slice(0, 4).map((sop: any) => (
                  <div key={sop.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{sop.sop_name || 'SOP'}</span>
                          {sop.is_critical_sop && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{sop.sop_category}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(sop.adoption_status)}`}>
                        {sop.adoption_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                      <div>Training: {sop.training_completion_rate || 0}%</div>
                      <div>Compliance: {sop.compliance_rate || 0}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Performance Normalization
            </h3>
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{dashboard.summary.metrics_on_track}</div>
                <div className="text-xs text-gray-600 mt-1">On Track</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-amber-600">{dashboard.summary.metrics_at_risk}</div>
                <div className="text-xs text-gray-600 mt-1">At Risk</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{dashboard.performance_metrics.length}</div>
                <div className="text-xs text-gray-600 mt-1">Total Metrics</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboard.performance_metrics.filter((m: any) => m.status === 'achieved').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Achieved</div>
              </div>
            </div>
            <div className="space-y-3">
              {dashboard.performance_metrics.slice(0, 5).map((metric: any) => (
                <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{metric.metric_name}</span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                          {metric.metric_category}
                        </span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(metric.status)}`}>
                      {metric.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Baseline</div>
                      <div className="font-semibold text-gray-900">{metric.baseline_value || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Current</div>
                      <div className="font-semibold text-blue-600">{metric.current_value || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Target</div>
                      <div className="font-semibold text-green-600">{metric.target_value}</div>
                    </div>
                  </div>
                  {metric.progress_percentage !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{metric.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, metric.progress_percentage)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Cultural Alignment
              </h3>
              <div className="mb-4 text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-pink-600">{dashboard.summary.cultural_tasks_completed}</div>
                <div className="text-xs text-gray-600 mt-1">Completed Tasks</div>
              </div>
              <div className="space-y-3">
                {dashboard.cultural_tasks.slice(0, 4).map((task: any) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{task.task_name}</span>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800 rounded">
                            {task.task_type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">{task.target_audience}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    {task.scheduled_date && (
                      <div className="text-xs text-gray-600 mt-2">
                        {task.status === 'completed'
                          ? `Completed: ${new Date(task.completed_date).toLocaleDateString()}`
                          : `Scheduled: ${new Date(task.scheduled_date).toLocaleDateString()}`}
                      </div>
                    )}
                    {task.engagement_score && (
                      <div className="text-xs text-green-600 mt-1">
                        Engagement: {task.engagement_score}/100
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Integration Team
              </h3>
              <div className="space-y-3">
                {dashboard.team_members.slice(0, 6).map((member: any) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {member.contact_email || 'Team Member'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{member.role?.replace('_', ' ')}</div>
                        {member.workstream && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            {member.workstream}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <div>{member.tasks_completed} / {member.tasks_assigned}</div>
                        <div className="text-gray-500">tasks</div>
                      </div>
                    </div>
                    {member.time_allocation_percentage && (
                      <div className="mt-2 text-xs text-gray-600">
                        Time Allocation: {member.time_allocation_percentage}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-600" />
              Integration Milestones
            </h3>
            <div className="space-y-3">
              {dashboard.milestones.map((milestone: any) => (
                <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{milestone.milestone_name}</span>
                        {milestone.is_gate && (
                          <Award className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                          {milestone.milestone_type}
                        </span>
                        {milestone.phase && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            {milestone.phase}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Target: {new Date(milestone.target_date).toLocaleDateString()}
                    </span>
                    {milestone.actual_date && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Actual: {new Date(milestone.actual_date).toLocaleDateString()}
                      </span>
                    )}
                    {milestone.is_gate && milestone.approval_status && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Approval: {milestone.approval_status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold mb-1">Structured Workflows</p>
                  <p className="text-green-800">
                    Day 0/30/90 milestone checklists with gate-based progression
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Performance Normalization</p>
                  <p className="text-blue-800">
                    Track metrics to benchmark standards with variance analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Briefcase className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-900">
                  <p className="font-semibold mb-1">PE-Grade Ready</p>
                  <p className="text-indigo-800">
                    Acquisition-ready platform for clinic roll-ups
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
