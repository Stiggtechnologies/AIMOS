import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  Bell,
  CheckCircle2,
  Clock,
  Users,
  Phone,
  FileText,
  MessageSquare,
  Activity,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  Send,
  BookOpen,
  ListChecks,
  Zap,
  Radio,
  Calendar,
  User,
} from 'lucide-react';
import {
  getActiveEmergency,
  getEmergencyDashboard,
  getEmergencyPlaybooks,
  getEmergencyContacts,
  get247Contacts,
  getMyEmergencyTasks,
  updateEmergencyTask,
} from '../../services/emergencyService';
import { useAuth } from '../../contexts/AuthContext';

export default function EmergencyView() {
  const { user } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState<any | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contacts247, setContacts247] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'broadcasts' | 'playbooks' | 'contacts' | 'logs'>('overview');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [emergency, allPlaybooks, allContacts, contacts247Data] = await Promise.all([
        getActiveEmergency(),
        getEmergencyPlaybooks(),
        getEmergencyContacts(),
        get247Contacts(),
      ]);

      setActiveEmergency(emergency);
      setPlaybooks(allPlaybooks);
      setContacts(allContacts);
      setContacts247(contacts247Data);

      if (emergency) {
        const dash = await getEmergencyDashboard(emergency.id);
        setDashboard(dash);
      }

      if (user) {
        const tasks = await getMyEmergencyTasks(user.id);
        setMyTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading emergency data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskUpdate(taskId: string, updates: any) {
    try {
      await updateEmergencyTask(taskId, updates);
      await loadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading emergency data...</div>
      </div>
    );
  }

  const getSeverityColor = (severity?: string) => {
    if (severity === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (severity === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (severity === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'completed' || status === 'resolved' || status === 'sent') return 'bg-green-100 text-green-800';
    if (status === 'in_progress' || status === 'active' || status === 'sending') return 'bg-blue-100 text-blue-800';
    if (status === 'blocked') return 'bg-red-100 text-red-800';
    if (status === 'pending' || status === 'scheduled') return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority?: string) => {
    if (priority === 'critical' || priority === 'immediate') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (priority === 'urgent' || priority === 'high') return <Zap className="w-4 h-4 text-orange-600" />;
    return <Activity className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Emergency & Business Continuity</h2>
        <p className="text-gray-600 mt-1">
          Crisis management and operational resilience
        </p>
      </div>

      {activeEmergency ? (
        <>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-red-900">{activeEmergency.title}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded border ${getSeverityColor(activeEmergency.severity)}`}>
                      {activeEmergency.severity} severity
                    </span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(activeEmergency.status)}`}>
                      {activeEmergency.status}
                    </span>
                  </div>
                  <p className="text-red-800 mb-3">{activeEmergency.description}</p>
                  <div className="flex items-center gap-6 text-sm text-red-700">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Declared: {new Date(activeEmergency.declared_at).toLocaleString()}
                    </span>
                    {activeEmergency.event_code && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Code: {activeEmergency.event_code}
                      </span>
                    )}
                    {activeEmergency.incident_commander && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Incident Commander assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{dashboard.summary.total_tasks}</div>
                <div className="text-xs text-gray-600 mt-1">Total Tasks</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{dashboard.summary.in_progress_tasks}</div>
                <div className="text-xs text-gray-600 mt-1">In Progress</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{dashboard.summary.pending_tasks}</div>
                <div className="text-xs text-gray-600 mt-1">Pending</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{dashboard.summary.critical_tasks}</div>
                <div className="text-xs text-gray-600 mt-1">Critical</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{dashboard.summary.sent_broadcasts}</div>
                <div className="text-xs text-gray-600 mt-1">Broadcasts</div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{dashboard.summary.total_logs}</div>
                <div className="text-xs text-gray-600 mt-1">Event Logs</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'tasks'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tasks ({myTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('broadcasts')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'broadcasts'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Broadcasts
                </button>
                <button
                  onClick={() => setActiveTab('playbooks')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'playbooks'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Playbooks
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'contacts'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Contacts
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 ${
                    activeTab === 'logs'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Event Log
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && dashboard && (
                <div className="space-y-6">
                  {dashboard.event.affected_staff_count > 0 || dashboard.event.affected_patient_count > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                          <p className="font-semibold mb-1">Impact Assessment</p>
                          <div className="flex gap-6">
                            {dashboard.event.affected_staff_count > 0 && (
                              <span>Staff affected: {dashboard.event.affected_staff_count}</span>
                            )}
                            {dashboard.event.affected_patient_count > 0 && (
                              <span>Patients affected: {dashboard.event.affected_patient_count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-blue-600" />
                        Tasks by Status
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(dashboard.tasksByStatus).map(([status, tasks]: [string, any]) => (
                          <div key={status} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                            <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(status)}`}>
                              {tasks.length}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-600" />
                        Tasks by Priority
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(dashboard.tasksByPriority).map(([priority, tasks]: [string, any]) => (
                          <div key={priority} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(priority)}
                              <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{tasks.length}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {dashboard.playbook && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-semibold mb-1">Active Playbook</p>
                          <p className="text-blue-800">{dashboard.playbook.playbook_name}</p>
                          <p className="text-xs text-blue-700 mt-1">
                            {dashboard.playbook.total_steps} steps • {dashboard.playbook.estimated_duration_minutes} min estimated
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {myTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No tasks assigned to you
                    </div>
                  ) : (
                    myTasks.map((task: any) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityIcon(task.priority)}
                              <span className="text-sm font-semibold text-gray-900">{task.task_title}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                {task.task_category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{task.task_description}</p>
                            {task.due_at && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {new Date(task.due_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(task.task_status)}`}>
                              {task.task_status}
                            </span>
                            {task.task_status === 'pending' && (
                              <button
                                onClick={() => handleTaskUpdate(task.id, { task_status: 'in_progress', started_at: new Date().toISOString() })}
                                className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Start
                              </button>
                            )}
                            {task.task_status === 'in_progress' && (
                              <button
                                onClick={() => handleTaskUpdate(task.id, { task_status: 'completed', completed_at: new Date().toISOString() })}
                                className="px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                        {task.event && (
                          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                            Event: {task.event.title}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'broadcasts' && dashboard && (
                <div className="space-y-4">
                  {dashboard.broadcasts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No broadcasts sent yet
                    </div>
                  ) : (
                    dashboard.broadcasts.map((broadcast: any) => (
                      <div key={broadcast.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Radio className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-semibold text-gray-900">{broadcast.broadcast_title || 'Broadcast'}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                {broadcast.broadcast_type}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                {broadcast.priority_level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{broadcast.message}</p>
                            <div className="text-xs text-gray-500">
                              {broadcast.sent_at ? `Sent: ${new Date(broadcast.sent_at).toLocaleString()}` : 'Not sent yet'}
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(broadcast.broadcast_status)}`}>
                            {broadcast.broadcast_status}
                          </span>
                        </div>
                        {broadcast.total_recipients > 0 && (
                          <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t border-gray-200">
                            <div>Recipients: {broadcast.total_recipients}</div>
                            <div>Delivered: {broadcast.delivered_count}</div>
                            <div>Acknowledged: {broadcast.acknowledged_count}</div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'playbooks' && (
                <div className="space-y-4">
                  {playbooks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No playbooks available
                    </div>
                  ) : (
                    playbooks.map((playbook: any) => (
                      <div key={playbook.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm font-semibold text-gray-900">{playbook.playbook_name}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded">
                                {playbook.playbook_category}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                                v{playbook.version}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{playbook.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{playbook.total_steps} steps</span>
                              <span>{playbook.estimated_duration_minutes} min</span>
                              {playbook.usage_count > 0 && <span>Used {playbook.usage_count} times</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  {contacts247.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        24/7 Available Contacts
                      </h4>
                      <div className="space-y-3">
                        {contacts247.map((contact: any) => (
                          <div key={contact.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{contact.contact_name}</span>
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                                    24/7
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                    Level {contact.escalation_level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{contact.contact_role}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-700">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {contact.primary_phone}
                                  </span>
                                  {contact.email && (
                                    <span className="flex items-center gap-1">
                                      <Send className="w-3 h-3" />
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      All Emergency Contacts
                    </h4>
                    <div className="space-y-3">
                      {contacts.slice(0, 10).map((contact: any) => (
                        <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">{contact.contact_name}</span>
                                {contact.organization && (
                                  <span className="text-xs text-gray-500">({contact.organization})</span>
                                )}
                                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                                  Level {contact.escalation_level}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{contact.contact_role}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-700">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {contact.primary_phone}
                                </span>
                                {contact.email && (
                                  <span className="flex items-center gap-1">
                                    <Send className="w-3 h-3" />
                                    {contact.email}
                                  </span>
                                )}
                                {contact.availability_hours && (
                                  <span className="text-gray-500">{contact.availability_hours}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && dashboard && (
                <div className="space-y-3">
                  {dashboard.logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No event logs yet
                    </div>
                  ) : (
                    dashboard.logs.map((log: any) => (
                      <div key={log.id} className="border-l-4 border-blue-600 bg-gray-50 rounded-r-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{log.log_title}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                {log.log_type}
                              </span>
                              {log.severity && (
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getSeverityColor(log.severity)}`}>
                                  {log.severity}
                                </span>
                              )}
                            </div>
                            {log.log_description && (
                              <p className="text-sm text-gray-600 mb-1">{log.log_description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(log.log_timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Emergencies</h3>
            <p className="text-gray-600">
              System operating normally. Crisis playbooks and emergency contacts are ready if needed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Crisis Playbooks Ready
              </h3>
              <div className="space-y-2">
                {playbooks.slice(0, 5).map((playbook: any) => (
                  <div key={playbook.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{playbook.playbook_name}</div>
                      <div className="text-xs text-gray-500">{playbook.playbook_category}</div>
                    </div>
                    <span className="text-xs text-gray-600">{playbook.total_steps} steps</span>
                  </div>
                ))}
                {playbooks.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No playbooks configured
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                24/7 Emergency Contacts
              </h3>
              <div className="space-y-2">
                {contacts247.slice(0, 5).map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{contact.contact_name}</div>
                      <div className="text-xs text-gray-500">{contact.contact_role}</div>
                    </div>
                    <span className="text-xs text-gray-600">{contact.primary_phone}</span>
                  </div>
                ))}
                {contacts247.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No 24/7 contacts configured
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold mb-1">Crisis Management</p>
                  <p className="text-red-800">
                    Structured playbooks for emergency response
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Mass Notifications</p>
                  <p className="text-blue-800">
                    Broadcast alerts to staff with acknowledgment tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold mb-1">Operational Resilience</p>
                  <p className="text-green-800">
                    Business continuity and recovery procedures
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
