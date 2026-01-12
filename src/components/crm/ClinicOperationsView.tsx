import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, TrendingUp, Settings, AlertTriangle } from 'lucide-react';
import { crmCapacityService } from '../../services/crmCapacityService';

export default function ClinicOperationsView() {
  const [capacityTimeline, setCapacityTimeline] = useState<any[]>([]);
  const [capacityRules, setCapacityRules] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      loadData();
    }
  }, [selectedClinic]);

  async function loadClinics() {
    try {
      const { data } = await (window as any).supabase
        .from('clinics')
        .select('*')
        .order('name');

      if (data && data.length > 0) {
        setClinics(data);
        setSelectedClinic(data[0].id);
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  }

  async function loadData() {
    try {
      const [timeline, rules] = await Promise.all([
        crmCapacityService.getCapacityTimeline(selectedClinic, 28),
        crmCapacityService.getCapacityRules(selectedClinic),
      ]);

      setCapacityTimeline(timeline);
      setCapacityRules(rules);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Clinic Operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Clinic Operations</h1>
        <p className="text-purple-100">Prevent burnout, bottlenecks, and lost revenue</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select Clinic:</label>
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {clinics.map(clinic => (
            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Capacity Timeline (Next 28 Days)
        </h2>
        <div className="space-y-2">
          {capacityTimeline.map((snapshot) => {
            const date = new Date(snapshot.snapshot_date);
            const isToday = date.toDateString() === new Date().toDateString();
            const percent = snapshot.capacity_percent;

            let statusColor = 'green';
            if (percent >= 85) statusColor = 'red';
            else if (percent >= 70) statusColor = 'yellow';

            return (
              <div
                key={snapshot.id}
                className={`p-4 rounded-lg border ${
                  isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {isToday && (
                      <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">TODAY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {snapshot.booked_slots} / {snapshot.total_slots} slots
                    </div>
                    <div className={`text-lg font-bold ${
                      statusColor === 'red' ? 'text-red-600' :
                      statusColor === 'yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {percent.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      statusColor === 'red' ? 'bg-red-500' :
                      statusColor === 'yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs text-gray-600">
                  <span>High CLV: {snapshot.high_clv_slots}</span>
                  <span>Medium CLV: {snapshot.medium_clv_slots}</span>
                  <span>Low CLV: {snapshot.low_clv_slots}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          Capacity Rules Engine
        </h2>
        <div className="space-y-3">
          {capacityRules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No capacity rules configured</p>
          ) : (
            capacityRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{rule.rule_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      When <span className="font-medium">{rule.condition_field}</span>{' '}
                      <span className="font-medium">{rule.condition_operator}</span>{' '}
                      <span className="font-medium">{rule.condition_value}%</span>
                      {' → '}
                      <span className="font-medium">{rule.rule_type.replace('_', ' ')}</span>
                      {rule.action_target && (
                        <span> for <span className="font-medium">{rule.action_value}</span></span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rule.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            No-Show & Flow Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">No-Show Rate</span>
              <span className="text-2xl font-bold text-gray-900">8.2%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Avg Wait Time</span>
              <span className="text-2xl font-bold text-gray-900">4.5 min</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Visits per Case</span>
              <span className="text-2xl font-bold text-gray-900">6.8</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Documentation Lag</span>
              <span className="text-2xl font-bold text-gray-900">1.2 days</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Operational Alerts
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">High Capacity Warning</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Clinic approaching 90% capacity for next week
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Warning
                </span>
              </div>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Capacity Opening</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    15 slots available for next Monday - consider scaling ads
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  Info
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
