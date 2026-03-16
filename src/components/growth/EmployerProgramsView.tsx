import { useState } from 'react';
import { Building2, Plus, Search, Users, TrendingUp, Briefcase, Phone, Mail, ChevronRight } from 'lucide-react';

const EMPLOYERS = [
  { id: '1', name: 'City of Calgary', industry: 'Government', employees: 18000, enrolled: 245, referrals: 34, contract: 'Corporate', status: 'active', contact: 'Helen Park', phone: '403-555-1001', email: 'hpark@calgary.ca', value: 48000 },
  { id: '2', name: 'Alberta Trucks Inc.', industry: 'Transportation', employees: 420, enrolled: 38, referrals: 12, contract: 'WCB Partner', status: 'active', contact: 'Dave Morrison', phone: '403-555-1002', email: 'dmorrison@abtrucks.ca', value: 18500 },
  { id: '3', name: 'Pembina Pipeline', industry: 'Energy', employees: 2100, enrolled: 89, referrals: 22, contract: 'Corporate', status: 'active', contact: 'Aisha Rahman', phone: '403-555-1003', email: 'arahman@pembina.com', value: 35000 },
  { id: '4', name: 'Horizon Construction', industry: 'Construction', employees: 850, enrolled: 67, referrals: 18, contract: 'WCB Partner', status: 'active', contact: 'Steve Clark', phone: '403-555-1004', email: 'sclark@horizonconst.ca', value: 28000 },
  { id: '5', name: 'FitCorp Wellness Inc.', industry: 'Wellness', employees: 120, enrolled: 15, referrals: 5, contract: 'Group Benefits', status: 'prospect', contact: 'Nancy Hu', phone: '403-555-1005', email: 'nhu@fitcorp.ca', value: 0 },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  prospect: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-600'
};

const CONTRACT_COLORS: Record<string, string> = {
  'Corporate': 'bg-teal-100 text-teal-800',
  'WCB Partner': 'bg-orange-100 text-orange-800',
  'Group Benefits': 'bg-blue-100 text-blue-800'
};

export default function EmployerProgramsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = EMPLOYERS.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.industry.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalEnrolled = EMPLOYERS.filter(e => e.status === 'active').reduce((s, e) => s + e.enrolled, 0);
  const totalValue = EMPLOYERS.filter(e => e.status === 'active').reduce((s, e) => s + e.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employer Programs</h2>
          <p className="text-gray-600 mt-1">Corporate partnerships, WCB, and group benefit programs</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Employer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{EMPLOYERS.filter(e => e.status === 'active').length}</div>
          <div className="text-sm text-gray-600">Active Partners</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-teal-600">{totalEnrolled.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Enrolled Employees</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">
            ${(totalValue / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-gray-600">Annual Contract Value</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-amber-600">
            {EMPLOYERS.reduce((s, e) => s + e.referrals, 0)}
          </div>
          <div className="text-sm text-gray-600">Referrals This Month</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employers or industries..."
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

        <div className="space-y-3">
          {filtered.map(employer => (
            <div key={employer.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{employer.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[employer.status]}`}>
                      {employer.status}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${CONTRACT_COLORS[employer.contract]}`}>
                      {employer.contract}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {employer.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {employer.enrolled} enrolled / {employer.employees.toLocaleString()} employees
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {employer.referrals} referrals this month
                    </span>
                    {employer.value > 0 && (
                      <span className="font-medium text-green-700">
                        ${employer.value.toLocaleString()}/yr
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Contact: {employer.contact}</span>
                    <a href={`tel:${employer.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Phone className="h-3 w-3" />
                      {employer.phone}
                    </a>
                    <a href={`mailto:${employer.email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="h-3 w-3" />
                      {employer.email}
                    </a>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
