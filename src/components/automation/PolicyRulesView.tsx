import { useState } from 'react';
import { Shield, ToggleLeft as Toggle, ChevronDown, ChevronUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import type { PolicyRule } from '../../services/aimAutomationService';

const RULE_TYPE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  content_filter: { label: 'Content Filter', color: 'bg-red-50 text-red-700', description: 'Block posts containing prohibited language or claims' },
  approval_gate: { label: 'Approval Gate', color: 'bg-amber-50 text-amber-700', description: 'Require human approval before publishing' },
  schedule_restriction: { label: 'Schedule Restriction', color: 'bg-blue-50 text-blue-700', description: 'Restrict posting to specific hours' },
  spend_cap: { label: 'Spend Cap', color: 'bg-purple-50 text-purple-700', description: 'Limit advertising spend automatically' },
  review_escalation: { label: 'Review Escalation', color: 'bg-orange-50 text-orange-700', description: 'Auto-escalate reviews matching conditions' },
  auto_pause: { label: 'Auto Pause', color: 'bg-gray-50 text-gray-700', description: 'Automatically pause underperforming campaigns' },
};

interface PolicyRulesViewProps {
  rules: PolicyRule[];
  loading: boolean;
  onToggle: (ruleId: string, isActive: boolean) => Promise<void>;
}

function RuleCard({ rule, onToggle }: { rule: PolicyRule; onToggle: PolicyRulesViewProps['onToggle'] }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const typeCfg = RULE_TYPE_CONFIG[rule.rule_type] ?? { label: rule.rule_type, color: 'bg-gray-50 text-gray-700', description: '' };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(rule.id, !rule.is_active);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeCfg.color}`}>
                {typeCfg.label}
              </span>
              <span className="text-xs text-gray-400">Priority {rule.priority}</span>
              {rule.platform && rule.platform !== 'all' && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{rule.platform}</span>
              )}
              {rule.aim_locations && (
                <span className="text-xs text-gray-400">{rule.aim_locations.name}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'} ${toggling ? 'opacity-50' : ''}`}
            >
              <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 mt-2 text-xs ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`}>
          {rule.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {rule.is_active ? 'Active' : 'Inactive'}
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conditions</p>
              <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto text-gray-700">
                {JSON.stringify(rule.conditions, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Actions</p>
              <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto text-gray-700">
                {JSON.stringify(rule.actions, null, 2)}
              </pre>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Created {new Date(rule.created_at).toLocaleDateString()}</span>
              <span>Updated {new Date(rule.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PolicyRulesView({ rules, loading, onToggle }: PolicyRulesViewProps) {
  const activeCount = rules.filter(r => r.is_active).length;

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const grouped = Object.keys(RULE_TYPE_CONFIG).reduce((acc, type) => {
    const typeRules = rules.filter(r => r.rule_type === type);
    if (typeRules.length > 0) acc[type] = typeRules;
    return acc;
  }, {} as Record<string, PolicyRule[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Policy Rules</h2>
          <p className="text-sm text-gray-500">{activeCount} of {rules.length} rules active</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{activeCount} rules protecting your content</span>
        </div>
      </div>

      {Object.entries(grouped).map(([type, typeRules]) => {
        const typeCfg = RULE_TYPE_CONFIG[type];
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeCfg.color}`}>{typeCfg.label}</span>
              <p className="text-xs text-gray-400">{typeCfg.description}</p>
            </div>
            {typeRules.map(rule => (
              <RuleCard key={rule.id} rule={rule} onToggle={onToggle} />
            ))}
          </div>
        );
      })}

      {rules.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No policy rules configured</p>
          <p className="text-sm text-gray-400 mt-1">Add rules to automate content governance</p>
        </div>
      )}
    </div>
  );
}
