import { useState, useMemo } from 'react';
import { Star, TriangleAlert as AlertTriangle, MessageSquare, CircleCheck as CheckCircle, ChevronDown, ChevronUp, Filter, Search, ArrowUpRight } from 'lucide-react';
import type { ReviewTriage, ReviewPriority, ReviewStatus, ResponseTemplate } from '../../services/aimAutomationService';

const PRIORITY_CONFIG: Record<ReviewPriority, { label: string; color: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700 bg-red-50', border: 'border-red-300', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-700 bg-orange-50', border: 'border-orange-300', dot: 'bg-orange-500' },
  normal: { label: 'Normal', color: 'text-amber-700 bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-gray-600 bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700' },
  responded: { label: 'Responded', color: 'bg-green-50 text-green-700' },
  escalated: { label: 'Escalated', color: 'bg-red-50 text-red-700' },
  archived: { label: 'Archived', color: 'bg-gray-50 text-gray-500' },
  flagged: { label: 'Flagged', color: 'bg-purple-50 text-purple-700' },
};

interface ReviewTriageViewProps {
  reviews: ReviewTriage[];
  templates: ResponseTemplate[];
  loading: boolean;
  onUpdateReview: (
    reviewId: string,
    updates: Partial<Pick<ReviewTriage, 'status' | 'priority' | 'response_text' | 'responded_at' | 'escalation_note'>>
  ) => Promise<void>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  templates,
  onUpdate,
}: {
  review: ReviewTriage;
  templates: ResponseTemplate[];
  onUpdate: ReviewTriageViewProps['onUpdateReview'];
}) {
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState(review.response_text ?? '');
  const [saving, setSaving] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[review.priority];
  const statusCfg = STATUS_CONFIG[review.status];

  const handleRespond = async () => {
    setSaving(true);
    try {
      await onUpdate(review.id, {
        response_text: responseText,
        status: 'responded',
        responded_at: new Date().toISOString(),
      });
      setResponding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEscalate = async () => {
    await onUpdate(review.id, { status: 'escalated' });
  };

  const applyTemplate = (template: ResponseTemplate) => {
    setResponseText(template.template_text.replace('{{reviewer_name}}', review.reviewer_name));
  };

  return (
    <div className={`bg-white rounded-xl border ${priorityCfg.border} shadow-sm overflow-hidden`}>
      <div className={`px-4 py-2 flex items-center justify-between ${priorityCfg.color}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
          <span className="text-xs font-semibold">{priorityCfg.label} Priority</span>
          <span className="text-xs opacity-70 capitalize">{review.platform}</span>
        </div>
        <div className="flex items-center gap-2">
          {review.risk_flags.map(flag => (
            <span key={flag} className="text-xs bg-red-100 text-red-700 font-medium px-1.5 py-0.5 rounded">
              {flag.replace(/_/g, ' ')}
            </span>
          ))}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{review.reviewer_name}</span>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-xs text-gray-400">
              {review.aim_locations?.name ?? 'Unknown'} · {new Date(review.review_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className={`text-sm text-gray-700 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {review.review_body}
        </p>

        {expanded && (
          <div className="mt-4 space-y-3">
            {review.response_text && review.status === 'responded' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">Our Response:</p>
                <p className="text-sm text-green-800">{review.response_text}</p>
              </div>
            )}

            {review.status !== 'responded' && review.status !== 'archived' && (
              <div>
                {!responding ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setResponding(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> Respond
                    </button>
                    {review.status !== 'escalated' && (
                      <button
                        onClick={handleEscalate}
                        className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Escalate
                      </button>
                    )}
                    <button
                      onClick={() => onUpdate(review.id, { status: 'archived' })}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Quick templates:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {templates.slice(0, 4).map(t => (
                            <button
                              key={t.id}
                              onClick={() => applyTemplate(t)}
                              className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRespond}
                        disabled={!responseText.trim() || saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Mark as Responded'}
                      </button>
                      <button
                        onClick={() => setResponding(false)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewTriageView({ reviews, templates, loading, onUpdateReview }: ReviewTriageViewProps) {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<ReviewPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let result = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.review_body.toLowerCase().includes(q) || r.reviewer_name.toLowerCase().includes(q)
      );
    }
    if (filterPriority !== 'all') result = result.filter(r => r.priority === filterPriority);
    if (filterStatus !== 'all') result = result.filter(r => r.status === filterStatus);

    const order: ReviewPriority[] = ['critical', 'high', 'normal', 'low'];
    result.sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
    return result;
  }, [reviews, search, filterPriority, filterStatus]);

  const criticalCount = reviews.filter(r => r.priority === 'critical' && r.status !== 'archived').length;
  const respondedCount = reviews.filter(r => r.status === 'responded').length;

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: reviews.length, color: 'text-gray-900' },
          { label: 'Critical', value: criticalCount, color: criticalCount > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Responded', value: respondedCount, color: 'text-green-600' },
          {
            label: 'Avg Rating',
            value: reviews.length > 0
              ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) + ' ★'
              : '—',
            color: 'text-amber-600',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as ReviewPriority | 'all')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ReviewStatus | 'all')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="responded">Responded</option>
          <option value="escalated">Escalated</option>
          <option value="flagged">Flagged</option>
          <option value="archived">Archived</option>
        </select>

        <span className="text-xs text-gray-500">{filtered.length} reviews</span>
      </div>

      <div className="space-y-3">
        {filtered.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            templates={templates.filter(t => !review.aim_locations || t.location_id === review.location_id)}
            onUpdate={onUpdateReview}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reviews found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
