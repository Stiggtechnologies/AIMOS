import { useState } from 'react';
import { Map, Plus, Search, MapPin, DollarSign, Calendar, TrendingUp, Building2, ChevronRight, FileSearch, SquareCheck as CheckSquare, CircleCheck as CheckCircle, Hammer, Eye, Star } from 'lucide-react';

const LOCATIONS = [
  { id: '1', name: 'AIM South Commons', city: 'Calgary, AB', address: '4500 South Trail Blvd', stage: 'open', openDate: '2026-04-15', capex: 580000, projectedRevenue: 1200000, population: 85000, competition: 'low', type: 'new_clinic' },
  { id: '2', name: 'AIM Crowfoot', city: 'Calgary, AB (NW)', address: 'Crowfoot Village Market', stage: 'under_construction', openDate: '2026-07-01', capex: 520000, projectedRevenue: 980000, population: 72000, competition: 'medium', type: 'new_clinic' },
  { id: '3', name: 'AIM Bridlewood', city: 'Calgary, AB (SW)', address: 'Bridlewood Town Centre', stage: 'launch_planning', openDate: '2026-10-01', capex: 495000, projectedRevenue: 920000, population: 68000, competition: 'low', type: 'new_clinic' },
  { id: '4', name: 'AIM Airdrie', city: 'Airdrie, AB', address: 'Kingsview Market', stage: 'approved', openDate: '2027-01-01', capex: 460000, projectedRevenue: 850000, population: 78000, competition: 'low', type: 'new_clinic' },
  { id: '5', name: 'AIM Okotoks', city: 'Okotoks, AB', address: 'TBD', stage: 'due_diligence', openDate: '2027-04-01', capex: 440000, projectedRevenue: 780000, population: 35000, competition: 'low', type: 'new_clinic' },
  { id: '6', name: 'Calgary NE Acquisition', city: 'Calgary, AB (NE)', address: 'TBD', stage: 'target_identified', openDate: '2027-06-01', capex: 280000, projectedRevenue: 720000, population: 92000, competition: 'medium', type: 'acquisition' },
  { id: '7', name: 'AIM Cochrane', city: 'Cochrane, AB', address: 'TBD', stage: 'opening_soon', openDate: '2026-05-01', capex: 390000, projectedRevenue: 680000, population: 29000, competition: 'low', type: 'satellite' },
];

const STAGE_CONFIG: Record<string, { label: string; color: string; step: number; icon: React.ReactNode }> = {
  target_identified: { label: 'Target Identified', color: 'bg-gray-100 text-gray-700', step: 1, icon: <Map className="h-3.5 w-3.5" /> },
  due_diligence: { label: 'Due Diligence', color: 'bg-yellow-100 text-yellow-800', step: 2, icon: <FileSearch className="h-3.5 w-3.5" /> },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', step: 3, icon: <CheckSquare className="h-3.5 w-3.5" /> },
  launch_planning: { label: 'Launch Planning', color: 'bg-sky-100 text-sky-800', step: 4, icon: <CheckCircle className="h-3.5 w-3.5" /> },
  under_construction: { label: 'Under Construction', color: 'bg-orange-100 text-orange-800', step: 5, icon: <Hammer className="h-3.5 w-3.5" /> },
  opening_soon: { label: 'Opening Soon', color: 'bg-teal-100 text-teal-800', step: 6, icon: <Eye className="h-3.5 w-3.5" /> },
  open: { label: 'Open', color: 'bg-green-100 text-green-800', step: 7, icon: <Star className="h-3.5 w-3.5" /> },
};

const TYPE_LABELS: Record<string, string> = {
  new_clinic: 'New Clinic',
  acquisition: 'Acquisition',
  partner: 'Partner',
  satellite: 'Satellite',
};

const TYPE_COLORS: Record<string, string> = {
  new_clinic: 'bg-blue-50 text-blue-700 border-blue-200',
  acquisition: 'bg-amber-50 text-amber-700 border-amber-200',
  partner: 'bg-teal-50 text-teal-700 border-teal-200',
  satellite: 'bg-gray-50 text-gray-700 border-gray-200',
};

const COMPETITION_COLORS: Record<string, string> = {
  low: 'text-green-700',
  medium: 'text-yellow-700',
  high: 'text-red-700'
};

const PIPELINE_STEPS = ['target_identified', 'due_diligence', 'approved', 'launch_planning', 'under_construction', 'opening_soon', 'open'];

export default function ExpansionPipelineView() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = LOCATIONS.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || l.stage === stageFilter;
    const matchType = !typeFilter || l.type === typeFilter;
    return matchSearch && matchStage && matchType;
  });

  const totalCapex = LOCATIONS.reduce((s, l) => s + l.capex, 0);
  const totalRevenue = LOCATIONS.reduce((s, l) => s + l.projectedRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expansion Pipeline</h2>
          <p className="text-gray-600 mt-1">New clinic site development, acquisitions, and launch pipeline</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{LOCATIONS.length}</div>
          <div className="text-sm text-gray-600">Sites in Pipeline</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{LOCATIONS.filter(l => l.stage === 'open').length}</div>
          <div className="text-sm text-gray-600">Launched</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-gray-900">${(totalCapex / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">Total CapEx Pipeline</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-teal-600">${(totalRevenue / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">Projected Revenue</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">7-Stage CRE Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const cfg = STAGE_CONFIG[step];
            const count = LOCATIONS.filter(l => l.stage === step).length;
            return (
              <div key={step} className="flex items-center gap-1 flex-shrink-0">
                <div className={`px-3 py-2 rounded-lg text-center min-w-28 border ${count > 0 ? `${cfg.color} border-transparent` : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className={count > 0 ? '' : 'opacity-40'}>{cfg.icon}</span>
                    <span className="text-lg font-bold leading-none">{count}</span>
                  </div>
                  <div className="text-xs leading-tight">{cfg.label}</div>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sites..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stages</option>
            {PIPELINE_STEPS.map(s => (
              <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="new_clinic">New Clinic</option>
            <option value="acquisition">Acquisition</option>
            <option value="partner">Partner</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(location => {
            const stageCfg = STAGE_CONFIG[location.stage];
            return (
              <div key={location.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{location.name}</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${stageCfg.color}`}>
                        {stageCfg.icon}
                        {stageCfg.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded border ${TYPE_COLORS[location.type]}`}>
                        {TYPE_LABELS[location.type]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {location.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        Open: {new Date(location.openDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        CapEx: ${(location.capex / 1000).toFixed(0)}K
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                        Proj. Revenue: ${(location.projectedRevenue / 1000).toFixed(0)}K
                      </span>
                      <span>
                        Competition: <span className={`font-medium capitalize ${COMPETITION_COLORS[location.competition]}`}>{location.competition}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No sites match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
