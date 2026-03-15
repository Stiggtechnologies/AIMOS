import { useState } from 'react';
import { Dumbbell, Check, Plus, ChevronDown, ChevronUp, RefreshCw, Activity, Flame, Target } from 'lucide-react';
import type { PatientExerciseProgram, PatientExerciseLog } from '../../services/patientExperienceService';

interface PatientExercisesViewProps {
  programs: PatientExerciseProgram[];
  logs: PatientExerciseLog[];
  patientId: string;
  loading: boolean;
  onLogExercise: (log: Omit<PatientExerciseLog, 'id'>) => Promise<void>;
  onRefresh: () => void;
}

interface LogFormState {
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  duration_minutes: number;
  pain_before: number;
  pain_after: number;
  difficulty_rating: number;
  notes: string;
}

function PainSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const color = value <= 2 ? 'text-green-600' : value <= 5 ? 'text-amber-600' : 'text-red-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className={`text-sm font-bold ${color}`}>{value}/10</span>
      </div>
      <input
        type="range" min={0} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none bg-gray-200 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
}

export default function PatientExercisesView({ programs, logs, patientId, loading, onLogExercise, onRefresh }: PatientExercisesViewProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [form, setForm] = useState<LogFormState>({
    exercise_name: '',
    sets_completed: 3,
    reps_completed: 10,
    duration_minutes: 20,
    pain_before: 0,
    pain_after: 0,
    difficulty_rating: 5,
    notes: '',
  });

  const activePrograms = programs.filter(p => p.is_active);
  const recentLogs = logs.slice(0, 10);

  const handleSubmit = async () => {
    if (!form.exercise_name.trim()) { setError('Please enter an exercise name'); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onLogExercise({
        patient_id: patientId,
        exercise_program_id: selectedProgram || null,
        exercise_name: form.exercise_name,
        completed_at: new Date().toISOString(),
        sets_completed: form.sets_completed,
        reps_completed: form.reps_completed,
        duration_minutes: form.duration_minutes,
        pain_before: form.pain_before,
        pain_after: form.pain_after,
        difficulty_rating: form.difficulty_rating,
        notes: form.notes,
      });
      setShowLogForm(false);
      setForm({ exercise_name: '', sets_completed: 3, reps_completed: 10, duration_minutes: 20, pain_before: 0, pain_after: 0, difficulty_rating: 5, notes: '' });
    } catch {
      setError('Failed to save exercise. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Exercises</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowLogForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Log Exercise
          </button>
        </div>
      </div>

      {/* Log form */}
      {showLogForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Log Exercise Session</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Exercise Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. Squats, Hip hinges, Walking..."
              value={form.exercise_name}
              onChange={e => setForm({ ...form, exercise_name: e.target.value })}
            />
          </div>

          {activePrograms.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Program (optional)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={selectedProgram}
                onChange={e => setSelectedProgram(e.target.value)}
              >
                <option value="">None selected</option>
                {activePrograms.map(p => (
                  <option key={p.id} value={p.id}>{p.program_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sets', key: 'sets_completed', min: 0, max: 20 },
              { label: 'Reps', key: 'reps_completed', min: 0, max: 100 },
              { label: 'Minutes', key: 'duration_minutes', min: 0, max: 180 },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="number" min={f.min} max={f.max}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center"
                  value={form[f.key as keyof LogFormState] as number}
                  onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>

          <PainSlider value={form.pain_before} onChange={v => setForm({ ...form, pain_before: v })} label="Pain before (0–10)" />
          <PainSlider value={form.pain_after} onChange={v => setForm({ ...form, pain_after: v })} label="Pain after (0–10)" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Difficulty</label>
              <span className="text-sm font-bold text-gray-700">{form.difficulty_rating}/10</span>
            </div>
            <input
              type="range" min={1} max={10} value={form.difficulty_rating}
              onChange={e => setForm({ ...form, difficulty_rating: Number(e.target.value) })}
              className="w-full h-2 appearance-none bg-gray-200 rounded-full cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2} placeholder="Any observations..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowLogForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Exercise
            </button>
          </div>
        </div>
      )}

      {/* Active programs */}
      {activePrograms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" /> Active Programs
          </h3>
          {activePrograms.map(p => {
            const pct = p.target_sessions > 0 ? Math.round((p.completed_sessions / p.target_sessions) * 100) : 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.program_name}</p>
                    {p.assigned_by_name && <p className="text-xs text-gray-500 mt-0.5">Assigned by {p.assigned_by_name}</p>}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {p.completed_sessions}/{p.target_sessions} sessions
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{pct}% complete</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent logs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" /> Recent Activity
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No exercises logged yet</p>
            <p className="text-xs text-gray-400 mt-1">Tap "Log Exercise" to get started</p>
          </div>
        ) : (
          recentLogs.map(log => {
            const isExpanded = expandedLog === log.id;
            const painChange = log.pain_after - log.pain_before;
            return (
              <div key={log.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{log.exercise_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.completed_at).toLocaleDateString()} · {log.sets_completed}×{log.reps_completed} reps
                    </p>
                  </div>
                  {painChange !== 0 && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${painChange < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Pain {painChange < 0 ? `${painChange}` : `+${painChange}`}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-gray-500">Duration:</span> <span className="font-medium text-gray-900">{log.duration_minutes} min</span></div>
                      <div><span className="text-gray-500">Difficulty:</span> <span className="font-medium text-gray-900">{log.difficulty_rating}/10</span></div>
                      <div><span className="text-gray-500">Pain before:</span> <span className="font-medium text-gray-900">{log.pain_before}/10</span></div>
                      <div><span className="text-gray-500">Pain after:</span> <span className="font-medium text-gray-900">{log.pain_after}/10</span></div>
                    </div>
                    {log.notes && <p className="text-xs text-gray-600 mt-2 italic">"{log.notes}"</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
