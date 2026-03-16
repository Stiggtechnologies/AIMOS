import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Settings, Stethoscope, DollarSign, TrendingUp, ChartBar as BarChart3, Compass, Cog, Menu, X, Bell, Search, LogOut, ChevronRight, ChevronDown, CircleUser as UserCircle, Users, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { moduleConfig, filterSubItemsByRole, type NavModule } from '../../config/navigation';
import { GlobalSearch } from '../GlobalSearch';
import { ToastContainer } from '../shared/Toast';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useToast } from '../../hooks/useToast';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { notificationService } from '../../services/notificationService';
import type { ModuleKey } from '../../types/enterprise';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Settings,
  Stethoscope,
  DollarSign,
  TrendingUp,
  BarChart3,
  Compass,
  Cog,
  Users,
  Package
};

interface EnterpriseShellProps {
  children: (props: { currentModule: ModuleKey; currentSubModule: string; onNavigate: (module: ModuleKey, subModule: string) => void }) => React.ReactNode;
}

export function EnterpriseShell({ children }: EnterpriseShellProps) {
  const { user, profile, signOut } = useAuth();
  const [currentModule, setCurrentModule] = useState<ModuleKey>('command_center');
  const [currentSubModule, setCurrentSubModule] = useState('overview');
  const [expandedModules, setExpandedModules] = useState<Set<ModuleKey>>(new Set(['command_center']));
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toasts, removeToast } = useToast();

  const accessibleModules = useMemo(() => {
    const roleLevel = profile?.role === 'executive' ? 'corporate' :
                      profile?.role === 'clinic_manager' ? 'clinic' :
                      profile?.role === 'clinician' ? 'clinical' :
                      profile?.role === 'admin' ? 'corporate' : 'support';

    const modulesByLevel: Record<string, ModuleKey[]> = {
      corporate: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'strategy', 'workforce', 'supply_chain', 'admin'],
      regional: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'workforce'],
      clinic: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'workforce', 'supply_chain'],
      clinical: ['command_center', 'clinical', 'operations'],
      support: ['command_center', 'operations', 'revenue']
    };

    return modulesByLevel[roleLevel] || ['command_center'];
  }, [profile?.role]);

  const filteredModules = useMemo(() => {
    return moduleConfig.filter(m => accessibleModules.includes(m.key));
  }, [accessibleModules]);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
        loadUnreadCount();
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNavigate = (module: ModuleKey, subModule: string) => {
    setCurrentModule(module);
    setCurrentSubModule(subModule);
    setExpandedModules(prev => new Set([...prev, module]));
    setMobileMenuOpen(false);
  };

  const toggleModule = (moduleKey: ModuleKey) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };

  const getModuleIcon = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />;
  };

  const getModuleColor = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-gray-400 group-hover:text-white';

    const colors: Record<string, string> = {
      blue: 'text-blue-400',
      emerald: 'text-emerald-400',
      teal: 'text-teal-400',
      amber: 'text-amber-400',
      rose: 'text-rose-400',
      cyan: 'text-cyan-400',
      sky: 'text-sky-400',
      orange: 'text-orange-400',
      stone: 'text-stone-400',
      slate: 'text-slate-400'
    };
    return colors[color] || 'text-blue-400';
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 flex">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            ${sidebarOpen ? 'lg:translate-x-0' : 'lg:translate-x-0'}
            ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
            fixed lg:sticky top-0 h-screen
            w-72 bg-gray-900 text-white
            transition-all duration-300 ease-in-out
            overflow-hidden flex flex-col z-50
            lg:z-auto
          `}
        >
          <div className={`p-4 ${sidebarCollapsed ? 'px-3' : 'px-5'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              {!sidebarCollapsed && (
                <div className="w-32 bg-white p-1.5 rounded-lg">
                  <img
                    src="/aim-logo-28oct18-resized.jpg"
                    alt="AIM"
                    className="w-full h-auto"
                  />
                </div>
              )}
              {sidebarCollapsed && (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
                  A
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="mt-3">
                <h1 className="text-lg font-bold">AIM OS</h1>
                <p className="text-xs text-gray-400">Enterprise Platform</p>
              </div>
            )}
          </div>

          <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin">
            {filteredModules.map(module => {
              const isExpanded = expandedModules.has(module.key);
              const isActiveModule = currentModule === module.key;
              const filteredSubItems = filterSubItemsByRole(module.subItems, profile?.role || '');

              return (
                <div key={module.key} className="mb-1">
                  <button
                    onClick={() => {
                      if (sidebarCollapsed) {
                        handleNavigate(module.key, module.subItems[0]?.key || 'overview');
                      } else {
                        toggleModule(module.key);
                        if (!isExpanded) {
                          handleNavigate(module.key, module.subItems[0]?.key || 'overview');
                        }
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${isActiveModule ? 'bg-gray-800' : 'hover:bg-gray-800'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={getModuleColor(module.color, isActiveModule)}>
                        {getModuleIcon(module.icon)}
                      </span>
                      {!sidebarCollapsed && (
                        <span className={`font-medium ${isActiveModule ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {module.label}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="text-gray-500">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    )}
                  </button>

                  {!sidebarCollapsed && isExpanded && (
                    <div className="mt-1 ml-3 pl-5 border-l border-gray-700 space-y-0.5">
                      {filteredSubItems.map(subItem => {
                        const isActiveSubItem = isActiveModule && currentSubModule === subItem.key;
                        return (
                          <button
                            key={subItem.key}
                            onClick={() => handleNavigate(module.key, subItem.key)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                              transition-colors
                              ${isActiveSubItem ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                            `}
                          >
                            <span>{subItem.label}</span>
                            {subItem.badge && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {subItem.badge.value || '!'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={`p-3 border-t border-gray-800 ${sidebarCollapsed ? 'px-2' : ''}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-3 px-2">
                <UserCircle className="h-9 w-9 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{profile?.first_name} {profile?.last_name}</div>
                  <div className="text-xs text-gray-400 capitalize">{profile?.role?.replace('_', ' ')}</div>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex flex-1 items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
              <button
                onClick={signOut}
                className={`flex items-center justify-center space-x-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors ${sidebarCollapsed ? 'w-full' : 'flex-1'}`}
              >
                <LogOut className="h-4 w-4" />
                {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="hidden sm:block">
                  <nav className="flex items-center space-x-1 text-sm">
                    <span className="text-gray-500">{filteredModules.find(m => m.key === currentModule)?.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {filteredModules.find(m => m.key === currentModule)?.subItems.find(s => s.key === currentSubModule)?.label || 'Overview'}
                    </span>
                  </nav>
                </div>
              </div>

              <div className="flex items-center space-x-2 lg:space-x-3">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-600" />
                  <span className="hidden sm:inline text-sm text-gray-600">Search...</span>
                  <kbd className="hidden lg:inline-block px-2 py-0.5 bg-white rounded text-xs text-gray-500 border">
                    ⌘K
                  </kbd>
                </button>
                <button
                  onClick={() => handleNavigate('command_center', 'notifications')}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children({ currentModule, currentSubModule, onNavigate: handleNavigate })}
          </main>
        </div>

        <GlobalSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={() => {
            setSearchOpen(false);
          }}
        />

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </ErrorBoundary>
  );
}
