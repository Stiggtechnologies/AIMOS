import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Eye,
} from 'lucide-react';

interface SectionCompletenessCheckProps {
  section: string;
  label: string;
  isComplete: boolean;
  missingItems: string[];
  riskItems: string[];
}

type StatusLevel = 'complete' | 'warning' | 'blocking';

function getStatusLevel(
  isComplete: boolean,
  missingItems: string[],
  riskItems: string[],
): StatusLevel {
  if (missingItems.length > 0) return 'blocking';
  if (riskItems.length > 0) return 'warning';
  if (isComplete) return 'complete';
  return 'warning';
}

const statusConfig: Record<StatusLevel, {
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
  IconComponent: React.ElementType;
}> = {
  complete: {
    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/5',
    label: 'Complete',
    IconComponent: CheckCircle,
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/5',
    label: 'Warnings',
    IconComponent: AlertTriangle,
  },
  blocking: {
    icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
    bgColor: 'bg-red-500/5',
    label: 'Issues',
    IconComponent: XCircle,
  },
};

export function SectionCompletenessCheck({
  section,
  label,
  isComplete,
  missingItems,
  riskItems,
}: SectionCompletenessCheckProps) {
  const [expanded, setExpanded] = useState(false);
  const statusLevel = getStatusLevel(isComplete, missingItems, riskItems);
  const config = statusConfig[statusLevel];

  const hasIssues = missingItems.length > 0 || riskItems.length > 0;

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} overflow-hidden transition-colors`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-medium text-white">{label}</span>
          {isComplete && missingItems.length === 0 && riskItems.length === 0 ? (
            <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {config.label}
            </span>
          ) : (
            <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} border ${config.borderColor}`}>
              {missingItems.length > 0
                ? `${missingItems.length} missing`
                : `${riskItems.length} warnings`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mark as Reviewed checkbox */}
          <button
            onClick={() => {}}
            className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
              isComplete
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            <Eye className="w-3 h-3" />
            Mark Reviewed
          </button>
          {hasIssues && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {expanded && hasIssues && (
        <div className="border-t border-slate-700/50 px-3 py-2 space-y-2">
          {/* Missing items */}
          {missingItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Missing mandatory items:
              </p>
              <ul className="ml-4 space-y-1">
                {missingItems.map((item, idx) => (
                  <li key={idx} className="text-xs text-red-300 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk items */}
          {riskItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Risk items:
              </p>
              <ul className="ml-4 space-y-1">
                {riskItems.map((item, idx) => (
                  <li key={idx} className="text-xs text-amber-300 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}