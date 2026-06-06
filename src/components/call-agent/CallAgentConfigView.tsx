import { useEffect, useState } from 'react';
import {
  Settings, Save, Phone, MessageSquare, Clock, MapPin, User,
  ChevronDown, ChevronUp, Mic, Bell, Shield, RefreshCw
} from 'lucide-react';
import { aiCallAgentService, AIClinicLocation, AIPractitioner } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface ConfigData {
  id: string;
  greeting_script: string;
  after_hours_behavior: string;
  sms_confirmation_template: string;
  sms_callback_template: string;
  sms_followup_template: string;
  max_wait_seconds: number;
  fallback_to_staff: boolean;
  active: boolean;
  business_hours: Record<string, string>;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5 mt-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function CallAgentConfigView() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [locations, setLocations] = useState<AIClinicLocation[]>([]);
  const [practitioners, setPractitioners] = useState<AIPractitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { error: showError, success } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cfg, locs, practs] = await Promise.all([
          aiCallAgentService.getConfig(),
          aiCallAgentService.getAllLocations(),
          aiCallAgentService.getPractitioners(),
        ]);
        if (cfg) setConfig(cfg as unknown as ConfigData);
        setLocations(locs);
        setPractitioners(practs);
      } catch {
        showError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      await aiCallAgentService.updateConfig(config.id, config as unknown as Record<string, unknown>);
      success('Configuration saved');
    } catch {
      showError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<ConfigData>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateBusinessHours = (day: string, value: string) => {
    setConfig(prev => prev ? {
      ...prev,
      business_hours: { ...prev.business_hours, [day]: value }
    } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Settings className="h-10 w-10 text-gray-300" />
        <p className="text-gray-500">No configuration found. Please seed the database first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Agent Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure AI call agent behavior, scripts, and templates</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* General Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">AI Call Agent Status</p>
            <p className="text-sm text-gray-500">Enable or disable the AI call agent globally</p>
          </div>
          <button
            onClick={() => updateConfig({ active: !config.active })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.active ? 'bg-green-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Greeting Script */}
      <Section title="Greeting & Scripts" icon={Mic}>
        <TextAreaField
          label="Opening Greeting Script"
          value={config.greeting_script}
          onChange={v => updateConfig({ greeting_script: v })}
          placeholder="Thank you for calling AIM..."
          rows={3}
        />
        <div className="mt-4 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Max Wait Before Fallback (seconds)</label>
          <input
            type="number"
            value={config.max_wait_seconds}
            onChange={e => updateConfig({ max_wait_seconds: Number(e.target.value) })}
            className="w-32 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="fallback"
            checked={config.fallback_to_staff}
            onChange={e => updateConfig({ fallback_to_staff: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="fallback" className="text-sm text-gray-700">Fallback to live staff if AI cannot complete booking</label>
        </div>
      </Section>

      {/* After Hours */}
      <Section title="After-Hours Behavior" icon={Clock}>
        <div className="mt-4 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">After-Hours Mode</label>
          <select
            value={config.after_hours_behavior}
            onChange={e => updateConfig({ after_hours_behavior: e.target.value })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="voicemail">Voicemail Only</option>
            <option value="callback_intake">Callback Intake (collect info)</option>
            <option value="next_available_booking">Book Next Available Slot</option>
            <option value="emergency_disclaimer">Emergency Disclaimer Message</option>
          </select>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Business Hours</p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {DAYS.map(day => (
              <div key={day} className="flex items-center justify-between px-4 py-2.5 bg-white">
                <span className="text-sm text-gray-700 w-28">{DAY_LABELS[day]}</span>
                <input
                  type="text"
                  value={config.business_hours?.[day] || ''}
                  onChange={e => updateBusinessHours(day, e.target.value)}
                  placeholder="8:00-18:00 or closed"
                  className="text-sm px-3 py-1 border border-gray-200 rounded-lg w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Format: 8:00-18:00 or "closed"</p>
        </div>
      </Section>

      {/* SMS Templates */}
      <Section title="SMS Templates" icon={MessageSquare}>
        <div className="mt-4 text-xs text-gray-500 bg-blue-50 rounded-lg px-4 py-3 mb-2">
          Available variables: <code className="font-mono">{'{{name}}'}</code>, <code className="font-mono">{'{{location}}'}</code>, <code className="font-mono">{'{{date}}'}</code>, <code className="font-mono">{'{{time}}'}</code>, <code className="font-mono">{'{{window}}'}</code>
        </div>
        <TextAreaField
          label="Appointment Confirmation SMS"
          value={config.sms_confirmation_template}
          onChange={v => updateConfig({ sms_confirmation_template: v })}
        />
        <TextAreaField
          label="Callback Scheduled SMS"
          value={config.sms_callback_template}
          onChange={v => updateConfig({ sms_callback_template: v })}
        />
        <TextAreaField
          label="Missed Call Follow-up SMS"
          value={config.sms_followup_template}
          onChange={v => updateConfig({ sms_followup_template: v })}
        />
      </Section>

      {/* Clinic Locations */}
      <Section title="Clinic Locations" icon={MapPin} defaultOpen={false}>
        <div className="mt-4 space-y-2">
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">{loc.name}</p>
                <p className="text-xs text-gray-500">{loc.address}, {loc.city} · {loc.phone}</p>
                <div className="flex gap-1 mt-1">
                  {(loc.services_offered || []).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {loc.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Practitioners */}
      <Section title="Practitioners" icon={User} defaultOpen={false}>
        <div className="mt-4 space-y-2">
          {practitioners.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">{p.title}</p>
                <div className="flex gap-1 mt-1">
                  {p.accepts_wcb && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">WCB</span>}
                  {p.accepts_mva && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">MVA</span>}
                  {p.accepts_new_patients && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">New Patients</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Priority: {p.booking_priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Save Footer */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
