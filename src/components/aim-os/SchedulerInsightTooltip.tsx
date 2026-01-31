import { useState } from 'react';
import { X, ChevronDown, Clock, BookOpen } from 'lucide-react';
import { ScheduleIntelligence } from '../../services/schedulerService';
import { schedulerService } from '../../services/schedulerService';

interface SchedulerInsightTooltipProps {
  insight: ScheduleIntelligence;
  position?: { x: number; y: number };
  onDismiss?: (insightId: string) => void;
  onSnooze?: (insightId: string, duration: number) => void;
}

const SNOOZE_OPTIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '1 day', minutes: 1440 },
];

export default function SchedulerInsightTooltip({
  insight,
  position,
  onDismiss,
  onSnooze,
}: SchedulerInsightTooltipProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const getIconColor = () => {
    switch (insight.type) {
      case 'no_show_risk':
        return 'text-amber-600';
      case 'capacity_gap':
        return 'text-blue-600';
      case 'overbooking':
        return 'text-red-600';
      case 'schedule_instability':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'no_show_risk':
        return '🔶';
      case 'capacity_gap':
        return '🔵';
      case 'overbooking':
        return '🔴';
      case 'schedule_instability':
        return '🟣';
      default:
        return '○';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-900';
    if (confidence >= 80) return 'bg-blue-100 text-blue-900';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-900';
    return 'bg-gray-100 text-gray-900';
  };

  const handleSnooze = async (minutes: number) => {
    if (onSnooze) {
      onSnooze(insight.id, minutes);
    } else {
      try {
        await schedulerService.snoozeInsight(insight.id, minutes, insight.appointment_id);
        setShowSnoozeOptions(false);
      } catch (error) {
        console.error('Error snoozing insight:', error);
      }
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(insight.id);
    } else {
      schedulerService.dismissInsight(insight.id, insight.appointment_id).catch(error => {
        console.error('Error dismissing insight:', error);
      });
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm z-50"
      style={{
        position: position ? 'fixed' : 'relative',
        left: position?.x,
        top: position?.y,
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <span className="text-2xl">{getTypeIcon()}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{insight.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {insight.tooltip && (
          <p className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded border border-gray-200">
            {insight.tooltip}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(insight.confidence)}`}>
            Confidence: {insight.confidence.toFixed(0)}%
          </span>
          {insight.suggested_action && (
            <span className="text-xs text-blue-600 font-medium">{insight.suggested_action}</span>
          )}
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={14} />
              Why am I seeing this?
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showExplanation ? 'rotate-180' : ''}`}
            />
          </button>

          {showExplanation && insight.explanation && (
            <div className="px-3 py-2 bg-gray-50 rounded text-sm space-y-2">
              <p className="text-gray-700">{insight.explanation.summary}</p>
              {insight.explanation.factors.length > 0 && (
                <ul className="space-y-1 text-gray-600">
                  {insight.explanation.factors.map((factor, idx) => (
                    <li key={idx} className="text-xs flex gap-2">
                      <span className="text-gray-400">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Clock size={14} />
                Snooze
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform ${showSnoozeOptions ? 'rotate-180' : ''}`}
              />
            </button>

            {showSnoozeOptions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-md z-50">
                {SNOOZE_OPTIONS.map(option => (
                  <button
                    key={option.minutes}
                    onClick={() => handleSnooze(option.minutes)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-b-0 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
