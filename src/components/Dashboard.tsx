import { useEffect, useState } from 'react';
import { Activity, Users, Briefcase, Calendar, TrendingUp, DollarSign, Target, AlertCircle } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { SkeletonCard } from './shared/SkeletonLoader';

interface DashboardMetrics {
  active_jobs: number;
  total_candidates: number;
  active_applications: number;
  pending_interviews: number;
  time_to_fill_avg: number;
  cost_per_hire_avg: number;
  pipeline_conversion_rate: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setError(null);
      const data = await analyticsService.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setError('Failed to load dashboard metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(7)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load metrics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadMetrics();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Active Jobs',
      value: metrics?.active_jobs || 0,
      icon: Briefcase,
      color: 'bg-blue-500',
      trend: null
    },
    {
      title: 'Total Candidates',
      value: metrics?.total_candidates || 0,
      icon: Users,
      color: 'bg-green-500',
      trend: null
    },
    {
      title: 'Active Applications',
      value: metrics?.active_applications || 0,
      icon: Activity,
      color: 'bg-orange-500',
      trend: null
    },
    {
      title: 'Pending Interviews',
      value: metrics?.pending_interviews || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: null
    },
    {
      title: 'Avg Time to Fill',
      value: `${Math.round(metrics?.time_to_fill_avg || 0)} days`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      trend: null
    },
    {
      title: 'Avg Cost per Hire',
      value: `$${Math.round(metrics?.cost_per_hire_avg || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      trend: null
    },
    {
      title: 'Conversion Rate',
      value: `${(metrics?.pipeline_conversion_rate || 0).toFixed(1)}%`,
      icon: Target,
      color: 'bg-pink-500',
      trend: null
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Autonomous Talent Acquisition Engine</h1>
        <p className="mt-2 text-sm lg:text-base text-gray-600">Real-time metrics and AI agent performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">{metric.title}</p>
                  <p className="mt-2 text-2xl lg:text-3xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`${metric.color} p-2 lg:p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 animate-pulse" />
          <div>
            <h2 className="text-xl font-bold">AI Agents Active</h2>
            <p className="text-blue-100">7 autonomous agents running 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
