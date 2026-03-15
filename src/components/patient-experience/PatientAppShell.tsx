import { useState } from 'react';
import { Chrome as Home, Calendar, Dumbbell, TrendingUp, MessageSquare, CreditCard, BookOpen, LogOut, Menu, X, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { PatientProfile } from '../../services/patientPortalService';

export type PatientView =
  | 'home'
  | 'appointments'
  | 'exercises'
  | 'progress'
  | 'messages'
  | 'billing'
  | 'education';

interface NavItem {
  view: PatientView;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface PatientAppShellProps {
  profile: PatientProfile;
  activeView: PatientView;
  onViewChange: (v: PatientView) => void;
  unreadMessages?: number;
  children: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'appointments', label: 'Appointments', icon: Calendar },
  { view: 'exercises', label: 'Exercises', icon: Dumbbell },
  { view: 'progress', label: 'Progress', icon: TrendingUp },
  { view: 'messages', label: 'Messages', icon: MessageSquare },
  { view: 'billing', label: 'Billing', icon: CreditCard },
  { view: 'education', label: 'Education', icon: BookOpen },
];

export default function PatientAppShell({
  profile,
  activeView,
  onViewChange,
  unreadMessages = 0,
  children,
}: PatientAppShellProps) {
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = NAV_ITEMS.map(item =>
    item.view === 'messages' ? { ...item, badge: unreadMessages || undefined } : item
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{profile.first_name} {profile.last_name}</p>
            <p className="text-xs text-gray-500">Patient Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unreadMessages > 0 && (
            <button
              onClick={() => { onViewChange('messages'); setMobileMenuOpen(false); }}
              className="relative p-1"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadMessages}
              </span>
            </button>
          )}
          <button onClick={() => setMobileMenuOpen(v => !v)} className="p-1">
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-white w-72 h-full shadow-xl flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-bold">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs text-gray-500">MRN: {profile.medical_record_number}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = activeView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => { onViewChange(item.view); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.badge ? (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{item.badge}</span>
                    ) : active ? (
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    ) : null}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{profile.first_name} {profile.last_name}</p>
                <p className="text-xs text-gray-500">MRN: {profile.medical_record_number}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onViewChange(item.view)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{item.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20 flex">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-colors ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge ? (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      {/* bottom padding for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
