import { useState, useEffect } from 'react';
import { Users, Phone, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getIntakePipeline, getPipelineStats } from '../../services/growthOsService';
import type { IntakePipeline } from '../../types/aim-os';

export default function IntakePipelineView() {
  const [intakes, setIntakes] = useState<IntakePipeline[]>([]);
  const [stats, setStats] = useState({
    totalIntakes: 0,
    leadInStage: 0,
    contactedStage: 0,
    bookedStage: 0,
    attendedStage: 0,
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, [selectedStage]);

  async function loadData() {
    try {
      const [intakesData, statsData] = await Promise.all([
        getIntakePipeline(undefined, selectedStage),
        getPipelineStats()
      ]);
      setIntakes(intakesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading intake data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading intake pipeline...</span>
      </div>
    );
  }

  const stages = [
    { key: 'lead_in', label: 'Lead In', count: stats.leadInStage, color: 'bg-blue-500' },
    { key: 'contacted', label: 'Contacted', count: stats.contactedStage, color: 'bg-amber-500' },
    { key: 'booked', label: 'Booked', count: stats.bookedStage, color: 'bg-purple-500' },
    { key: 'attended', label: 'Attended', count: stats.attendedStage, color: 'bg-green-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales & Intake Pipeline</h1>
        <p className="text-gray-600 mt-1">Lead conversion tracking and intake management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => setSelectedStage(selectedStage === stage.key ? undefined : stage.key)}
            className={`bg-white rounded-lg shadow-md p-5 text-left transition-all ${
              selectedStage === stage.key ? 'ring-2 ring-green-500' : 'hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stage.color} w-12 h-1 rounded-full`}></div>
              {selectedStage === stage.key && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{stage.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stage.count}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Intake Records
              {selectedStage && <span className="text-sm text-gray-500 ml-2">
                (Filtered: {stages.find(s => s.key === selectedStage)?.label})
              </span>}
            </h2>
            {selectedStage && (
              <button
                onClick={() => setSelectedStage(undefined)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {intakes.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No intake records found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Injury Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {intakes.map((intake) => (
                  <tr key={intake.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {intake.patient_first_name} {intake.patient_last_name}
                          </div>
                          <div className="text-sm text-gray-500">{intake.referral_source || 'Direct'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{intake.patient_phone}</div>
                      <div className="text-sm text-gray-500">{intake.patient_email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intake.injury_type || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        intake.stage === 'lead_in' ? 'bg-blue-100 text-blue-800' :
                        intake.stage === 'contacted' ? 'bg-amber-100 text-amber-800' :
                        intake.stage === 'booked' ? 'bg-purple-100 text-purple-800' :
                        intake.stage === 'attended' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {intake.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        intake.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        intake.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {intake.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${intake.estimated_value?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-center mb-2">
            <Phone className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Speed to Contact</h3>
          </div>
          <p className="text-sm text-blue-800">
            Average response time: <strong>2.3 hours</strong>
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">Conversion Rate</h3>
          </div>
          <p className="text-sm text-green-800">
            Lead to booking: <strong>64%</strong>
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-amber-600 mr-2" />
            <h3 className="font-semibold text-amber-900">Avg. Pipeline Time</h3>
          </div>
          <p className="text-sm text-amber-800">
            Days to first visit: <strong>4.2 days</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
