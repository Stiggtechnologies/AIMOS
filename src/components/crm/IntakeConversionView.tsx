import React, { useState, useEffect } from 'react';
import {
  Clock, Phone, Mail, User, CheckCircle, AlertCircle,
  TrendingUp, MessageSquare, Calendar
} from 'lucide-react';
import { crmLeadService } from '../../services/crmLeadService';
import { useAuth } from '../../contexts/AuthContext';

export default function IntakeConversionView() {
  const { user } = useAuth();
  const [leadQueue, setLeadQueue] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [serviceLine, setServiceLine] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [serviceLine]);

  async function loadData() {
    try {
      const leads = await crmLeadService.getLiveLeadQueue();
      const filteredLeads = serviceLine === 'all'
        ? leads
        : leads.filter(l => l.service_line?.slug === serviceLine);

      setLeadQueue(filteredLeads);

      setStaffPerformance({
        leads_contacted: 24,
        leads_booked: 18,
        bookings_showed: 16,
        conversion_rate: 75.0,
      });
    } catch (error) {
      console.error('Error loading intake data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleContactLead(lead: any) {
    try {
      if (user) {
        await crmLeadService.contactLead(lead.id, user.id, notes);
        setNotes('');
        setSelectedLead(null);
        loadData();
      }
    } catch (error) {
      console.error('Error contacting lead:', error);
    }
  }

  function getServiceColor(slug: string) {
    switch (slug) {
      case 'injury-mgmt':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'sports-rehab':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epc':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'massage':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Intake Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Intake & Conversion</h1>
        <p className="text-orange-100">Turn leads into cases, not just visits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Leads Contacted</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{staffPerformance?.leads_contacted || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Today</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Bookings Made</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{staffPerformance?.leads_booked || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Today</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Show Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {staffPerformance ? ((staffPerformance.bookings_showed / staffPerformance.leads_booked) * 100).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">This week</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {staffPerformance?.conversion_rate?.toFixed(0) || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Lead → Booking</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Live Lead Queue
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="injury-mgmt">Injury Management</option>
              <option value="sports-rehab">Sports Rehab</option>
              <option value="epc">EPC</option>
              <option value="massage">Massage</option>
            </select>
          </div>
        </div>

        {leadQueue.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">All leads contacted!</p>
            <p className="text-sm mt-1">Great work. Check back soon for new leads.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leadQueue.map((lead) => {
              const timeSince = lead.time_since_created || 0;
              const isOverdue = timeSince > 5;
              const tierPriority = lead.clv_tier?.priority || 3;

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedLead?.id === lead.id
                      ? 'border-orange-500 bg-orange-50'
                      : isOverdue
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(lead.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded border ${getServiceColor(lead.service_line?.slug || '')}`}>
                            {lead.service_line?.name || 'Unknown'}
                          </span>
                          {tierPriority === 1 && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
                              High CLV
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {lead.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {lead.payor_type?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {timeSince} min
                      </div>
                      {isOverdue && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          SLA BREACH
                        </div>
                      )}
                      {lead.status === 'contacted' && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Contacted
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLead?.id === lead.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                        <h4 className="font-semibold text-gray-900 mb-2">Script Prompt</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          <p>
                            "Hi {lead.first_name}, this is [Your Name] from AIM Performance.
                            I see you're interested in {lead.service_line?.name}.
                            {lead.payor_type?.slug === 'wcb' && " I understand you're dealing with a work-related injury."}
                            We'd love to help you get back to full function. When would be a good time for your first appointment?"
                          </p>
                          <div className="bg-blue-50 p-2 rounded mt-2">
                            <strong>Key Points:</strong>
                            <ul className="list-disc list-inside text-xs mt-1">
                              <li>Confirm injury/condition details</li>
                              <li>Explain assessment process (60 min)</li>
                              <li>Book within 48 hours if possible</li>
                              {tierPriority === 1 && <li className="text-orange-600 font-medium">HIGH VALUE - Prioritize booking</li>}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about the call..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        rows={3}
                      />

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleContactLead(lead)}
                          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        >
                          Mark as Contacted
                        </button>
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
