import React, { useState, useEffect } from 'react';
import {
  Microscope, Search, FileText, TrendingUp, CheckCircle, Clock,
  AlertTriangle, BookOpen, Target, BarChart3, ChevronRight, Send,
  Beaker, Award, Download, Shield, Sparkles
} from 'lucide-react';
import { clinicalIntelligenceService } from '../../services/clinicalIntelligenceService';
import { useToast } from '../../hooks/useToast';

export function ClinicalIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [queryText, setQueryText] = useState('');
  const [queryingEvidence, setQueryingEvidence] = useState(false);
  const [latestDigest, setLatestDigest] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [evidenceSyntheses, setEvidenceSyntheses] = useState<any[]>([]);
  const [pendingTranslations, setPendingTranslations] = useState<any[]>([]);
  const [activePilots, setActivePilots] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [researchSources, setResearchSources] = useState<any[]>([]);
  const [evidencePacks, setEvidencePacks] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'digest' | 'query' | 'papers' | 'translations' | 'pilots' | 'priorities' | 'packs'>('digest');
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [
      metricsData,
      digestData,
      papersData,
      synthesisData,
      translationsData,
      pilotsData,
      prioritiesData,
      sourcesData,
      packsData
    ] = await Promise.all([
      clinicalIntelligenceService.getDashboardMetrics(),
      clinicalIntelligenceService.getLatestDigest(),
      clinicalIntelligenceService.getRecentPapers(10),
      clinicalIntelligenceService.getEvidenceSyntheses(10),
      clinicalIntelligenceService.getPendingTranslations(),
      clinicalIntelligenceService.getActivePilots(),
      clinicalIntelligenceService.getResearchPriorities(),
      clinicalIntelligenceService.getResearchSources(),
      clinicalIntelligenceService.getEvidencePacks(10)
    ]);

    setMetrics(metricsData);
    setLatestDigest(digestData);
    setRecentPapers(papersData);
    setEvidenceSyntheses(synthesisData);
    setPendingTranslations(translationsData);
    setActivePilots(pilotsData);
    setPriorities(prioritiesData);
    setResearchSources(sourcesData);
    setEvidencePacks(packsData);
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

  const getTierBadgeColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Research-to-practice translation • Evidence synthesis • Outcomes measurement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                <p className="text-sm text-gray-600">Pending Changes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingTranslations.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Pilots</p>
                <p className="text-2xl font-bold text-blue-600">{activePilots.length}</p>
              </div>
              <Beaker className="w-8 h-8 text-blue-600" />
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

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Evidence Packs</p>
                <p className="text-2xl font-bold text-purple-600">{evidencePacks.length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button onClick={() => setSelectedTab('digest')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'digest' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Evidence Digest
              </button>
              <button onClick={() => setSelectedTab('query')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'query' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Query Evidence
              </button>
              <button onClick={() => setSelectedTab('papers')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'papers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Research Papers
              </button>
              <button onClick={() => setSelectedTab('translations')} className={`px-6 py-3 font-medium border-b-2 transition-colors relative whitespace-nowrap ${selectedTab === 'translations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Practice Changes
                {pendingTranslations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingTranslations.length}</span>
                )}
              </button>
              <button onClick={() => setSelectedTab('pilots')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'pilots' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Pilots
              </button>
              <button onClick={() => setSelectedTab('priorities')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'priorities' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Priorities
              </button>
              <button onClick={() => setSelectedTab('packs')} className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${selectedTab === 'packs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Evidence Packs
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'digest' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Monthly Evidence Digest
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Top findings, adoption recommendations, and audience-specific insights
                </p>

                {!latestDigest ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No digest available yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">{latestDigest.digest_period}</h4>

                      <div className="mb-4">
                        <h5 className="font-medium text-blue-800 mb-2">Top Findings:</h5>
                        <div className="space-y-2">
                          {latestDigest.top_findings?.map((finding: any, idx: number) => (
                            <div key={idx} className="bg-white border rounded p-3">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium text-gray-900 flex-1">{finding.finding}</p>
                                <span className={`text-xs px-2 py-1 rounded border ml-2 ${getEvidenceQualityColor(finding.evidence_quality)}`}>
                                  {finding.confidence}% confidence
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white border rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">Clinicians</p>
                          <p className="text-sm text-gray-900">{latestDigest.clinician_view}</p>
                        </div>
                        <div className="bg-white border rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">Operations</p>
                          <p className="text-sm text-gray-900">{latestDigest.operations_view}</p>
                        </div>
                        <div className="bg-white border rounded p-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">Executives</p>
                          <p className="text-sm text-gray-900">{latestDigest.executive_view}</p>
                        </div>
                      </div>

                      <div className="bg-green-100 border border-green-200 rounded p-3 mb-2">
                        <p className="text-xs font-medium text-green-800 mb-1">Adoption Recommendations:</p>
                        <p className="text-sm text-green-900">{latestDigest.adoption_recommendations}</p>
                      </div>

                      <div className="bg-orange-100 border border-orange-200 rounded p-3">
                        <p className="text-xs font-medium text-orange-800 mb-1">Not Ready Yet:</p>
                        <p className="text-sm text-orange-900">{latestDigest.not_ready_yet}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'query' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Ask the Evidence</h3>
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
                      {queryingEvidence ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
                          <p className="text-sm text-gray-600">{synthesis.executive_summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'papers' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Research Papers</h3>
                <p className="text-sm text-gray-600 mb-4">Tier-1 approved sources, auto-ingested weekly</p>
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
                        <p className="text-sm text-gray-700 mb-3">{paper.ai_summary}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{paper.study_type}</span>
                          {paper.sample_size && <span>n={paper.sample_size}</span>}
                          <span>{new Date(paper.publication_date).getFullYear()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'translations' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice Translation Proposals</h3>
                <p className="text-sm text-gray-600 mb-4">Research-based changes requiring CCO approval</p>
                {pendingTranslations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No pending translations</p>
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

                        <div className="flex gap-2">
                          <button
                            onClick={() => clinicalIntelligenceService.approveTranslation(translation.id, 'current-user-id')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'pilots' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice Pilots</h3>
                <p className="text-sm text-gray-600 mb-4">Test changes before platform-wide rollout</p>
                {activePilots.length === 0 ? (
                  <div className="text-center py-12">
                    <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active pilots</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePilots.map((pilot: any) => (
                      <div key={pilot.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{pilot.pilot_name}</h5>
                            <p className="text-sm text-gray-600">{pilot.translation?.change_title}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border ${pilot.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {pilot.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(pilot.start_date).toLocaleDateString()} - {new Date(pilot.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'priorities' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Research Priorities</h3>
                <p className="text-sm text-gray-600 mb-4">Focus engine for conditions and outcomes</p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Priority Conditions</h4>
                    <div className="space-y-2">
                      {priorities.filter((p: any) => p.priority_type === 'condition').map((priority: any) => (
                        <div key={priority.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{priority.priority_name}</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              Score: {priority.priority_score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Priority Outcomes</h4>
                    <div className="space-y-2">
                      {priorities.filter((p: any) => p.priority_type === 'outcome').map((priority: any) => (
                        <div key={priority.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{priority.priority_name}</span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              Score: {priority.priority_score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Research Sources by Tier</h4>
                  <div className="space-y-2">
                    {researchSources.slice(0, 10).map((source: any) => (
                      <div key={source.id} className="border rounded p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{source.name}</span>
                          <p className="text-xs text-gray-500">{source.source_type} • Credibility: {source.credibility_score}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${getTierBadgeColor(source.tier)}`}>
                          Tier {source.tier}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'packs' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Evidence Packs</h3>
                <p className="text-sm text-gray-600 mb-4">Auto-generated documentation for insurers, regulators, and audits</p>
                {evidencePacks.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No evidence packs generated yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidencePacks.map((pack: any) => (
                      <div key={pack.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{pack.pack_name}</h5>
                            <p className="text-sm text-gray-600">{pack.pack_type}</p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Download</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Generated {new Date(pack.generated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
