import { useState } from 'react';
import { Dumbbell, Plus, Search, Phone, Mail, Users, TrendingUp, Star, MapPin } from 'lucide-react';

const TRAINERS = [
  { id: '1', name: 'Mike Donovan', gym: 'Iron Core Fitness', city: 'Calgary NW', referrals: 18, ytd: 42, status: 'active', rating: 4.8, phone: '403-555-0101', email: 'mike@ironcorefit.ca', lastReferral: '2026-03-14' },
  { id: '2', name: 'Jessica Wu', gym: 'Elevate Athletic Training', city: 'Calgary SW', referrals: 14, ytd: 31, status: 'active', rating: 4.9, phone: '403-555-0202', email: 'jwu@elevatefit.ca', lastReferral: '2026-03-12' },
  { id: '3', name: 'Carlos Rivera', gym: 'Peak Performance', city: 'Calgary SE', referrals: 9, ytd: 19, status: 'active', rating: 4.7, phone: '403-555-0303', email: 'carlos@peakperform.ca', lastReferral: '2026-03-08' },
  { id: '4', name: 'Taylor Brooks', gym: 'FitLife Studios', city: 'Calgary NE', referrals: 3, ytd: 7, status: 'prospect', rating: null, phone: '403-555-0404', email: 'tbrooks@fitlife.ca', lastReferral: null },
  { id: '5', name: 'Priya Sharma', gym: 'Wellness Works', city: 'Calgary NW', referrals: 22, ytd: 54, status: 'active', rating: 5.0, phone: '403-555-0505', email: 'priya@wellnessworks.ca', lastReferral: '2026-03-15' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  prospect: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-600'
};

export default function TrainerReferralsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = TRAINERS.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.gym.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalReferrals = TRAINERS.reduce((s, t) => s + t.ytd, 0);
  const activeCount = TRAINERS.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trainer Referrals</h2>
          <p className="text-gray-600 mt-1">Personal trainer and fitness professional referral network</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <Dumbbell className="h-10 w-10 text-blue-400" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
            <div className="text-sm text-gray-600">Active Partners</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <Users className="h-10 w-10 text-green-400" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalReferrals}</div>
            <div className="text-sm text-gray-600">YTD Referrals</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <TrendingUp className="h-10 w-10 text-teal-400" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(totalReferrals / activeCount)}</div>
            <div className="text-sm text-gray-600">Avg Referrals / Partner</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trainers or gyms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(trainer => (
            <div key={trainer.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{trainer.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[trainer.status]}`}>
                      {trainer.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{trainer.gym}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {trainer.city}
                  </div>
                </div>
                {trainer.rating && (
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {trainer.rating}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{trainer.referrals}</div>
                  <div className="text-xs text-gray-500">This Month</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{trainer.ytd}</div>
                  <div className="text-xs text-gray-500">YTD Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Last Referral</div>
                  <div className="text-xs font-medium text-gray-700">
                    {trainer.lastReferral ? new Date(trainer.lastReferral).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <a href={`tel:${trainer.phone}`} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors">
                  <Phone className="h-3 w-3" />
                  Call
                </a>
                <a href={`mailto:${trainer.email}`} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors">
                  <Mail className="h-3 w-3" />
                  Email
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
