import { useState } from 'react';
import { TrendingUp, Users, UserPlus, Star, Phone, Mail, Dumbbell, Building2, ArrowUpRight, ArrowDownRight, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, ExternalLink } from 'lucide-react';

interface GrowthCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface LeadItem {
  id: string;
  name: string;
  source: string;
  phone: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'lost';
  slaMinutesRemaining: number;
}

interface ReferralPartner {
  id: string;
  name: string;
  type: 'trainer' | 'physician' | 'employer';
  referralsThisMonth: number;
  conversionRate: number;
  avgResponseTime: string;
  trend: 'up' | 'down' | 'stable';
}

interface ReviewRequest {
  id: string;
  patientName: string;
  sentAt: string;
  status: 'sent' | 'opened' | 'completed' | 'expired';
  rating?: number;
}

export function GrowthCommandCenter({ onNavigate }: GrowthCommandCenterProps) {
  const [kpis] = useState({
    newLeadsToday: 12,
    leadsTrend: 8.5,
    conversionRate: 68,
    conversionTrend: 2.1,
    newPatientsWtd: 45,
    patientsTrend: 12,
    referralVolume: 28,
    referralTrend: 15,
    avgDaysToFirstAppt: 2.4,
    aptTrend: -0.3,
    reviewsThisMonth: 42,
    avgRating: 4.8
  });

  const [funnelData] = useState({
    leads: 156,
    contacted: 124,
    booked: 89,
    arrived: 78,
    converted: 72
  });

  const [leads] = useState<LeadItem[]>([
    { id: '1', name: 'Jennifer Smith', source: 'Google Ads', phone: '(780) 555-0123', createdAt: '15 min ago', status: 'new', slaMinutesRemaining: 45 },
    { id: '2', name: 'David Lee', source: 'Trainer Referral', phone: '(780) 555-0124', createdAt: '32 min ago', status: 'new', slaMinutesRemaining: 28 },
    { id: '3', name: 'Amanda Brown', source: 'Website Form', phone: '(780) 555-0125', createdAt: '1 hour ago', status: 'contacted', slaMinutesRemaining: 0 },
    { id: '4', name: 'Chris Wilson', source: 'Walk-in', phone: '(780) 555-0126', createdAt: '2 hours ago', status: 'scheduled', slaMinutesRemaining: 0 },
  ]);

  const [topPartners] = useState<ReferralPartner[]>([
    { id: '1', name: 'Evolve Fitness', type: 'trainer', referralsThisMonth: 12, conversionRate: 85, avgResponseTime: '18 min', trend: 'up' },
    { id: '2', name: 'GoodLife Fitness', type: 'trainer', referralsThisMonth: 8, conversionRate: 78, avgResponseTime: '25 min', trend: 'stable' },
    { id: '3', name: 'Dr. Johnson', type: 'physician', referralsThisMonth: 6, conversionRate: 92, avgResponseTime: '2 hrs', trend: 'up' },
    { id: '4', name: 'ABC Corp HR', type: 'employer', referralsThisMonth: 5, conversionRate: 100, avgResponseTime: '45 min', trend: 'stable' },
  ]);

  const [reviewRequests] = useState<ReviewRequest[]>([
    { id: '1', patientName: 'Sarah Johnson', sentAt: 'Today 9:15 AM', status: 'completed', rating: 5 },
    { id: '2', patientName: 'Michael Chen', sentAt: 'Today 10:30 AM', status: 'opened' },
    { id: '3', patientName: 'Emma Wilson', sentAt: 'Yesterday', status: 'completed', rating: 5 },
    { id: '4', patientName: 'James Anderson', sentAt: 'Yesterday', status: 'sent' },
  ]);

  const getStatusColor = (status: LeadItem['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-amber-100 text-amber-700',
      scheduled: 'bg-emerald-100 text-emerald-700',
      converted: 'bg-green-100 text-green-700',
      lost: 'bg-gray-100 text-gray-700'
    };
    return colors[status];
  };

  const getPartnerIcon = (type: ReferralPartner['type']) => {
    const icons = { trainer: Dumbbell, physician: UserPlus, employer: Building2 };
    return icons[type];
  };

  const funnelTotal = funnelData.leads;
  const funnelWidths = {
    leads: 100,
    contacted: (funnelData.contacted / funnelTotal) * 100,
    booked: (funnelData.booked / funnelTotal) * 100,
    arrived: (funnelData.arrived / funnelTotal) * 100,
    converted: (funnelData.converted / funnelTotal) * 100
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Patient acquisition, referrals, and reputation management</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Clinics</option>
            <option>AIM South Commons</option>
            <option>AIM Windermere</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>This Week</option>
            <option>This Month</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Growth KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-blue-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+{kpis.leadsTrend}%
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.newLeadsToday}</div>
          <div className="text-xs text-blue-100 mt-0.5">New Leads Today</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-emerald-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+{kpis.conversionTrend}%
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
          <div className="text-xs text-emerald-100 mt-0.5">Conversion Rate</div>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-sky-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+{kpis.patientsTrend}%
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.newPatientsWtd}</div>
          <div className="text-xs text-sky-100 mt-0.5">New Patients WTD</div>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-rose-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+{kpis.referralTrend}%
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.referralVolume}</div>
          <div className="text-xs text-rose-100 mt-0.5">Referrals MTD</div>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-teal-100">
              <ArrowDownRight className="h-3 w-3 mr-0.5" />{kpis.aptTrend}d
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.avgDaysToFirstAppt}</div>
          <div className="text-xs text-teal-100 mt-0.5">Days to 1st Appt</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{kpis.avgRating}</div>
          <div className="text-xs text-amber-100 mt-0.5">{kpis.reviewsThisMonth} Reviews MTD</div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Conversion Funnel (MTD)</h2>
        <div className="space-y-3">
          {Object.entries(funnelData).map(([stage, count], idx) => {
            const width = funnelWidths[stage as keyof typeof funnelWidths];
            const colors = ['bg-blue-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500'];
            return (
              <div key={stage} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600 capitalize">{stage}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${colors[idx]} rounded-lg flex items-center justify-end pr-3 transition-all`}
                      style={{ width: `${Math.max(width, 15)}%` }}
                    >
                      <span className="text-white font-semibold text-sm">{count}</span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-500">
                  {idx > 0 ? `${((count / Object.values(funnelData)[idx - 1]) * 100).toFixed(0)}%` : '100%'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Lead Queue</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                {leads.filter(l => l.status === 'new' && l.slaMinutesRemaining < 30).length} urgent
              </span>
            </div>
            <button
              onClick={() => onNavigate('growth', 'leads')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {leads.map(lead => (
              <div key={lead.id} className={`p-4 hover:bg-gray-50 ${lead.status === 'new' && lead.slaMinutesRemaining < 30 ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{lead.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{lead.source} - {lead.phone}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{lead.createdAt}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {lead.status === 'new' && lead.slaMinutesRemaining > 0 && (
                      <span className={`text-xs px-2 py-1 rounded ${lead.slaMinutesRemaining < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        <Clock className="h-3 w-3 inline mr-1" />{lead.slaMinutesRemaining}m
                      </span>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Call">
                      <Phone className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Email">
                      <Mail className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Review Pipeline</h2>
            </div>
            <button
              onClick={() => onNavigate('growth', 'reviews')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {reviewRequests.map(review => (
              <div key={review.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{review.patientName}</p>
                    <p className="text-sm text-gray-500">{review.sentAt}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {review.status === 'completed' && review.rating && (
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    {review.status === 'sent' && <Mail className="h-4 w-4 text-gray-400" />}
                    {review.status === 'opened' && <ExternalLink className="h-4 w-4 text-blue-500" />}
                    {review.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button className="w-full py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium">
              Send Review Requests
            </button>
          </div>
        </div>
      </div>

      {/* Referral Partners Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5 text-rose-500" />
            <h2 className="font-semibold text-gray-900">Top Referral Partners</h2>
          </div>
          <button
            onClick={() => onNavigate('growth', 'trainers')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All Partners
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Referrals MTD</th>
                <th className="px-4 py-3 text-right">Conversion</th>
                <th className="px-4 py-3 text-right">Avg Response</th>
                <th className="px-4 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topPartners.map(partner => {
                const Icon = getPartnerIcon(partner.type);
                return (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{partner.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center space-x-2 text-sm text-gray-600">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{partner.type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{partner.referralsThisMonth}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={partner.conversionRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}>
                        {partner.conversionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{partner.avgResponseTime}</td>
                    <td className="px-4 py-3 text-center">
                      {partner.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-500 mx-auto" />}
                      {partner.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500 mx-auto" />}
                      {partner.trend === 'stable' && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
