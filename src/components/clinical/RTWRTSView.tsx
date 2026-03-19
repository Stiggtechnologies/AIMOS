import { useState, useEffect } from 'react';
import { Target, Plus, Search, ArrowUpRight, Briefcase, Activity, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RTWCase {
  id: string;
  patient: string;
  program: string;
  employer?: string;
  sport?: string;
  caseType: string;
  startDate: string;
  targetDate: string;
  status: string;
  phase: string;
  progress: number;
}

const DEMO_RTW_CASES: RTWCase[] = [
  { id: '1', patient: 'Tom Brown', program: 'Return to Work', employer: 'City Construction Ltd.', caseType: 'WCB', startDate: '2026-02-01', targetDate: '2026-04-01', status: 'in_progress', phase: 'Modified Duties', progress: 55 },
  { id: '2', patient: 'Linda Evans', program: 'Return to Sport', sport: 'Soccer', caseType: 'Private', startDate: '2026-01-15', targetDate: '2026-03-30', status: 'in_progress', phase: 'Sport-Specific Training', progress: 78 },
  { id: '3', patient: 'Carlos Reyes', program: 'Return to Work', employer: 'Alberta Trucks Inc.', caseType: 'MVA', startDate: '2025-12-10', targetDate: '2026-03-10', status: 'completed', phase: 'Full Duties', progress: 100 },
  { id: '4', patient: 'Ana Fischer', program: 'Return to Sport', sport: 'Hockey', caseType: 'Private', startDate: '2026-03-01', targetDate: '2026-06-01', status: 'in_progress', phase: 'Conditioning', progress: 25 },
];

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-gray-100 text-gray-700'
};

const TYPE_COLORS: Record<string, string> = {
  WCB: 'bg-orange-100 text-orange-800',
  MVA: 'bg-red-100 text-red-800',
  Private: 'bg-blue-100 text-blue-800'
};

export default function RTWRTSView() {
  const [cases, setCases] = useState<RTWCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  useEffect(() => { loadCases(); }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rtw_rts_cases')
        .select(`
          id, program_type, case_type, start_date, target_date, status, current_phase, progress_percent,
          employer_name, sport_type,
          patients:patient_id ( first_name, last_name )
        `)
        .order('start_date', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        setCases(DEMO_RTW_CASES);
      } else {
        setCases(data.map((r: Record<string, unknown>) => {
          const pt = r.patients as Record<string, string> | null;
          return {
            id: r.id as string,
            patient: pt ? `${pt.first_name} ${pt.last_name}` : 'Unknown',
            program: (r.program_type as string) || 'Return to Work',
            employer: r.employer_name as string | undefined,
            sport: r.sport_type as string | undefined,
            caseType: (r.case_type as string) || 'Private',
            startDate: (r.start_date as string) || '',
            targetDate: (r.target_date as string) || '',
            status: (r.status as string) || 'in_progress',
            phase: (r.current_phase as string) || 'Assessment',
            progress: Number(r.progress_percent) || 0,
          };
        }));
      }
    } catch {
      setCases(DEMO_RTW_CASES);
    } finally {
      setLoading(false);
    }
  }

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.patient.toLowerCase().includes(search.toLowerCase());
    const matchProgram = !programFilter || c.program === programFilter;
    return matchSearch && matchProgram;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RTW / RTS Programs</h2>
          <p className="text-gray-600 mt-1">Return to Work and Return to Sport case management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadCases} disabled={loading} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{cases.length}</div>
          <div className="text-sm text-gray-600">Total Programs</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{cases.filter(c => c.status === 'completed').length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{cases.filter(c => c.program === 'Return to Work').length}</div>
          <div className="text-sm text-gray-600">RTW Cases</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-teal-600">{cases.filter(c => c.program === 'Return to Sport').length}</div>
          <div className="text-sm text-gray-600">RTS Cases</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={programFilter}
            onChange={e => setProgramFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            <option value="Return to Work">Return to Work</option>
            <option value="Return to Sport">Return to Sport</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading RTW/RTS programs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Target className="h-10 w-10 mx-auto mb-2 text-gray-200" />
            <p className="font-medium text-gray-500">No programs found</p>
            <p className="text-xs mt-1">Adjust filters or create a new program</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {!loading && filtered.map(c => (
            <div key={c.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">{c.patient}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[c.caseType]}`}>
                      {c.caseType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1 font-medium text-blue-700">
                      <ArrowUpRight className="h-4 w-4" />
                      {c.program}
                    </span>
                    {c.employer && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {c.employer}
                      </span>
                    )}
                    {c.sport && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" />
                        {c.sport}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Target: {new Date(c.targetDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Phase: <strong className="text-gray-800">{c.phase}</strong></span>
                  <span>{c.progress}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${c.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
