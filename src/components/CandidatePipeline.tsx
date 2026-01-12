import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MapPin, Award, ExternalLink } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import type { Application } from '../types';

export default function CandidatePipeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { key: 'all', label: 'All', count: applications.length },
    { key: 'applied', label: 'Applied', count: applications.filter(a => a.status === 'applied').length },
    { key: 'screening', label: 'Screening', count: applications.filter(a => a.status === 'screening').length },
    { key: 'interviewing', label: 'Interviewing', count: applications.filter(a => a.status === 'interviewing' || a.status === 'interview_scheduled').length },
    { key: 'offered', label: 'Offered', count: applications.filter(a => a.status === 'offered').length },
    { key: 'accepted', label: 'Hired', count: applications.filter(a => a.status === 'accepted').length }
  ];

  const filteredApplications = selectedStage === 'all'
    ? applications
    : applications.filter(a => {
        if (selectedStage === 'interviewing') {
          return a.status === 'interviewing' || a.status === 'interview_scheduled';
        }
        return a.status === selectedStage;
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-yellow-100 text-yellow-800';
      case 'interviewing':
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'offered': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="mt-2 text-gray-600">Track candidates through the hiring process</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {stages.map(stage => (
          <button
            key={stage.key}
            onClick={() => setSelectedStage(stage.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStage === stage.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {stage.label} ({stage.count})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApplications.map(application => {
          const candidate = application.candidate;
          if (!candidate) return null;

          return (
            <div key={application.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {candidate.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{candidate.location}</span>
                        </div>
                      )}
                    </div>

                    {application.job && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Applied to: {application.job.title}</span>
                      </div>
                    )}

                    {candidate.source_channel && (
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Source: {candidate.source_channel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {application.screening_score && (
                    <div>
                      <div className={`text-3xl font-bold ${getScoreColor(application.screening_score)}`}>
                        {application.screening_score.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  )}
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {application.screening_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
                  {application.screening_notes}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Days in pipeline: {application.days_in_pipeline}</span>
                <span>Last activity: {new Date(application.last_activity_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No candidates in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}
