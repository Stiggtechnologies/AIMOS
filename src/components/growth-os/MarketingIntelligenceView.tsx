import { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import { getCampaigns, getLeads, getMarketingStats } from '../../services/growthOsService';
import type { Campaign, Lead } from '../../types/aim-os';

export default function MarketingIntelligenceView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ activeCampaigns: 0, totalSpend: 0, totalLeads: 0, costPerLead: 0, channelCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [campaignsData, leadsData, statsData] = await Promise.all([
        getCampaigns(undefined, 'active'),
        getLeads(),
        getMarketingStats()
      ]);
      setCampaigns(campaignsData);
      setLeads(leadsData.slice(0, 10));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading marketing intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing Intelligence</h1>
        <p className="text-gray-600 mt-1">Campaign tracking, lead generation, and ROI analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
            <Target className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
            <Users className="h-8 w-8 text-emerald-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalSpend.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cost Per Lead</p>
              <p className="text-2xl font-bold text-gray-900">${stats.costPerLead.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Channels</p>
              <p className="text-2xl font-bold text-gray-900">{stats.channelCount}</p>
            </div>
            <Activity className="h-8 w-8 text-cyan-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
          </div>
          <div className="p-6">
            {campaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active campaigns</p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                        <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${campaign.total_budget?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Spent</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${campaign.spent_to_date.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
          </div>
          <div className="p-6">
            {leads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No leads yet</p>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{lead.injury_type || 'Not specified'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                        lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Score: {lead.lead_score}/100</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
