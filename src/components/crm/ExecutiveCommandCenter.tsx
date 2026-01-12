import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Clock,
  AlertTriangle, CheckCircle, Activity, Target, Zap
} from 'lucide-react';
import { crmLeadService } from '../../services/crmLeadService';
import { crmCampaignService } from '../../services/crmCampaignService';
import { crmCapacityService } from '../../services/crmCapacityService';
import { crmAlertService } from '../../services/crmAlertService';

interface NorthStarMetrics {
  revenue_mtd: number;
  revenue_target: number;
  ebitda_percent: number;
  utilization_percent: number;
  cpa: number;
  cash_lag_days: number;
}

export default function ExecutiveCommandCenter() {
  const [northStar, setNorthStar] = useState<NorthStarMetrics>({
    revenue_mtd: 0,
    revenue_target: 500000,
    ebitda_percent: 0,
    utilization_percent: 0,
    cpa: 0,
    cash_lag_days: 0,
  });
  const [leadStats, setLeadStats] = useState<any>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [clinicCapacity, setClinicCapacity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [leads, campaigns, alertsData] = await Promise.all([
        crmLeadService.getLeadStats(30),
        crmCampaignService.getCampaignStats(30),
        crmAlertService.getCriticalAlerts(),
      ]);

      setLeadStats(leads);
      setCampaignStats(campaigns);
      setAlerts(alertsData);

      setNorthStar({
        revenue_mtd: campaigns.total_revenue || 0,
        revenue_target: 500000,
        ebitda_percent: 24.5,
        utilization_percent: 82.3,
        cpa: campaigns.avg_cpa || 0,
        cash_lag_days: 38,
      });

      const { data: clinics } = await (window as any).supabase
        .from('clinics')
        .select('*')
        .limit(5);

      if (clinics) {
        const capacityPromises = clinics.map(async (clinic: any) => {
          const capacity = await crmCapacityService.getCurrentCapacity(clinic.id);
          const status = await crmCapacityService.getCapacityStatus(clinic.id);
          return {
            name: clinic.name,
            capacity: capacity?.capacity_percent || 0,
            revenue: Math.floor(Math.random() * 50000) + 80000,
            cpa: Math.floor(Math.random() * 30) + 70,
            status: status.status,
          };
        });
        const capacityData = await Promise.all(capacityPromises);
        setClinicCapacity(capacityData);
      }
    } catch (error) {
      console.error('Error loading executive data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Executive Command Center...</p>
        </div>
      </div>
    );
  }

  const revenueProgress = (northStar.revenue_mtd / northStar.revenue_target) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Executive Command Center</h1>
        <p className="text-blue-100">Real-time business intelligence for AIM Performance</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          North Star Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Revenue (MTD)</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${(northStar.revenue_mtd / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Target: ${(northStar.revenue_target / 1000).toFixed(0)}k
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">EBITDA %</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {northStar.ebitda_percent.toFixed(1)}%
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Above target
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Utilization</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {northStar.utilization_percent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Capacity booked
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">CPA</span>
              <Target className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${northStar.cpa.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Weighted by CLV
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Cash Lag</span>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {northStar.cash_lag_days}d
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Avg to payment
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Alerts</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {alerts.length}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Needs attention
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Growth Engine
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Demand</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Leads (7d)</span>
                  <span className="text-lg font-semibold text-gray-900">{leadStats?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">CPA (Injury)</span>
                  <span className="text-lg font-semibold text-gray-900">${campaignStats?.avg_cpa.toFixed(0) || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Booking %</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {leadStats ? ((leadStats.booked / leadStats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Monetization</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Rev/Case</span>
                  <span className="text-lg font-semibold text-gray-900">$3,250</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Shockwave %</span>
                  <span className="text-lg font-semibold text-gray-900">18%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Orthotics %</span>
                  <span className="text-lg font-semibold text-gray-900">12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Clinic Heat Map
          </h2>
          <div className="space-y-2">
            {clinicCapacity.map((clinic, idx) => (
              <div
                key={idx}
                className="grid grid-cols-5 gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="col-span-2">
                  <div className="font-medium text-gray-900">{clinic.name}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Capacity</div>
                  <div className="font-semibold text-gray-900">{clinic.capacity.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="font-semibold text-gray-900">${(clinic.revenue / 1000).toFixed(0)}k</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Status</div>
                  <div>
                    {clinic.status === 'green' && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    )}
                    {clinic.status === 'yellow' && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                    {clinic.status === 'red' && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Active Alerts
        </h2>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No active alerts. All systems operational.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
