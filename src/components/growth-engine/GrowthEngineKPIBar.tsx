import React from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Target, CircleAlert as AlertCircle, ChartBar as BarChart3, Zap } from 'lucide-react';
import type { GrowthKPIs } from '../../services/growthEngineService';

interface Props {
  kpis: GrowthKPIs;
}

const fmt = (n: number, prefix = '', suffix = '') =>
  `${prefix}${n % 1 === 0 ? n.toLocaleString() : n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;

const KPICard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const GrowthEngineKPIBar: React.FC<Props> = ({ kpis }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
    <KPICard
      icon={Users}
      label="Leads (MTD)"
      value={fmt(kpis.totalLeads)}
      sub={`${kpis.newToday} new today`}
      accent="bg-blue-500"
    />
    <KPICard
      icon={Calendar}
      label="Booked"
      value={fmt(kpis.totalBookings)}
      sub={`${kpis.overallConvRate.toFixed(1)}% conv`}
      accent="bg-green-500"
    />
    <KPICard
      icon={DollarSign}
      label="Revenue (MTD)"
      value={fmt(kpis.totalRevenue, '$')}
      sub="est. billed"
      accent="bg-emerald-500"
    />
    <KPICard
      icon={Target}
      label="Ad Spend"
      value={fmt(kpis.totalSpend, '$')}
      sub="paid channels"
      accent="bg-amber-500"
    />
    <KPICard
      icon={BarChart3}
      label="Cost / Lead"
      value={fmt(kpis.avgCPL, '$')}
      sub="paid only"
      accent="bg-orange-500"
    />
    <KPICard
      icon={Zap}
      label="Cost / Booked"
      value={fmt(kpis.avgCPB, '$')}
      sub="paid channels"
      accent="bg-rose-500"
    />
    <KPICard
      icon={TrendingUp}
      label="ROAS"
      value={`${kpis.overallROAS.toFixed(2)}x`}
      sub="blended"
      accent="bg-sky-500"
    />
    <KPICard
      icon={AlertCircle}
      label="Active Leads"
      value={fmt(kpis.activeLeads)}
      sub={`${kpis.lostLeads} lost`}
      accent="bg-gray-500"
    />
  </div>
);
