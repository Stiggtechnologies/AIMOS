import { useState, useEffect, useCallback } from 'react';
import { Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Clock, RefreshCw, Play, Zap, Database, Server, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import {
  n8nWorkflowService,
  WorkflowRun,
  WorkflowException,
  OperationalAlert,
  IntegrationAccount,
} from '../../services/n8nWorkflowService';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  started: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

const CONN_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  connected: { label: 'Connected', color: 'text-green-600', icon: CheckCircle },
  degraded: { label: 'Degraded', color: 'text-amber-600', icon: AlertTriangle },
  auth_required: { label: 'Auth Required', color: 'text-red-600', icon: XCircle },
  disconnected: { label: 'Disconnected', color: 'text-red-600', icon: XCircle },
  disabled: { label: 'Disabled', color: 'text-gray-400', icon: XCircle },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon: typeof Activity;
}

function StatCard({ label, value, sub, color = 'text-gray-900', icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

interface TriggerButtonProps {
  label: string;
  description: string;
  icon: typeof Play;
  onTrigger: () => Promise<void>;
  loading: boolean;
}

function TriggerButton({ label, description, icon: Icon, onTrigger, loading }: TriggerButtonProps) {
  return (
    <button
      onClick={onTrigger}
      disabled={loading}
      className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        {loading ? <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> : <Icon className="w-4 h-4 text-blue-600" />}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
    </button>
  );
}

export default function WorkflowOpsView() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [exceptions, setExceptions] = useState<WorkflowException[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResults, setTriggerResults] = useState<Record<string, unknown> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tab, setTab] = useState<'runs' | 'exceptions' | 'integrations'>('runs');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, e, a, i] = await Promise.allSettled([
        n8nWorkflowService.getWorkflowRuns({ limit: 50 }),
        n8nWorkflowService.getExceptions({ limit: 50 }),
        n8nWorkflowService.getOperationalAlerts({ status: 'open' }),
        n8nWorkflowService.getIntegrationAccounts(),
      ]);
      if (r.status === 'fulfilled') setRuns(r.value);
      if (e.status === 'fulfilled') setExceptions(e.value);
      if (a.status === 'fulfilled') setAlerts(a.value);
      if (i.status === 'fulfilled') setIntegrations(i.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function trigger(name: string, fn: () => Promise<Record<string, unknown>>) {
    setTriggering(name);
    setTriggerResults(null);
    try {
      const result = await fn();
      setTriggerResults(result);
      await load();
    } finally {
      setTriggering(null);
    }
  }

  async function handleResolveException(id: string) {
    await n8nWorkflowService.resolveException(id);
    setExceptions((prev) => prev.map((e) => e.id === id ? { ...e, status: 'resolved' as const } : e));
  }

  async function handleAcknowledgeAlert(id: string) {
    await n8nWorkflowService.acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const filteredRuns = statusFilter === 'all' ? runs : runs.filter((r) => r.status === statusFilter);
  const openExceptions = exceptions.filter((e) => ['open', 'escalated', 'triaged'].includes(e.status));

  const connectedIntegrations = integrations.filter((i) => i.connection_status === 'connected').length;
  const degradedIntegrations = integrations.filter((i) => i.connection_status !== 'connected' && i.connection_status !== 'disabled').length;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Workflow Operations</h1>
            <p className="text-sm text-gray-500 mt-0.5">n8n orchestration layer — runs, exceptions, integrations</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Runs" value={runs.length} sub={`${runs.filter((r) => r.status === 'completed').length} completed`} icon={Activity} />
          <StatCard label="Open Exceptions" value={openExceptions.length} sub={`${openExceptions.filter((e) => e.severity === 'critical').length} critical`} color={openExceptions.length > 0 ? 'text-red-600' : 'text-gray-900'} icon={AlertTriangle} />
          <StatCard label="Open Alerts" value={alerts.length} sub={`${alerts.filter((a) => a.severity === 'critical').length} critical`} color={alerts.length > 0 ? 'text-amber-600' : 'text-gray-900'} icon={Zap} />
          <StatCard label="Integrations" value={`${connectedIntegrations}/${integrations.length}`} sub={degradedIntegrations > 0 ? `${degradedIntegrations} need attention` : 'All healthy'} color={degradedIntegrations > 0 ? 'text-amber-600' : 'text-green-600'} icon={Server} />
        </div>

        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">{alerts.length} open operational alert{alerts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${SEVERITY_COLORS[alert.severity] || 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{alert.title}</div>
                    {alert.message && <div className="text-xs mt-0.5 opacity-80">{alert.message}</div>}
                    <div className="text-xs opacity-60 mt-1">{timeAgo(alert.created_at)}</div>
                  </div>
                  <button onClick={() => handleAcknowledgeAlert(alert.id)} className="flex-shrink-0 text-xs px-2 py-1 bg-white border border-current rounded hover:opacity-80">
                    Ack
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Play className="w-4 h-4 text-blue-500" /> Manual Triggers</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fire n8n-equivalent workflow jobs on demand</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TriggerButton label="Publish Dispatcher" description="Fan out due publish jobs by channel" icon={Play} loading={triggering === 'publish'} onTrigger={() => trigger('publish', n8nWorkflowService.triggerPublishDispatcher)} />
            <TriggerButton label="Review Sync" description="Ingest new reviews from GBP & flag risks" icon={RefreshCw} loading={triggering === 'review'} onTrigger={() => trigger('review', () => n8nWorkflowService.triggerReviewSync())} />
            <TriggerButton label="KPI Snapshot" description="Build daily metrics for all locations" icon={Database} loading={triggering === 'kpi'} onTrigger={() => trigger('kpi', () => n8nWorkflowService.triggerKpiSnapshot())} />
            <TriggerButton label="Integration Heartbeat" description="Check all integration account health" icon={Server} loading={triggering === 'heartbeat'} onTrigger={() => trigger('heartbeat', n8nWorkflowService.triggerIntegrationHeartbeat)} />
          </div>
          {triggerResults && (
            <div className="mx-4 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs font-medium text-gray-600 mb-1">Last trigger result</div>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32">{JSON.stringify(triggerResults, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex border-b border-gray-100">
            {(['runs', 'exceptions', 'integrations'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'runs' ? `Workflow Runs (${runs.length})` : t === 'exceptions' ? `Exceptions (${openExceptions.length} open)` : `Integrations (${integrations.length})`}
              </button>
            ))}
          </div>

          {tab === 'runs' && (
            <div>
              <div className="flex items-center gap-2 p-3 border-b border-gray-50">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                {['all', 'completed', 'failed', 'started', 'partial'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {filteredRuns.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">No workflow runs yet. Trigger one above.</div>
                )}
                {filteredRuns.map((run) => (
                  <div key={run.id}>
                    <button
                      onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      {expandedRun === run.id ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{run.workflow_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[run.status] || 'bg-gray-100 text-gray-600'}`}>{run.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{timeAgo(run.started_at)}</span>
                          {run.correlation_id && <span className="text-xs text-gray-400 font-mono truncate max-w-xs">{run.correlation_id}</span>}
                          {run.source_system && <span className="text-xs text-gray-400">via {run.source_system}</span>}
                        </div>
                      </div>
                      {run.completed_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                        </span>
                      )}
                    </button>
                    {expandedRun === run.id && (
                      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-500 mb-1">Input</div>
                          <pre className="text-xs text-gray-700 overflow-auto max-h-32">{JSON.stringify(run.input_payload_json, null, 2)}</pre>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-500 mb-1">Output</div>
                          <pre className="text-xs text-gray-700 overflow-auto max-h-32">{JSON.stringify(run.output_payload_json, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'exceptions' && (
            <div className="divide-y divide-gray-50">
              {exceptions.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No exceptions on record.</div>
              )}
              {exceptions.map((ex) => (
                <div key={ex.id}>
                  <button
                    onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    {expandedEx === ex.id ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{ex.summary}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[ex.severity] || ''}`}>{ex.severity}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ex.status] || 'bg-gray-100 text-gray-600'}`}>{ex.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{ex.workflow_name}</span>
                        <span className="text-xs text-gray-400">{timeAgo(ex.created_at)}</span>
                        <span className="text-xs text-gray-400">retry {ex.retry_attempts}/{ex.max_retries}</span>
                      </div>
                    </div>
                    {['open', 'escalated', 'triaged'].includes(ex.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolveException(ex.id); }}
                        className="flex-shrink-0 text-xs px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100"
                      >
                        Resolve
                      </button>
                    )}
                  </button>
                  {expandedEx === ex.id && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Root cause: <span className="font-normal text-gray-700">{ex.root_cause}</span></div>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-40">{JSON.stringify(ex.details_json, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'integrations' && (
            <div className="divide-y divide-gray-50">
              {integrations.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No integration accounts found.</div>
              )}
              {integrations.map((intg) => {
                const cfg = CONN_STATUS[intg.connection_status] || CONN_STATUS.disconnected;
                const Icon = cfg.icon;
                return (
                  <div key={intg.id} className="flex items-center gap-4 px-4 py-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{intg.account_name}</span>
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{intg.provider.replace(/_/g, ' ')}</span>
                        {intg.last_successful_sync_at && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />synced {timeAgo(intg.last_successful_sync_at)}</span>}
                        {intg.last_error_message && <span className="text-xs text-red-500 truncate max-w-xs">{intg.last_error_message}</span>}
                      </div>
                    </div>
                    {intg.token_expires_at && new Date(intg.token_expires_at) < new Date(Date.now() + 7 * 86400000) && (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Token expiring</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
