import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import {
  LayoutDashboard, Briefcase, Users, Bot, TrendingUp, Menu, X,
  Building2, BookOpen, Shield, Megaphone, LogOut, UserCircle, Cpu, Zap, Settings, Brain,
  Rocket, Handshake, Bell, Search, Target
} from 'lucide-react';
import { GlobalSearch } from './components/GlobalSearch';
import { NotificationsCenter } from './components/NotificationsCenter';
import { ToastContainer } from './components/shared/Toast';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { useToast } from './hooks/useToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { notificationService } from './services/notificationService';

import IntranetDashboard from './components/intranet/IntranetDashboard';
import ClinicsView from './components/intranet/ClinicsView';
import PeopleView from './components/intranet/PeopleView';
import AcademyView from './components/intranet/AcademyView';
import ComplianceView from './components/intranet/ComplianceView';
import AnnouncementsView from './components/intranet/AnnouncementsView';
import DocumentLibraryView from './components/intranet/DocumentLibraryView';
import DashboardsView from './components/intranet/DashboardsView';
import SOPHubView from './components/intranet/SOPHubView';
import FormsView from './components/intranet/FormsView';

import Dashboard from './components/Dashboard';
import JobsView from './components/JobsView';
import CandidatePipeline from './components/CandidatePipeline';
import AgentsView from './components/AgentsView';
import AnalyticsView from './components/AnalyticsView';

import AIMOSDashboard from './components/aim-os/AIMOSDashboard';
import GrowthOSDashboard from './components/growth-os/GrowthOSDashboard';
import OperationsEngineView from './components/operations/OperationsEngineView';
import AIAssistantDashboard from './components/AIAssistantDashboard';
import LaunchManagementDashboard from './components/launches/LaunchManagementDashboard';
import PartnerClinicsView from './components/partners/PartnerClinicsView';
import PatientPortalDashboard from './components/patient/PatientPortalDashboard';
import ClinicianMobileDashboard from './components/clinician/ClinicianMobileDashboard';
import { ExcellenceDemoView } from './components/operations/ExcellenceDemoView';
import CRMDashboard from './components/crm/CRMDashboard';
import { AgentExecutionDashboard } from './components/agents/AgentExecutionDashboard';
import { ClinicalIntelligenceDashboard } from './components/aim-os';

type View = 'dashboard' | 'clinics' | 'people' | 'academy' | 'compliance' | 'announcements' | 'documents' |
  'dashboards' | 'sops' | 'forms' | 'operations' | 'aim-os' | 'growth-os' | 'ai-assistant' | 'launches' | 'partners' |
  'talent-dashboard' | 'talent-jobs' | 'talent-pipeline' | 'talent-agents' | 'talent-analytics' | 'notifications' |
  'patient-portal' | 'clinician-mobile' | 'excellence-demo' | 'crm' | 'agent-execution' | 'clinical-intelligence';

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toasts, removeToast, success } = useToast();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage />;
  }

  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { key: 'ai-assistant', label: 'AI Assistant', icon: Brain, section: 'main' },
    { key: 'agent-execution', label: 'Agent Execution', icon: Bot, section: 'main', roles: ['executive', 'admin', 'operations'] },
    { key: 'clinical-intelligence', label: 'Clinical Intelligence', icon: BookOpen, section: 'main', roles: ['executive', 'admin', 'clinician'] },
    { key: 'crm', label: 'CRM Automation', icon: Target, section: 'main' },
    { key: 'excellence-demo', label: 'Excellence Demo', icon: Zap, section: 'main', roles: ['executive', 'admin'] },
    { key: 'clinician-mobile', label: 'Clinician Mobile', icon: UserCircle, section: 'main', roles: ['clinician', 'executive', 'admin'] },
    { key: 'clinics', label: 'Clinics', icon: Building2, section: 'main' },
    { key: 'people', label: 'People', icon: Users, section: 'main' },
    { key: 'launches', label: 'Clinic Launches', icon: Rocket, section: 'main' },
    { key: 'partners', label: 'Partner Clinics', icon: Handshake, section: 'main' },
    { key: 'academy', label: 'Academy', icon: BookOpen, section: 'main' },
    { key: 'compliance', label: 'Compliance', icon: Shield, section: 'main' },
    { key: 'announcements', label: 'Announcements', icon: Megaphone, section: 'main' },
    { key: 'operations', label: 'Operations', icon: Settings, section: 'main' },
    { key: 'aim-os', label: 'AIM OS', icon: Cpu, section: 'main' },
    { key: 'growth-os', label: 'Growth OS', icon: Zap, section: 'main' },
  ];

  const talentNavigation = [
    { key: 'talent-dashboard', label: 'Overview', icon: LayoutDashboard },
    { key: 'talent-jobs', label: 'Jobs', icon: Briefcase },
    { key: 'talent-pipeline', label: 'Pipeline', icon: Users },
    { key: 'talent-agents', label: 'AI Agents', icon: Bot },
    { key: 'talent-analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const canViewTalent = profile.role === 'executive' || profile.role === 'admin';

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <IntranetDashboard onNavigate={(view) => setCurrentView(view as View)} />;
      case 'ai-assistant': return <AIAssistantDashboard />;
      case 'agent-execution': return <AgentExecutionDashboard />;
      case 'clinical-intelligence': return <ClinicalIntelligenceDashboard />;
      case 'crm': return <CRMDashboard />;
      case 'clinics': return <ClinicsView />;
      case 'people': return <PeopleView />;
      case 'launches': return <LaunchManagementDashboard />;
      case 'partners': return <PartnerClinicsView />;
      case 'academy': return <AcademyView />;
      case 'compliance': return <ComplianceView />;
      case 'announcements': return <AnnouncementsView />;
      case 'documents': return <DocumentLibraryView />;
      case 'dashboards': return <DashboardsView />;
      case 'sops': return <SOPHubView />;
      case 'forms': return <FormsView />;
      case 'operations': return <OperationsEngineView />;
      case 'excellence-demo': return <ExcellenceDemoView />;
      case 'aim-os': return <AIMOSDashboard />;
      case 'growth-os': return <GrowthOSDashboard />;
      case 'notifications': return <NotificationsCenter />;
      case 'patient-portal': return <PatientPortalDashboard />;
      case 'clinician-mobile': return <ClinicianMobileDashboard />;
      case 'talent-dashboard': return <Dashboard />;
      case 'talent-jobs': return <JobsView />;
      case 'talent-pipeline': return <CandidatePipeline />;
      case 'talent-agents': return <AgentsView />;
      case 'talent-analytics': return <AnalyticsView />;
      default: return <IntranetDashboard onNavigate={(view) => setCurrentView(view as View)} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            ${sidebarOpen ? 'lg:translate-x-0 lg:w-64' : 'lg:translate-x-0 lg:w-0'}
            fixed lg:sticky top-0 h-screen
            w-64 bg-gray-900 text-white
            transition-all duration-300 ease-in-out
            overflow-hidden flex flex-col z-50
            lg:z-auto scrollbar-thin
          `}
        >
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="w-40 mb-3 bg-white p-2 rounded-lg">
              <img
                src="/aim-logo-28oct18-resized.jpg"
                alt="Alberta Injury Management"
                className="w-full h-auto"
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold">AIM OS</h1>
              <p className="text-xs text-gray-400">Operating System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin">
          <div className="mb-6">
            {navigation.filter(item => {
              if (item.roles) {
                return item.roles.includes(profile.role);
              }
              return true;
            }).map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setCurrentView(item.key as View);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {canViewTalent && (
            <div className="border-t border-gray-800 pt-4 mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Talent Acquisition
              </div>
              {talentNavigation.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentView(item.key as View);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <UserCircle className="h-8 w-8 text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile.first_name} {profile.last_name}</div>
              <div className="text-xs text-gray-400 capitalize">{profile.role.replace('_', ' ')}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              {/* Desktop sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-2 px-3 lg:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Open search"
              >
                <Search className="h-4 w-4 text-gray-600" />
                <span className="hidden sm:inline text-sm text-gray-600">Search...</span>
                <kbd className="hidden md:inline-block px-2 py-1 bg-white rounded text-xs text-gray-500 border border-gray-300">⌘K</kbd>
              </button>
              <button
                onClick={() => {
                  setCurrentView('notifications');
                  setMobileMenuOpen(false);
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">Alberta Injury Management Inc.</p>
                <p className="text-xs text-gray-500">Internal Operating System</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderView()}
        </main>
      </div>

      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(url) => {
          setSearchOpen(false);
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
    </ErrorBoundary>
  );
}

export default App;
