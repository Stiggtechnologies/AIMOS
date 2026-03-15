import { useState, useEffect } from 'react';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Building2, Wifi, Stethoscope, Users, Megaphone, CreditCard, Package, ChevronDown, ChevronRight, Flag } from 'lucide-react';
import { launchService, type ClinicLaunch } from '../../services/launchService';

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  facilities: { label: 'Facilities', icon: <Building2 className="h-5 w-5" />, color: 'text-orange-600' },
  it: { label: 'IT & Systems', icon: <Wifi className="h-5 w-5" />, color: 'text-blue-600' },
  clinical_ops: { label: 'Clinical Ops', icon: <Stethoscope className="h-5 w-5" />, color: 'text-teal-600' },
  staffing: { label: 'Staffing', icon: <Users className="h-5 w-5" />, color: 'text-green-600' },
  marketing: { label: 'Marketing', icon: <Megaphone className="h-5 w-5" />, color: 'text-pink-600' },
  billing: { label: 'Billing & Payers', icon: <CreditCard className="h-5 w-5" />, color: 'text-amber-600' },
  equipment: { label: 'Equipment', icon: <Package className="h-5 w-5" />, color: 'text-gray-600' },
};

interface ReadinessItem { label: string; done: boolean; critical: boolean }
interface ReadinessCategory { score: number; items: ReadinessItem[] }

const READINESS_DATA: Record<string, ReadinessCategory> = {
  facilities: {
    score: 92,
    items: [
      { label: 'Lease signed and possession confirmed', done: true, critical: true },
      { label: 'Building permit approved', done: true, critical: true },
      { label: 'Construction 95%+ complete', done: true, critical: true },
      { label: 'Final municipal inspection passed', done: true, critical: true },
      { label: 'Occupancy permit issued', done: false, critical: true },
      { label: 'Signage installed', done: true, critical: false },
      { label: 'Furniture and fixtures in place', done: true, critical: false },
      { label: 'Parking arrangements confirmed', done: true, critical: false },
      { label: 'Cleaning completed', done: false, critical: false },
      { label: 'Fire and safety systems tested', done: true, critical: true },
      { label: 'Accessibility compliance verified', done: true, critical: false },
    ],
  },
  it: {
    score: 88,
    items: [
      { label: 'Internet and phone lines active', done: true, critical: true },
      { label: 'EMR clinic profile live (Jane App)', done: true, critical: true },
      { label: 'POS and payment terminal tested', done: true, critical: true },
      { label: 'Staff accounts and MFA configured', done: true, critical: true },
      { label: 'AIM OS clinic integration activated', done: false, critical: true },
      { label: 'Online booking enabled', done: true, critical: true },
      { label: 'PIPA data handling reviewed', done: true, critical: true },
      { label: 'Security cameras and alarm live', done: true, critical: false },
      { label: 'Backup and disaster recovery tested', done: false, critical: false },
      { label: 'Printer and scanner setup', done: true, critical: false },
    ],
  },
  clinical_ops: {
    score: 95,
    items: [
      { label: 'College registration submitted', done: true, critical: true },
      { label: 'Service menu finalized', done: true, critical: true },
      { label: 'SOPs localized and distributed', done: true, critical: true },
      { label: 'Intake forms loaded into EMR', done: true, critical: true },
      { label: 'Payer credentialing submitted (WCB, DVA)', done: true, critical: true },
      { label: 'Treatment room assignments set', done: true, critical: false },
      { label: 'Emergency protocol reviewed by all staff', done: false, critical: true },
      { label: 'Supply inventory stocked', done: true, critical: false },
      { label: 'Sterilization protocols confirmed', done: true, critical: true },
      { label: 'Patient privacy notice displayed', done: true, critical: true },
    ],
  },
  staffing: {
    score: 78,
    items: [
      { label: 'Clinic Director / Lead PT hired', done: true, critical: true },
      { label: 'All clinical roles filled', done: false, critical: true },
      { label: 'Front desk admin hired', done: true, critical: true },
      { label: 'All staff background checks complete', done: true, critical: true },
      { label: 'Onboarding and orientation done', done: false, critical: true },
      { label: 'Payroll setup for all staff', done: true, critical: true },
      { label: 'Uniform and ID badges issued', done: false, critical: false },
      { label: 'Staff schedule for opening week set', done: false, critical: true },
      { label: 'Training certifications verified', done: true, critical: true },
    ],
  },
  marketing: {
    score: 84,
    items: [
      { label: 'Google Business Profile live', done: true, critical: true },
      { label: 'Website location page published', done: true, critical: true },
      { label: 'Digital ads running (Facebook/Google)', done: true, critical: false },
      { label: 'GP and specialist outreach complete', done: false, critical: false },
      { label: 'Trainer/gym referral partnerships initiated', done: true, critical: false },
      { label: 'Grand opening event scheduled', done: false, critical: false },
      { label: 'Patient review request workflow set up', done: true, critical: false },
      { label: 'Promotional materials printed', done: true, critical: false },
    ],
  },
  billing: {
    score: 90,
    items: [
      { label: 'Business registration complete', done: true, critical: true },
      { label: 'Bank account and merchant services active', done: true, critical: true },
      { label: 'Fee schedule loaded into EMR', done: true, critical: true },
      { label: 'WCB billing setup and test claim sent', done: true, critical: true },
      { label: 'Group benefits / direct billing active', done: false, critical: true },
      { label: 'Invoice and receipt templates confirmed', done: true, critical: false },
      { label: 'Chart of accounts set up', done: true, critical: true },
      { label: 'AR reporting activated in AIM OS', done: true, critical: false },
    ],
  },
  equipment: {
    score: 82,
    items: [
      { label: 'Treatment tables delivered and assembled', done: true, critical: true },
      { label: 'Ultrasound units calibrated', done: true, critical: true },
      { label: 'Shockwave unit tested', done: false, critical: false },
      { label: 'Gym rehab equipment installed', done: true, critical: false },
      { label: 'Electrotherapy units tested', done: true, critical: false },
      { label: 'Laser therapy unit calibrated', done: false, critical: false },
      { label: 'Traction table installed', done: true, critical: false },
      { label: 'All equipment service records filed', done: true, critical: false },
    ],
  },
};

const THRESHOLD = 85;

function scoreColor(s: number) { return s >= THRESHOLD ? 'text-green-700' : s >= 70 ? 'text-amber-700' : 'text-red-700'; }
function barColor(s: number) { return s >= THRESHOLD ? 'bg-green-500' : s >= 70 ? 'bg-amber-500' : 'bg-red-500'; }
function scoreStatus(s: number) {
  if (s >= THRESHOLD) return { label: 'Ready', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" /> };
  if (s >= 70) return { label: 'At Risk', color: 'bg-amber-100 text-amber-800', icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> };
  return { label: 'Not Ready', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3.5 w-3.5 text-red-600" /> };
}

interface BranchLaunchReadinessDashboardProps {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function BranchLaunchReadinessDashboard({ onNavigate }: BranchLaunchReadinessDashboardProps) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [launches, setLaunches] = useState<ClinicLaunch[]>([]);
  const [selectedLaunchId, setSelectedLaunchId] = useState<string>('');
  const [loadingLaunches, setLoadingLaunches] = useState(true);

  useEffect(() => {
    launchService.getAllLaunches()
      .then(data => {
        setLaunches(data);
        if (data.length > 0) setSelectedLaunchId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingLaunches(false));
  }, []);

  const selectedLaunch = launches.find(l => l.id === selectedLaunchId);

  const toggle = (cat: string) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  const categories = Object.keys(READINESS_DATA);
  const overallScore = Math.round(categories.reduce((s, c) => s + READINESS_DATA[c].score, 0) / categories.length);
  const readyCount = categories.filter(c => READINESS_DATA[c].score >= THRESHOLD).length;
  const notReadyCount = categories.filter(c => READINESS_DATA[c].score < THRESHOLD).length;
  const goLiveReady = notReadyCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Launch Readiness Assessment</h2>
          <p className="text-gray-600 mt-1">All categories must score 85%+ to authorize go-live</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedLaunch && onNavigate && (
            <button
              onClick={() => onNavigate('operations', `launch-detail:${selectedLaunch.id}`)}
              className="px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Launch Detail
            </button>
          )}
        <select
          value={selectedLaunchId}
          onChange={e => setSelectedLaunchId(e.target.value)}
          disabled={loadingLaunches}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loadingLaunches ? (
            <option>Loading...</option>
          ) : launches.length === 0 ? (
            <option value="">No launches found</option>
          ) : launches.map(l => (
            <option key={l.id} value={l.id}>{l.launch_name}</option>
          ))}
        </select>
        </div>
      </div>

      <div className={`rounded-xl border-2 p-6 flex items-center justify-between ${goLiveReady ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${goLiveReady ? 'bg-green-100' : 'bg-amber-100'}`}>
            {goLiveReady
              ? <CheckCircle className="h-8 w-8 text-green-600" />
              : <AlertTriangle className="h-8 w-8 text-amber-600" />}
          </div>
          <div>
            <div className={`text-xl font-bold ${goLiveReady ? 'text-green-800' : 'text-amber-800'}`}>
              {goLiveReady ? 'Go-Live Authorized' : `Go-Live Blocked — ${notReadyCount} categor${notReadyCount === 1 ? 'y' : 'ies'} below threshold`}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">{selectedLaunch?.launch_name ?? 'Select a launch'} · Overall Score: {overallScore}% · Threshold: {THRESHOLD}%</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${goLiveReady ? 'text-green-700' : 'text-amber-700'}`}>{overallScore}%</div>
          <div className="text-sm text-gray-500">{readyCount}/{categories.length} ready</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Score', value: `${overallScore}%`, color: scoreColor(overallScore) },
          { label: 'Categories Ready', value: `${readyCount}/${categories.length}`, color: 'text-green-700' },
          { label: 'Threshold', value: `${THRESHOLD}%`, color: 'text-gray-700' },
          { label: 'Target Open Date', value: selectedLaunch ? new Date(selectedLaunch.target_open_date).toLocaleDateString() : '—', color: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Category Scorecard</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥85% Ready</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 70–84% At Risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;70% Blocked</span>
          </div>
        </div>

        <div className="space-y-3">
          {categories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const data = READINESS_DATA[cat];
            const status = scoreStatus(data.score);
            const isExpanded = expandedCats[cat];
            const doneCount = data.items.filter(i => i.done).length;
            const criticalPending = data.items.filter(i => !i.done && i.critical).length;

            return (
              <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(cat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <span className="font-medium text-gray-900">{cfg.label}</span>
                    <div className="flex items-center gap-1">
                      {status.icon}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    {criticalPending > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        <Flag className="h-3 w-3" />{criticalPending} critical pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${scoreColor(data.score)}`}>{data.score}%</div>
                      <div className="text-xs text-gray-500">{doneCount}/{data.items.length} items</div>
                    </div>
                    <div className="w-28 bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${barColor(data.score)}`} style={{ width: `${data.score}%` }} />
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-100">
                    {data.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-5 py-2.5">
                        {item.done
                          ? <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          : <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${item.critical ? 'border-red-400' : 'border-gray-300'}`} />}
                        <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : item.critical ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                        {!item.done && item.critical && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Critical</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
