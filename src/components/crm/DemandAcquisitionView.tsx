import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Activity,
  PauseCircle, PlayCircle, AlertCircle, CheckCircle, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { crmCampaignService } from '../../services/crmCampaignService';
import { crmCapacityService } from '../../services/crmCapacityService';

export default function DemandAcquisitionView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any>({ top: [], bottom: [] });
  const [funnelData, setFunnelData] = useState<any>({});
  const [capacityStatus, setCapacityStatus] = useState<any>(null);
  const [serviceLines, setServiceLines] = useState<any[]>([]);
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedServiceLine]);

  async function loadData() {
    try {
      const [campaignsData, topKeywords, bottomKeywords] = await Promise.all([
        crmCampaignService.getCampaigns({ status: 'active' }),
        crmCampaignService.getTopKeywords(10),
        crmCampaignService.getBottomKeywords(10),
      ]);

      setCampaigns(campaignsData);
      setKeywords({ top: topKeywords, bottom: bottomKeywords });

      const serviceLineId = selectedServiceLine === 'all' ? undefined : selectedServiceLine;
      const funnel = await crmCampaignService.getFunnelData(serviceLineId, 30);
      setFunnelData(funnel);

      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (clinics) {
        const status = await crmCapacityService.getCapacityStatus(clinics.id);
        setCapacityStatus(status);
      }

      const { data: services } = await supabase
        .from('crm_service_lines')
        .select('*')
        .eq('active', true)
        .order('priority');

      setServiceLines(services || []);
    } catch (error) {
      console.error('Error loading demand data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleCampaign(id: string, currentStatus: string) {
    try {
      if (currentStatus === 'active') {
        await crmCampaignService.pauseCampaign(id);
      } else {
        await crmCampaignService.activateCampaign(id);
      }
      loadData();
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Demand & Acquisition...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Demand & Acquisition</h1>
        <p className="text-green-100">Control marketing spend without breaking operations</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          Spend Control Panel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Daily Spend</div>
            <div className="text-2xl font-bold text-gray-900">
              ${campaigns.reduce((sum, c) => sum + (c.actual_spend || 0), 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Budget: ${campaigns.reduce((sum, c) => sum + (c.daily_budget || 0), 0).toFixed(0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1">CPA (All Services)</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(campaigns.reduce((sum, c) => sum + (c.cpa || 0), 0) / Math.max(campaigns.length, 1)).toFixed(0)}
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -8% vs last week
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-gray-600 mb-1">ROAS</div>
            <div className="text-2xl font-bold text-gray-900">
              {(campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / Math.max(campaigns.length, 1)).toFixed(1)}x
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Return on ad spend
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            capacityStatus?.status === 'green'
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
              : capacityStatus?.status === 'yellow'
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
              : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
          }`}>
            <div className="text-sm text-gray-600 mb-1">Capacity Throttle</div>
            <div className="text-2xl font-bold text-gray-900 uppercase">
              {capacityStatus?.status || 'N/A'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {capacityStatus?.message || 'Checking...'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Funnel by Service Line
          </h2>
          <select
            value={selectedServiceLine}
            onChange={(e) => setSelectedServiceLine(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            {serviceLines.map(sl => (
              <option key={sl.id} value={sl.id}>{sl.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-900">{funnelData.clicks || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Clicks</div>
            <div className="text-xs text-gray-500 mt-1">From ads</div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="text-sm text-gray-600 ml-2">
              {funnelData.click_to_lead ? funnelData.click_to_lead.toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{funnelData.leads || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Leads</div>
            <div className="text-xs text-gray-500 mt-1">Form submissions</div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="text-sm text-gray-600 ml-2">
              {funnelData.lead_to_booking ? funnelData.lead_to_booking.toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg text-center border border-green-200">
            <div className="text-3xl font-bold text-green-900">{funnelData.booked || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Booked</div>
            <div className="text-xs text-gray-500 mt-1">${funnelData.revenue_per_lead ? funnelData.revenue_per_lead.toFixed(0) : 0}/lead</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Conversion Rate</div>
            <div className="text-xl font-semibold text-gray-900">
              {funnelData.lead_to_booking ? funnelData.lead_to_booking.toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Cost per Lead</div>
            <div className="text-xl font-semibold text-gray-900">
              ${funnelData.leads ? (funnelData.revenue / funnelData.leads).toFixed(0) : 0}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Revenue per Lead</div>
            <div className="text-xl font-semibold text-gray-900">
              ${funnelData.revenue_per_lead ? funnelData.revenue_per_lead.toFixed(0) : 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            Top 10 Revenue Keywords
          </h2>
          <div className="space-y-2">
            {keywords.top.map((kw: any, idx: number) => (
              <div key={kw.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500">#{idx + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{kw.keyword}</div>
                    <div className="text-xs text-gray-500">{kw.match_type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">${(kw.revenue || 0).toFixed(0)}</div>
                  <div className="text-xs text-gray-500">ROAS: {(kw.roas || 0).toFixed(1)}x</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
            <TrendingDown className="w-5 h-5" />
            Bottom 10 Waste Keywords
          </h2>
          <div className="space-y-2">
            {keywords.bottom.map((kw: any, idx: number) => (
              <div key={kw.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500">#{idx + 1}</span>
                  <div>
                    <div className="font-medium text-gray-900">{kw.keyword}</div>
                    <div className="text-xs text-gray-500">{kw.match_type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-600">${(kw.spend || 0).toFixed(0)}</div>
                  <div className="text-xs text-gray-500">ROAS: {(kw.roas || 0).toFixed(1)}x</div>
                  <button className="text-xs text-red-600 hover:text-red-800 mt-1">
                    Suggest Pause
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          Active Campaigns
        </h2>
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                    <span>Spend: ${(campaign.actual_spend || 0).toFixed(0)}</span>
                    <span>Leads: {campaign.total_leads || 0}</span>
                    <span>CPA: ${(campaign.cpa || 0).toFixed(0)}</span>
                    <span>ROAS: {(campaign.roas || 0).toFixed(1)}x</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                  className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {campaign.status === 'active' ? (
                    <PauseCircle className="w-5 h-5 text-gray-600" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-green-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
