import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Clock, Target, Award, Users } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

interface AgentPerformance {
  agent_name: string;
  total_executions: number;
  success_rate: number;
  avg_execution_time: number;
}

interface ChannelPerformance {
  channel_name: string;
  total_candidates: number;
  total_hires: number;
  conversion_rate: number;
  cost_per_hire: number;
}

export default function AnalyticsView() {
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [agents, channels] = await Promise.all([
        analyticsService.getAgentPerformance(),
        analyticsService.getSourcingChannelPerformance()
      ]);
      setAgentPerformance(agents);
      setChannelPerformance(channels);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="mt-2 text-gray-600">Performance metrics and optimization opportunities</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Agent Performance</h2>
        <div className="space-y-4">
          {agentPerformance.map((agent, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{agent.agent_name}</h3>
                <span className="text-sm text-gray-500">{agent.total_executions} executions</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-semibold text-green-600">{agent.success_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${agent.success_rate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Avg: {agent.avg_execution_time}ms
                  </span>
                </div>
              </div>
            </div>
          ))}
          {agentPerformance.length === 0 && (
            <p className="text-center text-gray-500 py-8">No agent performance data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Sourcing Channel Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Candidates
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    Hires
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Conversion
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Cost/Hire
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {channelPerformance.map((channel, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{channel.channel_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{channel.total_candidates}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{channel.total_hires}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`font-semibold ${
                        channel.conversion_rate >= 5 ? 'text-green-600' :
                        channel.conversion_rate >= 2 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {channel.conversion_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">${channel.cost_per_hire.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
              {channelPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No channel performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <TrendingUp className="h-8 w-8 mb-2" />
          <h3 className="text-lg font-semibold">Optimization Insights</h3>
          <p className="mt-2 text-blue-100">AI continuously optimizes sourcing strategies based on performance data</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <Target className="h-8 w-8 mb-2" />
          <h3 className="text-lg font-semibold">Predictive Analytics</h3>
          <p className="mt-2 text-green-100">Forecast hiring needs and identify bottlenecks before they occur</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <Award className="h-8 w-8 mb-2" />
          <h3 className="text-lg font-semibold">Quality Tracking</h3>
          <p className="mt-2 text-purple-100">Monitor candidate quality scores and improve screening accuracy</p>
        </div>
      </div>
    </div>
  );
}
