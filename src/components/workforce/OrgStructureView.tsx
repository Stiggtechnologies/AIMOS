import { useState } from 'react';
import { Building2, Users, ChevronDown, ChevronRight, Crown, Map, Stethoscope } from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  type: 'network' | 'region' | 'clinic' | 'role';
  children?: OrgNode[];
  count?: number;
}

const ORG_TREE: OrgNode = {
  id: 'network',
  name: 'AIM Network',
  title: 'Enterprise',
  type: 'network',
  count: 6,
  children: [
    {
      id: 'r1',
      name: 'Edmonton Region',
      title: 'Regional Director: Sarah Chen',
      type: 'region',
      count: 3,
      children: [
        { id: 'c1', name: 'South Commons', title: 'Manager: James Ortiz', type: 'clinic', count: 8 },
        { id: 'c2', name: 'West End', title: 'Manager: Lisa Park', type: 'clinic', count: 7 },
        { id: 'c3', name: 'North Gate', title: 'Manager: Tom Black', type: 'clinic', count: 6 },
      ]
    },
    {
      id: 'r2',
      name: 'Calgary Region',
      title: 'Regional Director: Mike Torres',
      type: 'region',
      count: 3,
      children: [
        { id: 'c4', name: 'Beltline', title: 'Manager: Anna White', type: 'clinic', count: 9 },
        { id: 'c5', name: 'Chinook', title: 'Manager: Dave Kim', type: 'clinic', count: 8 },
        { id: 'c6', name: 'NW Calgary', title: 'Manager: Rachel Green', type: 'clinic', count: 7 },
      ]
    }
  ]
};

const typeConfig = {
  network: { icon: Crown, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  region: { icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  clinic: { icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  role: { icon: Users, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
};

function OrgNodeCard({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const cfg = typeConfig[node.type];
  const Icon = cfg.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <div
        className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${cfg.color}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{node.name}</p>
            <p className="text-xs text-gray-500">{node.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {node.count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {node.count} {node.type === 'clinic' ? 'staff' : node.type === 'region' ? 'clinics' : 'regions'}
            </div>
          )}
          {hasChildren && (
            <span className="text-gray-400">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="border-l-2 border-gray-200 ml-4 pl-2 mt-1">
          {node.children!.map(child => (
            <OrgNodeCard key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgStructureView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Org Structure</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise organizational hierarchy — Network, Region, Clinic</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-teal-500" /> 6 Clinics</span>
          <span className="flex items-center gap-1"><Map className="h-4 w-4 text-emerald-500" /> 2 Regions</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-500" /> 45 Staff</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <OrgNodeCard node={ORG_TREE} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: '45', icon: Users, color: 'blue' },
          { label: 'Active Clinics', value: '6', icon: Building2, color: 'teal' },
          { label: 'Regions', value: '2', icon: Map, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center`}>
                <Icon className={`h-5 w-5 text-${color}-600`} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{value}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
