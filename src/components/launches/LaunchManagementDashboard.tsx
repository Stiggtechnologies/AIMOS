import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  ListChecks,
  ChevronRight,
  Calendar,
  Target,
  DollarSign,
  Brain
} from 'lucide-react';
import { launchService, type ClinicLaunch } from '../../services/launchService';
import { launchAIService, type LaunchInsight } from '../../services/launchAIService';
import LaunchDetailView from './LaunchDetailView';

interface LaunchManagementDashboardProps {
  onViewLaunch?: (launchId: string) => void;
  onCreateLaunch?: () => void;
}

export default function LaunchManagementDashboard({
  onViewLaunch,
  onCreateLaunch
}: LaunchManagementDashboardProps) {
  const [launches, setLaunches] = useState<ClinicLaunch[]>([]);
  const [myLaunches, setMyLaunches] = useState<ClinicLaunch[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<Map<string, LaunchInsight[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'my' | 'planning' | 'in_progress' | 'at_risk'>('all');
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allLaunches, userLaunches, userTasks] = await Promise.all([
        launchService.getAllLaunches(),
        launchService.getMyLaunches(),
        launchService.getMyTasks(),
      ]);

      setLaunches(allLaunches);
      setMyLaunches(userLaunches);
      setMyTasks(userTasks);

      const inProgressLaunches = allLaunches.filter(l =>
        l.status === 'in_progress' || l.status === 'at_risk'
      );
      const insightsMap = new Map<string, LaunchInsight[]>();

      for (const launch of inProgressLaunches.slice(0, 5)) {
        const insights = await launchAIService.generateLaunchInsights(launch.id);
        insightsMap.set(launch.id, insights);
      }

      setAiInsights(insightsMap);
    } catch (error) {
      console.error('Failed to load launches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLaunches = launches.filter(launch => {
    if (view === 'all') return true;
    if (view === 'my') return myLaunches.some(ml => ml.id === launch.id);
    return launch.status === view;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-blue-100 text-blue-800',
      delayed: 'bg-orange-100 text-orange-800',
      at_risk: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors] || colors.planning}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPhaseBadge = (phase: string) => {
    const phaseNumber = phase.match(/phase_(\d)/)?.[1] || '0';
    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'pink'];
    const color = colors[parseInt(phaseNumber)] || 'gray';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded bg-${color}-100 text-${color}-800`}>
        Phase {phaseNumber}
      </span>
    );
  };

  const getDaysUntilOpen = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const days = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = [
    {
      label: 'Active Launches',
      value: launches.filter(l => ['planning', 'approved', 'in_progress'].includes(l.status)).length,
      icon: Rocket,
      color: 'blue',
    },
    {
      label: 'At Risk',
      value: launches.filter(l => l.status === 'at_risk').length,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'Completed (YTD)',
      value: launches.filter(l => l.status === 'completed').length,
      icon: CheckCircle2,
      color: 'green',
    },
    {
      label: 'My Tasks',
      value: myTasks.length,
      icon: ListChecks,
      color: 'orange',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If a launch is selected, show detail view
  if (selectedLaunchId) {
    return (
      <LaunchDetailView
        launchId={selectedLaunchId}
        onBack={() => setSelectedLaunchId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-600" />
            New Clinic Launch Module
          </h1>
          <p className="mt-2 text-gray-600">
            Manage clinic launches from deal authorization through stabilization
          </p>
        </div>
        {onCreateLaunch && (
          <button
            onClick={onCreateLaunch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Launch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Array.from(aiInsights.entries()).some(([_, insights]) => insights.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">AI Launch Insights</h3>
              <div className="space-y-2">
                {Array.from(aiInsights.entries()).map(([launchId, insights]) => {
                  const launch = launches.find(l => l.id === launchId);
                  if (!launch || insights.length === 0) return null;

                  const topInsight = insights[0];
                  return (
                    <div key={launchId} className="bg-white rounded p-3 border border-blue-200">
                      <p className="text-sm font-medium text-gray-900">{launch.launch_name}</p>
                      <p className="text-sm text-gray-700 mt-1">{topInsight.message}</p>
                      {insights.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{insights.length - 1} more insights
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Launches</h2>
            <div className="flex gap-2">
              {['all', 'my', 'planning', 'in_progress', 'at_risk'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as typeof view)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {v.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredLaunches.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No launches found</p>
              <p className="text-sm">Try selecting a different filter or create a new launch</p>
            </div>
          ) : (
            filteredLaunches.map((launch) => {
              const daysUntilOpen = getDaysUntilOpen(launch.target_open_date);
              const insights = aiInsights.get(launch.id) || [];
              const criticalInsights = insights.filter(i => i.severity === 'critical');

              return (
                <div
                  key={launch.id}
                  onClick={() => setSelectedLaunchId(launch.id)}
                  className="p-6 hover:bg-blue-50 cursor-pointer transition-all border-l-4 border-blue-600 bg-white hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Rocket className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {launch.launch_name}
                        </h3>
                        {getStatusBadge(launch.status)}
                        {getPhaseBadge(launch.current_phase)}
                        {criticalInsights.length > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {criticalInsights.length} Critical
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>Launch Code: {launch.launch_code}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Target: {new Date(launch.target_open_date).toLocaleDateString()}
                            {daysUntilOpen >= 0 && ` (${daysUntilOpen}d)`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{launch.overall_completion_pct.toFixed(0)}% Complete</span>
                        </div>

                        {launch.approved_budget && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              ${(launch.actual_cost / 1000).toFixed(0)}K / $
                              {(launch.approved_budget / 1000).toFixed(0)}K
                            </span>
                          </div>
                        )}
                      </div>

                      {insights.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">
                            {insights[0].message}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            launch.status === 'at_risk'
                              ? 'bg-red-600'
                              : launch.status === 'delayed'
                              ? 'bg-orange-600'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${launch.overall_completion_pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 group-hover:shadow-md transition-all">
                        View Details
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <span className="text-xs text-gray-500">Click to manage</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {myTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              My Tasks ({myTasks.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {myTasks.slice(0, 10).map((task: any) => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {task.clinic_launches?.launch_name} • {task.clinic_launches?.launch_code}
                    </p>
                    {task.due_date && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={
                          new Date(task.due_date) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {task.is_gate_blocker && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      GATE BLOCKER
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
