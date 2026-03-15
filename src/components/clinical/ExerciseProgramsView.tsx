import { useState } from 'react';
import { Dumbbell, Plus, Search, Play, ChevronRight, Clock, Users, ChartBar as BarChart2 } from 'lucide-react';

const PROGRAMS = [
  { id: '1', name: 'Lower Back Strengthening', category: 'Strengthening', exercises: 8, patients: 12, duration: '30 min', level: 'Beginner', status: 'active' },
  { id: '2', name: 'Shoulder Rotator Cuff Protocol', category: 'Rehabilitation', exercises: 6, patients: 7, duration: '25 min', level: 'Intermediate', status: 'active' },
  { id: '3', name: 'ACL Phase 1 Recovery', category: 'Post-Surgical', exercises: 10, patients: 5, duration: '45 min', level: 'Beginner', status: 'active' },
  { id: '4', name: 'Cervical Mobility & Stability', category: 'Mobility', exercises: 7, patients: 9, duration: '20 min', level: 'Beginner', status: 'active' },
  { id: '5', name: 'Hip Strengthening Advanced', category: 'Strengthening', exercises: 12, patients: 4, duration: '40 min', level: 'Advanced', status: 'draft' },
  { id: '6', name: 'Balance & Proprioception', category: 'Balance', exercises: 9, patients: 8, duration: '30 min', level: 'Intermediate', status: 'active' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Strengthening': 'bg-blue-100 text-blue-800',
  'Rehabilitation': 'bg-teal-100 text-teal-800',
  'Post-Surgical': 'bg-orange-100 text-orange-800',
  'Mobility': 'bg-green-100 text-green-800',
  'Balance': 'bg-cyan-100 text-cyan-800'
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700',
  Intermediate: 'bg-yellow-50 text-yellow-700',
  Advanced: 'bg-red-50 text-red-700'
};

export default function ExerciseProgramsView() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = PROGRAMS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(PROGRAMS.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercise Programs</h2>
          <p className="text-gray-600 mt-1">Manage exercise protocols and home programs</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <Dumbbell className="h-10 w-10 text-blue-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{PROGRAMS.filter(p => p.status === 'active').length}</div>
            <div className="text-sm text-gray-600">Active Programs</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <Users className="h-10 w-10 text-teal-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{PROGRAMS.reduce((s, p) => s + p.patients, 0)}</div>
            <div className="text-sm text-gray-600">Patients Enrolled</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <BarChart2 className="h-10 w-10 text-green-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{PROGRAMS.reduce((s, p) => s + p.exercises, 0)}</div>
            <div className="text-sm text-gray-600">Total Exercises</div>
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
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(program => (
            <div key={program.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{program.name}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[program.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {program.category}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${LEVEL_COLORS[program.level]}`}>
                      {program.level}
                    </span>
                    {program.status === 'draft' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">Draft</span>
                    )}
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors">
                  <Play className="h-3 w-3" />
                  Use
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {program.exercises} exercises
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
      </div>
    </div>
  );
}
