import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { WriteBackRecommendation } from '../../services/writeBackService';

interface ApprovalModalProps {
  recommendation: WriteBackRecommendation;
  isOpen: boolean;
  isLoading: boolean;
  onApprove: (note: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onClose: () => void;
}

export default function ApprovalModal({
  recommendation,
  isOpen,
  isLoading,
  onApprove,
  onReject,
  onClose,
}: ApprovalModalProps) {
  const [approvalNote, setApprovalNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(approvalNote);
      setApprovalNote('');
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsApproving(true);
    try {
      await onReject(approvalNote);
      setApprovalNote('');
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const confidenceColor =
    recommendation.confidence_score >= 90
      ? 'text-green-600'
      : recommendation.confidence_score >= 80
        ? 'text-blue-600'
        : 'text-yellow-600';

  const impactBadgeColor = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
    critical: 'bg-red-200 text-red-900',
  };

  const recommendationTypeLabel: Record<string, string> = {
    status_update: 'Status Update',
    waitlist_fill: 'Fill No-Show Slot',
    overbook_suggestion: 'Overbook Consideration',
    reschedule: 'Reschedule Suggestion',
    block_insertion: 'Add Buffer Block',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Approval Required</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Proposed Action */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {recommendationTypeLabel[recommendation.recommendation_type] || recommendation.title}
                  </h3>
                  <p className="text-sm text-blue-800 mt-1">{recommendation.description}</p>
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-600">AI Confidence</p>
                <p className={`text-2xl font-bold ${confidenceColor}`}>
                  {recommendation.confidence_score.toFixed(0)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Required</p>
                <p className="text-lg font-semibold text-gray-900">
                  {recommendation.required_threshold.toFixed(0)}%
                </p>
              </div>
              <div>
                {recommendation.confidence_score >= recommendation.required_threshold ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-semibold">Meets Threshold</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-semibold">Below Threshold</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rationale */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Rationale</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation.rationale}</p>
            </div>

            {/* Expected Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Expected Impact
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(recommendation.expected_impact).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {typeof value === 'number' ? `${value}%` : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposed Action Details */}
            {recommendation.proposed_action && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Action Details</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {recommendation.proposed_action.instruction ||
                      JSON.stringify(recommendation.proposed_action, null, 2)}
                  </p>
                </div>
              </div>
            )}

            {/* Approval Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add any notes or comments about this decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isApproving}
              />
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900">
                <strong>Important:</strong> This approval will be logged for audit purposes. Practice Perfect
                remains the system of record. The action will be queued for execution.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
              <button
                onClick={onClose}
                disabled={isApproving}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isApproving || isLoading}
                className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving || isLoading}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
