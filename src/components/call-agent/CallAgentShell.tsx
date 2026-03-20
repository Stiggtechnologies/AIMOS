import { useState } from 'react';
import { Phone, Calendar, Settings, PhoneCall, Activity, Bot } from 'lucide-react';
import { CallSessionsView } from './CallSessionsView';
import { CallSessionDetail } from './CallSessionDetail';
import { AppointmentsDashboard } from './AppointmentsDashboard';
import { BookingQueueView } from './BookingQueueView';
import { CallAgentConfigView } from './CallAgentConfigView';
import { CallAgentEventsView } from './CallAgentEventsView';
import type { CallSession } from '../../services/aiCallAgentService';

type Tab = 'sessions' | 'appointments' | 'queue' | 'events' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'sessions',      label: 'Call Sessions',  icon: Phone,     description: 'Live call log' },
  { key: 'appointments',  label: 'Appointments',   icon: Calendar,  description: 'Booking pipeline' },
  { key: 'queue',         label: 'Booking Queue',  icon: PhoneCall, description: 'Action required' },
  { key: 'events',        label: 'Events Log',     icon: Activity,  description: 'Automation events' },
  { key: 'settings',      label: 'Configuration',  icon: Settings,  description: 'Agent settings' },
];

export function CallAgentShell() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Module Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">AI Call Agent</h1>
            <p className="text-xs text-gray-400 mt-0.5">Automated inbound call handling &amp; booking</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Tab Nav */}
        <nav className="flex items-center gap-0 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'sessions' && (
          <CallSessionsView onSelectSession={setSelectedSession} />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsDashboard />
        )}
        {activeTab === 'queue' && (
          <BookingQueueView onSelectSession={setSelectedSession} />
        )}
        {activeTab === 'events' && (
          <CallAgentEventsView />
        )}
        {activeTab === 'settings' && (
          <CallAgentConfigView />
        )}
      </div>

      {/* ── Session Detail Slide-in ── */}
      {selectedSession && (
        <CallSessionDetail
          sessionId={selectedSession.id}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
