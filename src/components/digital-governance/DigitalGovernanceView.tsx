import { useState } from 'react';
import { Shield } from 'lucide-react';
import DigitalGovernanceDashboard from './DigitalGovernanceDashboard';
import AssetsRegistry from './AssetsRegistry';

type Tab = 'dashboard' | 'assets' | 'users' | 'onboarding' | 'offboarding' | 'audit' | 'templates';

export default function DigitalGovernanceView() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', component: DigitalGovernanceDashboard },
    { id: 'assets' as Tab, label: 'Assets Registry', component: AssetsRegistry },
    { id: 'users' as Tab, label: 'Users & Roles', component: PlaceholderView },
    { id: 'onboarding' as Tab, label: 'Onboarding Queue', component: PlaceholderView },
    { id: 'offboarding' as Tab, label: 'Offboarding Queue', component: PlaceholderView },
    { id: 'audit' as Tab, label: 'Audit Log', component: PlaceholderView },
    { id: 'templates' as Tab, label: 'Role Templates', component: PlaceholderView },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || DigitalGovernanceDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <ActiveComponent />
      </div>
    </div>
  );
}

// Placeholder component for views not yet built
function PlaceholderView() {
  return (
    <div className="text-center py-16">
      <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
      <p className="text-gray-600">This view is under construction</p>
      <p className="text-sm text-gray-500 mt-2">
        Dashboard and Assets Registry are fully functional
      </p>
    </div>
  );
}
