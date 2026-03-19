import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Star, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, FileText, Zap, DollarSign, Users, ChartBar as BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import type { KpiSnapshot, CampaignHealth, ReviewTriage, ContentPost, CampaignAlert } from '../../services/aimAutomationService';

interface OverviewDashboardProps {
  kpiSnapshots: KpiSnapshot[];
  campaignHealth: CampaignHealth[];
  reviews: ReviewTriage[];
  posts: ContentPost[];
  alerts: CampaignAlert[];
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  color = 'blue',
  urgent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'gray';
  urgent?: boolean;
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className={`bg-white rounded-xl border ${urgent ? 'border-red-300 shadow-red-100' : 'border-gray-200'} shadow-sm p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function OverviewDashboard({
  kpiSnapshots,
  campaignHealth,
  reviews,
  posts,
  alerts,
  loading,
}: OverviewDashboardProps) {
  const todayKpi = useMemo(() => {
    if (!kpiSnapshots.length) return null;
    const sorted = [...kpiSnapshots].sort((a, b) =>
      new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );
    return sorted[0];
  }, [kpiSnapshots]);

  const totalSpend = useMemo(() =>
    campaignHealth.reduce((sum, c) => sum + c.spend_cents, 0) / 100,
    [campaignHealth]
  );

  const totalLeads = useMemo(() =>
    campaignHealth.reduce((sum, c) => sum + c.leads, 0),
    [campaignHealth]
  );

  const avgHealthScore = useMemo(() => {
    if (!campaignHealth.length) return 0;
    return Math.round(campaignHealth.reduce((sum, c) => sum + c.health_score, 0) / campaignHealth.length);
  }, [campaignHealth]);

  const criticalReviews = useMemo(() =>
    reviews.filter(r => r.priority === 'critical' && r.status !== 'archived'),
    [reviews]
  );

  const pendingPosts = useMemo(() =>
    posts.filter(p => p.status === 'awaiting_approval' || p.status === 'draft'),
    [posts]
  );

  const openAlerts = useMemo(() =>
    alerts.filter(a => !a.is_resolved),
    [alerts]
  );

  const chartData = useMemo(() => {
    const byDate = new Map<string, { date: string; leads: number; spend: number }>();
    kpiSnapshots.forEach(s => {
      const key = s.snapshot_date;
      const existing = byDate.get(key) || { date: key, leads: 0, spend: 0 };
      existing.leads += s.total_leads;
      existing.spend += s.total_ad_spend_cents / 100;
      byDate.set(key, existing);
    });
    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: new Date(d.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      }));
  }, [kpiSnapshots]);

  const platformData = useMemo(() => {
    const byPlatform = new Map<string, { platform: string; leads: number; spend: number }>();
    campaignHealth.forEach(c => {
      const key = c.platform;
      const existing = byPlatform.get(key) || { platform: key, leads: 0, spend: 0 };
      existing.leads += c.leads;
      existing.spend += c.spend_cents / 100;
      byPlatform.set(key, existing);
    });
    return Array.from(byPlatform.values());
  }, [campaignHealth]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Approvals"
          value={posts.filter(p => p.status === 'awaiting_approval').length}
          sub={`${pendingPosts.length} total in queue`}
          icon={CheckCircle}
          color={posts.filter(p => p.status === 'awaiting_approval').length > 0 ? 'amber' : 'green'}
          urgent={posts.filter(p => p.status === 'awaiting_approval').length > 2}
        />
        <StatCard
          label="Critical Reviews"
          value={criticalReviews.length}
          sub={`${reviews.filter(r => r.status === 'new').length} unresponded`}
          icon={AlertTriangle}
          color={criticalReviews.length > 0 ? 'red' : 'green'}
          urgent={criticalReviews.length > 0}
        />
        <StatCard
          label="Open Alerts"
          value={openAlerts.length}
          sub={`${openAlerts.filter(a => a.severity === 'critical').length} critical`}
          icon={Zap}
          color={openAlerts.filter(a => a.severity === 'critical').length > 0 ? 'red' : 'amber'}
          urgent={openAlerts.filter(a => a.severity === 'critical').length > 0}
        />
        <StatCard
          label="Avg Campaign Health"
          value={`${avgHealthScore}%`}
          sub={`${campaignHealth.length} active campaigns`}
          icon={BarChart3}
          color={avgHealthScore >= 75 ? 'green' : avgHealthScore >= 50 ? 'amber' : 'red'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Ad Spend (Today)"
          value={`$${totalSpend.toLocaleString('en-CA', { minimumFractionDigits: 0 })}`}
          sub="Across all platforms"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          label="Total Leads (Today)"
          value={totalLeads}
          sub={`${campaignHealth.reduce((s, c) => s + c.conversions, 0)} conversions`}
          icon={Users}
          color="green"
          trend={12}
        />
        <StatCard
          label="Avg Review Rating"
          value={avgRating}
          sub={`${reviews.length} total reviews`}
          icon={Star}
          color={Number(avgRating) >= 4 ? 'green' : Number(avgRating) >= 3 ? 'amber' : 'red'}
        />
        <StatCard
          label="Posts Published Today"
          value={todayKpi?.total_posts_published ?? 0}
          sub={`${todayKpi?.total_posts_pending ?? 0} pending`}
          icon={FileText}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads & Spend Trend (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={false} name="Leads" />
              <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} dot={false} name="Spend ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Platform Performance (leads vs. spend)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {openAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Alerts</h3>
          <div className="space-y-2">
            {openAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-xs mb-0.5 uppercase tracking-wide ${
                    alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`}>{alert.severity} · {alert.alert_type.replace(/_/g, ' ')}</p>
                  <p className={`${
                    alert.severity === 'critical' ? 'text-red-800' : alert.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'
                  }`}>{alert.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {criticalReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Critical Reviews Requiring Immediate Attention
          </h3>
          <div className="space-y-3">
            {criticalReviews.slice(0, 3).map(review => (
              <div key={review.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-700 uppercase">{review.priority}</span>
                    <span className="text-xs text-gray-500">{review.reviewer_name}</span>
                    <span className="text-xs text-gray-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <div className="flex gap-1">
                    {review.risk_flags.map(flag => (
                      <span key={flag} className="text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-medium">
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{review.review_body}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400 capitalize">
                    {review.aim_locations?.name ?? 'Unknown location'} · {review.platform}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    review.status === 'escalated' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{review.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Campaign Health Summary</h3>
        <div className="space-y-2">
          {campaignHealth.slice(0, 8).map(camp => (
            <div key={camp.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{camp.campaign_name}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-500">{camp.health_score}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      camp.status === 'active' ? 'bg-green-100 text-green-700' :
                      camp.status === 'paused' ? 'bg-gray-100 text-gray-600' :
                      camp.status === 'limited' ? 'bg-amber-100 text-amber-700' :
                      camp.status === 'learning' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    } capitalize`}>{camp.status}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      camp.health_score >= 75 ? 'bg-green-500' :
                      camp.health_score >= 50 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${camp.health_score}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-gray-700">${(camp.spend_cents / 100).toFixed(0)}</p>
                <p className="text-xs text-gray-400">{camp.leads} leads</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Data refreshes automatically. Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
