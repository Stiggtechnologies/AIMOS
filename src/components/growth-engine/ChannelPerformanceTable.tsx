import React from 'react';
import { Search, MapPin, Facebook, Instagram, Music, Linkedin, Globe, Share2, CircleHelp as HelpCircle } from 'lucide-react';
import type { ChannelMetrics } from '../../services/growthEngineService';

const ICON_MAP: Record<string, React.ElementType> = {
  Search, MapPin, Facebook, Instagram, Music, Linkedin, Globe, Share2, HelpCircle,
  Stethoscope: HelpCircle, Users: HelpCircle,
};

interface Props {
  channels: ChannelMetrics[];
  onSelectChannel?: (ch: string) => void;
  selectedChannel?: string;
}

const fmt$ = (n: number) => n === 0 ? '—' : `$${n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtX   = (n: number) => n === 0 ? '—' : `${n.toFixed(2)}x`;

const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5">
    <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
  </div>
);

export const ChannelPerformanceTable: React.FC<Props> = ({ channels, onSelectChannel, selectedChannel }) => {
  const maxLeads = Math.max(...channels.map(c => c.leads), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Channel Performance</h3>
        <span className="text-xs text-gray-400">MTD · March 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Booked</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Conv %</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Spend</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CPL</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {channels.map(ch => {
              const IconComp = ICON_MAP[ch.icon] ?? HelpCircle;
              const isSelected = selectedChannel === ch.channel;
              return (
                <tr
                  key={ch.channel}
                  onClick={() => onSelectChannel?.(isSelected ? '' : ch.channel)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50/50'}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: ch.color + '20' }}>
                        <IconComp className="h-4 w-4" style={{ color: ch.color }} />
                      </div>
                      <div className="min-w-[120px]">
                        <p className="font-medium text-gray-900 text-sm">{ch.label}</p>
                        <Bar pct={(ch.leads / maxLeads) * 100} color={ch.color} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{ch.leads}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{ch.bookings}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      ch.convRate >= 40 ? 'bg-green-100 text-green-700' :
                      ch.convRate >= 25 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {fmtPct(ch.convRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fmt$(ch.spend)}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{fmt$(ch.cpl)}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-gray-900">{fmt$(ch.revenue)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`font-semibold ${ch.roas >= 5 ? 'text-green-600' : ch.roas >= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {fmtX(ch.roas)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
