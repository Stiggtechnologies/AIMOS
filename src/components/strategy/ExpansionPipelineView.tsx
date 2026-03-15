import { useState } from 'react';
import { Map, Plus, Search, MapPin, DollarSign, Calendar, TrendingUp, Building2, ChevronRight, Clock } from 'lucide-react';

const LOCATIONS = [
  { id: '1', name: 'AIM South Commons', city: 'Calgary, AB', address: '4500 South Trail Blvd', stage: 'open', openDate: '2026-04-15', capex: 580000, projectedRevenue: 1200000, population: 85000, competition: 'low', status: 'launched' },
  { id: '2', name: 'AIM Crowfoot', city: 'Calgary, AB (NW)', address: 'Crowfoot Village Market', stage: 'build_out', openDate: '2026-07-01', capex: 520000, projectedRevenue: 980000, population: 72000, competition: 'medium', status: 'construction' },
  { id: '3', name: 'AIM Bridlewood', city: 'Calgary, AB (SW)', address: 'Bridlewood Town Centre', stage: 'lease_signed', openDate: '2026-10-01', capex: 495000, projectedRevenue: 920000, population: 68000, competition: 'low', status: 'planning' },
  { id: '4', name: 'AIM Airdrie', city: 'Airdrie, AB', address: 'Kingsview Market', stage: 'site_selection', openDate: '2027-01-01', capex: 460000, projectedRevenue: 850000, population: 78000, competition: 'low', status: 'prospect' },
  { id: '5', name: 'AIM Okotoks', city: 'Okotoks, AB', address: 'TBD', stage: 'market_analysis', openDate: '2027-04-01', capex: 440000, projectedRevenue: 780000, population: 35000, competition: 'low', status: 'prospect' },
];

const STAGE_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  market_analysis: { label: 'Market Analysis', color: 'bg-gray-100 text-gray-700', step: 1 },
  site_selection: { label: 'Site Selection', color: 'bg-yellow-100 text-yellow-800', step: 2 },
  lease_signed: { label: 'Lease Signed', color: 'bg-blue-100 text-blue-800', step: 3 },
  build_out: { label: 'Build-Out', color: 'bg-orange-100 text-orange-800', step: 4 },
  open: { label: 'Open', color: 'bg-green-100 text-green-800', step: 5 }
};

const COMPETITION_COLORS: Record<string, string> = {
  low: 'text-green-700',
  medium: 'text-yellow-700',
  high: 'text-red-700'
};

export default function ExpansionPipelineView() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const filtered = LOCATIONS.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalCapex = LOCATIONS.reduce((s, l) => s + l.capex, 0);
  const totalRevenue = LOCATIONS.reduce((s, l) => s + l.projectedRevenue, 0);

  const PIPELINE_STEPS = ['market_analysis', 'site_selection', 'lease_signed', 'build_out', 'open'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expansion Pipeline</h2>
          <p className="text-gray-600 mt-1">New clinic site development and launch pipeline</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <h3 className="font-semibold text-gray-900 mb-4">Pipeline Stages</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const cfg = STAGE_CONFIG[step];
            const count = LOCATIONS.filter(l => l.stage === step).length;
            return (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <div className={`px-4 py-2 rounded-lg text-center min-w-32 ${count > 0 ? cfg.color : 'bg-gray-50 text-gray-400'}`}>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs">{cfg.label}</div>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
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
        </div>

        <div className="space-y-3">
          {filtered.map(location => {
            const stageCfg = STAGE_CONFIG[location.stage];
            return (
              <div key={location.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{location.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${stageCfg.color}`}>
                        {stageCfg.label}
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
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
