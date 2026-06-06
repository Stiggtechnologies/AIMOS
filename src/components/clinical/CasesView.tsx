import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Search, Calendar, User, Clock, ChevronRight, CircleAlert as AlertCircle, X, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Case {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  priority: string;
  opened_at: string;
  closed_at: string | null;
  age_days: number;
  aging_status?: string;
  clinic_name?: string;
  primary_clinician_name?: string;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-200 text-red-900',
  critical: 'bg-red-300 text-red-900',
};

const CASE_TYPES = ['physiotherapy', 'massage', 'chiropractic', 'occupational', 'mva', 'wcb'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent', 'critical'];

function generateCaseNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CASE-${year}-${rand}`;
}

interface NewCaseModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewCaseModal({ onClose, onCreated }: NewCaseModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState('');
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [priority, setPriority] = useState('medium');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [caseNumber] = useState(generateCaseNumber());

  useEffect(() => {
    supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(100)
      .then(({ data }) => {
        if (data && data.length > 0) setPatients(data);
      });
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('ops_cases').insert({
      case_number: caseNumber,
      patient_id: patientId || null,
      case_type: caseType,
      priority,
      status: 'new',
      chief_complaint: chiefComplaint || null,
      clinical_notes: clinicalNotes || null,
      opened_at: new Date().toISOString(),
    });
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Case</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{caseNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Case Created</h3>
            <p className="text-sm font-mono text-gray-500 mb-1">{caseNumber}</p>
            <p className="text-sm text-gray-500 capitalize">{caseType} &middot; {priority} priority</p>
            <button
              onClick={() => { onCreated(); onClose(); }}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Patient</label>
              <select
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a patient (optional)</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Case Type</label>
                <select
                  value={caseType}
                  onChange={e => setCaseType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CASE_TYPES.map(t => (
                    <option key={t} value={t}>{t === 'mva' ? 'MVA' : t === 'wcb' ? 'WCB' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Chief Complaint</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                placeholder="Primary reason for case opening..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Clinical Notes (optional)</label>
              <textarea
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                rows={3}
                placeholder="Initial case notes, relevant history..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CasesView() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showNewCase, setShowNewCase] = useState(false);

  useEffect(() => {
    loadCases();
  }, [statusFilter, typeFilter]);

  const loadCases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ops_cases')
        .select('id, case_number, case_type, status, priority, opened_at, closed_at, created_at')
        .order('opened_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (typeFilter) query = query.eq('case_type', typeFilter);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Case[] = (data || []).map((c: Record<string, unknown>) => {
        const openedAt = (c.opened_at || c.created_at) as string;
        const ageDays = openedAt
          ? Math.floor((Date.now() - new Date(openedAt).getTime()) / 86400000)
          : 0;
        return {
          id: c.id as string,
          case_number: c.case_number as string,
          case_type: c.case_type as string,
          status: c.status as string,
          priority: c.priority as string,
          opened_at: openedAt,
          closed_at: c.closed_at as string | null,
          age_days: ageDays,
        };
      });
      setCases(mapped);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter(c =>
    !searchTerm ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.primary_clinician_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCount = cases.filter(c => c.status === 'new' || c.status === 'active').length;
  const criticalCount = cases.filter(c => c.priority === 'critical' || c.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
          <p className="text-gray-600 mt-1">Patient case management and tracking</p>
        </div>
        <button
          onClick={() => setShowNewCase(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{cases.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Cases</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{openCount}</div>
          <div className="text-sm text-gray-600 mt-1">New / Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-sm text-gray-600 mt-1">Urgent / Critical</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="physiotherapy">Physiotherapy</option>
            <option value="massage">Massage</option>
            <option value="chiropractic">Chiropractic</option>
            <option value="occupational">Occupational Therapy</option>
            <option value="mva">MVA</option>
            <option value="wcb">WCB</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <FolderOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{c.case_number}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[c.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {c.primary_clinician_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {c.primary_clinician_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.opened_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.age_days}d old
                      </span>
                      {c.case_type && (
                        <span className="capitalize">{c.case_type === 'mva' ? 'MVA' : c.case_type === 'wcb' ? 'WCB' : c.case_type}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No cases found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new case</p>
          </div>
        )}
      </div>

      {showNewCase && (
        <NewCaseModal
          onClose={() => setShowNewCase(false)}
          onCreated={loadCases}
        />
      )}
    </div>
  );
}
