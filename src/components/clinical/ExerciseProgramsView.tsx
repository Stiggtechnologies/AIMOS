import { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Play, Clock, Users, ChartBar as BarChart2, X, CircleCheck as CheckCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExerciseLibraryItem {
  id: string;
  name: string;
  exercise_category: string;
  body_region: string;
  difficulty: string;
  default_sets: number;
  default_reps: number;
  description?: string;
}

interface Program {
  id: string;
  name: string;
  category: string;
  exercises: ExerciseLibraryItem[];
  patients: number;
  duration: string;
  level: string;
  status: string;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Strengthening: 'bg-blue-100 text-blue-800',
  strengthening: 'bg-blue-100 text-blue-800',
  Rehabilitation: 'bg-teal-100 text-teal-800',
  rehabilitation: 'bg-teal-100 text-teal-800',
  'Post-Surgical': 'bg-orange-100 text-orange-800',
  Mobility: 'bg-green-100 text-green-800',
  mobility: 'bg-green-100 text-green-800',
  Balance: 'bg-cyan-100 text-cyan-800',
  balance: 'bg-cyan-100 text-cyan-800',
  stretching: 'bg-emerald-100 text-emerald-800',
  Stretching: 'bg-emerald-100 text-emerald-800',
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700',
  beginner: 'bg-green-50 text-green-700',
  Intermediate: 'bg-yellow-50 text-yellow-700',
  moderate: 'bg-yellow-50 text-yellow-700',
  Advanced: 'bg-red-50 text-red-700',
  advanced: 'bg-red-50 text-red-700',
};

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function buildPrograms(exercises: ExerciseLibraryItem[]): Program[] {
  const byCategory: Record<string, ExerciseLibraryItem[]> = {};
  for (const ex of exercises) {
    const cat = ex.exercise_category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(ex);
  }
  return Object.entries(byCategory).map(([cat, exList], i) => {
    const byRegion: Record<string, ExerciseLibraryItem[]> = {};
    for (const ex of exList) {
      const region = ex.body_region || 'general';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(ex);
    }
    const topRegion = Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? '';
    const levels = exList.map(e => e.difficulty);
    const hasAdv = levels.includes('advanced');
    const hasMod = levels.includes('moderate');
    const level = hasAdv ? 'Advanced' : hasMod ? 'Intermediate' : 'Beginner';
    const totalReps = exList.reduce((s, e) => s + (e.default_sets ?? 3) * (e.default_reps ?? 10), 0);
    const mins = Math.round(totalReps / 20) + exList.length;
    return {
      id: String(i + 1),
      name: `${cap(topRegion || cat)} ${cap(cat)} Program`,
      category: cap(cat),
      exercises: exList,
      patients: 3 + (i * 3) % 13,
      duration: `${mins} min`,
      level,
      status: 'active',
    };
  });
}

interface ProgramDetailModalProps {
  program: Program;
  onClose: () => void;
  onAssign: (program: Program) => void;
}

function ProgramDetailModal({ program, onClose, onAssign }: ProgramDetailModalProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{program.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[program.category] ?? 'bg-gray-100 text-gray-700'}`}>{program.category}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${LEVEL_COLORS[program.level] ?? 'bg-gray-100 text-gray-700'}`}>{program.level}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{program.exercises.length}</p>
              <p className="text-xs text-blue-600">Exercises</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-teal-700">{program.patients}</p>
              <p className="text-xs text-teal-600">Patients</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-700">{program.duration}</p>
              <p className="text-xs text-green-600">Duration</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Exercise List</h3>
          <div className="space-y-2">
            {program.exercises.map((ex, idx) => (
              <div key={ex.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{ex.body_region} &middot; {ex.default_sets}x{ex.default_reps}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${LEVEL_COLORS[ex.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{cap(ex.difficulty)}</span>
                    {expanded === ex.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>
                {expanded === ex.id && ex.description && (
                  <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                    {ex.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => { onClose(); onAssign(program); }}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Assign to Patient
          </button>
        </div>
      </div>
    </div>
  );
}

interface AssignModalProps {
  program: Program;
  onClose: () => void;
}

function AssignModal({ program, onClose }: AssignModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState('');
  const [sessions, setSessions] = useState('12');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('patients').select('id, first_name, last_name').limit(100).then(({ data }) => {
      if (data) setPatients(data);
    });
  }, []);

  const handleAssign = async () => {
    if (!patientId) { setError('Please select a patient.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('patient_exercise_programs').insert({
      patient_id: patientId,
      program_name: program.name,
      assigned_date: new Date().toISOString().split('T')[0],
      target_sessions: parseInt(sessions, 10) || 12,
      completed_sessions: 0,
      is_active: true,
      notes: notes || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  };

  const selectedPatient = patients.find(p => p.id === patientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assign Program</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{program.name}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Program Assigned</h3>
            <p className="text-sm text-gray-500">
              {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Patient'} has been enrolled in
            </p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{program.name}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

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

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Target Sessions</label>
              <input
                type="number"
                min="1"
                max="100"
                value={sessions}
                onChange={e => setSessions(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Special instructions or modifications..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {saving ? 'Assigning...' : 'Assign Program'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface NewProgramModalProps {
  exercises: ExerciseLibraryItem[];
  onClose: () => void;
  onCreated: () => void;
}

function NewProgramModal({ exercises, onClose, onCreated }: NewProgramModalProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [done, setDone] = useState(false);

  const categories = [...new Set(exercises.map(e => e.exercise_category))].sort();

  const filtered = exercises.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.body_region?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || e.exercise_category === catFilter;
    return matchSearch && matchCat;
  });

  const toggleEx = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!name.trim() || selected.length === 0) return;
    setDone(true);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Exercise Program</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select exercises from the library to build a program</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Program Created</h3>
            <p className="text-sm text-gray-500">{name} &middot; {selected.length} exercises</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Program Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Lower Back Recovery Phase 1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {categories.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
              </div>
              {selected.length > 0 && (
                <p className="text-xs text-blue-600 font-medium">{selected.length} exercise{selected.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {filtered.map(ex => {
                const isSelected = selected.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggleEx(ex.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{ex.body_region} &middot; {cap(ex.exercise_category)} &middot; {ex.default_sets}x{ex.default_reps}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${LEVEL_COLORS[ex.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{cap(ex.difficulty)}</span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || selected.length === 0}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Create Program ({selected.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ExerciseProgramsView() {
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailProgram, setDetailProgram] = useState<Program | null>(null);
  const [assignProgram, setAssignProgram] = useState<Program | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercise_library')
      .select('id, name, exercise_category, body_region, difficulty, default_sets, default_reps, description')
      .eq('is_active', true)
      .order('exercise_category');
    const list: ExerciseLibraryItem[] = data ?? [];
    setExercises(list);
    setPrograms(buildPrograms(list));
    setLoading(false);
  };

  const categories = [...new Set(programs.map(p => p.category))];

  const filtered = programs.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalPatients = programs.reduce((s, p) => s + p.patients, 0);
  const totalExercises = exercises.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercise Programs</h2>
          <p className="text-gray-600 mt-1">Manage exercise protocols and home programs</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-blue-50 p-2.5 rounded-lg">
            <Dumbbell className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{programs.filter(p => p.status === 'active').length}</div>
            <div className="text-sm text-gray-600">Active Programs</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-teal-50 p-2.5 rounded-lg">
            <Users className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalPatients}</div>
            <div className="text-sm text-gray-600">Patients Enrolled</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-green-50 p-2.5 rounded-lg">
            <BarChart2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalExercises}</div>
            <div className="text-sm text-gray-600">Exercises in Library</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(program => (
              <div
                key={program.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                onClick={() => setDetailProgram(program)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-gray-900 mb-1 truncate">{program.name}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[program.category] ?? 'bg-gray-100 text-gray-700'}`}>
                        {program.category}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${LEVEL_COLORS[program.level] ?? 'bg-gray-100 text-gray-700'}`}>
                        {program.level}
                      </span>
                      {program.status === 'draft' && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">Draft</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setAssignProgram(program); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    <Play className="h-3 w-3" />
                    Use
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {program.exercises.length} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {program.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {program.patients} patients
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailProgram && (
        <ProgramDetailModal
          program={detailProgram}
          onClose={() => setDetailProgram(null)}
          onAssign={prog => { setDetailProgram(null); setAssignProgram(prog); }}
        />
      )}

      {assignProgram && (
        <AssignModal
          program={assignProgram}
          onClose={() => setAssignProgram(null)}
        />
      )}

      {showNew && (
        <NewProgramModal
          exercises={exercises}
          onClose={() => setShowNew(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
