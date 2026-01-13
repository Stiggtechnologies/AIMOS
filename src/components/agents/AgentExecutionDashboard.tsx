import React, { useState, useEffect } from 'react';
import {
  Bot, Play, Clock, CheckCircle, AlertTriangle, TrendingUp,
  Activity, Zap, Users, FileText, ChevronRight, XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { agentExecutionService, type AgentExecutionResult, type HITLEscalation } from '../../services/agentExecutionService';
import { useToast } from '../../hooks/useToast';

interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain_id: string;
  risk_level: string;
  requires_hitl: boolean;
  active: boolean;
  domain: {
    name: string;
    executive_owner: string;
  };
}

interface ExecutionMetrics {
  total_executions: number;
  avg_confidence_score: number;
  escalation_rate: number;
  last_execution_at: string | null;
}

export function AgentExecutionDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [userInput, setUserInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<AgentExecutionResult | null>(null);
  const [pendingEscalations, setPendingEscalations] = useState<HITLEscalation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'execute' | 'escalations' | 'history'>('execute');
  const [agentMetrics, setAgentMetrics] = useState<Record<string, ExecutionMetrics>>({});
  const { showToast } = useToast();

  useEffect(() => {
    loadAgents();
    loadPendingEscalations();
    loadMetrics();
  }, []);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from('ai_agents')
      .select(`
        *,
        domain:agent_domains (
          name,
          executive_owner
        )
      `)
      .eq('active', true)
      .order('name');

    if (!error && data) {
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
      }
    }
  };

  const loadPendingEscalations = async () => {
    const escalations = await agentExecutionService.getPendingEscalations();
    setPendingEscalations(escalations);
  };

  const loadMetrics = async () => {
    const { data } = await supabase
      .from('agent_execution_metrics')
      .select('agent_id, total_executions, avg_confidence_score, escalation_rate, last_execution_at');

    if (data) {
      const metricsMap: Record<string, ExecutionMetrics> = {};
      data.forEach(m => {
        metricsMap[m.agent_id] = m;
      });
      setAgentMetrics(metricsMap);
    }
  };

  const executeAgent = async () => {
    if (!selectedAgent || !userInput.trim()) {
      showToast('Please select an agent and provide input', 'error');
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const result = await agentExecutionService.executeAgent({
        agentSlug: selectedAgent.slug,
        userInput: userInput,
        userId: 'current-user-id' // Replace with actual user ID
      });

      setExecutionResult(result);

      if (result.escalation_required) {
        showToast('Decision requires human review - added to HITL queue', 'warning');
        await loadPendingEscalations();
      } else {
        showToast('Agent executed successfully', 'success');
      }

      await loadMetrics();
    } catch (error: any) {
      showToast(error.message || 'Failed to execute agent', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const resolveEscalation = async (
    escalationId: string,
    resolution: 'approved' | 'rejected' | 'modified'
  ) => {
    try {
      await agentExecutionService.resolveEscalation(
        escalationId,
        resolution,
        'current-user-id', // Replace with actual user ID
        `Resolved as ${resolution}`
      );

      showToast(`Escalation ${resolution}`, 'success');
      await loadPendingEscalations();
    } catch (error: any) {
      showToast(error.message || 'Failed to resolve escalation', 'error');
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const metrics = selectedAgent ? agentMetrics[selectedAgent.id] : null;

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            AI Agent Execution Center
          </h1>
          <p className="text-gray-600 mt-2">
            Execute AI agents, monitor performance, and manage human-in-the-loop escalations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Escalations</p>
                <p className="text-2xl font-bold text-orange-600">{pendingEscalations.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics?.avg_confidence_score?.toFixed(0) || '0'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.total_executions || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Available Agents</h2>
              </div>
              <div className="overflow-y-auto max-h-[600px]">
                {agents.map((agent) => {
                  const agentMetric = agentMetrics[agent.id];
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                        selectedAgent?.id === agent.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-gray-400" />
                            <h3 className="font-medium text-gray-900 text-sm">{agent.name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{agent.domain?.executive_owner}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskLevelColor(agent.risk_level)}`}>
                              {agent.risk_level}
                            </span>
                            {agent.requires_hitl && (
                              <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                                HITL Required
                              </span>
                            )}
                          </div>
                          {agentMetric && (
                            <div className="mt-2 text-xs text-gray-500">
                              {agentMetric.total_executions} executions • {agentMetric.avg_confidence_score?.toFixed(0)}% confidence
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setSelectedTab('execute')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      selectedTab === 'execute'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Execute Agent
                  </button>
                  <button
                    onClick={() => setSelectedTab('escalations')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors relative ${
                      selectedTab === 'escalations'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    HITL Queue
                    {pendingEscalations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingEscalations.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedTab === 'execute' && selectedAgent && (
                  <div>
                    {/* Agent Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">{selectedAgent.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{selectedAgent.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {selectedAgent.domain?.executive_owner}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getRiskLevelColor(selectedAgent.risk_level)}`}>
                          {selectedAgent.risk_level} risk
                        </span>
                        {selectedAgent.requires_hitl && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <AlertTriangle className="w-4 h-4" />
                            Always requires HITL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input Form */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request / Input
                      </label>
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Enter your request or data for the agent to process..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={6}
                        disabled={executing}
                      />
                    </div>

                    <button
                      onClick={executeAgent}
                      disabled={executing || !userInput.trim()}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      {executing ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          Executing Agent...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Execute Agent
                        </>
                      )}
                    </button>

                    {/* Execution Result */}
                    {executionResult && (
                      <div className={`mt-6 p-4 rounded-lg border-2 ${
                        executionResult.escalation_required
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          {executionResult.escalation_required ? (
                            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {executionResult.escalation_required ? 'Human Review Required' : 'Execution Complete'}
                            </h4>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                                <p className="text-sm text-gray-900 mt-1">{executionResult.recommendation}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Confidence Score:</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        executionResult.confidence_score >= 80 ? 'bg-green-600' :
                                        executionResult.confidence_score >= 60 ? 'bg-yellow-600' :
                                        'bg-red-600'
                                      }`}
                                      style={{ width: `${executionResult.confidence_score}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{executionResult.confidence_score}%</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Rationale:</p>
                                <p className="text-sm text-gray-600 mt-1">{executionResult.rationale}</p>
                              </div>

                              {executionResult.identified_risks.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Identified Risks:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    {executionResult.identified_risks.map((risk, idx) => (
                                      <li key={idx}>{risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {executionResult.escalation_reason && (
                                <div className="p-3 bg-orange-100 rounded border border-orange-200">
                                  <p className="text-sm font-medium text-orange-900">Escalation Reason:</p>
                                  <p className="text-sm text-orange-700 mt-1">{executionResult.escalation_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'escalations' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Pending Human Review</h3>
                    {pendingEscalations.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <p className="text-gray-600">No pending escalations</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingEscalations.map((escalation) => (
                          <div key={escalation.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{escalation.agent_name}</h4>
                                <p className="text-sm text-gray-600">{new Date(escalation.created_at).toLocaleString()}</p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                                {escalation.confidence_score}% confidence
                              </span>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">User Input:</p>
                                <p className="text-sm text-gray-600">{escalation.user_input}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Agent Recommendation:</p>
                                <p className="text-sm text-gray-900">{escalation.recommendation}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Escalation Reason:</p>
                                <p className="text-sm text-orange-700">{escalation.escalation_reason}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => resolveEscalation(escalation.id, 'approved')}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => resolveEscalation(escalation.id, 'rejected')}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
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
        </div>
      </div>
    </div>
  );
}
