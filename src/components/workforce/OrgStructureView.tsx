import React, { useState, useEffect } from 'react';
import { Building2, Users, ChevronDown, ChevronRight, Crown, Map, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  type: 'network' | 'region' | 'clinic' | 'role';
  children?: OrgNode[];
  count?: number;
  status?: string;
}

interface ClinicRow {
  id: string;
  name: string;
  city?: string;
  status?: string;
  region?: string;
  manager_name?: string;
}

function buildOrgTree(clinics: ClinicRow[], totalStaff: number): OrgNode {
  const regionMap = new Map<string, ClinicRow[]>();
  clinics.forEach(c => {
    const region = c.region || c.city || 'Other';
    if (!regionMap.has(region)) regionMap.set(region, []);
    regionMap.get(region)!.push(c);
  });

  const regionNodes: OrgNode[] = Array.from(regionMap.entries()).map(([regionName, clinicList], idx) => ({
    id: `region-${idx}`,
    name: `${regionName} Region`,
    title: `${clinicList.length} clinic${clinicList.length !== 1 ? 's' : ''}`,
    type: 'region' as const,
    count: clinicList.length,
    children: clinicList.map(c => ({
      id: c.id,
      name: c.name,
      title: c.manager_name ? `Manager: ${c.manager_name}` : (c.status === 'active' ? 'Active' : c.status || 'Active'),
      type: 'clinic' as const,
      status: c.status,
    })),
  }));

  return {
    id: 'network',
    name: 'AIM Network',
    title: 'Enterprise',
    type: 'network',
    count: regionNodes.length,
    children: regionNodes,
  };
}

const DEMO_ORG_TREE: OrgNode = {
  id: 'network',
  name: 'AIM Network',
  title: 'Enterprise',
  type: 'network',
  count: 2,
  children: [
    {
      id: 'r1',
      name: 'Edmonton Region',
      title: '3 clinics',
      type: 'region',
      count: 3,
      children: [
        { id: 'c1', name: 'South Commons', title: 'Active', type: 'clinic' },
        { id: 'c2', name: 'West End', title: 'Active', type: 'clinic' },
        { id: 'c3', name: 'North Gate', title: 'Active', type: 'clinic' },
      ]
    },
    {
      id: 'r2',
      name: 'Calgary Region',
      title: '3 clinics',
      type: 'region',
      count: 3,
      children: [
        { id: 'c4', name: 'Beltline', title: 'Active', type: 'clinic' },
        { id: 'c5', name: 'Chinook', title: 'Active', type: 'clinic' },
        { id: 'c6', name: 'NW Calgary', title: 'Active', type: 'clinic' },
      ]
    }
  ]
};

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
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
  const [orgTree, setOrgTree] = useState<OrgNode>(DEMO_ORG_TREE);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ clinics: 0, regions: 0, staff: 0 });

  useEffect(() => { loadOrgData(); }, []);

  async function loadOrgData() {
    setLoading(true);
    try {
      const [clinicsResult, staffResult] = await Promise.allSettled([
        supabase.from('clinics').select('id, name, city, status, region, manager_name').eq('status', 'active').order('name'),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const clinics: ClinicRow[] = clinicsResult.status === 'fulfilled' && clinicsResult.value.data
        ? clinicsResult.value.data
        : [];
      const staffCount = staffResult.status === 'fulfilled' ? (staffResult.value.count ?? 0) : 0;

      if (clinics.length > 0) {
        const tree = buildOrgTree(clinics, staffCount);
        const regionCount = tree.children?.length ?? 0;
        setOrgTree(tree);
        setStats({ clinics: clinics.length, regions: regionCount, staff: staffCount });
      } else {
        const regionCount = DEMO_ORG_TREE.children?.length ?? 0;
        const clinicCount = DEMO_ORG_TREE.children?.reduce((s, r) => s + (r.count ?? 0), 0) ?? 0;
        setStats({ clinics: clinicCount, regions: regionCount, staff: 45 });
      }
    } catch {
      const regionCount = DEMO_ORG_TREE.children?.length ?? 0;
      const clinicCount = DEMO_ORG_TREE.children?.reduce((s, r) => s + (r.count ?? 0), 0) ?? 0;
      setStats({ clinics: clinicCount, regions: regionCount, staff: 45 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Org Structure</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise organizational hierarchy — Network, Region, Clinic</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-teal-500" /> {stats.clinics} Clinics</span>
            <span className="flex items-center gap-1"><Map className="h-4 w-4 text-emerald-500" /> {stats.regions} Regions</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-500" /> {stats.staff} Staff</span>
          </div>
          <button
            onClick={loadOrgData}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading org structure...</p>
          </div>
        ) : (
          <OrgNodeCard node={orgTree} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: stats.staff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Clinics', value: stats.clinics, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Regions', value: stats.regions, icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
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
