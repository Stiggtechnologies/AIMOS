import { useState } from 'react';
import { Phone, Calendar, List, Settings, PhoneCall } from 'lucide-react';
import { CallSessionsView } from './CallSessionsView';
import { CallSessionDetail } from './CallSessionDetail';
import { AppointmentsDashboard } from './AppointmentsDashboard';
import { BookingQueueView } from './BookingQueueView';
import { CallAgentConfigView } from './CallAgentConfigView';
import type { CallSession } from '../../services/aiCallAgentService';

type Tab = 'sessions' | 'appointments' | 'queue' | 'settings';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'sessions', label: 'Call Sessions', icon: Phone },
  { key: 'appointments', label: 'Appointments', icon: Calendar },
  { key: 'queue', label: 'Booking Queue', icon: PhoneCall },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function CallAgentShell() {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [selectedSession, setSelectedSession] = useState<CallSession | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex items-center gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
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
        {activeTab === 'settings' && (
          <CallAgentConfigView />
        )}
      </div>

      {/* Session Detail Drawer */}
      {selectedSession && (
        <CallSessionDetail
          sessionId={selectedSession.id}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
