import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, ChevronDown, ChevronUp, RefreshCw,
  CircleCheck as CheckCircle, Play, SquarePlus as PlusSquare,
  ListChecks, FileText, Zap, ArrowRight, ChevronRight
} from 'lucide-react';
import { enterpriseOSService, MeetingTemplate, MeetingSession, AgendaItem } from '../../services/enterpriseOSService';

const CADENCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; freq: string }> = {
  daily_huddle:            { label: 'Daily Huddle',         color: 'text-teal-700',  bg: 'bg-teal-50',  border: 'border-teal-200', freq: 'Every day' },
  weekly_tactical:         { label: 'Weekly Tactical',      color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200', freq: 'Every Monday' },
  monthly_business_review: { label: 'Monthly Business Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', freq: 'First Friday of month' },
  quarterly_planning:      { label: 'Quarterly Planning',   color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', freq: 'Last week of quarter' },
  annual_strategic:        { label: 'Annual Strategic',     color: 'text-gray-800',  bg: 'bg-gray-100', border: 'border-gray-300', freq: 'Q4 each year' },
};

const CADENCE_ORDER = ['daily_huddle','weekly_tactical','monthly_business_review','quarterly_planning','annual_strategic'];

const DEMO_TEMPLATES: MeetingTemplate[] = [
  { id: 't1', cadence_type: 'daily_huddle', title: 'Daily Clinical Huddle', default_duration_minutes: 15, default_agenda: [
    { title: 'Yesterday highlights', minutes: 2 },
    { title: 'Today schedule and capacity', minutes: 3 },
    { title: 'Open action items', minutes: 5 },
    { title: 'Blockers and announcements', minutes: 5 },
  ]},
  { id: 't2', cadence_type: 'weekly_tactical', title: 'Weekly Tactical Review', default_duration_minutes: 60, default_agenda: [
    { title: 'Scorecard review — previous week', minutes: 15 },
    { title: 'Open issues — Reds and Yellows', minutes: 15 },
    { title: 'Action item review', minutes: 10 },
    { title: 'KPI variance discussion', minutes: 10 },
    { title: 'Goal progress update', minutes: 5 },
    { title: 'New items and announcements', minutes: 5 },
  ]},
  { id: 't3', cadence_type: 'monthly_business_review', title: 'Monthly Business Review', default_duration_minutes: 90, default_agenda: [
    { title: 'Monthly scorecard — all levels', minutes: 20 },
    { title: 'KPI deep dive — red metrics', minutes: 20 },
    { title: 'Goal cascade update', minutes: 15 },
    { title: 'Financial performance', minutes: 15 },
    { title: 'People and workforce', minutes: 10 },
    { title: 'Decisions and action items', minutes: 10 },
  ]},
  { id: 't4', cadence_type: 'quarterly_planning', title: 'Quarterly Planning Session', default_duration_minutes: 180, default_agenda: [
    { title: 'Previous quarter scorecard', minutes: 20 },
    { title: 'Goal cascade review', minutes: 25 },
    { title: 'Next quarter priorities — BHAG alignment', minutes: 30 },
    { title: 'KPI target setting', minutes: 20 },
    { title: 'Risk and issues', minutes: 20 },
    { title: 'Resource and budget alignment', minutes: 20 },
    { title: 'Action items and owners', minutes: 25 },
  ]},
  { id: 't5', cadence_type: 'annual_strategic', title: 'Annual Strategic Planning', default_duration_minutes: 480, default_agenda: [
    { title: 'Annual scorecard review', minutes: 45 },
    { title: 'BHAG progress and 3HAG alignment', minutes: 30 },
    { title: '3-year picture update', minutes: 45 },
    { title: 'Annual priorities — next fiscal year', minutes: 60 },
    { title: 'KPI dictionary review and target approval', minutes: 30 },
    { title: 'Network and regional expansion', minutes: 45 },
    { title: 'Financial and capital plan', minutes: 45 },
    { title: 'People and culture strategy', minutes: 30 },
    { title: 'Technology and systems roadmap', minutes: 30 },
    { title: 'Risk management', minutes: 20 },
    { title: 'Year commitments and owners', minutes: 20 },
  ]},
];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function AgendaTimeline({ items }: { items: AgendaItem[] }) {
  const total = items.reduce((s, i) => s + i.minutes, 0);
  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const pct = (item.minutes / total) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500 font-bold">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-700 truncate">{item.title}</span>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.minutes}m</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MeetingCadenceEngine() {
  const [templates, setTemplates] = useState<MeetingTemplate[]>(DEMO_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>('t2');
  const [activeTab, setActiveTab] = useState<'templates' | 'sessions'>('templates');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await enterpriseOSService.getMeetingTemplates();
      setTemplates(data.length > 0 ? data : DEMO_TEMPLATES);
    } catch {
      setTemplates(DEMO_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }

  const orderedTemplates = CADENCE_ORDER.map(type => templates.find(t => t.cadence_type === type)).filter(Boolean) as MeetingTemplate[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Meeting Cadence Engine</h2>
            <p className="text-xs text-gray-500">Daily Huddle · Weekly Tactical · Monthly Business Review · Quarterly Planning · Annual Strategic</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['templates','sessions'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${activeTab === t ? 'bg-white shadow-sm font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-700">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cadence rhythm visualizer */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cadence Rhythm</h3>
        <div className="flex items-start gap-3 overflow-x-auto pb-2">
          {CADENCE_ORDER.map((type, i) => {
            const cfg = CADENCE_CONFIG[type];
            const template = templates.find(t => t.cadence_type === type);
            return (
              <div key={type} className="flex items-start gap-2 flex-shrink-0">
                <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 min-w-32`}>
                  <div className={`text-xs font-bold ${cfg.color} mb-1`}>{cfg.label}</div>
                  <div className="text-xs text-gray-500">{cfg.freq}</div>
                  {template && <div className="text-xs text-gray-400 mt-1">{formatDuration(template.default_duration_minutes)}</div>}
                </div>
                {i < CADENCE_ORDER.length - 1 && <ArrowRight className="h-4 w-4 text-gray-300 mt-4 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-3">
          {orderedTemplates.map(template => {
            const cfg = CADENCE_CONFIG[template.cadence_type];
            const isExpanded = expandedTemplate === template.id;
            const totalMinutes = template.default_agenda.reduce((s, i) => s + i.minutes, 0);
            return (
              <div key={template.id} className={`bg-white rounded-xl shadow-sm border ${cfg.border} overflow-hidden`}>
                <button
                  onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                  className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className="font-semibold text-gray-900">{template.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(template.default_duration_minutes)}</span>
                      <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{template.default_agenda.length} agenda items</span>
                      <span className="text-gray-400">{cfg.freq}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${cfg.bg} ${cfg.color} border ${cfg.border} hover:opacity-80 flex items-center gap-1`}>
                      <Play className="h-3.5 w-3.5" />Start Meeting
                    </button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Default Agenda</h4>
                        <AgendaTimeline items={template.default_agenda} />
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span>Total: {formatDuration(totalMinutes)}</span>
                          <button className="text-teal-600 hover:underline flex items-center gap-1">
                            <PlusSquare className="h-3.5 w-3.5" />Add Item
                          </button>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Auto-Generated Agenda Sources</h4>
                        <div className="space-y-2 text-xs">
                          {template.cadence_type !== 'daily_huddle' && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="text-gray-700">Scorecard Red/Yellow metrics auto-added to issues list</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                            <Zap className="h-4 w-4 text-teal-500 flex-shrink-0" />
                            <span className="text-gray-700">Open action items from previous meeting auto-populated</span>
                          </div>
                          {(template.cadence_type === 'monthly_business_review' || template.cadence_type === 'quarterly_planning' || template.cadence_type === 'annual_strategic') && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <span className="text-gray-700">Goal cascade progress snapshot auto-attached</span>
                            </div>
                          )}
                          {template.cadence_type === 'annual_strategic' && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              <span className="text-gray-700">KPI dictionary approval workflow triggered</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Recent Sessions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { cadence: 'weekly_tactical', title: 'Weekly Tactical — Mar 10', date: 'Mar 10, 2026', status: 'completed', attendance: 8, actions: 3, reds_resolved: 1 },
              { cadence: 'weekly_tactical', title: 'Weekly Tactical — Mar 3', date: 'Mar 3, 2026', status: 'completed', attendance: 7, actions: 5, reds_resolved: 0 },
              { cadence: 'monthly_business_review', title: 'Monthly Business Review — February 2026', date: 'Feb 28, 2026', status: 'completed', attendance: 12, actions: 8, reds_resolved: 2 },
              { cadence: 'weekly_tactical', title: 'Weekly Tactical — Mar 17 (Upcoming)', date: 'Mar 17, 2026', status: 'scheduled', attendance: 0, actions: 0, reds_resolved: 0 },
            ].map((s, i) => {
              const cfg = CADENCE_CONFIG[s.cadence];
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} flex-shrink-0`}>{cfg.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{s.title}</div>
                    <div className="text-xs text-gray-500">{s.date}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                    {s.status === 'completed' && (
                      <>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{s.attendance}</span>
                        {s.actions > 0 && <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />{s.actions} actions</span>}
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.status}
                    </span>
                    {s.status === 'scheduled' && (
                      <button className="text-xs px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                        <Play className="h-3 w-3" />Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
