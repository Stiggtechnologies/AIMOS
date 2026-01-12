import { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { workflowService, WorkflowDefinition, ScheduledTask, NotificationTemplate } from '../../services/workflowService';

export default function WorkflowAutomationView() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [workflowsData, tasksData, templatesData] = await Promise.all([
        workflowService.getWorkflowDefinitions(),
        workflowService.getScheduledTasks(),
        workflowService.getNotificationTemplates()
      ]);

      setWorkflows(workflowsData);
      setTasks(tasksData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerWorkflow(action: 'process_notifications' | 'generate_credential_alerts' | 'check_scheduled_tasks') {
    try {
      setProcessing(action);
      setLastResult(null);

      const result = await workflowService.triggerWorkflowProcessor(action);
      setLastResult(result);

      await loadData();
    } catch (error: any) {
      console.error('Error triggering workflow:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  }

  async function handleToggleTask(taskId: string, isActive: boolean) {
    try {
      await workflowService.updateScheduledTask(taskId, { is_active: !isActive });
      await loadData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workflow automation...</div>
      </div>
    );
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workflow Automation</h2>
        <p className="text-gray-600 mt-1">Manage automated workflows, scheduled tasks, and notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleTriggerWorkflow('generate_credential_alerts')}
          disabled={processing !== null}
          className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-3">
            <Zap className="h-8 w-8 text-blue-600" />
            {processing === 'generate_credential_alerts' && (
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Generate Credential Alerts</h3>
          <p className="text-sm text-gray-600">Check all credentials and create alerts</p>
        </button>

        <button
          onClick={() => handleTriggerWorkflow('process_notifications')}
          disabled={processing !== null}
          className="bg-white border-2 border-green-200 rounded-lg p-6 hover:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-3">
            <Play className="h-8 w-8 text-green-600" />
            {processing === 'process_notifications' && (
              <RefreshCw className="h-5 w-5 text-green-600 animate-spin" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Process Notifications</h3>
          <p className="text-sm text-gray-600">Send pending email notifications</p>
        </button>

        <button
          onClick={() => handleTriggerWorkflow('check_scheduled_tasks')}
          disabled={processing !== null}
          className="bg-white border-2 border-orange-200 rounded-lg p-6 hover:border-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-8 w-8 text-orange-600" />
            {processing === 'check_scheduled_tasks' && (
              <RefreshCw className="h-5 w-5 text-orange-600 animate-spin" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Run Scheduled Tasks</h3>
          <p className="text-sm text-gray-600">Execute pending scheduled jobs</p>
        </button>
      </div>

      {lastResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Workflow Executed Successfully</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {Object.entries(lastResult).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Tasks</h3>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No scheduled tasks configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(task.is_active)}`}>
                        {task.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Schedule</p>
                        <p className="font-medium text-gray-900">{task.schedule_cron}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Run Count</p>
                        <p className="font-medium text-gray-900">{task.run_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Run</p>
                        <p className="font-medium text-gray-900">
                          {task.last_run_at ? new Date(task.last_run_at).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Run</p>
                        <p className="font-medium text-gray-900">
                          {task.next_run_at ? new Date(task.next_run_at).toLocaleDateString() : 'Not scheduled'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleTask(task.id, task.is_active)}
                    className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      task.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {task.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {task.failure_count > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>{task.failure_count} failure{task.failure_count !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Definitions</h3>

          {workflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No workflows configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map(workflow => (
                <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(workflow.is_active)}`}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">{workflow.category}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{workflow.trigger_type}</span>
                    {workflow.is_system && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">System</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Templates</h3>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No templates configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      template.default_priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      template.default_priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      template.default_priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {template.default_priority}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">{template.channel}</span>
                    <span className="text-gray-400">•</span>
                    <span>{template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
