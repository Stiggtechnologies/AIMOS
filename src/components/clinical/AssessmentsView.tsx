import { useState } from 'react';
import { ClipboardList, Plus, Search, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, User, Calendar } from 'lucide-react';

const MOCK_ASSESSMENTS = [
  { id: '1', patient: 'Jane Smith', type: 'Initial Assessment', status: 'completed', clinician: 'Dr. Chen', date: '2026-03-14', score: 78 },
  { id: '2', patient: 'Mark Johnson', type: 'Re-assessment', status: 'scheduled', clinician: 'Dr. Patel', date: '2026-03-15', score: null },
  { id: '3', patient: 'Sara Lee', type: 'Discharge Assessment', status: 'pending', clinician: 'Dr. Chen', date: '2026-03-16', score: null },
  { id: '4', patient: 'Tom Brown', type: 'Progress Assessment', status: 'completed', clinician: 'Dr. Williams', date: '2026-03-13', score: 65 },
  { id: '5', patient: 'Alice Park', type: 'Initial Assessment', status: 'completed', clinician: 'Dr. Patel', date: '2026-03-12', score: 82 },
];

const STATUS_ICONS: Record<string, JSX.Element> = {
  completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  scheduled: <Clock className="h-4 w-4 text-blue-600" />,
  pending: <AlertCircle className="h-4 w-4 text-yellow-600" />
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

export default function AssessmentsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_ASSESSMENTS.filter(a => {
    const matchSearch = !search || a.patient.toLowerCase().includes(search.toLowerCase()) || a.clinician.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completedCount = MOCK_ASSESSMENTS.filter(a => a.status === 'completed').length;
  const pendingCount = MOCK_ASSESSMENTS.filter(a => a.status === 'pending').length;
  const scheduledCount = MOCK_ASSESSMENTS.filter(a => a.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessments</h2>
          <p className="text-gray-600 mt-1">Patient assessment tracking and management</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <Clock className="h-10 w-10 text-blue-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{scheduledCount}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <AlertCircle className="h-10 w-10 text-yellow-500" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients or clinicians..."
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
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Clinician</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{a.patient}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{a.type}</td>
                  <td className="py-3 px-4 text-gray-700">{a.clinician}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(a.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {a.score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${a.score >= 70 ? 'bg-green-500' : a.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${a.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{a.score}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[a.status]}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
