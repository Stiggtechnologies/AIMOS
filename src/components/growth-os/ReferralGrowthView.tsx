import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertCircle, Heart, DollarSign } from 'lucide-react';
import { getReferralPartners, getReferralGaps } from '../../services/growthOsService';
import type { ReferralPartner, ReferralGap } from '../../types/aim-os';

export default function ReferralGrowthView() {
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [gaps, setGaps] = useState<ReferralGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [partnersData, gapsData] = await Promise.all([
        getReferralPartners(),
        getReferralGaps('open')
      ]);
      setPartners(partnersData);
      setGaps(gapsData);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading referral data...</span>
      </div>
    );
  }

  const totalReferrals = partners.reduce((sum, p) => sum + p.total_referrals, 0);
  const ytdReferrals = partners.reduce((sum, p) => sum + p.ytd_referrals, 0);
  const avgHealthScore = partners.length > 0
    ? Math.round(partners.reduce((sum, p) => sum + p.relationship_health_score, 0) / partners.length)
    : 0;
  const atRiskPartners = partners.filter(p => p.relationship_status === 'at_risk').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referral Growth Engine</h1>
        <p className="text-gray-600 mt-1">Partner relationships and referral expansion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Partners</p>
              <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
            </div>
            <Users className="h-8 w-8 text-amber-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">YTD Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{ytdReferrals}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Health Score</p>
              <p className="text-2xl font-bold text-gray-900">{avgHealthScore}%</p>
            </div>
            <Heart className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">At Risk</p>
              <p className="text-2xl font-bold text-gray-900">{atRiskPartners}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                {gaps.length} Referral Gaps Detected
              </h3>
              <p className="text-sm text-red-800 mb-3">
                These partners show declining volume or underperformance vs peers
              </p>
              <div className="space-y-2">
                {gaps.slice(0, 3).map((gap) => {
                  const partner = partners.find(p => p.id === gap.partner_id);
                  return (
                    <div key={gap.id} className="bg-white p-3 rounded border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{partner?.partner_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{gap.gap_description}</p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                          ${gap.opportunity_value?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Referral Partners</h2>
        </div>
        <div className="overflow-x-auto">
          {partners.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No referral partners found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lifetime Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{partner.partner_name}</div>
                          <div className="text-sm text-gray-500">{partner.primary_contact_name || 'No contact'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                        {partner.partner_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              partner.relationship_health_score >= 75 ? 'bg-green-500' :
                              partner.relationship_health_score >= 50 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${partner.relationship_health_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{partner.relationship_health_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {partner.ytd_referrals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${partner.lifetime_value?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        partner.relationship_status === 'active' ? 'bg-green-100 text-green-800' :
                        partner.relationship_status === 'at_risk' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {partner.relationship_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
