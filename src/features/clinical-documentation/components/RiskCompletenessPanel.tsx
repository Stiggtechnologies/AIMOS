import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  AlertCircle,
  Activity,
} from 'lucide-react';

export type RiskScore = 'low' | 'medium' | 'high';

interface BlockingIssue {
  id: string;
  description: string;
  category: string;
}

interface WarningIssue {
  id: string;
  description: string;
  category: string;
}

interface SectionStatus {
  key: string;
  label: string;
  isComplete: boolean;
}

interface RiskCompletenessPanelProps {
  completenessScore: number;
  riskScore: RiskScore;
  blockingIssues?: BlockingIssue[];
  warningIssues?: WarningIssue[];
  sectionStatuses?: SectionStatus[];
  isSignable?: boolean;
  onValidate?: () => void;
  isValidating?: boolean;
}

const riskColors = {
  low: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  high: 'text-red-400 bg-red-500/20 border-red-500/30',
};

const riskLabels = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

const sectionLabels: Record<string, string> = {
  subjective: 'Subjective',
  objective: 'Objective',
  assessment: 'Assessment',
  treatment: 'Treatment',
  response: 'Response',
  plan: 'Plan',
  followup: 'Follow-up',
};

export function RiskCompletenessPanel({
  completenessScore = 0,
  riskScore = 'low',
  blockingIssues = [],
  warningIssues = [],
  sectionStatuses = [],
  isSignable = false,
  onValidate,
  isValidating = false,
}: RiskCompletenessPanelProps) {
  const [activeTab, setActiveTab] = useState<'risk' | 'completeness'>('completeness');

  const getProgressColor = (score: number): string => {
    if (score >= 70) return '#10b981'; // emerald-500
    if (score >= 40) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getProgressBg = (score: number): string => {
    if (score >= 70) return 'bg-emerald-500/20';
    if (score >= 40) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  const completenessColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const defaultSections = [
    { key: 'subjective', label: 'Subjective', isComplete: false },
    { key: 'objective', label: 'Objective', isComplete: false },
    { key: 'assessment', label: 'Assessment', isComplete: false },
    { key: 'treatment', label: 'Treatment', isComplete: false },
    { key: 'response', label: 'Response', isComplete: false },
    { key: 'plan', label: 'Plan', isComplete: false },
    { key: 'followup', label: 'Follow-up', isComplete: false },
  ];

  const displaySections = sectionStatuses.length > 0 ? sectionStatuses : defaultSections;
  const completeCount = displaySections.filter((s) => s.isComplete).length;
  const missingSections = displaySections.filter((s) => !s.isComplete);

  // Circular progress calculations
  const radius = 36;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (completenessScore / 100) * circumference;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('completeness')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'completeness'
              ? 'text-blue-400 bg-slate-800/50 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
        >
          <Activity className="w-4 h-4" />
          Completeness
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'risk'
              ? 'text-blue-400 bg-slate-800/50 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
        >
          <Shield className="w-4 h-4" />
          Risk
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'completeness' ? (
          <div className="flex flex-col items-center gap-6">
            {/* Circular Progress */}
            <div className="relative">
              <svg width="100" height="100" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={stroke}
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={getProgressColor(completenessScore)}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${completenessColor(completenessScore)}`}>
                  {completenessScore}
                </span>
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-lg text-sm font-medium
              ${completenessScore >= 70
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : completenessScore >= 40
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
              {completenessScore >= 70
                ? 'Ready to Complete'
                : completenessScore >= 40
                  ? 'Needs More Detail'
                  : 'Incomplete'
              }
            </div>

            {/* Section Breakdown */}
            <div className="w-full">
              <h4 className="text-xs font-medium text-slate-400 mb-3">Section Status</h4>
              <div className="space-y-2">
                {displaySections.map((section) => (
                  <div
                    key={section.key}
                    className={`flex items-center justify-between p-2 rounded-lg border
                      ${section.isComplete
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                      }`}
                  >
                    <span className={`text-sm ${section.isComplete ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sectionLabels[section.key] || section.label}
                    </span>
                    {section.isComplete ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Missing Count */}
              {missingSections.length > 0 && (
                <div className="mt-3 text-xs text-red-400">
                  {missingSections.length} section{missingSections.length > 1 ? 's' : ''} need more detail
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Overall Risk Score */}
            <div className={`p-4 rounded-lg border ${riskColors[riskScore]}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">{riskLabels[riskScore]}</span>
                </div>
                <span className="text-xs opacity-75">
                  Overall Documentation Risk
                </span>
              </div>
            </div>

            {/* Blocking Issues */}
            {blockingIssues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-red-400 flex items-center gap-2">
                  <XCircle className="w-3 h-3" />
                  Blocking Issues ({blockingIssues.length})
                </h4>
                <div className="space-y-2">
                  {blockingIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <p className="text-sm text-red-300">{issue.description}</p>
                      <span className="text-xs text-red-500/70">{issue.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Issues */}
            {warningIssues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Warnings ({warningIssues.length})
                </h4>
                <div className="space-y-2">
                  {warningIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <p className="text-sm text-amber-300">{issue.description}</p>
                      <span className="text-xs text-amber-500/70">{issue.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Issues */}
            {blockingIssues.length === 0 && warningIssues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <CheckCircle className="w-8 h-8 mb-3 text-emerald-500" />
                <p className="text-sm">No risk issues detected</p>
                <p className="text-xs mt-1">Documentation looks good</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 space-y-3">
        {/* Validate Button */}
        <button
          onClick={onValidate}
          disabled={isValidating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <CheckCircle className="w-4 h-4" />
          Validate Now
        </button>

        {/* Sign Status */}
        {isSignable ? (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Ready to Sign</span>
          </div>
        ) : blockingIssues.length > 0 ? (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {blockingIssues.length} blocking issue{blockingIssues.length > 1 ? 's' : ''}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default RiskCompletenessPanel;
