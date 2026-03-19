import { useState } from 'react';
import { LayoutDashboard, ListChecks, SquareCheck as CheckSquare, MessageSquare, TriangleAlert as AlertTriangle, ChartBar as BarChart3, MapPin, Plug, Shield, ScrollText, Settings, ChevronLeft, ChevronRight, Bell, Zap, X, Menu } from 'lucide-react';
import type { AimLocation } from '../../services/aimAutomationService';

export type AutomationView =
  | 'overview'
  | 'content-queue'
  | 'approval-center'
  | 'review-triage'
  | 'exception-center'
  | 'campaign-health'
  | 'locations'
  | 'integrations'
  | 'policy-rules'
  | 'audit-log'
  | 'settings';

interface NavItem {
  view: AutomationView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface AimAutomationShellProps {
  children: React.ReactNode;
  activeView: AutomationView;
  onViewChange: (view: AutomationView) => void;
  locations: AimLocation[];
  selectedLocationId: string | null;
  onLocationChange: (id: string | null) => void;
  pendingApprovals?: number;
  openAlerts?: number;
  criticalReviews?: number;
}

export default function AimAutomationShell({
  children,
  activeView,
  onViewChange,
  locations,
  selectedLocationId,
  onLocationChange,
  pendingApprovals = 0,
  openAlerts = 0,
  criticalReviews = 0,
}: AimAutomationShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { view: 'overview', label: 'Overview', icon: LayoutDashboard },
    { view: 'content-queue', label: 'Content Queue', icon: ListChecks },
    { view: 'approval-center', label: 'Approval Center', icon: CheckSquare, badge: pendingApprovals },
    { view: 'review-triage', label: 'Review Triage', icon: MessageSquare, badge: criticalReviews },
    { view: 'exception-center', label: 'Exception Center', icon: AlertTriangle, badge: openAlerts },
    { view: 'campaign-health', label: 'Campaign Health', icon: BarChart3 },
    { view: 'locations', label: 'Locations', icon: MapPin },
    { view: 'integrations', label: 'Integrations', icon: Plug },
    { view: 'policy-rules', label: 'Policy Rules', icon: Shield },
    { view: 'audit-log', label: 'Audit Log', icon: ScrollText },
    { view: 'settings', label: 'Settings', icon: Settings },
  ];

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-none">AIM Automation</p>
            <p className="text-gray-400 text-xs mt-0.5">Control System</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-800">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Location</label>
          <select
            value={selectedLocationId ?? ''}
            onChange={e => onLocationChange(e.target.value || null)}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          {selectedLocation && (
            <p className="text-xs text-gray-500 mt-1">{selectedLocation.city}, {selectedLocation.province}</p>
          )}
        </div>
      )}

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => { onViewChange(item.view); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium group relative ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {collapsed && item.badge != null && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className={`hidden lg:flex flex-col bg-gray-900 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-gray-900 flex flex-col h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {navItems.find(n => n.view === activeView)?.label}
              </h1>
              {selectedLocation && (
                <p className="text-xs text-gray-500 mt-0.5">{selectedLocation.name} · {selectedLocation.city}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(pendingApprovals + openAlerts + criticalReviews) > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <Bell className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {pendingApprovals + openAlerts + criticalReviews} items need attention
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
