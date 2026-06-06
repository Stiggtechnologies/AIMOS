import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, RefreshCw, Clock, User, Database, CreditCard as Edit3, Trash2, Plus, Eye, ChevronDown, ChevronUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle, FileText, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { exportService } from '../../services/exportService';

interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  changed_fields?: string[];
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface FilterState {
  search: string;
  action: string;
  table_name: string;
  user_id: string;
  date_from: string;
  date_to: string;
}

const ACTION_ICONS: Record<string, typeof Edit3> = {
  insert: Plus,
  update: Edit3,
  delete: Trash2,
  select: Eye,
  export: Download,
  login: User,
  logout: User
};

const ACTION_COLORS: Record<string, string> = {
  insert: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  select: 'bg-gray-100 text-gray-700 border-gray-200',
  export: 'bg-purple-100 text-purple-700 border-purple-200',
  login: 'bg-teal-100 text-teal-700 border-teal-200',
  logout: 'bg-orange-100 text-orange-700 border-orange-200'
};

export default function AuditLogViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [tables, setTables] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    action: '',
    table_name: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadEvents();
    loadFilterOptions();
  }, [page, filters]);

  const loadFilterOptions = async () => {
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('id, email')
      .order('email');

    if (userData) {
      setUsers(userData);
    }

    const { data: tableData } = await supabase
      .from('audit_events')
      .select('table_name')
      .order('table_name');

    if (tableData) {
      const uniqueTables = [...new Set(tableData.map(t => t.table_name))].filter(Boolean);
      setTables(uniqueTables);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_events')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
      }

      if (filters.search) {
        query = query.or(`table_name.ilike.%${filters.search}%,action.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const eventsWithUsers = await Promise.all(
        (data || []).map(async (event) => {
          if (event.user_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('email, first_name, last_name')
              .eq('id', event.user_id)
              .maybeSingle();

            return {
              ...event,
              user_email: profile?.email,
              user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined
            };
          }
          return event;
        })
      );

      setEvents(eventsWithUsers);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error loading audit events:', err);
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = events.map(event => ({
      timestamp: new Date(event.created_at).toLocaleString(),
      user_email: event.user_email || event.user_id,
      action: event.action,
      table_name: event.table_name,
      record_id: event.record_id || '',
      changed_fields: event.changed_fields?.join(', ') || '',
      description: getEventDescription(event)
    }));

    await exportService.export(exportData, {
      format,
      filename: 'audit_log',
      title: 'AIM OS Audit Log',
      subtitle: `Exported on ${new Date().toLocaleDateString()}`,
      includeTimestamp: true,
      columns: exportService.generateReportColumns('audit_log')
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      table_name: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    setPage(1);
  };

  const getEventDescription = (event: AuditEvent): string => {
    const action = event.action.toLowerCase();
    const table = event.table_name?.replace(/_/g, ' ') || 'record';

    switch (action) {
      case 'insert':
        return `Created new ${table}`;
      case 'update':
        if (event.changed_fields?.length) {
          return `Updated ${event.changed_fields.length} field(s) in ${table}`;
        }
        return `Updated ${table}`;
      case 'delete':
        return `Deleted ${table}`;
      case 'export':
        return `Exported ${event.metadata?.row_count || ''} records as ${event.metadata?.format || 'file'}`;
      case 'login':
        return 'User logged in';
      case 'logout':
        return 'User logged out';
      default:
        return `${action} on ${table}`;
    }
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action.toLowerCase()] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (action: string): string => {
    return ACTION_COLORS[action.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDataDiff = (oldData: any, newData: any, changedFields?: string[]) => {
    if (!oldData && !newData) return null;

    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {})
    ]);

    const relevantKeys = changedFields?.length
      ? changedFields
      : Array.from(allKeys).filter(key =>
          JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])
        );

    if (relevantKeys.length === 0) {
      return <p className="text-gray-500 text-sm">No changes recorded</p>;
    }

    return (
      <div className="space-y-2">
        {relevantKeys.map(key => (
          <div key={key} className="bg-gray-50 rounded p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">{key}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Before</div>
                <div className="text-sm bg-red-50 text-red-800 p-2 rounded font-mono break-all">
                  {oldData?.[key] !== undefined
                    ? typeof oldData[key] === 'object'
                      ? JSON.stringify(oldData[key], null, 2)
                      : String(oldData[key])
                    : '(empty)'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">After</div>
                <div className="text-sm bg-green-50 text-green-800 p-2 rounded font-mono break-all">
                  {newData?.[key] !== undefined
                    ? typeof newData[key] === 'object'
                      ? JSON.stringify(newData[key], null, 2)
                      : String(newData[key])
                    : '(empty)'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-600">
              {totalCount.toLocaleString()} events recorded
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadEvents()}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
                hasActiveFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.values(filters).filter(v => v).length}
                </span>
              )}
            </button>
          </div>
          <div className="relative group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="insert">Insert</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="select">Select</option>
                <option value="export">Export</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
              <select
                value={filters.table_name}
                onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Tables</option>
                {tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={filters.user_id}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Audit Log</h3>
            <p className="text-red-800 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading audit events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Events Found</h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? 'No events match your current filters. Try adjusting your search criteria.'
                : 'Audit events will appear here as users interact with the system.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.id} className="hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(event.action)}`}>
                      {getActionIcon(event.action)}
                      <span className="capitalize">{event.action}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {getEventDescription(event)}
                        </span>
                        {event.record_id && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {event.record_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1" />
                          {event.user_email || event.user_name || 'System'}
                        </span>
                        <span className="flex items-center">
                          <Database className="w-3.5 h-3.5 mr-1" />
                          {event.table_name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatTimestamp(event.created_at)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    {expandedId === event.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedId === event.id && (
                  <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Event Details</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex">
                            <dt className="w-32 text-gray-500">Event ID:</dt>
                            <dd className="font-mono text-gray-900">{event.id}</dd>
                          </div>
                          <div className="flex">
                            <dt className="w-32 text-gray-500">User ID:</dt>
                            <dd className="font-mono text-gray-900">{event.user_id || 'N/A'}</dd>
                          </div>
                          <div className="flex">
                            <dt className="w-32 text-gray-500">Record ID:</dt>
                            <dd className="font-mono text-gray-900">{event.record_id || 'N/A'}</dd>
                          </div>
                          <div className="flex">
                            <dt className="w-32 text-gray-500">Timestamp:</dt>
                            <dd className="text-gray-900">{new Date(event.created_at).toLocaleString()}</dd>
                          </div>
                          {event.ip_address && (
                            <div className="flex">
                              <dt className="w-32 text-gray-500">IP Address:</dt>
                              <dd className="font-mono text-gray-900">{event.ip_address}</dd>
                            </div>
                          )}
                        </dl>

                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metadata</h5>
                            <pre className="bg-white border border-gray-200 rounded p-3 text-xs font-mono overflow-auto max-h-40">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Changes</h4>
                        {event.old_data || event.new_data ? (
                          renderDataDiff(event.old_data, event.new_data, event.changed_fields)
                        ) : (
                          <p className="text-gray-500 text-sm">No data changes recorded for this event.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} events
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Audit Log Compliance</p>
          <p className="text-blue-800 mt-1">
            All user actions are automatically logged for security and compliance purposes.
            Audit logs are immutable and retained according to your organization's data retention policy.
          </p>
        </div>
      </div>
    </div>
  );
}
