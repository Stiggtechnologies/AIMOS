import { useState, useMemo } from 'react';
import { ScrollText, Search, Filter, Download } from 'lucide-react';
import type { AuditLogEntry } from '../../services/aimAutomationService';

interface AuditLogViewProps {
  entries: AuditLogEntry[];
  loading: boolean;
}

const ACTION_COLOR: Record<string, string> = {
  approve: 'text-green-700 bg-green-50',
  reject: 'text-red-700 bg-red-50',
  publish: 'text-blue-700 bg-blue-50',
  create: 'text-gray-700 bg-gray-50',
  update: 'text-amber-700 bg-amber-50',
  delete: 'text-red-700 bg-red-50',
  escalate: 'text-orange-700 bg-orange-50',
  resolve: 'text-green-700 bg-green-50',
  toggle: 'text-gray-700 bg-gray-50',
};

export default function AuditLogView({ entries, loading }: AuditLogViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const resourceTypes = useMemo(() => {
    const types = new Set(entries.map(e => e.resource_type));
    return Array.from(types).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = [...entries];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.actor_name.toLowerCase().includes(q) ||
        e.resource_type.toLowerCase().includes(q) ||
        e.resource_id.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') result = result.filter(e => e.resource_type === filterType);
    return result;
  }, [entries, search, filterType]);

  if (loading) {
    return (
      <div className="p-6 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit log..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All resource types</option>
          {resourceTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span className="text-xs text-gray-500 ml-auto">{filtered.length} entries</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No audit entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Resource', 'Location', 'Platform'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(entry => {
                  const actionWord = entry.action.split('_')[0].toLowerCase();
                  const actionColor = ACTION_COLOR[actionWord] ?? 'text-gray-700 bg-gray-50';
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('en-CA', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {entry.actor_name || 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${actionColor}`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 font-medium">{entry.resource_type}</p>
                        <p className="text-xs text-gray-400 font-mono truncate max-w-24">{entry.resource_id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {entry.aim_locations?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                        {entry.platform ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
