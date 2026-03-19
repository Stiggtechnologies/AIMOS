import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, User, Calendar, RefreshCw, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Assessment {
  id: string;
  patient_name: string;
  assessment_type: string;
  status: string;
  clinician_name: string;
  assessment_date: string;
  pain_current: number | null;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

const DEMO_ASSESSMENTS: Assessment[] = [
  { id: '1', patient_name: 'Jane Smith', assessment_type: 'Initial Assessment', status: 'completed', clinician_name: 'Dr. Chen', assessment_date: '2026-03-14', pain_current: 4 },
  { id: '2', patient_name: 'Mark Johnson', assessment_type: 'Re-assessment', status: 'scheduled', clinician_name: 'Dr. Patel', assessment_date: '2026-03-15', pain_current: null },
  { id: '3', patient_name: 'Sara Lee', assessment_type: 'Discharge Assessment', status: 'pending', clinician_name: 'Dr. Chen', assessment_date: '2026-03-16', pain_current: null },
  { id: '4', patient_name: 'Tom Brown', assessment_type: 'Progress Assessment', status: 'completed', clinician_name: 'Dr. Williams', assessment_date: '2026-03-13', pain_current: 3 },
  { id: '5', patient_name: 'Alice Park', assessment_type: 'Initial Assessment', status: 'completed', clinician_name: 'Dr. Patel', assessment_date: '2026-03-12', pain_current: 2 },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 text-green-700' },
  scheduled: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 text-blue-700' },
  pending: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700' },
};

const ASSESSMENT_TYPES = [
  'Initial Assessment',
  'Re-assessment',
  'Progress Assessment',
  'Discharge Assessment',
  'Functional Assessment',
  'Pain Assessment',
];

interface NewAssessmentModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewAssessmentModal({ onClose, onCreated }: NewAssessmentModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState('');
  const [assessmentType, setAssessmentType] = useState(ASSESSMENT_TYPES[0]);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [painCurrent, setPainCurrent] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('clinical_assessments').insert({
      patient_id: patientId,
      assessment_type: assessmentType,
      assessment_date: assessmentDate,
      pain_current: painCurrent !== '' ? parseInt(painCurrent, 10) : null,
      clinical_findings: clinicalFindings || null,
      status: 'pending',
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
            <h2 className="text-lg font-bold text-gray-900">New Assessment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Create a new patient clinical assessment</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Assessment Created</h3>
            <p className="text-sm text-gray-500">{assessmentType} &middot; {new Date(assessmentDate).toLocaleDateString()}</p>
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
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Assessment Type</label>
                <select
                  value={assessmentType}
                  onChange={e => setAssessmentType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ASSESSMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={e => setAssessmentDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Current Pain Level (0–10)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painCurrent}
                  onChange={e => setPainCurrent(e.target.value)}
                  className="flex-1"
                />
                <span className="w-10 text-center text-sm font-semibold text-gray-700">
                  {painCurrent !== '' ? painCurrent : '—'}
                </span>
                {painCurrent !== '' && (
                  <button
                    onClick={() => setPainCurrent('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              {painCurrent !== '' && (
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      parseInt(painCurrent) <= 3 ? 'bg-green-500' :
                      parseInt(painCurrent) <= 6 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(parseInt(painCurrent) / 10) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Clinical Findings (optional)</label>
              <textarea
                value={clinicalFindings}
                onChange={e => setClinicalFindings(e.target.value)}
                rows={3}
                placeholder="Observations, findings, relevant notes..."
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
                <ClipboardList className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentsView() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewAssessment, setShowNewAssessment] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinical_assessments')
        .select(`
          id,
          assessment_type,
          assessment_date,
          pain_current,
          status,
          patients:patient_id ( first_name, last_name )
        `)
        .order('assessment_date', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setAssessments(DEMO_ASSESSMENTS);
      } else {
        setAssessments(data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          patient_name: row.patients
            ? `${(row.patients as Record<string, string>).first_name} ${(row.patients as Record<string, string>).last_name}`
            : 'Unknown Patient',
          assessment_type: (row.assessment_type as string) || 'Assessment',
          status: (row.status as string) || 'pending',
          clinician_name: 'Clinician',
          assessment_date: row.assessment_date as string,
          pain_current: row.pain_current as number | null,
        })));
      }
    } catch {
      setAssessments(DEMO_ASSESSMENTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assessments.filter(a => {
    const matchSearch = !search ||
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.clinician_name.toLowerCase().includes(search.toLowerCase()) ||
      a.assessment_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completedCount = assessments.filter(a => a.status === 'completed').length;
  const pendingCount = assessments.filter(a => a.status === 'pending').length;
  const scheduledCount = assessments.filter(a => a.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessments</h2>
          <p className="text-gray-500 text-sm mt-0.5">Patient assessment tracking and management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAssessments}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewAssessment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-green-50 p-2.5 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{scheduledCount}</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-amber-50 p-2.5 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients or clinicians..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400">Loading assessments...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Patient</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Clinician</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Pain (0–10)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <ClipboardList className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="font-medium text-gray-500">No assessments found</p>
                    <p className="text-xs text-gray-400 mt-1">Adjust filters or create a new assessment</p>
                  </td>
                </tr>
              ) : filtered.map(a => {
                const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <tr key={a.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <span className="font-medium text-gray-900">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{a.assessment_type}</td>
                    <td className="py-3 px-4 text-gray-600">{a.clinician_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-300" />
                        {new Date(a.assessment_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {a.pain_current !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                a.pain_current <= 3 ? 'bg-green-500' :
                                a.pain_current <= 6 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(a.pain_current / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{a.pain_current}/10</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
                        <StatusIcon className="h-3 w-3" />
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNewAssessment && (
        <NewAssessmentModal
          onClose={() => setShowNewAssessment(false)}
          onCreated={loadAssessments}
        />
      )}
    </div>
  );
}
