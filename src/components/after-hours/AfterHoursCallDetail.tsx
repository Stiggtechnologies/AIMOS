import { useState } from 'react';
import { X, Phone, Calendar, CheckCircle, Play, FileText, AlertCircle } from 'lucide-react';
import { afterHoursService } from '../../services/afterHoursService';
import type { AfterHoursCall } from '../../types/afterHours';
import { useToast } from '../../hooks/useToast';

interface Props {
  call: AfterHoursCall;
  onClose: () => void;
  onUpdate: () => void;
}

export function AfterHoursCallDetail({ call, onClose, onUpdate }: Props) {
  const [outcome, setOutcome] = useState<AfterHoursCall['outcome']>(call.outcome || 'booked');
  const [notes, setNotes] = useState(call.follow_up_notes || '');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const handleCompleteFollowUp = async () => {
    try {
      setLoading(true);
      await afterHoursService.completeFollowUp(call.id, outcome, notes);
      success('Follow-up marked as complete');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      showError('Failed to complete follow-up');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">After-Hours Call Details</h2>
            <p className="text-blue-100 text-sm">
              {new Date(call.call_started_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <p className="font-medium">{call.patient_name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{call.from_number}</p>
              </div>
              {call.patient_email && (
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{call.patient_email}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">Urgency</label>
                <p className={`font-semibold ${getUrgencyColor(call.urgency_level)}`}>
                  {call.urgency_level?.toUpperCase() || 'MEDIUM'}
                </p>
              </div>
            </div>
          </div>

          {/* Call Recording */}
          {call.recording_url && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Call Recording
              </h3>
              <audio controls className="w-full">
                <source src={call.recording_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-gray-500 mt-2">
                Duration: {Math.floor((call.call_duration_seconds || 0) / 60)}:{((call.call_duration_seconds || 0) % 60).toString().padStart(2, '0')}
              </p>
            </div>
          )}

          {/* Injury Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Injury/Concern Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {call.injury_description || 'No description provided'}
            </p>
            {call.pain_level && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Pain Level:</strong> {call.pain_level}
              </p>
            )}
          </div>

          {/* Transcription */}
          {call.transcription && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Full Transcription</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {call.transcription}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {call.ai_summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                AI Analysis Summary
              </h3>
              <p className="text-blue-800">{call.ai_summary}</p>
            </div>
          )}

          {/* CRM Lead Link */}
          {call.lead && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">CRM Lead Created</h3>
              <p className="text-green-800">
                Lead: {call.lead.first_name} {call.lead.last_name} - Status: {call.lead.status}
              </p>
              <a 
                href={`#crm/leads/${call.lead.id}`}
                className="text-green-600 hover:text-green-800 text-sm underline mt-2 inline-block"
              >
                View in CRM →
              </a>
            </div>
          )}

          {/* Follow-up Actions */}
          {!call.follow_up_completed_at && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Complete Follow-up</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as AfterHoursCall['outcome'])}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="booked">Booked Appointment</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="no_answer">No Answer</option>
                    <option value="wrong_number">Wrong Number</option>
                    <option value="spam">Spam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Add any notes about the follow-up..."
                  />
                </div>

                <button
                  onClick={handleCompleteFollowUp}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Completed Status */}
          {call.follow_up_completed_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Follow-up Completed
              </h3>
              <p className="text-green-800">
                <strong>Outcome:</strong> {call.outcome}
              </p>
              <p className="text-green-800 mt-1">
                <strong>Completed:</strong> {new Date(call.follow_up_completed_at).toLocaleString()}
              </p>
              {call.follow_up_notes && (
                <p className="text-green-800 mt-2">
                  <strong>Notes:</strong> {call.follow_up_notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {call.from_number && !call.follow_up_completed_at && (
            <a
              href={`tel:${call.from_number}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Back
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
