import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter, UserPlus, Search, RefreshCw, X, Plus,
  ChevronDown,
} from 'lucide-react';
import {
  growthEngineService,
  PIPELINE_STAGES,
  FUNNEL_TYPES,
  type PipelineLead,
} from '../../services/growthEngineService';
import { LeadCard } from './LeadCard';
import { LeadDetailModal } from './LeadDetailModal';

const CHANNELS = [
  { slug: '',                         label: 'All Channels' },
  { slug: 'google-ads',              label: 'Google Ads' },
  { slug: 'google-business-profile', label: 'Google Business' },
  { slug: 'facebook-ads',            label: 'Facebook' },
  { slug: 'instagram',               label: 'Instagram' },
  { slug: 'tiktok',                  label: 'TikTok' },
  { slug: 'linkedin',                label: 'LinkedIn' },
  { slug: 'website-organic',         label: 'Organic' },
];

const NewLeadModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    channel_source: 'google-ads', funnel_type: 'physio',
    urgency_level: 'medium', intent_confidence: 'medium',
    lead_value_estimate: 450, notes: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.first_name || !form.phone) return;
    setSaving(true);
    try {
      await growthEngineService.createLead(form);
      onCreated();
      onClose();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );

  const input = (field: keyof typeof form, placeholder = '') => (
    <input
      value={form[field] as string}
      onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
      placeholder={placeholder}
      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
    />
  );

  const select = (field: keyof typeof form, options: { value: string; label: string }[]) => (
    <div className="relative">
      <select
        value={form[field] as string}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">New Lead</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <Field label="First Name *">
            {input('first_name', 'Jane')}
          </Field>
          <Field label="Last Name *">
            {input('last_name', 'Smith')}
          </Field>
          <Field label="Phone *">
            {input('phone', '+1 780 555 0100')}
          </Field>
          <Field label="Email">
            {input('email', 'jane@example.com')}
          </Field>
          <Field label="Channel Source">
            {select('channel_source', CHANNELS.filter(c => c.slug).map(c => ({ value: c.slug, label: c.label })))}
          </Field>
          <Field label="Funnel Type">
            {select('funnel_type', FUNNEL_TYPES.map(f => ({ value: f.key, label: f.label })))}
          </Field>
          <Field label="Urgency">
            {select('urgency_level', [
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ])}
          </Field>
          <Field label="Intent">
            {select('intent_confidence', [
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ])}
          </Field>
          <Field label="Est. Value ($)">
            <input
              type="number"
              value={form.lead_value_estimate}
              onChange={e => setForm(prev => ({ ...prev, lead_value_estimate: Number(e.target.value) }))}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </Field>
          <Field label="Notes">
            {input('notes', 'Optional notes...')}
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
          <button
            onClick={save}
            disabled={!form.first_name || !form.phone || saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Saving…' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const LeadPipelineKanban: React.FC = () => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PipelineLead | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterFunnel, setFilterFunnel] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await growthEngineService.getPipelineLeads({ limit: 300 });
      setLeads(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { setRefreshing(true); load(); };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    if (q && !`${l.first_name} ${l.last_name} ${l.phone} ${l.email ?? ''}`.toLowerCase().includes(q)) return false;
    if (filterChannel && l.channel_source !== filterChannel) return false;
    if (filterFunnel && l.funnel_type !== filterFunnel) return false;
    return true;
  });

  const byStage = (stageKey: string) => filtered.filter(l => l.status === stageKey);

  const handleStatusChange = (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
  };

  const VISIBLE_STAGES = PIPELINE_STAGES.slice(0, 6);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Lead Pipeline</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {filtered.length} leads
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads…"
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 w-44"
              />
            </div>

            {/* Channel filter */}
            <div className="relative">
              <select
                value={filterChannel}
                onChange={e => setFilterChannel(e.target.value)}
                className="text-sm pl-3 pr-7 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none bg-white"
              >
                {CHANNELS.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Funnel filter */}
            <div className="relative">
              <select
                value={filterFunnel}
                onChange={e => setFilterFunnel(e.target.value)}
                className="text-sm pl-3 pr-7 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none bg-white"
              >
                <option value="">All Funnels</option>
                {FUNNEL_TYPES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(filterChannel || filterFunnel || search) && (
              <button onClick={() => { setSearch(''); setFilterChannel(''); setFilterFunnel(''); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-2 hover:bg-gray-100 rounded-lg">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}

            <button onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-colors">
              <UserPlus className="h-4 w-4" />
              New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="flex gap-4 min-w-max h-full">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = byStage(stage.key);
            const totalValue = stageLeads.reduce((s, l) => s + (l.lead_value_estimate || 0), 0);
            return (
              <div key={stage.key} className="w-72 flex flex-col">
                {/* Stage Header */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${stage.color}`}>
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    {totalValue > 0 && (
                      <span className="text-xs font-medium opacity-75">
                        ${totalValue.toLocaleString()}
                      </span>
                    )}
                    <span className="w-5 h-5 bg-white/40 rounded-full flex items-center justify-center text-xs font-bold">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                  {stageLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">No leads</p>
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => setSelected(lead)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </div>
  );
};
