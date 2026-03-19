import { useState } from 'react';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Facebook, Instagram, Linkedin, FileText, Calendar, MessageSquare, CircleAlert as AlertCircle } from 'lucide-react';
import type { ContentApproval, Platform } from '../../services/aimAutomationService';

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  google_business: FileText,
  tiktok: FileText,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'text-blue-600 bg-blue-50',
  instagram: 'text-pink-600 bg-pink-50',
  linkedin: 'text-blue-700 bg-blue-100',
  google_business: 'text-green-600 bg-green-50',
  tiktok: 'text-gray-900 bg-gray-100',
};

interface ApprovalCenterViewProps {
  approvals: ContentApproval[];
  loading: boolean;
  onDecide: (approvalId: string, decision: 'approved' | 'rejected', feedback?: string) => Promise<void>;
}

function ApprovalCard({ approval, onDecide }: {
  approval: ContentApproval;
  onDecide: (id: string, decision: 'approved' | 'rejected', feedback?: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const post = approval.aim_content_posts;
  if (!post) return null;

  const platform = post.platform as Platform;
  const PlatformIcon = PLATFORM_ICONS[platform] ?? FileText;
  const platformColor = PLATFORM_COLORS[platform] ?? 'text-gray-600 bg-gray-50';

  const handleDecide = async (decision: 'approved' | 'rejected') => {
    setDeciding(true);
    try {
      await onDecide(approval.id, decision, feedback || undefined);
    } finally {
      setDeciding(false);
      setShowFeedback(false);
    }
  };

  const waitingHours = Math.round(
    (Date.now() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${platformColor}`}>
              <PlatformIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-gray-600 capitalize">{platform.replace('_', ' ')}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{post.content_type}</span>
            {post.aim_locations && (
              <span className="text-xs text-gray-500">{post.aim_locations.name}</span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${waitingHours > 24 ? 'text-red-600' : waitingHours > 8 ? 'text-amber-600' : 'text-gray-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            {waitingHours < 1 ? 'just now' : `${waitingHours}h`}
          </div>
        </div>

        {post.title && <h3 className="text-sm font-semibold text-gray-900 mb-2">{post.title}</h3>}

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 leading-relaxed">{post.body}</p>
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          {post.scheduled_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Scheduled: {new Date(post.scheduled_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {post.campaign_tag && (
            <span className="flex items-center gap-1">
              Campaign: {post.campaign_tag}
            </span>
          )}
          <span>Submitted {new Date(approval.created_at).toLocaleDateString()}</span>
        </div>

        {showFeedback && (
          <div className="mb-4">
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Add feedback for the author (optional)..."
              className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDecide('approved')}
            disabled={deciding}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => setShowFeedback(s => !s)}
            className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDecide('rejected')}
            disabled={deciding}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalCenterView({ approvals, loading, onDecide }: ApprovalCenterViewProps) {
  const pending = approvals.filter(a => a.status === 'pending');
  const decided = approvals.filter(a => a.status !== 'pending');
  const [showDecided, setShowDecided] = useState(false);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
          <p className="text-sm text-gray-500">{pending.length} post{pending.length !== 1 ? 's' : ''} awaiting your review</p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
            <AlertCircle className="w-3.5 h-3.5" />
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-500 mt-1">No posts are awaiting approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map(approval => (
            <ApprovalCard key={approval.id} approval={approval} onDecide={onDecide} />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div>
          <button
            onClick={() => setShowDecided(s => !s)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium mb-3"
          >
            {showDecided ? 'Hide' : 'Show'} {decided.length} decided approval{decided.length !== 1 ? 's' : ''}
          </button>
          {showDecided && (
            <div className="space-y-2">
              {decided.map(approval => {
                const post = approval.aim_content_posts;
                if (!post) return null;
                return (
                  <div key={approval.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      approval.status === 'approved' || approval.status === 'auto_approved'
                        ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {approval.status === 'approved' || approval.status === 'auto_approved'
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{post.title || post.body.slice(0, 60) + '...'}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {approval.status} · {approval.decided_at ? new Date(approval.decided_at).toLocaleDateString() : 'N/A'}
                        {approval.feedback && ` · "${approval.feedback}"`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{post.platform.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
