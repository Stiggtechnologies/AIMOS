import { useState } from 'react';
import { Star, MessageSquare, TrendingUp, ThumbsUp, ExternalLink, RefreshCw, Search } from 'lucide-react';

const REVIEWS = [
  { id: '1', author: 'Sarah M.', rating: 5, text: 'Incredible team! My back pain is finally gone after 8 sessions. Dr. Chen is thorough and explains everything. Highly recommend!', platform: 'Google', date: '2026-03-14', status: 'responded', clinic: 'AIM North' },
  { id: '2', author: 'James K.', rating: 5, text: 'Best physiotherapy clinic I have been to. The staff is professional and the facility is top-notch.', platform: 'Google', date: '2026-03-12', status: 'pending', clinic: 'AIM South Commons' },
  { id: '3', author: 'Linda T.', rating: 4, text: 'Very good service, wait times could be shorter but the quality of treatment is excellent.', platform: 'Google', date: '2026-03-10', status: 'responded', clinic: 'AIM Westside' },
  { id: '4', author: 'Robert H.', rating: 3, text: 'Treatment was okay but parking is really difficult. Location should be reconsidered.', platform: 'Google', date: '2026-03-08', status: 'pending', clinic: 'AIM North' },
  { id: '5', author: 'Maria P.', rating: 5, text: 'After my MVA, I was in serious pain. The team at AIM got me back to full function in 3 months. Life changing!', platform: 'Google', date: '2026-03-06', status: 'responded', clinic: 'AIM South Commons' },
];

const STAR_DISTRIBUTION = [
  { stars: 5, count: 142, pct: 72 },
  { stars: 4, count: 38, pct: 19 },
  { stars: 3, count: 12, pct: 6 },
  { stars: 2, count: 4, pct: 2 },
  { stars: 1, count: 1, pct: 1 },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsView() {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = REVIEWS.filter(r => {
    const matchSearch = !search || r.author.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase());
    const matchRating = !ratingFilter || r.rating === parseInt(ratingFilter);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchRating && matchStatus;
  });

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  const pendingCount = REVIEWS.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google Reviews</h2>
          <p className="text-gray-600 mt-1">Monitor and respond to patient reviews</p>
        </div>
        <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Reviews
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl font-bold text-gray-900">{avgRating}</div>
            <div>
              <StarRating rating={Math.round(parseFloat(avgRating))} />
              <div className="text-sm text-gray-600 mt-1">{REVIEWS.length} reviews</div>
            </div>
          </div>
          <div className="space-y-2">
            {STAR_DISTRIBUTION.map(d => (
              <div key={d.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm text-gray-700">{d.stars}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-sm text-gray-600 w-8">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Reviews', value: REVIEWS.length, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Rating', value: avgRating, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Response', value: pendingCount, icon: MessageSquare, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Response Rate', value: `${Math.round((REVIEWS.filter(r => r.status === 'responded').length / REVIEWS.length) * 100)}%`, icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-lg p-4 flex flex-col gap-2`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Needs Response</option>
            <option value="responded">Responded</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className={`p-4 border rounded-lg transition-colors ${review.status === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{review.author}</span>
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-500">{review.clinic}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{new Date(review.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {review.status === 'pending' && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Needs Response</span>
                  )}
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.text}</p>
              {review.status === 'pending' && (
                <button className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  Write Response
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
