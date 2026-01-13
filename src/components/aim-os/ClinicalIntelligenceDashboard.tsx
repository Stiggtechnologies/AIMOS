import React, { useState, useEffect } from 'react';
import {
  Microscope, Search, FileText, TrendingUp, CheckCircle, Clock,
  AlertTriangle, BookOpen, Target, BarChart3, ChevronRight, Send
} from 'lucide-react';
import { clinicalIntelligenceService } from '../../services/clinicalIntelligenceService';
import { useToast } from '../../hooks/useToast';

export function ClinicalIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [queryText, setQueryText] = useState('');
  const [queryingEvidence, setQueryingEvidence] = useState(false);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [evidenceSyntheses, setEvidenceSyntheses] = useState<any[]>([]);
  const [pendingTranslations, setPendingTranslations] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'query' | 'papers' | 'translations' | 'outcomes'>('query');
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [metricsData, papersData, synthesisData, translationsData] = await Promise.all([
      clinicalIntelligenceService.getDashboardMetrics(),
      clinicalIntelligenceService.getRecentPapers(10),
      clinicalIntelligenceService.getEvidenceSyntheses(10),
      clinicalIntelligenceService.getPendingTranslations()
    ]);

    setMetrics(metricsData);
    setRecentPapers(papersData);
    setEvidenceSyntheses(synthesisData);
    setPendingTranslations(translationsData);
  };

  const handleQueryEvidence = async () => {
    if (!queryText.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }

    setQueryingEvidence(true);

    try {
      const synthesis = await clinicalIntelligenceService.queryEvidence(
        queryText,
        'current-user-id'
      );

      if (synthesis) {
        showToast('Evidence synthesis complete', 'success');
        setQueryText('');
        await loadData();
      } else {
        showToast('Failed to synthesize evidence', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Query failed', 'error');
    } finally {
      setQueryingEvidence(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getEvidenceQualityColor = (quality: string) => {
    switch (quality) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Microscope className="w-8 h-8 text-blue-600" />
            Clinical Intelligence & Innovation
          </h1>
          <p className="text-gray-600 mt-2">
            Research-to-practice translation, evidence synthesis, and outcomes measurement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Research Papers</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_papers || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Translations</p>
                <p className="text-2xl font-bold text-orange-600">{metrics?.pending_translations || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Adoptions</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.active_adoptions || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive Outcomes</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.positive_outcomes || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('query')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === 'query'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Query Evidence
              </button>
              <button
                onClick={() => setSelectedTab('papers')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === 'papers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Research Papers
              </button>
              <button
                onClick={() => setSelectedTab('translations')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors relative ${
                  selectedTab === 'translations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Practice Translations
                {pendingTranslations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingTranslations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedTab('outcomes')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  selectedTab === 'outcomes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Outcomes
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'query' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Ask the Evidence</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ask clinical or operational questions and get evidence-based answers synthesized from our research database
                </p>

                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQueryEvidence()}
                      placeholder="e.g., What does current evidence say about early mobilization for shoulder injuries?"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={queryingEvidence}
                    />
                    <button
                      onClick={handleQueryEvidence}
                      disabled={queryingEvidence || !queryText.trim()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {queryingEvidence ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      Query
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Evidence Syntheses</h4>
                  {evidenceSyntheses.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No evidence syntheses yet</p>
                      <p className="text-sm text-gray-500 mt-1">Ask a question to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evidenceSyntheses.map((synthesis) => (
                        <div key={synthesis.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{synthesis.query_text}</h5>
                            <div className="flex gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getEvidenceQualityColor(synthesis.evidence_quality)}`}>
                                {synthesis.evidence_quality}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                                {synthesis.confidence_score}% confidence
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{synthesis.executive_summary}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(synthesis.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'papers' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Research Papers</h3>
                {recentPapers.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No research papers ingested yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPapers.map((paper) => (
                      <div key={paper.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900 flex-1">{paper.title}</h5>
                          <span className={`text-xs px-2 py-1 rounded-full border ml-2 ${getQualityColor(paper.quality_score)}`}>
                            Quality: {paper.quality_score}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {paper.authors?.slice(0, 3).join(', ')}
                          {paper.authors?.length > 3 && ' et al.'}
                        </p>
                        <p className="text-sm text-gray-700 mb-3">{paper.ai_summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{paper.study_type}</span>
                          {paper.sample_size && <span>n={paper.sample_size}</span>}
                          <span>{new Date(paper.publication_date).getFullYear()}</span>
                        </div>
                        {paper.conditions?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {paper.conditions.map((condition: string, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                {condition}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'translations' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Practice Translation Proposals</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and approve research-based changes to clinical practice
                </p>
                {pendingTranslations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No pending translations</p>
                    <p className="text-sm text-gray-500 mt-1">All proposals have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTranslations.map((translation) => (
                      <div key={translation.id} className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900">{translation.change_title}</h5>
                              <span className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                                {translation.change_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{translation.change_description}</p>
                          </div>
                          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 ml-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <p className="text-gray-600">Expected Improvement:</p>
                            <p className="text-gray-900">{translation.expected_outcome_improvement}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Complexity:</p>
                            <p className="text-gray-900 capitalize">{translation.implementation_complexity}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => clinicalIntelligenceService.approveTranslation(translation.id, 'current-user-id')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => clinicalIntelligenceService.rejectTranslation(translation.id, 'current-user-id', 'Requires further review')}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'outcomes' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Research Outcomes Dashboard</h3>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Outcomes tracking coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-world impact measurements will appear here once practice changes are implemented
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
