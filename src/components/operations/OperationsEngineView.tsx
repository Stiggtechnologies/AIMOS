import { useState, useEffect } from 'react';
import { Calendar, Chrome as Home, Shield, CircleAlert as AlertCircle, LayoutDashboard, Zap, Brain, Clock, RefreshCw, Users, TrendingUp } from 'lucide-react';
import OperationsDashboard from './OperationsDashboard';
import StaffingView from './StaffingView';
import CapacityView from './CapacityView';
import CredentialsView from './CredentialsView';
import WorkflowAutomationView from './WorkflowAutomationView';
import OperationalAIAgentsView from './OperationalAIAgentsView';
import CaseAgingView from './CaseAgingView';
import { supabase } from '../../lib/supabase';

type TabView = 'dashboard' | 'staffing' | 'capacity' | 'credentials' | 'case-aging' | 'automation' | 'ai-agents';

interface TodaySummary {
  scheduledAppointments: number;
  staffOnDuty: number;
  openAlerts: number;
  tasksCompleted: number;
  roomUtilization: number;
}

export default function OperationsEngineView() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    loadTodaySummary();
  }, []);

  const loadTodaySummary = async () => {
    setLoadingSummary(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [apptResult, staffResult, alertResult] = await Promise.allSettled([
        supabase
          .from('patient_appointments')
          .select('id', { count: 'exact', head: true })
          .gte('scheduled_at', `${today}T00:00:00`)
          .lte('scheduled_at', `${today}T23:59:59`),
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('employment_status', 'active'),
        supabase
          .from('credential_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('is_resolved', false),
      ]);

      setSummary({
        scheduledAppointments:
          apptResult.status === 'fulfilled' ? (apptResult.value.count ?? 0) : 0,
        staffOnDuty:
          staffResult.status === 'fulfilled' ? (staffResult.value.count ?? 0) : 0,
        openAlerts:
          alertResult.status === 'fulfilled' ? (alertResult.value.count ?? 0) : 0,
        tasksCompleted: 12,
        roomUtilization: 74,
      });
    } catch {
      setSummary({
        scheduledAppointments: 0,
        staffOnDuty: 0,
        openAlerts: 0,
        tasksCompleted: 12,
        roomUtilization: 74,
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const tabs = [
    { key: 'dashboard' as TabView, label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & Alerts' },
    { key: 'staffing' as TabView, label: 'Staffing', icon: Calendar, description: 'Schedules & Time Off' },
    { key: 'capacity' as TabView, label: 'Capacity', icon: Home, description: 'Rooms & Utilization' },
    { key: 'credentials' as TabView, label: 'Credentials', icon: Shield, description: 'Licensing & Alerts' },
    { key: 'case-aging' as TabView, label: 'Case Aging', icon: Clock, description: 'Aging & Escalations' },
    { key: 'automation' as TabView, label: 'Automation', icon: Zap, description: 'Workflows & Tasks' },
    { key: 'ai-agents' as TabView, label: 'AI Agents', icon: Brain, description: 'Intelligent Insights' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <OperationsDashboard />;
      case 'staffing': return <StaffingView />;
      case 'capacity': return <CapacityView />;
      case 'credentials': return <CredentialsView />;
      case 'case-aging': return <CaseAgingView />;
      case 'automation': return <WorkflowAutomationView />;
      case 'ai-agents': return <OperationalAIAgentsView />;
      default: return null;
    }
  };

  const summaryCards = [
    {
      label: "Today's Appointments",
      value: loadingSummary ? '—' : summary?.scheduledAppointments ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Staff',
      value: loadingSummary ? '—' : summary?.staffOnDuty ?? 0,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Room Utilization',
      value: loadingSummary ? '—' : `${summary?.roomUtilization ?? 0}%`,
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Open Alerts',
      value: loadingSummary ? '—' : summary?.openAlerts ?? 0,
      icon: AlertCircle,
      color: summary?.openAlerts ? 'text-red-600' : 'text-gray-600',
      bg: summary?.openAlerts ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Staffing, capacity, credentials, and clinical workflow management
          </p>
        </div>
        <button
          onClick={loadTodaySummary}
          disabled={loadingSummary}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingSummary ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`${bg} p-2.5 rounded-lg flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 leading-snug">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
