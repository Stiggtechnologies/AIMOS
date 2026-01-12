import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  Star,
  Target,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  Info,
  Shield,
  Download
} from 'lucide-react';
import { partnerService, type PartnerClinic, type PartnerDashboardSummary } from '../../services/partnerService';

interface PartnerDashboardProps {
  partnerClinicId: string;
}

export default function PartnerDashboard({ partnerClinicId }: PartnerDashboardProps) {
  const [partner, setPartner] = useState<PartnerClinic | null>(null);
  const [summary, setSummary] = useState<PartnerDashboardSummary | null>(null);
  const [revenueShare, setRevenueShare] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [partnerClinicId, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [partnerData, summaryData, revenueData] = await Promise.all([
        partnerService.getPartnerClinicById(partnerClinicId),
        partnerService.getPartnerDashboardSummary(
          partnerClinicId,
          getStartDate(),
          new Date().toISOString().split('T')[0]
        ),
        partnerService.getRevenueShareHistory(partnerClinicId, 6),
      ]);

      setPartner(partnerData);
      setSummary(summaryData);
      setRevenueShare(revenueData);
    } catch (error) {
      console.error('Failed to load partner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case '30d':
        return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      case '90d':
        return new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      case 'ytd':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    }
  };

  const handleExportCSV = async () => {
    if (!partner) return;

    try {
      setExporting(true);
      const startDate = getStartDate();
      const endDate = new Date().toISOString().split('T')[0];

      const csvContent = await partnerService.exportDashboardToCSV(
        partnerClinicId,
        startDate,
        endDate
      );

      const filename = `${partner.partner_name.replace(/\s+/g, '_')}_Dashboard_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      partnerService.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!partner || !summary) {
    return (
      <div className="text-center text-gray-500 py-12">
        Partner dashboard data not available
      </div>
    );
  }

  const stats = [
    {
      label: 'Members Treated',
      value: summary.total_members_treated,
      icon: Users,
      color: 'blue',
      change: null,
    },
    {
      label: 'Total Visits',
      value: summary.total_visits,
      icon: Activity,
      color: 'green',
      change: null,
    },
    {
      label: 'Avg. Satisfaction',
      value: summary.avg_satisfaction?.toFixed(1) || 'N/A',
      icon: Star,
      color: 'yellow',
      subtitle: 'out of 5.0',
    },
    {
      label: 'Return-to-Play',
      value: summary.return_to_play_completions,
      icon: Target,
      color: 'purple',
      subtitle: 'completions',
    },
  ];

  const latestRevenue = revenueShare[0];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{partner.partner_name}</h1>
            <p className="text-blue-100 mt-1">
              Partner Dashboard - {(partner as any).clinics?.name}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {partner.partner_member_base.toLocaleString()} Members
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Since {new Date(partner.partnership_start_date || '').toLocaleDateString()}
              </span>
            </div>
          </div>

          {partner.is_flagship_location && (
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              Flagship Location
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Privacy Protected Dashboard</h3>
            <p className="text-sm text-blue-700 mt-1">
              This dashboard shows aggregated, de-identified metrics only. Patient names, diagnoses,
              clinical notes, and billing details are never visible to partners.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['30d', '90d', 'ytd'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as typeof dateRange)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
              {range === 'ytd' && 'Year to Date'}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization Metrics</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Avg. Visits per Episode</span>
                <span className="font-semibold">{summary.avg_visits_per_episode?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, ((summary.avg_visits_per_episode || 0) / 10) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Successful Outcomes</span>
                <span className="font-semibold">{summary.successful_outcomes_pct?.toFixed(0) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${summary.successful_outcomes_pct || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Info className="w-4 h-4" />
              <span className="font-medium">Program Participation</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.return_to_play_completions} completions
            </p>
            <p className="text-sm text-gray-600 mt-1">Return-to-play programs completed</p>
          </div>
        </div>

        {partner.revenue_share_enabled && latestRevenue && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Share</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Current Period</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestRevenue.revenue_share_amount?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(latestRevenue.period_start).toLocaleDateString()} -
                  {new Date(latestRevenue.period_end).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Partner-Sourced</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${latestRevenue.partner_sourced_revenue?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {latestRevenue.partner_sourced_patients || 0} patients
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">YTD Share</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${latestRevenue.ytd_revenue_share?.toLocaleString() || '0'}
                  </p>
                  {partner.revenue_share_cap && (
                    <p className="text-xs text-gray-500 mt-1">
                      of ${partner.revenue_share_cap.toLocaleString()} cap
                    </p>
                  )}
                </div>
              </div>

              {partner.revenue_share_cap && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Cap Progress</span>
                    <span className="font-semibold">
                      {((latestRevenue.ytd_revenue_share / partner.revenue_share_cap) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        latestRevenue.cap_exhausted ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${Math.min(100, (latestRevenue.ytd_revenue_share / partner.revenue_share_cap) * 100)}%`,
                      }}
                    />
                  </div>
                  {latestRevenue.cap_exhausted && (
                    <p className="text-xs text-red-600 mt-2">Annual cap reached</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Member conversion rate</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Aggregate utilization</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Program participation</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Return-to-play averages</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Satisfaction scores</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Patient names (blocked)</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Diagnoses (blocked)</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Clinical notes (blocked)</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span>Billing details (blocked)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
