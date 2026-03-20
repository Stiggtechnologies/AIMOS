import React from 'react';
import { Clock, Phone, Mail, ChevronRight, TriangleAlert as AlertTriangle, DollarSign } from 'lucide-react';
import type { PipelineLead } from '../../services/growthEngineService';
import { FUNNEL_TYPES } from '../../services/growthEngineService';

interface Props {
  lead: PipelineLead;
  onClick: () => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  'google-ads':              'bg-blue-100 text-blue-700',
  'google-business-profile': 'bg-green-100 text-green-700',
  'facebook-ads':            'bg-blue-100 text-blue-800',
  'instagram':               'bg-pink-100 text-pink-700',
  'tiktok':                  'bg-gray-100 text-gray-800',
  'linkedin':                'bg-sky-100 text-sky-700',
  'website-organic':         'bg-emerald-100 text-emerald-700',
};

const URGENCY_COLORS: Record<string, string> = {
  high:   'text-red-500',
  medium: 'text-amber-500',
  low:    'text-gray-400',
};

const minutesAgo = (dt: string) => {
  const mins = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const LeadCard: React.FC<Props> = ({ lead, onClick }) => {
  const funnel = FUNNEL_TYPES.find(f => f.key === lead.funnel_type);
  const channelClass = CHANNEL_COLORS[lead.channel_source] ?? 'bg-gray-100 text-gray-600';
  const ageMinutes = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 60000);
  const isStale = ageMinutes > 24 * 60;
  const channelLabel = lead.lead_source?.name ?? lead.channel_source ?? 'Unknown';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group p-4 space-y-3
        ${isStale ? 'border-red-200' : 'border-gray-100'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {minutesAgo(lead.created_at)}
            {isStale && <span className="text-red-500 font-medium ml-1">· Stale</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {lead.urgency_level === 'high' && (
            <AlertTriangle className={`h-4 w-4 ${URGENCY_COLORS['high']}`} />
          )}
          {lead.lead_value_estimate > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              <DollarSign className="h-3 w-3" />
              {lead.lead_value_estimate.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {funnel && (
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${funnel.color}`}>
            {funnel.label}
          </span>
        )}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${channelClass}`}>
          {channelLabel}
        </span>
        {lead.intent_confidence === 'high' && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            High Intent
          </span>
        )}
      </div>

      {/* Contact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>

      {lead.email && (
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <Mail className="h-3 w-3" />
          {lead.email}
        </p>
      )}
    </div>
  );
};
