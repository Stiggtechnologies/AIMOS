import { useState, useMemo } from 'react';
import { Plus, Filter, Search, Facebook, Instagram, Linkedin, Calendar, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, FileText, Eye, CreditCard as Edit3, Trash2, Send, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import type { ContentPost, PostStatus, Platform } from '../../services/aimAutomationService';

const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  google_business: FileText,
  tiktok: FileText,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: 'text-blue-600 bg-blue-50',
  instagram: 'text-pink-600 bg-pink-50',
  linkedin: 'text-blue-700 bg-blue-100',
  google_business: 'text-green-600 bg-green-50',
  tiktok: 'text-gray-900 bg-gray-100',
};

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; dot: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  generated: { label: 'Generated', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  awaiting_approval: { label: 'Awaiting Approval', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  approved: { label: 'Approved', color: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
  publishing: { label: 'Publishing', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  held: { label: 'Held', color: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  archived: { label: 'Archived', color: 'bg-gray-50 text-gray-500', dot: 'bg-gray-300' },
};

const STATUS_ORDER: PostStatus[] = [
  'awaiting_approval', 'draft', 'generated', 'approved', 'scheduled',
  'publishing', 'published', 'held', 'failed', 'archived'
];

interface ContentQueueViewProps {
  posts: ContentPost[];
  loading: boolean;
  onUpdateStatus: (postId: string, status: PostStatus) => Promise<void>;
}

interface PostCardProps {
  post: ContentPost;
  onUpdateStatus: (postId: string, status: PostStatus) => Promise<void>;
}

function PostCard({ post, onUpdateStatus }: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[post.status];
  const PlatformIcon = PLATFORM_ICONS[post.platform] ?? FileText;
  const platformColor = PLATFORM_COLORS[post.platform] ?? 'text-gray-600 bg-gray-50';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
      post.status === 'awaiting_approval' ? 'border-amber-300' :
      post.status === 'failed' ? 'border-red-300' :
      post.status === 'held' ? 'border-orange-300' :
      'border-gray-200'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${platformColor}`}>
              <PlatformIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-gray-500 capitalize">{post.platform.replace('_', ' ')}</span>
            <span className="text-xs font-medium text-gray-400 capitalize">{post.content_type}</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                <button
                  onClick={() => { setExpanded(e => !e); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View Details
                </button>
                {post.status === 'draft' && (
                  <button
                    onClick={() => { onUpdateStatus(post.id, 'awaiting_approval'); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit for Approval
                  </button>
                )}
                {post.status === 'approved' && (
                  <button
                    onClick={() => { onUpdateStatus(post.id, 'scheduled'); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" /> Schedule
                  </button>
                )}
                {(post.status === 'draft' || post.status === 'generated') && (
                  <button
                    onClick={() => { onUpdateStatus(post.id, 'archived'); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Archive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {post.title && <p className="text-sm font-semibold text-gray-900 mb-1">{post.title}</p>}
        <p className={`text-sm text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{post.body}</p>
        {post.body.length > 100 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
            {post.hashtags.length > 4 && (
              <span className="text-xs text-gray-400">+{post.hashtags.length - 4} more</span>
            )}
          </div>
        )}

        {post.failure_reason && (
          <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
            <span className="font-medium">Failure: </span>{post.failure_reason}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {post.aim_locations && <span>{post.aim_locations.name}</span>}
            {post.campaign_tag && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{post.campaign_tag}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {post.scheduled_at ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(post.scheduled_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(post.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentQueueView({ posts, loading, onUpdateStatus }: ContentQueueViewProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>('all');
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const filtered = useMemo(() => {
    let result = [...posts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.body.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (filterPlatform !== 'all') result = result.filter(p => p.platform === filterPlatform);
    return result;
  }, [posts, search, filterStatus, filterPlatform]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<PostStatus, number>> = {};
    posts.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return counts;
  }, [posts]);

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PostStatus | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map(s => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label} ({statusCounts[s] ?? 0})
              </option>
            ))}
          </select>

          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value as Platform | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="google_business">Google Business</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              Kanban
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_ORDER.filter(s => (statusCounts[s] ?? 0) > 0).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s
                ? STATUS_CONFIG[s].color + ' border-current'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
            {STATUS_CONFIG[s].label}
            <span className="ml-0.5 opacity-70">{statusCounts[s]}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">{filtered.length} of {posts.length} posts</p>

      {view === 'list' ? (
        <div className="space-y-3">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} onUpdateStatus={onUpdateStatus} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No posts found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {(['awaiting_approval', 'approved', 'scheduled', 'published', 'failed'] as PostStatus[]).map(status => {
            const statusPosts = filtered.filter(p => p.status === status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="min-w-52">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg mb-2 ${cfg.color}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                  <span className="ml-auto text-xs opacity-70">{statusPosts.length}</span>
                </div>
                <div className="space-y-2">
                  {statusPosts.map(post => (
                    <PostCard key={post.id} post={post} onUpdateStatus={onUpdateStatus} />
                  ))}
                  {statusPosts.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
