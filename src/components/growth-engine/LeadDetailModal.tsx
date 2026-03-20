import React, { useState, useEffect } from 'react';
import {
  X, Phone, Mail, Clock, MessageSquare, Send,
  ChevronDown, DollarSign, Calendar,
} from 'lucide-react';
import { growthEngineService, PIPELINE_STAGES, FUNNEL_TYPES, type PipelineLead, type LeadActivity } from '../../services/growthEngineService';

interface Props {
  lead: PipelineLead;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

const ACT_ICONS: Record<string, React.ElementType> = {
  call: Phone, sms: MessageSquare, email: Mail, note: Clock, dm: MessageSquare,
};

const fmt = (dt: string) => new Date(dt).toLocaleString('en-CA', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

export const LeadDetailModal: React.FC<Props> = ({ lead, onClose, onStatusChange }) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [note, setNote] = useState('');
  const [actType, setActType] = useState('note');
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState(lead.status);

  useEffect(() => {
    growthEngineService.getLeadActivities(lead.id).then(setActivities).catch(() => {});
  }, [lead.id]);

  const addActivity = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await growthEngineService.addActivity(lead.id, actType, note.trim());
      const updated = await growthEngineService.getLeadActivities(lead.id);
      setActivities(updated);
      setNote('');
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: string) => {
    setNewStatus(status);
    try {
      await growthEngineService.updateLeadStatus(lead.id, status);
      onStatusChange(lead.id, status);
    } catch { /* ignore */ }
  };

  const funnel = FUNNEL_TYPES.find(f => f.key === lead.funnel_type);
  const stage  = PIPELINE_STAGES.find(s => s.key === newStatus);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Lead · {new Date(lead.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                </div>
              )}
              {lead.contacted_at && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  Contacted {fmt(lead.contacted_at)}
                </div>
              )}
              {lead.booked_at && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  Booked {fmt(lead.booked_at)}
                </div>
              )}
              {lead.lead_value_estimate > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  Est. value: ${lead.lead_value_estimate.toLocaleString()}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {funnel && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${funnel.color}`}>
                    {funnel.label}
                  </span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stage?.color ?? 'bg-gray-100 text-gray-700'}`}>
                  {stage?.label ?? lead.status}
                </span>
                {lead.intent_confidence && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    lead.intent_confidence === 'high' ? 'bg-green-100 text-green-700' :
                    lead.intent_confidence === 'low'  ? 'bg-gray-100 text-gray-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {lead.intent_confidence} intent
                  </span>
                )}
              </div>
              {lead.notes && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                  {lead.notes}
                </p>
              )}
            </div>
          </div>

          {/* Status Changer */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Move to Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => changeStatus(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                    newStatus === s.key
                      ? `${s.color} border-transparent ring-2 ring-offset-1 ${s.ring}`
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Activity ({activities.length})
            </label>
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No activities yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activities.map(act => {
                  const Icon = ACT_ICONS[act.activity_type] ?? Clock;
                  return (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed">{act.notes}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(act.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Activity */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Log Activity</label>
              <div className="relative">
                <select
                  value={actType}
                  onChange={e => setActType(e.target.value)}
                  className="text-xs bg-white border border-gray-200 rounded-lg pl-2 pr-6 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="dm">DM</option>
                </select>
                <ChevronDown className="h-3 w-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addActivity()}
                placeholder="Add a note..."
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
              <button
                onClick={addActivity}
                disabled={!note.trim() || saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
