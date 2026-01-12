import React, { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Activity, UserCheck,
  Menu, X
} from 'lucide-react';
import ExecutiveCommandCenter from './ExecutiveCommandCenter';
import DemandAcquisitionView from './DemandAcquisitionView';
import ClinicOperationsView from './ClinicOperationsView';
import IntakeConversionView from './IntakeConversionView';

type ViewType = 'executive' | 'marketing' | 'operations' | 'intake';

export default function CRMDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('executive');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const views = [
    {
      id: 'executive' as ViewType,
      name: 'Executive Command Center',
      icon: LayoutDashboard,
      description: 'CEO / Board View',
      color: 'blue',
    },
    {
      id: 'marketing' as ViewType,
      name: 'Demand & Acquisition',
      icon: TrendingUp,
      description: 'Marketing Lead',
      color: 'green',
    },
    {
      id: 'operations' as ViewType,
      name: 'Clinic Operations',
      icon: Activity,
      description: 'COO View',
      color: 'purple',
    },
    {
      id: 'intake' as ViewType,
      name: 'Intake & Conversion',
      icon: UserCheck,
      description: 'Front Desk',
      color: 'orange',
    },
  ];

  function renderView() {
    switch (activeView) {
      case 'executive':
        return <ExecutiveCommandCenter />;
      case 'marketing':
        return <DemandAcquisitionView />;
      case 'operations':
        return <ClinicOperationsView />;
      case 'intake':
        return <IntakeConversionView />;
      default:
        return <ExecutiveCommandCenter />;
    }
  }

  const getColorClasses = (color: string, active: boolean) => {
    if (active) {
      switch (color) {
        case 'blue':
          return 'bg-blue-100 text-blue-900 border-blue-500';
        case 'green':
          return 'bg-green-100 text-green-900 border-green-500';
        case 'purple':
          return 'bg-purple-100 text-purple-900 border-purple-500';
        case 'orange':
          return 'bg-orange-100 text-orange-900 border-orange-500';
        default:
          return 'bg-gray-100 text-gray-900 border-gray-500';
      }
    } else {
      return 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">CRM Automation</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded lg:hidden"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Google Ads + Intake + CRM System
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;

              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getColorClasses(
                    view.color,
                    isActive
                  )}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{view.name}</div>
                      <div className="text-xs opacity-75 truncate">{view.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>System Status:</span>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Update:</span>
                <span className="font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {!sidebarOpen && (
          <div className="bg-white border-b border-gray-200 p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </div>
    </div>
  );
}
