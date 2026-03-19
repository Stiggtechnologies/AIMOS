import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, ChartBar as BarChart3, Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from 'recharts';
import type { CampaignHealth, CampaignAlert } from '../../services/aimAutomationService';

const HEALTH_COLOR = (score: number) =>
  score >= 75 ? 'text-green-600 bg-green-50' :
  score >= 50 ? 'text-amber-600 bg-amber-50' :
  'text-red-600 bg-red-50';

const HEALTH_BAR = (score: number) =>
  score >= 75 ? 'bg-green-500' :
  score >= 50 ? 'bg-amber-500' :
  'bg-red-500';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-600' },
  learning: { label: 'Learning', color: 'bg-blue-100 text-blue-700' },
  limited: { label: 'Limited', color: 'bg-amber-100 text-amber-700' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700' },
};

interface CampaignHealthViewProps {
  campaigns: CampaignHealth[];
  alerts: CampaignAlert[];
  loading: boolean;
  onResolveAlert: (alertId: string) => Promise<void>;
}

export default function CampaignHealthView({
  campaigns,
  alerts,
  loading,
  onResolveAlert,
}: CampaignHealthViewProps) {
  const openAlerts = useMemo(() => alerts.filter(a => !a.is_resolved), [alerts]);

  const totals = useMemo(() => ({
    spend: campaigns.reduce((s, c) => s + c.spend_cents, 0) / 100,
    leads: campaigns.reduce((s, c) => s + c.leads, 0),
    conversions: campaigns.reduce((s, c) => s + c.conversions, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    avgHealth: campaigns.length
      ? Math.round(campaigns.reduce((s, c) => s + c.health_score, 0) / campaigns.length)
      : 0,
  }), [campaigns]);

  const platformChartData = useMemo(() => {
    const byPlatform = new Map<string, { platform: string; leads: number; spend: number; conversions: number }>();
    campaigns.forEach(c => {
      const key = c.platform;
      const existing = byPlatform.get(key) || { platform: key, leads: 0, spend: 0, conversions: 0 };
      existing.leads += c.leads;
      existing.spend += c.spend_cents / 100;
      existing.conversions += c.conversions;
      byPlatform.set(key, existing);
    });
    return Array.from(byPlatform.values());
  }, [campaigns]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Spend', value: `$${totals.spend.toLocaleString('en-CA', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'blue' as const },
          { label: 'Total Leads', value: totals.leads.toLocaleString(), icon: Users, color: 'green' as const },
          { label: 'Conversions', value: totals.conversions.toLocaleString(), icon: CheckCircle, color: 'green' as const },
          { label: 'Avg Health Score', value: `${totals.avgHealth}%`, icon: Activity, color: totals.avgHealth >= 75 ? 'green' as const : totals.avgHealth >= 50 ? 'amber' as const : 'red' as const },
          { label: 'Open Alerts', value: openAlerts.length, icon: AlertTriangle, color: openAlerts.length > 0 ? 'red' as const : 'green' as const },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            amber: 'bg-amber-50 text-amber-600',
            red: 'bg-red-50 text-red-600',
          };
          return (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {openAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">Active Alerts</h3>
          {openAlerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                alert.severity === 'critical' ? 'text-red-500' :
                alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
              }`} />
              <p className={`flex-1 text-sm ${
                alert.severity === 'critical' ? 'text-red-800' :
                alert.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'
              }`}>{alert.message}</p>
              <button
                onClick={() => onResolveAlert(alert.id)}
                className="flex-shrink-0 px-2.5 py-1 bg-white border text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads by Platform</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" radius={[3, 3, 0, 0]} />
              <Bar dataKey="conversions" fill="#10b981" name="Conversions" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spend by Platform ($)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(0)}`} />
              <Bar dataKey="spend" fill="#f59e0b" name="Spend ($)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Campaign', 'Platform', 'Health', 'Status', 'Spend', 'Leads', 'CPL', 'ROAS'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map(campaign => {
                const statusCfg = STATUS_CONFIG[campaign.status] ?? { label: campaign.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">{campaign.campaign_name}</p>
                      <p className="text-xs text-gray-400">{campaign.aim_locations?.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 capitalize">{campaign.platform.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${HEALTH_BAR(campaign.health_score)}`}
                            style={{ width: `${campaign.health_score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${HEALTH_COLOR(campaign.health_score)}`}>
                          {campaign.health_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                      ${(campaign.spend_cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{campaign.leads}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      ${(campaign.cpl_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-xs font-medium ${campaign.roas >= 3 ? 'text-green-600' : campaign.roas >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                        {campaign.roas >= 2 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {campaign.roas.toFixed(2)}x
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No campaign data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
