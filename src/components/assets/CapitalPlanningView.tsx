import { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, Calendar, DollarSign, Flag, X, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function conditionScoreToLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  if (score >= 3) return 'Poor';
  return 'Critical';
}

interface ReplacementRequestModal {
  assetId: string;
  assetName: string;
}

interface Props {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function CapitalPlanningView({ onNavigate }: Props) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [requestModal, setRequestModal] = useState<ReplacementRequestModal | null>(null);
  const [requestDate, setRequestDate] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => { fetchAssets(); }, []);

  async function fetchAssets() {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_tag, purchase_date, replacement_cost, condition_score, expected_replacement_date, status, criticality')
        .order('expected_replacement_date', { ascending: true, nullsFirst: false })
        .limit(200);
      setAssets(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const withReplacement = useMemo(() => assets.filter((a: any) => a.expected_replacement_date), [assets]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    withReplacement.forEach(a => {
      const y = new Date(a.expected_replacement_date).getFullYear().toString();
      years.add(y);
    });
    return Array.from(years).sort();
  }, [withReplacement]);

  const filtered = useMemo(() => {
    if (yearFilter === 'all') return withReplacement;
    return withReplacement.filter(a => new Date(a.expected_replacement_date).getFullYear().toString() === yearFilter);
  }, [withReplacement, yearFilter]);

  const totalReplacement = useMemo(() => filtered.reduce((sum, a) => sum + (a.replacement_cost || 0), 0), [filtered]);
  const dueSoon = useMemo(() => withReplacement.filter(a => new Date(a.expected_replacement_date) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), [withReplacement]);

  async function handleRequestSave() {
    if (!requestModal) return;
    if (!requestDate) { setSaveError('Please set an expected replacement date'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase.from('assets').update({
        expected_replacement_date: requestDate,
        ...(requestNotes ? { condition_notes: requestNotes } : {}),
      }).eq('id', requestModal.assetId);
      if (error) throw error;
      setSavedId(requestModal.assetId);
      setAssets(prev => prev.map(a => a.id === requestModal.assetId
        ? { ...a, expected_replacement_date: requestDate }
        : a
      ));
      setTimeout(() => {
        setRequestModal(null);
        setRequestDate('');
        setRequestNotes('');
        setSavedId(null);
      }, 1200);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-600" /> Capital Planning
        </h1>
        <p className="text-gray-500 mt-1">Asset replacement schedule and cost projections</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            {yearFilter === 'all' ? 'Total Replacement Value' : `${yearFilter} Replacement Value`}
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalReplacement.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-2">
            <Calendar className="w-4 h-4" /> Due Within 12 Months
          </div>
          <p className="text-3xl font-bold text-amber-600">{dueSoon.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Assets on Schedule
          </div>
          <p className="text-3xl font-bold text-gray-900">{withReplacement.length} <span className="text-base font-normal text-gray-400">/ {assets.length}</span></p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-semibold text-gray-900">Replacement Schedule</h2>
          <div className="flex items-center gap-3">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Years</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-xs text-gray-400">{filtered.length} asset{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Replacement Cost</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Condition</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice(0, 50).map((asset: any) => {
                const isOverdue = new Date(asset.expected_replacement_date) < new Date();
                const conditionLabel = conditionScoreToLabel(asset.condition_score);
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onNavigate?.('assets', `asset-detail:${asset.id}`)}>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.asset_tag || '—'}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {asset.replacement_cost != null ? `$${asset.replacement_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {new Date(asset.expected_replacement_date).toLocaleDateString()}
                        {isOverdue && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Overdue</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {conditionLabel} {asset.condition_score != null ? `(${asset.condition_score})` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                        asset.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{asset.status || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setRequestModal({ assetId: asset.id, assetName: asset.name }); setRequestDate(asset.expected_replacement_date?.slice(0, 10) || ''); setRequestNotes(''); setSaveError(''); }}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                      >
                        <Flag className="w-3 h-3" /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
              {assets.filter((a: any) => !a.expected_replacement_date).map((asset: any) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 cursor-pointer" onClick={() => onNavigate?.('assets', `asset-detail:${asset.id}`)}>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-xs text-gray-500">{asset.asset_tag || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {asset.replacement_cost != null ? `$${asset.replacement_cost.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 italic">Not scheduled</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {conditionScoreToLabel(asset.condition_score)} {asset.condition_score != null ? `(${asset.condition_score})` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                      asset.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{asset.status || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setRequestModal({ assetId: asset.id, assetName: asset.name }); setRequestDate(''); setRequestNotes(''); setSaveError(''); }}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all"
                    >
                      <Flag className="w-3 h-3" /> Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && <p className="px-6 py-10 text-center text-gray-500">No assets found</p>}
        </div>
      </div>

      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Replacement Request</h2>
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">{requestModal.assetName}</p>
                </div>
              </div>
              <button onClick={() => setRequestModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {savedId === requestModal.assetId ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700">Replacement date saved</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expected Replacement Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={requestDate}
                      onChange={e => setRequestDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={requestNotes}
                      onChange={e => setRequestNotes(e.target.value)}
                      rows={3}
                      placeholder="Reason for replacement, budget notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  {saveError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{saveError}</div>}
                </>
              )}
            </div>

            {savedId !== requestModal.assetId && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button onClick={() => setRequestModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={handleRequestSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Date'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
