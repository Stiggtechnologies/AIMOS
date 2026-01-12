import { useState, useEffect } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  BarChart3,
  Users,
  Target,
  FileText,
  Award,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  getLatestKPINormalization,
  getDiligenceChecklists,
  getIncompleteDiligenceItems,
  getDataRoomFolders,
  getDataRoomDocuments,
  getLatestMaturityAssessments,
  getLatestExitReadinessMetric,
  getBuyerProfiles,
  getValueDrivers,
  calculateValuationReadinessMetrics,
  type KPINormalization,
  type DiligenceChecklist,
  type DataRoomFolder,
  type DataRoomDocument,
  type MaturityAssessment,
  type ExitReadinessMetric,
  type BuyerProfile,
  type ValueDriver,
} from '../../services/valuationReadinessService';

export default function ValuationReadinessView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'diligence' | 'data_room' | 'maturity' | 'buyers' | 'value_drivers'>('overview');

  const [latestKPI, setLatestKPI] = useState<KPINormalization | null>(null);
  const [checklists, setChecklists] = useState<DiligenceChecklist[]>([]);
  const [incompleteItems, setIncompleteItems] = useState<DiligenceChecklist[]>([]);
  const [folders, setFolders] = useState<DataRoomFolder[]>([]);
  const [documents, setDocuments] = useState<DataRoomDocument[]>([]);
  const [assessments, setAssessments] = useState<MaturityAssessment[]>([]);
  const [exitMetric, setExitMetric] = useState<ExitReadinessMetric | null>(null);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [drivers, setDrivers] = useState<ValueDriver[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        kpiData,
        checklistsData,
        incompleteData,
        foldersData,
        documentsData,
        assessmentsData,
        exitData,
        buyersData,
        driversData,
        metricsData,
      ] = await Promise.all([
        getLatestKPINormalization(),
        getDiligenceChecklists(),
        getIncompleteDiligenceItems(),
        getDataRoomFolders(),
        getDataRoomDocuments(),
        getLatestMaturityAssessments(),
        getLatestExitReadinessMetric(),
        getBuyerProfiles(),
        getValueDrivers(),
        calculateValuationReadinessMetrics(),
      ]);

      setLatestKPI(kpiData);
      setChecklists(checklistsData);
      setIncompleteItems(incompleteData);
      setFolders(foldersData);
      setDocuments(documentsData);
      setAssessments(assessmentsData);
      setExitMetric(exitData);
      setBuyers(buyersData);
      setDrivers(driversData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading valuation readiness data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Exit Readiness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exit & Valuation Readiness</h2>
        <p className="text-sm text-gray-600 mt-1">
          Maximize business value through operational maturity
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Exit Readiness</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{metrics.overallReadiness}%</p>
                <p className="text-xs text-green-700 mt-1">
                  Est. Multiple: {metrics.estimatedMultipleLow}x - {metrics.estimatedMultipleHigh}x
                </p>
              </div>
              <div className="h-12 w-12 bg-green-200 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Diligence Complete</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.diligenceCompletion}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.completedChecklistItems}/{metrics.totalChecklistItems} items
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Room Ready</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.dataRoomCompletion}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.publishedDocuments}/{metrics.totalDocuments} docs
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maturity Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.avgMaturityScore}/100</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.maturityDimensions} dimensions assessed
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'kpis', label: 'KPI Normalization', icon: TrendingUp },
            { id: 'diligence', label: 'Diligence Checklist', icon: CheckCircle2 },
            { id: 'data_room', label: 'Data Room', icon: FolderOpen },
            { id: 'maturity', label: 'Maturity Score', icon: Award },
            { id: 'buyers', label: 'Buyer Profiles', icon: Users },
            { id: 'value_drivers', label: 'Value Drivers', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Financial Quality</h3>
                <div className="text-3xl font-bold text-blue-900">{exitMetric?.financial_quality_score || 0}%</div>
                <p className="text-xs text-blue-700 mt-2">
                  Normalized metrics ready for buyer review
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-3">Operational Quality</h3>
                <div className="text-3xl font-bold text-green-900">{exitMetric?.operational_quality_score || 0}%</div>
                <p className="text-xs text-green-700 mt-2">
                  Process maturity and documentation
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">Tech Quality</h3>
                <div className="text-3xl font-bold text-purple-900">{exitMetric?.tech_quality_score || 0}%</div>
                <p className="text-xs text-purple-700 mt-2">
                  Platform scalability and architecture
                </p>
              </div>
            </div>

            {latestKPI && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Financial Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Period</p>
                    <p className="text-lg font-semibold text-gray-900">{latestKPI.period}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Normalized Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(latestKPI.normalized_revenue / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Normalized EBITDA</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(latestKPI.normalized_ebitda / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Rule of 40</p>
                    <p className="text-lg font-semibold text-gray-900">{latestKPI.rule_of_40_score}%</p>
                  </div>
                </div>
              </div>
            )}

            {incompleteItems.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                  Critical Incomplete Items
                </h3>
                <div className="space-y-3">
                  {incompleteItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-3 border border-amber-200 bg-amber-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center space-x-3 mt-2 text-xs">
                            <span className="text-gray-600">Category: {item.category?.category_name}</span>
                            {item.required_for_exit && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">
                                REQUIRED FOR EXIT
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded font-semibold ${
                              item.buyer_scrutiny_level === 'critical' ? 'bg-red-100 text-red-800' :
                              item.buyer_scrutiny_level === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.buyer_scrutiny_level.toUpperCase()} SCRUTINY
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Buyer Fit</h3>
              <div className="text-sm text-gray-600 mb-3">
                {metrics.highFitBuyers} high-fit buyers identified out of {metrics.potentialBuyers} profiles
              </div>
              <div className="space-y-2">
                {buyers.filter(b => b.fit_score >= 80).slice(0, 3).map((buyer) => (
                  <div key={buyer.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{buyer.buyer_name}</h4>
                      <p className="text-sm text-gray-600">{buyer.buyer_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{buyer.fit_score}%</div>
                      <div className="text-xs text-gray-500">Fit Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KPI Normalization</h3>
              <p className="text-sm text-gray-600">
                Adjusted financial metrics as buyers would calculate them
              </p>
            </div>

            {latestKPI ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Revenue</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reported</span>
                        <span className="font-semibold text-gray-900">
                          ${(latestKPI.reported_revenue / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Normalized</span>
                        <span className="font-bold">
                          ${(latestKPI.normalized_revenue / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Adjustment</span>
                        <span className="font-semibold text-gray-700">
                          ${((latestKPI.normalized_revenue - latestKPI.reported_revenue) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">EBITDA</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reported</span>
                        <span className="font-semibold text-gray-900">
                          ${(latestKPI.reported_ebitda / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Normalized</span>
                        <span className="font-bold">
                          ${(latestKPI.normalized_ebitda / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Add-backs</span>
                        <span className="font-semibold text-gray-700">
                          ${((latestKPI.normalized_ebitda - latestKPI.reported_ebitda) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Gross Margin</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {(latestKPI.normalized_gross_margin * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Operating Margin</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {(latestKPI.normalized_operating_margin * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">LTV / CAC</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {latestKPI.ltv_cac_ratio.toFixed(1)}x
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Rule of 40</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {latestKPI.rule_of_40_score}%
                    </p>
                  </div>
                </div>

                {latestKPI.notes && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Notes</h4>
                    <p className="text-sm text-blue-800">{latestKPI.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No KPI data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diligence' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Diligence Checklist</h3>
              <p className="text-sm text-gray-600">
                Buyer-style diligence items: {metrics.completedChecklistItems} of {metrics.totalChecklistItems} complete
              </p>
            </div>

            <div className="space-y-4">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${
                    item.completion_status === 'complete'
                      ? 'border-green-200 bg-green-50'
                      : item.completion_status === 'in_progress'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                        {item.required_for_exit && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            REQUIRED
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          item.buyer_scrutiny_level === 'critical' ? 'bg-red-100 text-red-800' :
                          item.buyer_scrutiny_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          item.buyer_scrutiny_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.buyer_scrutiny_level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>Category: {item.category?.category_name}</span>
                        <span>Item: {item.item_number}</span>
                        {item.target_completion_date && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {new Date(item.target_completion_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-2xl font-bold ${
                        item.completion_status === 'complete' ? 'text-green-600' :
                        item.completion_status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-400'
                      }`}>
                        {item.completion_percentage}%
                      </div>
                      <div className="text-xs text-gray-600 capitalize">{item.completion_status.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full ${
                        item.completion_status === 'complete' ? 'bg-green-600' :
                        item.completion_status === 'in_progress' ? 'bg-blue-600' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${item.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}

              {checklists.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No diligence items configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data_room' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Data Room</h3>
              <p className="text-sm text-gray-600">
                {metrics.publishedDocuments} of {metrics.totalDocuments} documents ready for buyer review
              </p>
            </div>

            <div className="space-y-3">
              {folders.map((folder) => {
                const folderDocs = documents.filter(d => d.folder_id === folder.id);
                const publishedDocs = folderDocs.filter(d => d.status === 'approved' || d.status === 'published').length;

                return (
                  <div key={folder.id} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{folder.folder_name}</h4>
                          {folder.description && (
                            <p className="text-sm text-gray-600">{folder.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          {publishedDocs}/{folderDocs.length} ready
                        </span>
                        {folder.is_confidential && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            CONFIDENTIAL
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          folder.access_level === 'public' ? 'bg-green-100 text-green-800' :
                          folder.access_level === 'phase1' ? 'bg-blue-100 text-blue-800' :
                          folder.access_level === 'phase2' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {folder.access_level.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {folderDocs.length > 0 && (
                      <div className="p-4 space-y-2">
                        {folderDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.document_name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.document_type} • v{doc.version} • {doc.file_size_mb.toFixed(1)}MB
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              doc.status === 'approved' || doc.status === 'published' ? 'bg-green-100 text-green-800' :
                              doc.status === 'review' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {folders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No data room folders configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maturity' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operational Maturity Assessment</h3>
              <p className="text-sm text-gray-600">
                Average score: {metrics.avgMaturityScore}/100 across {metrics.maturityDimensions} dimensions
              </p>
            </div>

            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{assessment.dimension?.dimension_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assessment.dimension?.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-3xl font-bold text-blue-600">{assessment.current_score}</div>
                      <div className="text-xs text-gray-600">/ {assessment.target_score}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${(assessment.current_score / assessment.target_score) * 100}%` }}
                    ></div>
                  </div>

                  {assessment.strengths && assessment.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">Strengths:</p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        {assessment.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.weaknesses && assessment.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-1">Areas for Improvement:</p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        {assessment.weaknesses.map((weakness, idx) => (
                          <li key={idx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {assessments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No maturity assessments available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'buyers' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Potential Buyer Profiles</h3>
              <p className="text-sm text-gray-600">
                {metrics.highFitBuyers} high-fit buyers out of {metrics.potentialBuyers} total profiles
              </p>
            </div>

            <div className="space-y-4">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{buyer.buyer_name}</h4>
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded capitalize">
                          {buyer.buyer_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-3xl font-bold ${
                        buyer.fit_score >= 80 ? 'text-green-600' :
                        buyer.fit_score >= 60 ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {buyer.fit_score}%
                      </div>
                      <div className="text-xs text-gray-600">Fit Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Check Size</p>
                      <p className="font-semibold text-gray-900">
                        ${(buyer.typical_check_size_min / 1000000).toFixed(0)}M - ${(buyer.typical_check_size_max / 1000000).toFixed(0)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue Range</p>
                      <p className="font-semibold text-gray-900">
                        ${(buyer.preferred_revenue_range_min / 1000000).toFixed(0)}M - ${(buyer.preferred_revenue_range_max / 1000000).toFixed(0)}M
                      </p>
                    </div>
                    {buyer.typical_hold_period && (
                      <div>
                        <p className="text-gray-600">Hold Period</p>
                        <p className="font-semibold text-gray-900">{buyer.typical_hold_period}</p>
                      </div>
                    )}
                    {buyer.deal_structure_preference && (
                      <div>
                        <p className="text-gray-600">Deal Structure</p>
                        <p className="font-semibold text-gray-900">{buyer.deal_structure_preference}</p>
                      </div>
                    )}
                  </div>

                  {buyer.key_evaluation_criteria && buyer.key_evaluation_criteria.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Key Evaluation Criteria:</p>
                      <div className="flex flex-wrap gap-2">
                        {buyer.key_evaluation_criteria.map((criteria, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {criteria}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {buyers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No buyer profiles configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'value_drivers' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Value Drivers</h3>
              <p className="text-sm text-gray-600">
                {metrics.strongValueDrivers} strong drivers, {metrics.weakValueDrivers} need improvement
              </p>
            </div>

            {['financial', 'operational', 'market', 'strategic'].map((category) => {
              const categoryDrivers = drivers.filter(d => d.driver_category === category);

              if (categoryDrivers.length === 0) return null;

              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 capitalize">{category} Drivers</h4>
                  <div className="space-y-3">
                    {categoryDrivers.map((driver) => (
                      <div key={driver.id} className="p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h5 className="font-semibold text-gray-900">{driver.driver_name}</h5>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                driver.current_rating === 'strong' ? 'bg-green-100 text-green-800' :
                                driver.current_rating === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {driver.current_rating.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                driver.impact_on_multiple === 'high' ? 'bg-purple-100 text-purple-800' :
                                driver.impact_on_multiple === 'medium' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {driver.impact_on_multiple.toUpperCase()} IMPACT
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{driver.description}</p>
                          </div>
                        </div>

                        {driver.supporting_evidence && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Evidence:</p>
                            <p className="text-sm text-gray-600">{driver.supporting_evidence}</p>
                          </div>
                        )}

                        {driver.improvement_plan && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Improvement Plan:</p>
                            <p className="text-sm text-gray-600">{driver.improvement_plan}</p>
                            {driver.target_timeline && (
                              <p className="text-xs text-gray-500 mt-1">
                                Target: {new Date(driver.target_timeline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {drivers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No value drivers configured</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
