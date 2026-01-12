import { useEffect, useState } from 'react';
import { Bot, Activity, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { agentService } from '../services/agentService';
import type { Agent, AgentEvent } from '../types';

export default function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentsData, eventsData] = await Promise.all([
        agentService.getAllAgents(),
        agentService.getPendingEvents(20)
      ]);
      setAgents(agentsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'paused': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusColor = (status: AgentEvent['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
        <p className="mt-2 text-gray-600">Monitor autonomous agent performance and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => {
          const successRate = agent.total_executions > 0
            ? ((agent.total_executions - agent.total_failures) / agent.total_executions * 100)
            : 0;

          return (
            <div key={agent.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{agent.display_name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                {getStatusIcon(agent.status)}
              </div>

              <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{agent.total_executions}</div>
                  <div className="text-xs text-gray-500">Executions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>

              {agent.average_execution_time_ms && (
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="h-4 w-4 mr-2" />
                  <span>Avg: {agent.average_execution_time_ms}ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Agent Events</h2>
        <div className="space-y-3">
          {events.slice(0, 10).map(event => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{event.agent_name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">{event.event_type}</div>
                {event.error_message && (
                  <div className="mt-1 text-sm text-red-600">{event.error_message}</div>
                )}
              </div>
              <div className="text-right text-sm text-gray-500">
                {new Date(event.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
