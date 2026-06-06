import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  FileText,
  Target,
  Calendar,
  Award,
  PieChart,
} from 'lucide-react';
import {
  getCapitalRequests,
  getCapitalInvestments,
  getInvestmentReviews,
  getClinicReinvestments,
  calculatePortfolioMetrics,
  type CapitalRequest,
  type CapitalInvestment,
  type InvestmentReview,
  type ClinicReinvestment,
} from '../../services/capitalAllocationService';

export default function CapitalAllocationView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'investments' | 'reviews' | 'reinvestments'>('overview');

  const [requests, setRequests] = useState<CapitalRequest[]>([]);
  const [investments, setInvestments] = useState<CapitalInvestment[]>([]);
  const [reviews, setReviews] = useState<InvestmentReview[]>([]);
  const [reinvestments, setReinvestments] = useState<ClinicReinvestment[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [requestsData, investmentsData, reviewsData, reinvestmentsData, metricsData] = await Promise.all([
        getCapitalRequests(),
        getCapitalInvestments(),
        getInvestmentReviews(),
        getClinicReinvestments(),
        calculatePortfolioMetrics(),
      ]);

      setRequests(requestsData);
      setInvestments(investmentsData);
      setReviews(reviewsData);
      setReinvestments(reinvestmentsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading capital allocation data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Capital Allocation...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => ['submitted', 'under_review'].includes(r.status));
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const activeInvestments = investments.filter(i => ['planning', 'in_progress'].includes(i.project_status));
  const completedInvestments = investments.filter(i => i.project_status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Capital Allocation & Investment Governance</h2>
        <p className="text-sm text-gray-600 mt-1">
          PE-grade discipline for growth spending
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requested</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(metrics.totalRequested / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">{pendingRequests.length} pending</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${(metrics.totalInvested / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">{activeInvestments.length} active projects</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average ROI</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics.avgROI.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics.approvalRate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{approvedRequests.length} approved</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'requests', label: 'Requests', icon: FileText },
            { id: 'investments', label: 'Investments', icon: Target },
            { id: 'reviews', label: 'Post-Investment Reviews', icon: Award },
            { id: 'reinvestments', label: 'Clinic Reinvestment', icon: PieChart },
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
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Investment Pipeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Pending Requests</span>
                    <span className="font-bold text-blue-900">{pendingRequests.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Active Projects</span>
                    <span className="font-bold text-blue-900">{activeInvestments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Completed Projects</span>
                    <span className="font-bold text-blue-900">{completedInvestments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Reviews Completed</span>
                    <span className="font-bold text-blue-900">{reviews.length}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-3">Performance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Total Capital Deployed</span>
                    <span className="font-bold text-green-900">${(metrics?.totalInvested / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Portfolio ROI</span>
                    <span className="font-bold text-green-900">{metrics?.avgROI.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Approval Rate</span>
                    <span className="font-bold text-green-900">{metrics?.approvalRate.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Projects On Budget</span>
                    <span className="font-bold text-green-900">
                      {investments.filter(i => Math.abs(i.budget_variance_percent) <= 5).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                <div className="space-y-3">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{request.project_title}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              request.strategic_priority === 'critical' ? 'bg-red-100 text-red-800' :
                              request.strategic_priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              request.strategic_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.strategic_priority?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{request.project_description}</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Requested Amount</p>
                              <p className="font-semibold text-gray-900">${(request.requested_amount / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Expected ROI</p>
                              <p className="font-semibold text-gray-900">{request.expected_annual_roi_percent}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Payback Period</p>
                              <p className="font-semibold text-gray-900">{request.payback_period_months} months</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeInvestments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Investments</h3>
                <div className="space-y-3">
                  {activeInvestments.slice(0, 5).map((investment) => (
                    <div key={investment.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{investment.request?.project_title}</h4>
                          <p className="text-sm text-gray-600">{investment.investment_number}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          investment.project_status === 'planning' ? 'bg-blue-100 text-blue-800' :
                          investment.project_status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {investment.project_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{investment.percent_complete}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${investment.percent_complete}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Approved Amount</p>
                          <p className="font-semibold text-gray-900">${(investment.approved_amount / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Actual Spent</p>
                          <p className="font-semibold text-gray-900">${(investment.actual_spent / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Budget Variance</p>
                          <p className={`font-semibold ${
                            Math.abs(investment.budget_variance_percent) <= 5 ? 'text-green-600' :
                            Math.abs(investment.budget_variance_percent) <= 10 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {investment.budget_variance_percent > 0 ? '+' : ''}{investment.budget_variance_percent}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Capital Requests</h3>
              <p className="text-sm text-gray-600">All capital expenditure requests with ROI justification</p>
            </div>

            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{request.project_title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          request.strategic_priority === 'critical' ? 'bg-red-100 text-red-800' :
                          request.strategic_priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          request.strategic_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.strategic_priority?.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{request.project_description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Request #</p>
                          <p className="font-semibold text-gray-900">{request.request_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">{request.investment_category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">${(request.requested_amount / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expected ROI</p>
                          <p className="font-semibold text-gray-900">{request.expected_annual_roi_percent}%</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Year 1 Revenue Impact</p>
                          <p className="text-sm font-semibold text-gray-900">${(request.revenue_impact_year1 / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Year 2 Revenue Impact</p>
                          <p className="text-sm font-semibold text-gray-900">${(request.revenue_impact_year2 / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Year 3 Revenue Impact</p>
                          <p className="text-sm font-semibold text-gray-900">${(request.revenue_impact_year3 / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {requests.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No capital requests submitted</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Investments</h3>
              <p className="text-sm text-gray-600">Track funded projects and performance</p>
            </div>

            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{investment.request?.project_title}</h4>
                      <p className="text-sm text-gray-600">{investment.investment_number}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      investment.project_status === 'completed' ? 'bg-green-100 text-green-800' :
                      investment.project_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      investment.project_status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {investment.project_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completion Progress</span>
                      <span className="font-semibold text-gray-900">{investment.percent_complete}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${investment.percent_complete}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Approved Budget</p>
                      <p className="font-semibold text-gray-900">${(investment.approved_amount / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Actual Spent</p>
                      <p className="font-semibold text-gray-900">${(investment.actual_spent / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Budget Variance</p>
                      <p className={`font-semibold ${
                        Math.abs(investment.budget_variance_percent) <= 5 ? 'text-green-600' :
                        Math.abs(investment.budget_variance_percent) <= 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {investment.budget_variance_percent > 0 ? '+' : ''}{investment.budget_variance_percent}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Timeline Variance</p>
                      <p className={`font-semibold ${
                        Math.abs(investment.timeline_variance_days) <= 7 ? 'text-green-600' :
                        Math.abs(investment.timeline_variance_days) <= 30 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {investment.timeline_variance_days > 0 ? '+' : ''}{investment.timeline_variance_days} days
                      </p>
                    </div>
                  </div>

                  {investment.expected_completion_date && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Expected completion: {new Date(investment.expected_completion_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}

              {investments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active investments</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Post-Investment Reviews</h3>
              <p className="text-sm text-gray-600">Performance tracking against projections</p>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.investment?.request?.project_title}</h4>
                      <p className="text-sm text-gray-600">{review.review_period} Review - {new Date(review.review_date).toLocaleDateString()}</p>
                    </div>
                    {review.overall_rating && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Award
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.overall_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Actual ROI</p>
                      <p className="text-sm font-semibold text-gray-900">{review.actual_roi_percent}%</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Revenue Impact</p>
                      <p className="text-sm font-semibold text-gray-900">${(review.actual_revenue_impact / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Cost Savings</p>
                      <p className="text-sm font-semibold text-gray-900">${(review.actual_cost_savings / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">vs. Projection</p>
                      <p className={`text-sm font-semibold ${
                        review.performance_vs_projection === 'exceeding' ? 'text-green-600' :
                        review.performance_vs_projection === 'meeting' ? 'text-blue-600' :
                        review.performance_vs_projection === 'below' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {review.performance_vs_projection?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {review.lessons_learned && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Lessons Learned</p>
                      <p className="text-sm text-blue-800">{review.lessons_learned}</p>
                    </div>
                  )}
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No post-investment reviews completed</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reinvestments' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinic Reinvestment Tracking</h3>
              <p className="text-sm text-gray-600">Capital deployment by clinic</p>
            </div>

            <div className="space-y-4">
              {reinvestments.map((reinvestment) => (
                <div key={reinvestment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        FY {reinvestment.fiscal_year} Q{reinvestment.fiscal_quarter}
                      </h4>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {reinvestment.reinvestment_rate_percent}% Reinvestment Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Total Revenue</p>
                      <p className="font-semibold text-gray-900">${(reinvestment.total_revenue / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Investments</p>
                      <p className="font-semibold text-gray-900">${(reinvestment.total_investments / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-gray-600">ROI Performance</p>
                      <p className="font-semibold text-green-600">{reinvestment.roi_performance}%</p>
                    </div>
                  </div>

                  {reinvestment.benchmark_comparison && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-semibold">Benchmark: {reinvestment.benchmark_comparison}</p>
                    </div>
                  )}
                </div>
              ))}

              {reinvestments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No reinvestment data available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
