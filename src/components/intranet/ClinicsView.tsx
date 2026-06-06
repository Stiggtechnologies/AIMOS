import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Users, Building2, TrendingUp } from 'lucide-react';
import { clinicService } from '../../services/intranetService';
import type { Clinic, ClinicMetrics } from '../../types/intranet';

export default function ClinicsView() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [metrics, setMetrics] = useState<ClinicMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      loadMetrics(selectedClinic.id);
    }
  }, [selectedClinic]);

  const loadClinics = async () => {
    try {
      const data = await clinicService.getAllClinics();
      setClinics(data);
      if (data.length > 0) setSelectedClinic(data[0]);
    } catch (error) {
      console.error('Error loading clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (clinicId: string) => {
    try {
      const data = await clinicService.getClinicMetrics(clinicId, 7);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  const avgMetrics = metrics.length > 0 ? {
    visits: Math.round(metrics.reduce((sum, m) => sum + m.patient_visits, 0) / metrics.length),
    revenue: Math.round(metrics.reduce((sum, m) => sum + Number(m.revenue), 0) / metrics.length),
    utilization: Math.round(metrics.reduce((sum, m) => sum + Number(m.utilization_rate), 0) / metrics.length)
  } : { visits: 0, revenue: 0, utilization: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinics</h1>
        <p className="mt-2 text-gray-600">View clinic locations and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">All Locations ({clinics.length})</h2>
            <div className="space-y-2">
              {clinics.map(clinic => (
                <button
                  key={clinic.id}
                  onClick={() => setSelectedClinic(clinic)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedClinic?.id === clinic.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">{clinic.name}</div>
                  <div className="text-sm text-gray-600">{clinic.city}, {clinic.province}</div>
                  <div className="text-xs text-gray-500 mt-1">{clinic.code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedClinic && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedClinic.name}</h2>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-start text-gray-700">
                      <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <div>{selectedClinic.address}</div>
                        <div>{selectedClinic.city}, {selectedClinic.province} {selectedClinic.postal_code}</div>
                      </div>
                    </div>
                    {selectedClinic.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-5 w-5 mr-2" />
                        <span>{selectedClinic.phone}</span>
                      </div>
                    )}
                    {selectedClinic.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-5 w-5 mr-2" />
                        <span>{selectedClinic.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Treatment Rooms</span>
                      <span className="text-xl font-bold text-gray-900">{selectedClinic.treatment_rooms}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600 text-sm mb-2">Services Offered</div>
                      <div className="flex flex-wrap gap-1">
                        {(selectedClinic.services_offered || []).map((service, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  7-Day Performance Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Avg Daily Visits</div>
                    <div className="text-3xl font-bold text-blue-900">{avgMetrics.visits}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Avg Daily Revenue</div>
                    <div className="text-3xl font-bold text-green-900">${avgMetrics.revenue}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-sm text-purple-600 mb-1">Utilization Rate</div>
                    <div className="text-3xl font-bold text-purple-900">{avgMetrics.utilization}%</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
