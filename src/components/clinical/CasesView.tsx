import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Search, Filter, Calendar, User, Clock, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Case {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  priority: string;
  opened_at: string;
  closed_at: string | null;
  age_days: number;
  clinic_name?: string;
  primary_clinician_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
  critical: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  urgent: 'bg-red-200 text-red-900'
};

export default function CasesView() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadCases();
  }, [statusFilter, typeFilter]);

  const loadCases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ops_case_aging_status')
        .select('*')
        .order('opened_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (typeFilter) query = query.eq('case_type', typeFilter);

      const { data, error } = await query;
      if (error) throw error;
      setCases(data || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter(c =>
    !searchTerm ||
    c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.primary_clinician_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCount = cases.filter(c => c.status === 'open' || c.status === 'active').length;
  const criticalCount = cases.filter(c => c.aging_status === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
          <p className="text-gray-600 mt-1">Patient case management and tracking</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{cases.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Cases</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{openCount}</div>
          <div className="text-sm text-gray-600 mt-1">Open / Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-sm text-gray-600 mt-1">Critical Aging</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="physiotherapy">Physiotherapy</option>
            <option value="massage">Massage</option>
            <option value="chiropractic">Chiropractic</option>
            <option value="occupational">Occupational Therapy</option>
            <option value="mva">MVA</option>
            <option value="wbc">WCB</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <FolderOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{c.case_number}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[c.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {c.primary_clinician_name ?? 'Unassigned'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.opened_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <Clock className="h-3 w-3" />
                        {c.age_days}d old
                      </span>
                      {c.case_type && <span className="capitalize">{c.case_type}</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No cases found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
