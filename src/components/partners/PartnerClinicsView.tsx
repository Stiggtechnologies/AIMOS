import React, { useState, useEffect } from 'react';
import {
  Building2,
  Star,
  DollarSign,
  Users,
  ChevronRight,
  Plus,
  TrendingUp,
  Target,
  Copy
} from 'lucide-react';
import { partnerService, type PartnerClinic } from '../../services/partnerService';
import PartnerDashboard from './PartnerDashboard';

export default function PartnerClinicsView() {
  const [partners, setPartners] = useState<PartnerClinic[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'dashboard'>('list');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerService.getAllPartnerClinics();
      setPartners(data);

      const epc = data.find(p => p.partner_name === 'Edmonton Pickleball Center');
      if (epc) {
        setSelectedPartner(epc.id);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      prospect: 'bg-gray-100 text-gray-800',
      negotiating: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-orange-100 text-orange-800',
      terminated: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status as keyof typeof colors] || colors.prospect}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      embedded_partner: 'Embedded',
      sports_facility: 'Sports Facility',
      on_site_employer: 'Employer Site',
      recreation_center: 'Rec Center',
      standalone: 'Standalone',
    };

    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (view === 'dashboard' && selectedPartner) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('list')}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
        >
          ← Back to Partner Clinics
        </button>
        <PartnerDashboard partnerClinicId={selectedPartner} />
      </div>
    );
  }

  const flagshipPartners = partners.filter(p => p.is_flagship_location);
  const activePartners = partners.filter(p => p.status === 'active' && !p.is_flagship_location);
  const prospectPartners = partners.filter(p => p.status === 'prospect' || p.status === 'negotiating');

  const stats = [
    {
      label: 'Total Partners',
      value: partners.length,
      icon: Building2,
      color: 'blue',
    },
    {
      label: 'Active',
      value: activePartners.length + flagshipPartners.length,
      icon: Target,
      color: 'green',
    },
    {
      label: 'Flagship Locations',
      value: flagshipPartners.length,
      icon: Star,
      color: 'yellow',
    },
    {
      label: 'Total Members',
      value: partners.reduce((sum, p) => sum + p.partner_member_base, 0).toLocaleString(),
      icon: Users,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Partner Clinics
          </h1>
          <p className="mt-2 text-gray-600">
            Embedded partner locations and revenue-share partnerships
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {flagshipPartners.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 bg-yellow-50">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Flagship Locations</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Reference implementations for replication
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {flagshipPartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => {
                  setSelectedPartner(partner.id);
                  setView('dashboard');
                }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {partner.partner_name}
                      </h3>
                      {getStatusBadge(partner.status)}
                      {getTypeBadge(partner.partner_type)}
                      {partner.is_replication_template && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          Template
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {(partner as any).clinics?.name} • {(partner as any).clinics?.city}, {(partner as any).clinics?.province}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{partner.partner_member_base.toLocaleString()} members</span>
                      </div>

                      {partner.revenue_share_enabled && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{partner.revenue_share_rate}% revenue share</span>
                        </div>
                      )}

                      {partner.square_footage && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>{partner.square_footage} sq ft</span>
                        </div>
                      )}

                      {partner.partnership_start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>Since {new Date(partner.partnership_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {partner.template_name && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-gray-700">Template: </span>
                        <span className="text-gray-600">{partner.template_name}</span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-6 h-6 text-gray-400 ml-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePartners.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Partners</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {activePartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => {
                  setSelectedPartner(partner.id);
                  setView('dashboard');
                }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {partner.partner_name}
                      </h3>
                      {getStatusBadge(partner.status)}
                      {getTypeBadge(partner.partner_type)}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {(partner as any).clinics?.name}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{partner.partner_member_base.toLocaleString()} members</span>
                      </div>

                      {partner.revenue_share_enabled && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{partner.revenue_share_rate}% revenue share</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-gray-400 ml-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prospectPartners.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pipeline</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {prospectPartners.map((partner) => (
              <div key={partner.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {partner.partner_name}
                      </h3>
                      {getStatusBadge(partner.status)}
                      {getTypeBadge(partner.partner_type)}
                    </div>

                    {partner.notes && (
                      <p className="text-sm text-gray-600 mt-2">{partner.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
