import { useState } from 'react';
import { TrendingUp, Plus, RefreshCw, Check, Moon, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PatientProgressScore } from '../../services/patientExperienceService';

interface PatientProgressViewProps {
  scores: PatientProgressScore[];
  patientId: string;
  loading: boolean;
  onAddScore: (score: Omit<PatientProgressScore, 'id' | 'created_at'>) => Promise<void>;
  onRefresh: () => void;
}

interface ScoreFormState {
  pain_score: number;
  function_score: number;
  mood_score: number;
  sleep_quality: number;
  activity_level: string;
  notes: string;
}

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

function ScoreSlider({ value, onChange, label, min, max, colorFn }: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min: number;
  max: number;
  colorFn: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className={`text-sm font-bold ${colorFn(value)}`}>{value}{max === 100 ? '%' : `/${max}`}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none bg-gray-200 rounded-full cursor-pointer"
      />
    </div>
  );
}

export default function PatientProgressView({ scores, patientId, loading, onAddScore, onRefresh }: PatientProgressViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ScoreFormState>({
    pain_score: 3,
    function_score: 70,
    mood_score: 7,
    sleep_quality: 7,
    activity_level: 'light',
    notes: '',
  });

  const chartData = [...scores].reverse().slice(-14).map(s => ({
    date: new Date(s.score_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
    pain: s.pain_score,
    function: s.function_score,
    mood: s.mood_score,
  }));

  const latest = scores[0] ?? null;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onAddScore({
        patient_id: patientId,
        score_date: new Date().toISOString().split('T')[0],
        pain_score: form.pain_score,
        function_score: form.function_score,
        mood_score: form.mood_score,
        sleep_quality: form.sleep_quality,
        activity_level: form.activity_level,
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ pain_score: 3, function_score: 70, mood_score: 7, sleep_quality: 7, activity_level: 'light', notes: '' });
    } catch {
      setError('Failed to save check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const painColor = (v: number) => v <= 2 ? 'text-green-600' : v <= 5 ? 'text-amber-600' : 'text-red-600';
  const goodColor = (v: number) => v >= 8 ? 'text-green-600' : v >= 5 ? 'text-amber-600' : 'text-red-600';
  const pctColor = (v: number) => v >= 70 ? 'text-green-600' : v >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">My Progress</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Check In
          </button>
        </div>
      </div>

      {/* Check-in form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Daily Check-In</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <ScoreSlider value={form.pain_score} onChange={v => setForm({ ...form, pain_score: v })} label="Pain level (0 = none, 10 = severe)" min={0} max={10} colorFn={painColor} />
          <ScoreSlider value={form.function_score} onChange={v => setForm({ ...form, function_score: v })} label="How well are you functioning? (%)" min={0} max={100} colorFn={pctColor} />
          <ScoreSlider value={form.mood_score} onChange={v => setForm({ ...form, mood_score: v })} label="Mood / mental wellbeing (1–10)" min={1} max={10} colorFn={goodColor} />
          <ScoreSlider value={form.sleep_quality} onChange={v => setForm({ ...form, sleep_quality: v })} label="Sleep quality last night (1–10)" min={1} max={10} colorFn={goodColor} />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Activity level today</label>
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setForm({ ...form, activity_level: lvl })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    form.activity_level === lvl ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lvl.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={2} placeholder="How are you feeling today?"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Check-In
            </button>
          </div>
        </div>
      )}

      {/* Latest snapshot */}
      {latest && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-3">Last check-in — {new Date(latest.score_date).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pain', value: `${latest.pain_score}/10`, color: painColor(latest.pain_score) },
              { label: 'Function', value: `${latest.function_score}%`, color: pctColor(latest.function_score) },
              { label: 'Mood', value: `${latest.mood_score}/10`, color: goodColor(latest.mood_score) },
              { label: 'Sleep', value: `${latest.sleep_quality}/10`, color: goodColor(latest.sleep_quality) },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {latest.activity_level && (
            <div className="flex items-center gap-2 mt-3">
              <Zap className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-xs text-gray-600 capitalize">Activity: {latest.activity_level.replace('_', ' ')}</span>
              {latest.sleep_quality && (
                <>
                  <Moon className="w-3.5 h-3.5 text-gray-400 ml-2" />
                  <span className="text-xs text-gray-600">Sleep {latest.sleep_quality}/10</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-teal-600" /> 14-Day Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} domain={[0, 10]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} dot={false} name="Pain" />
              <Line type="monotone" dataKey="mood" stroke="#0d9488" strokeWidth={2} dot={false} name="Mood" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" />Pain</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-teal-600 inline-block rounded" />Mood</span>
          </div>
        </div>
      )}

      {/* History */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : scores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No check-ins yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap "Check In" to start tracking</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">History</h3>
          {scores.slice(0, 20).map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.pain_score <= 3 ? '#22c55e' : s.pain_score <= 6 ? '#f59e0b' : '#ef4444' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{new Date(s.score_date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                {s.notes && <p className="text-xs text-gray-500 truncate">{s.notes}</p>}
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className={`font-semibold ${painColor(s.pain_score)}`}>Pain {s.pain_score}</span>
                <span className={`font-semibold ${pctColor(s.function_score)}`}>{s.function_score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
