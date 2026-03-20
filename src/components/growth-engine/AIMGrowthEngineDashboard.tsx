import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Plus, Filter, ChevronRight, Zap, Target, ChartBar as BarChart3 } from 'lucide-react';
import { growthEngineService, type GrowthKPIs, type ChannelMetrics, type DailyTrend } from '../../services/growthEngineService';
import { GrowthEngineKPIBar } from './GrowthEngineKPIBar';
import { ChannelPerformanceTable } from './ChannelPerformanceTable';
import { MultiTrendChart } from './TrendChart';

const CHANNEL_ICONS_COLOR: Record<string, string> = {
  'google-ads':             '#4285F4',
  'google-business-profile':'#34A853',
  'facebook-ads':           '#1877F2',
  'instagram':              '#E1306C',
  'tiktok':                 '#010101',
  'linkedin':               '#0A66C2',
  'website-organic':        '#059669',
};

interface Props {
  onNavigate?: (module: string, sub: string) => void;
}

export const AIMGrowthEngineDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<GrowthKPIs | null>(null);
  const [channels, setChannels] = useState<ChannelMetrics[]>([]);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [k, ch, tr] = await Promise.all([
        growthEngineService.getGrowthKPIs(),
        growthEngineService.getChannelMetrics(),
        growthEngineService.getDailyTrends(14),
      ]);
      setKpis(k);
      setChannels(ch);
      setTrends(tr);
    } catch (err) {
      console.error('Growth Engine load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        <div className="grid grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const topChannel = channels.reduce((best, ch) =>
    ch.leads > (best?.leads ?? 0) ? ch : best, channels[0]);

  const topROAS = channels.filter(c => c.roas > 0).reduce((best, ch) =>
    ch.roas > (best?.roas ?? 0) ? ch : best, channels.find(c => c.roas > 0));

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AIM Growth Engine</h1>
              <p className="text-xs text-gray-500">Multi-channel acquisition · Pipeline · Attribution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.('growth', 'growth-engine-new-lead')}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Lead
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* KPI Bar */}
        {kpis && <GrowthEngineKPIBar kpis={kpis} />}

        {/* Quick Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Channel */}
          {topChannel && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Channel (Leads)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold"
                  style={{ backgroundColor: CHANNEL_ICONS_COLOR[topChannel.channel] ?? '#6B7280' }}>
                  {topChannel.label.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{topChannel.label}</p>
                  <p className="text-sm text-gray-500">{topChannel.leads} leads · ${topChannel.revenue.toLocaleString()} rev</p>
                </div>
              </div>
            </div>
          )}

          {/* Best ROAS */}
          {topROAS && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Best ROAS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold"
                  style={{ backgroundColor: CHANNEL_ICONS_COLOR[topROAS.channel] ?? '#6B7280' }}>
                  {topROAS.label.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{topROAS.label}</p>
                  <p className="text-sm text-gray-500">{topROAS.roas.toFixed(2)}x ROAS · ${topROAS.cpl.toFixed(0)} CPL</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'View Pipeline', sub: onNavigate ? () => onNavigate('growth', 'growth-engine-pipeline') : undefined },
                { label: 'Channel Attribution', sub: onNavigate ? () => onNavigate('growth', 'growth-engine-attribution') : undefined },
                { label: 'Lead Queue', sub: onNavigate ? () => onNavigate('growth', 'intake-conversion') : undefined },
              ].map(({ label, sub }) => (
                <button key={label} onClick={sub}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <span>{label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">14-Day Lead & Booking Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily intake across all channels</p>
            </div>
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <MultiTrendChart data={trends} />
        </div>

        {/* Channel Table */}
        <ChannelPerformanceTable
          channels={channels}
          onSelectChannel={setSelectedChannel}
          selectedChannel={selectedChannel}
        />

        {/* Funnel Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Closed-Loop Funnel</h3>
          <div className="flex items-stretch gap-0">
            {[
              { label: 'Content', icon: '✦', value: 'All channels', bg: 'from-blue-500 to-blue-600' },
              { label: 'Lead Capture', icon: '→', value: kpis ? `${kpis.totalLeads} leads` : '—', bg: 'from-blue-600 to-blue-700' },
              { label: 'Pipeline', icon: '→', value: kpis ? `${kpis.activeLeads} active` : '—', bg: 'from-blue-700 to-rose-500' },
              { label: 'Booking', icon: '→', value: kpis ? `${kpis.totalBookings} booked` : '—', bg: 'from-rose-500 to-rose-600' },
              { label: 'Revenue', icon: '→', value: kpis ? `$${kpis.totalRevenue.toLocaleString()}` : '—', bg: 'from-rose-600 to-emerald-500' },
              { label: 'Optimize', icon: '↻', value: 'ROAS loop', bg: 'from-emerald-500 to-emerald-600' },
            ].map((step, i) => (
              <div key={step.label} className="flex-1 flex items-center">
                <div className={`flex-1 bg-gradient-to-r ${step.bg} px-3 py-4 text-center ${
                  i === 0 ? 'rounded-l-xl' : i === 5 ? 'rounded-r-xl' : ''
                }`}>
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">{step.label}</p>
                  <p className="text-sm font-bold text-white">{step.value}</p>
                </div>
                {i < 5 && (
                  <div className="w-0 h-0 border-t-[20px] border-b-[20px] border-l-[10px] border-transparent"
                    style={{ borderLeftColor: 'transparent' }} />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
