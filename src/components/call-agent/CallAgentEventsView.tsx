import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AutomationEvent {
  id: string;
  timestamp: Date;
  type: 'call_started' | 'intent_detected' | 'booking_created' | 'sms_sent' | 'error';
  sessionId: string;
  message: string;
  metadata?: Record<string, any>;
  status: 'success' | 'warning' | 'error';
}

export function CallAgentEventsView() {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with actual service call
    const mockEvents: AutomationEvent[] = [
      {
        id: '1',
        timestamp: new Date(),
        type: 'call_started',
        sessionId: 'CS-001',
        message: 'Incoming call received from +1 780 555 0123',
        status: 'success',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000),
        type: 'intent_detected',
        sessionId: 'CS-001',
        message: 'Booking intent detected - Physiotherapy appointment',
        status: 'success',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000),
        type: 'booking_created',
        sessionId: 'CS-001',
        message: 'Appointment booked for 2026-03-22 at 10:00 AM',
        status: 'success',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000),
        type: 'sms_sent',
        sessionId: 'CS-001',
        message: 'Confirmation SMS sent to patient',
        status: 'success',
      },
    ];

    setEvents(mockEvents);
    setLoading(false);
  }, []);

  const getEventIcon = (type: AutomationEvent['type'], status: AutomationEvent['status']) => {
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === 'warning') return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    
    switch (type) {
      case 'call_started':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'booking_created':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventColor = (status: AutomationEvent['status']) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'warning': return 'bg-yellow-50 border-yellow-100';
      case 'error': return 'bg-red-50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Automation Events Log</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Live event stream</span>
        </div>
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-4 rounded-lg border ${getEventColor(event.status)}`}
          >
            <div className="flex items-start gap-3">
              {getEventIcon(event.type, event.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{event.message}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    Session: {event.sessionId}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No events yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Automation events will appear here as calls are processed
          </p>
        </div>
      )}
    </div>
  );
}
