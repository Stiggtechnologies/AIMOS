import { useState, useEffect } from 'react';
import {
  Smile,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ThumbsUp,
  ThumbsDown,
  Activity,
} from 'lucide-react';
import {
  getSatisfactionSignals,
  getReferralPartnerSatisfaction,
  getReputationMonitoring,
  getChurnRiskIndicators,
  getComplaintThemes,
  getExperienceImprovementActions,
  getHighRiskChurnIndicators,
  type SatisfactionSignals,
  type ReferralPartnerSatisfaction,
  type ReputationMonitoring,
  type ChurnRiskIndicators,
  type ComplaintTheme,
  type ExperienceImprovementAction,
} from '../../services/experienceReputationService';

export default function ExperienceReputationView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'satisfaction' | 'complaints' | 'referral_partners' | 'reputation' | 'churn_risk' | 'improvements'>('overview');

  const [satisfactionSignals, setSatisfactionSignals] = useState<SatisfactionSignals[]>([]);
  const [referralPartners, setReferralPartners] = useState<ReferralPartnerSatisfaction[]>([]);
  const [reputationData, setReputationData] = useState<ReputationMonitoring[]>([]);
  const [churnRisk, setChurnRisk] = useState<ChurnRiskIndicators[]>([]);
  const [complaints, setComplaints] = useState<ComplaintTheme[]>([]);
  const [improvements, setImprovements] = useState<ExperienceImprovementAction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [satisfactionData, partnerData, reputationDataResult, churnData, complaintsData, improvementsData] = await Promise.all([
        getSatisfactionSignals(),
        getReferralPartnerSatisfaction(),
        getReputationMonitoring(),
        getChurnRiskIndicators(),
        getComplaintThemes(),
        getExperienceImprovementActions(),
      ]);

      setSatisfactionSignals(satisfactionData);
      setReferralPartners(partnerData);
      setReputationData(reputationDataResult);
      setChurnRisk(churnData);
      setComplaints(complaintsData);
      setImprovements(improvementsData);
    } catch (error) {
      console.error('Error loading experience data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Experience Intelligence...</p>
        </div>
      </div>
    );
  }

  const latestSatisfaction = satisfactionSignals[0];
  const avgNPS = satisfactionSignals.length > 0
    ? satisfactionSignals.reduce((sum, s) => sum + s.nps_score, 0) / satisfactionSignals.length
    : 0;

  const avgOverallScore = satisfactionSignals.length > 0
    ? satisfactionSignals.reduce((sum, s) => sum + s.average_overall_score, 0) / satisfactionSignals.length
    : 0;

  const activeComplaints = complaints.filter(c => c.status === 'active').length;
  const highSeverityComplaints = complaints.filter(c => c.severity === 'high' || c.severity === 'critical').length;

  const avgReputationRating = reputationData.length > 0
    ? reputationData.reduce((sum, r) => sum + r.average_rating, 0) / reputationData.length
    : 0;

  const totalPatientsAtRisk = churnRisk.reduce((sum, c) => sum + c.patients_at_risk_count, 0);
  const highRiskCount = churnRisk.filter(c => c.risk_level === 'high').length;

  const activeImprovements = improvements.filter(i => i.status === 'planned' || i.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Experience & Reputation Intelligence</h2>
        <p className="text-sm text-gray-600 mt-1">
          Experience drives referrals more than outcomes - protect your growth flywheel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">NPS Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgNPS.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {latestSatisfaction ? `${latestSatisfaction.promoters_count} promoters` : 'No data'}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              avgNPS >= 50 ? 'bg-green-100' :
              avgNPS >= 0 ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                avgNPS >= 50 ? 'text-green-600' :
                avgNPS >= 0 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgOverallScore.toFixed(1)}/5.0</p>
              <p className="text-xs text-gray-500 mt-1">
                {latestSatisfaction ? `${latestSatisfaction.responses_collected} responses` : 'No responses'}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Smile className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Online Reputation</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgReputationRating.toFixed(1)}/5.0</p>
              <p className="text-xs text-gray-500 mt-1">
                {reputationData.reduce((sum, r) => sum + r.total_reviews, 0)} total reviews
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients at Risk</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalPatientsAtRisk}</p>
              <p className="text-xs text-gray-500 mt-1">{highRiskCount} high risk</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              highRiskCount > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                highRiskCount > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'satisfaction', label: 'Patient Satisfaction', icon: Smile },
            { id: 'complaints', label: 'Complaint Themes', icon: MessageSquare },
            { id: 'referral_partners', label: 'Referral Partners', icon: Users },
            { id: 'reputation', label: 'Online Reputation', icon: Star },
            { id: 'churn_risk', label: 'Churn Risk', icon: AlertTriangle },
            { id: 'improvements', label: 'Improvement Actions', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Latest Satisfaction Metrics</h3>
                {latestSatisfaction ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">NPS Score</span>
                      <span className="font-bold text-blue-900">{latestSatisfaction.nps_score}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Overall Score</span>
                      <span className="font-bold text-blue-900">{latestSatisfaction.average_overall_score.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Treatment Effectiveness</span>
                      <span className="font-bold text-blue-900">{latestSatisfaction.treatment_effectiveness_score.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Staff Friendliness</span>
                      <span className="font-bold text-blue-900">{latestSatisfaction.staff_friendliness_score.toFixed(1)}/5.0</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-blue-700">No satisfaction data available</p>
                )}
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-3">Active Complaints</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Total Active</span>
                    <span className="font-bold text-red-900">{activeComplaints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">High Severity</span>
                    <span className="font-bold text-red-900">{highSeverityComplaints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Requiring Action</span>
                    <span className="font-bold text-red-900">{activeImprovements}</span>
                  </div>
                </div>
              </div>
            </div>

            {highRiskCount > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">High Risk Churn Alerts</h3>
                <div className="space-y-3">
                  {churnRisk.filter(c => c.risk_level === 'high').slice(0, 3).map((risk) => (
                    <div
                      key={risk.id}
                      className="p-4 bg-red-50 border-l-4 border-red-500 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {risk.patients_at_risk_count} patients at risk
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Missed Appointments</p>
                              <p className="font-semibold text-gray-900">{risk.missed_appointments_count}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Declined Rebookings</p>
                              <p className="font-semibold text-gray-900">{risk.declined_rebookings_count}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Negative Feedback</p>
                              <p className="font-semibold text-gray-900">{risk.negative_feedback_count}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeImprovements > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Improvement Initiatives</h3>
                <div className="space-y-2">
                  {improvements.filter(i => i.status !== 'completed' && i.status !== 'abandoned').slice(0, 5).map((action) => (
                    <div key={action.id} className="p-3 bg-blue-50 rounded flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{action.description}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Category: {action.action_category} • Started: {new Date(action.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {action.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'satisfaction' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Satisfaction Tracking</h3>
              <p className="text-sm text-gray-600">Aggregated, non-PHI satisfaction metrics</p>
            </div>

            <div className="space-y-4">
              {satisfactionSignals.map((signal) => (
                <div key={signal.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(signal.period_start).toLocaleDateString()} - {new Date(signal.period_end).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{signal.responses_collected} responses collected</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-600">NPS</p>
                        <p className={`text-lg font-bold ${
                          signal.nps_score >= 50 ? 'text-green-600' :
                          signal.nps_score >= 0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {signal.nps_score}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Overall</p>
                        <p className="text-lg font-bold text-blue-600">{signal.average_overall_score.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Ease of Booking</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.ease_of_booking_score.toFixed(1)}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Staff Friendliness</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.staff_friendliness_score.toFixed(1)}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Facility Cleanliness</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.facility_cleanliness_score.toFixed(1)}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Wait Time Satisfaction</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.wait_time_satisfaction_score.toFixed(1)}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Treatment Effectiveness</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.treatment_effectiveness_score.toFixed(1)}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Would Recommend</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{signal.would_recommend_percentage.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">{signal.promoters_count} promoters</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-600">{signal.passives_count} passives</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="text-gray-600">{signal.detractors_count} detractors</span>
                    </div>
                  </div>
                </div>
              ))}

              {satisfactionSignals.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Smile className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No satisfaction data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complaint Theme Analysis</h3>
              <p className="text-sm text-gray-600">Categorized and trend-tracked complaints</p>
            </div>

            <div className="space-y-3">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    complaint.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    complaint.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    complaint.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{complaint.theme_name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          complaint.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          complaint.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          complaint.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {complaint.severity.toUpperCase()}
                        </span>
                        {complaint.trend === 'increasing' && (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Category: {complaint.category}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Occurrences</p>
                          <p className="font-semibold text-gray-900">{complaint.occurrence_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">First Reported</p>
                          <p className="font-semibold text-gray-900">{new Date(complaint.first_reported).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Last Reported</p>
                          <p className="font-semibold text-gray-900">{new Date(complaint.last_reported).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {complaints.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No complaints recorded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'referral_partners' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Partner Satisfaction</h3>
              <p className="text-sm text-gray-600">Relationship health with referring providers</p>
            </div>

            <div className="space-y-3">
              {referralPartners.map((partner) => (
                <div key={partner.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{partner.partner_name || 'Partner'}</h4>
                      <p className="text-sm text-gray-600">Type: {partner.partner_type}</p>
                      {partner.survey_date && (
                        <p className="text-xs text-gray-500 mt-1">Surveyed: {new Date(partner.survey_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Overall Satisfaction</p>
                      <p className="text-2xl font-bold text-blue-600">{partner.overall_satisfaction_score?.toFixed(1) || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Communication</p>
                      <p className="text-sm font-semibold text-gray-900">{partner.communication_score?.toFixed(1) || 'N/A'}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Responsiveness</p>
                      <p className="text-sm font-semibold text-gray-900">{partner.responsiveness_score?.toFixed(1) || 'N/A'}/5</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Would Refer Again</p>
                      <p className="text-sm font-semibold text-gray-900">{partner.likelihood_to_refer_score?.toFixed(1) || 'N/A'}/5</p>
                    </div>
                  </div>

                  {partner.follow_up_required && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700 font-medium">Follow-up required</span>
                    </div>
                  )}
                </div>
              ))}

              {referralPartners.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No referral partner data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Online Reputation Monitoring</h3>
              <p className="text-sm text-gray-600">Public review platform tracking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reputationData.map((rep) => (
                <div key={rep.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 capitalize">{rep.platform}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold text-gray-900">{rep.average_rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Reviews</span>
                      <span className="font-semibold text-gray-900">{rep.total_reviews}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">New Reviews</span>
                      <span className="font-semibold text-gray-900">{rep.new_reviews_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Positive</span>
                      <span className="font-semibold text-green-600">{rep.positive_reviews_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Negative</span>
                      <span className="font-semibold text-red-600">{rep.negative_reviews_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Response Rate</span>
                      <span className="font-semibold text-gray-900">{rep.response_rate_percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}

              {reputationData.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No reputation data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'churn_risk' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Churn Risk Indicators</h3>
              <p className="text-sm text-gray-600">Early warning signals for patient retention</p>
            </div>

            <div className="space-y-4">
              {churnRisk.map((risk) => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    risk.risk_level === 'high' ? 'bg-red-50 border-red-500' :
                    risk.risk_level === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-green-50 border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(risk.period_start).toLocaleDateString()} - {new Date(risk.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded ${
                      risk.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      risk.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {risk.risk_level.toUpperCase()} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Patients at Risk</p>
                      <p className="text-lg font-bold text-gray-900">{risk.patients_at_risk_count}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Missed Appointments</p>
                      <p className="text-lg font-bold text-gray-900">{risk.missed_appointments_count}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Declined Rebookings</p>
                      <p className="text-lg font-bold text-gray-900">{risk.declined_rebookings_count}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Negative Feedback</p>
                      <p className="text-lg font-bold text-gray-900">{risk.negative_feedback_count}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Payment Issues</p>
                      <p className="text-lg font-bold text-gray-900">{risk.payment_issues_count}</p>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">Long Gaps</p>
                      <p className="text-lg font-bold text-gray-900">{risk.long_gaps_between_visits_count}</p>
                    </div>
                  </div>
                </div>
              ))}

              {churnRisk.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No churn risk data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience Improvement Actions</h3>
              <p className="text-sm text-gray-600">Track initiatives triggered by experience signals</p>
            </div>

            <div className="space-y-3">
              {improvements.map((action) => (
                <div
                  key={action.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    action.status === 'completed' ? 'bg-green-50 border-green-500' :
                    action.status === 'in_progress' ? 'bg-blue-50 border-blue-500' :
                    action.status === 'abandoned' ? 'bg-gray-50 border-gray-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{action.description}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          action.status === 'completed' ? 'bg-green-100 text-green-800' :
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          action.status === 'abandoned' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {action.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">{action.action_category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Triggered By</p>
                          <p className="font-semibold text-gray-900">{action.triggered_by || 'Manual'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-semibold text-gray-900">{new Date(action.start_date).toLocaleDateString()}</p>
                        </div>
                        {action.completion_date && (
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-semibold text-gray-900">{new Date(action.completion_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      {action.expected_impact && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Expected Impact:</span> {action.expected_impact}
                        </p>
                      )}
                    </div>
                    {action.actual_impact_measured && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              ))}

              {improvements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No improvement actions recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
