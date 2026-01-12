import { useState } from 'react';
import { Calendar, Home, Shield, AlertCircle, LayoutDashboard, Zap, Brain, Clock } from 'lucide-react';
import OperationsDashboard from './OperationsDashboard';
import StaffingView from './StaffingView';
import CapacityView from './CapacityView';
import CredentialsView from './CredentialsView';
import WorkflowAutomationView from './WorkflowAutomationView';
import OperationalAIAgentsView from './OperationalAIAgentsView';
import CaseAgingView from './CaseAgingView';

type TabView = 'dashboard' | 'staffing' | 'capacity' | 'credentials' | 'case-aging' | 'automation' | 'ai-agents';

export default function OperationsEngineView() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');

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
      case 'dashboard':
        return <OperationsDashboard />;
      case 'staffing':
        return <StaffingView />;
      case 'capacity':
        return <CapacityView />;
      case 'credentials':
        return <CredentialsView />;
      case 'case-aging':
        return <CaseAgingView />;
      case 'automation':
        return <WorkflowAutomationView />;
      case 'ai-agents':
        return <OperationalAIAgentsView />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operations Engine</h1>
        <p className="mt-2 text-gray-600">Manage staffing, capacity, and credentials</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900 text-sm">Operations Hub</h3>
          <p className="text-blue-800 text-sm mt-1">
            Comprehensive operations management covering staff scheduling, facility capacity planning,
            and credential tracking with AI-powered expiry alerts.
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
