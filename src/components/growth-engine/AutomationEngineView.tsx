import React, { useState } from 'react';
import { Zap, Phone, MessageSquare, Calendar, Star, Play, Pause, Settings, ChevronRight, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, RefreshCw, ToggleLeft, ToggleRight, ArrowRight, Send } from 'lucide-react';

interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  description: string;
  steps: { delay: string; action: string; channel: string }[];
  enabled: boolean;
  firedToday: number;
  successRate: number;
  category: 'lead' | 'appointment' | 'retention';
  icon: React.ElementType;
  color: string;
}

const DEFAULT_FLOWS: AutomationFlow[] = [
  {
    id: 'missed-call-sms',
    name: 'Missed Call → Instant SMS',
    trigger: 'call_missed',
    description: 'Auto-SMS within 60 seconds of a missed call to prevent lead loss.',
    steps: [
      { delay: '0:60', action: 'Send SMS: "Hi! You just called AIM. We missed you — reply to book or call back at (780) 469-4IM"', channel: 'sms' },
      { delay: '2:00', action: 'Create lead record in CRM with channel_source = phone', channel: 'crm' },
      { delay: '1:00:00', action: 'If no reply: send follow-up SMS with booking link', channel: 'sms' },
    ],
    enabled: true,
    firedToday: 7,
    successRate: 68,
    category: 'lead',
    icon: Phone,
    color: 'blue',
  },
  {
    id: 'new-lead-sequence',
    name: 'New Lead Follow-Up Sequence',
    trigger: 'lead_created',
    description: '3-touch follow-up sequence for all new inbound leads.',
    steps: [
      { delay: '0:05', action: 'Send welcome SMS with clinic info and team name', channel: 'sms' },
      { delay: '0:30', action: 'Staff alert: call lead within 30 minutes (SLA)', channel: 'crm' },
      { delay: '24:00', action: 'If not contacted: reminder SMS + staff notification', channel: 'sms' },
      { delay: '72:00', action: 'If still new: final SMS + auto-escalate priority to High', channel: 'sms' },
    ],
    enabled: true,
    firedToday: 14,
    successRate: 81,
    category: 'lead',
    icon: MessageSquare,
    color: 'green',
  },
  {
    id: 'no-show-rebooking',
    name: 'No-Show → Rebooking',
    trigger: 'appointment_no_show',
    description: 'Automatically reach out to no-shows and offer rebooking within 24h.',
    steps: [
      { delay: '0:30', action: 'Send SMS: "We missed you today! Let\'s rebook — reply or call us."', channel: 'sms' },
      { delay: '2:00:00', action: 'Send email with online booking link if email on file', channel: 'email' },
      { delay: '24:00:00', action: 'Staff task: personal call attempt', channel: 'crm' },
      { delay: '48:00:00', action: 'Final SMS: offer different time or location', channel: 'sms' },
    ],
    enabled: true,
    firedToday: 3,
    successRate: 55,
    category: 'appointment',
    icon: Calendar,
    color: 'amber',
  },
  {
    id: 'orthotics-delayed-followup',
    name: 'Orthotics Lead — Delayed Follow-Up',
    trigger: 'lead_created (funnel_type=orthotics)',
    description: 'Orthotics leads need longer consideration time — nurture over 2 weeks.',
    steps: [
      { delay: '0:05', action: 'Send welcome SMS with orthotics info sheet link', channel: 'sms' },
      { delay: '3 days', action: 'Send email: "Custom orthotics covered by most benefit plans"', channel: 'email' },
      { delay: '7 days', action: 'SMS reminder: assessment spots filling up', channel: 'sms' },
      { delay: '14 days', action: 'Final SMS: last chance — seasonal promotion', channel: 'sms' },
    ],
    enabled: true,
    firedToday: 2,
    successRate: 44,
    category: 'lead',
    icon: Clock,
    color: 'teal',
  },
  {
    id: 'completed-care-review',
    name: 'Completed Care → Review Request',
    trigger: 'lead_status_changed (status=completed)',
    description: 'Request Google review after patient completes their care plan.',
    steps: [
      { delay: '1:00:00', action: 'Send SMS: "We hope your recovery went great! Could you leave us a review?"', channel: 'sms' },
      { delay: '3 days', action: 'If no review: send email with direct Google review link', channel: 'email' },
    ],
    enabled: true,
    firedToday: 5,
    successRate: 38,
    category: 'retention',
    icon: Star,
    color: 'rose',
  },
  {
    id: 'employer-nurture',
    name: 'Employer Lead Nurture',
    trigger: 'lead_created (funnel_type=employer)',
    description: 'B2B employers need formal follow-up — email sequence over 2 weeks.',
    steps: [
      { delay: '0:30', action: 'Send employer info package via email', channel: 'email' },
      { delay: '2 days', action: 'SMS: "Did you receive our employer guide?"', channel: 'sms' },
      { delay: '7 days', action: 'Email: case study + WCB cost savings data', channel: 'email' },
      { delay: '14 days', action: 'Call task assigned to senior rep', channel: 'crm' },
    ],
    enabled: false,
    firedToday: 0,
    successRate: 29,
    category: 'lead',
    icon: Zap,
    color: 'sky',
  },
];

const CHANNEL_STYLES: Record<string, string> = {
  sms:   'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  crm:   'bg-gray-100 text-gray-700',
  call:  'bg-amber-100 text-amber-700',
};

const COLOR_MAP: Record<string, { bg: string; ring: string; icon: string; badge: string }> = {
  blue:  { bg: 'bg-blue-100',   ring: 'ring-blue-300',   icon: 'text-blue-600',  badge: 'bg-blue-500' },
  green: { bg: 'bg-green-100',  ring: 'ring-green-300',  icon: 'text-green-600', badge: 'bg-green-500' },
  amber: { bg: 'bg-amber-100',  ring: 'ring-amber-300',  icon: 'text-amber-600', badge: 'bg-amber-500' },
  teal:  { bg: 'bg-teal-100',   ring: 'ring-teal-300',   icon: 'text-teal-600',  badge: 'bg-teal-500' },
  rose:  { bg: 'bg-rose-100',   ring: 'ring-rose-300',   icon: 'text-rose-600',  badge: 'bg-rose-500' },
  sky:   { bg: 'bg-sky-100',    ring: 'ring-sky-300',    icon: 'text-sky-600',   badge: 'bg-sky-500' },
};

export const AutomationEngineView: React.FC = () => {
  const [flows, setFlows] = useState<AutomationFlow[]>(DEFAULT_FLOWS);
  const [selected, setSelected] = useState<AutomationFlow | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setFlows(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const testFire = (id: string) => {
    setTestingId(id);
    setTimeout(() => setTestingId(null), 2000);
  };

  const totalFired = flows.reduce((s, f) => s + f.firedToday, 0);
  const enabledCount = flows.filter(f => f.enabled).length;
  const avgSuccess = Math.round(flows.filter(f => f.enabled).reduce((s, f) => s + f.successRate, 0) / enabledCount);

  const CATEGORIES = [
    { key: 'lead',        label: 'Lead Flows',     count: flows.filter(f => f.category === 'lead').length },
    { key: 'appointment', label: 'Appointments',   count: flows.filter(f => f.category === 'appointment').length },
    { key: 'retention',   label: 'Retention',      count: flows.filter(f => f.category === 'retention').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Automation Engine</h1>
              <p className="text-xs text-gray-500">n8n-ready webhook triggers for lead, appointment & retention flows</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-gray-900">{totalFired}</p>
                <p className="text-xs text-gray-400">Fired Today</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{enabledCount}/{flows.length}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{avgSuccess}%</p>
                <p className="text-xs text-gray-400">Avg Success</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Flow List */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <span key={c.key} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                  {c.label} ({c.count})
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {flows.map(flow => {
              const colors = COLOR_MAP[flow.color] ?? COLOR_MAP['blue'];
              const Icon = flow.icon;
              return (
                <button
                  key={flow.id}
                  onClick={() => setSelected(flow)}
                  className={`w-full text-left px-4 py-4 transition-colors ${
                    selected?.id === flow.id ? 'bg-amber-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${colors.icon}`} style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">{flow.name}</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{flow.trigger}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${flow.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {flow.enabled ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-xs text-gray-400">{flow.firedToday}× today</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Zap className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400">Select an automation flow</h3>
              <p className="text-sm text-gray-300 mt-1">to view steps, configure, and test-fire</p>
            </div>
          ) : (() => {
            const colors = COLOR_MAP[selected.color] ?? COLOR_MAP['blue'];
            const Icon = selected.icon;
            const liveFlow = flows.find(f => f.id === selected.id) ?? selected;
            return (
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                      <Icon className={`${colors.icon}`} style={{ width: 22, height: 22 }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                          Trigger: {selected.trigger}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                          {selected.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testFire(selected.id)}
                      disabled={testingId === selected.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {testingId === selected.id ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Testing…</>
                      ) : (
                        <><Send className="h-4 w-4" /> Test Fire</>
                      )}
                    </button>
                    <button
                      onClick={() => toggle(selected.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                        liveFlow.enabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {liveFlow.enabled ? (
                        <><Pause className="h-4 w-4" /> Pause</>
                      ) : (
                        <><Play className="h-4 w-4" /> Enable</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Fired Today',    value: `${liveFlow.firedToday}` },
                    { label: 'Success Rate',   value: `${liveFlow.successRate}%` },
                    { label: 'Status',         value: liveFlow.enabled ? 'Active' : 'Paused' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Steps */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-5">Automation Steps</h3>
                  <div className="space-y-4">
                    {selected.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {i + 1}
                          </div>
                          {i < selected.steps.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-500">+{step.delay}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_STYLES[step.channel] ?? 'bg-gray-100 text-gray-600'}`}>
                              {step.channel.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-4 py-3">
                            {step.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhook Info */}
                <div className="bg-gray-900 rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">n8n Webhook Trigger</span>
                  </div>
                  <div className="font-mono text-xs text-green-400 bg-black/30 rounded-lg px-4 py-3 break-all">
                    POST {'{SUPABASE_URL}'}/functions/v1/aim-workflow-event
                  </div>
                  <div className="font-mono text-xs text-gray-300 bg-black/30 rounded-lg px-4 py-3 leading-relaxed">
                    {JSON.stringify({
                      event_type: selected.trigger,
                      source: 'aim-crm',
                      target_type: 'lead',
                      target_id: '{lead_id}',
                      payload: { automation_id: selected.id },
                    }, null, 2)}
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
