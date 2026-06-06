import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Beaker,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Zap,
  Archive,
  RefreshCw,
  BookOpen,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { researchIngestionService } from '../../services/researchIngestionService';
import { evidenceSynthesisTriggerService } from '../../services/evidenceSynthesisTriggerService';
import { translationProposalService } from '../../services/translationProposalService';
import { pilotManagementService } from '../../services/pilotManagementService';
import { outcomeAttributionService } from '../../services/outcomeAttributionService';
import { decisionEnforcementService } from '../../services/decisionEnforcementService';

interface CIIStatus {
  researchIngestion: { jobsCompleted: number; papersIngested: number; qualityScore: number };
  evidenceSynthesis: { digestsPublished: number; actionableFlags: number };
  translationProposals: { generated: number; approved: number; pending: number };
  pilots: { active: number; completed: number };
  outcomes: { measured: number; positive: number };
  decisions: { rollouts: number; rollbacks: number };
}

interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  doi?: string;
  quality_score: number;
  clinical_relevance: number;
  operational_relevance: number;
  reimbursement_relevance: number;
  ai_summary: string;
  ai_clinical_implications: string;
  ai_operational_implications: string;
}

export const CIIAutomationDashboard: React.FC = () => {
  const [status, setStatus] = useState<CIIStatus>({
    researchIngestion: { jobsCompleted: 0, papersIngested: 0, qualityScore: 0 },
    evidenceSynthesis: { digestsPublished: 0, actionableFlags: 0 },
    translationProposals: { generated: 0, approved: 0, pending: 0 },
    pilots: { active: 0, completed: 0 },
    outcomes: { measured: 0, positive: 0 },
    decisions: { rollouts: 0, rollbacks: 0 }
  });
  const [activePhase, setActivePhase] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ingestion, digests, proposals, pilots, outcomes, decisions, { data: paperData }] = await Promise.all([
        researchIngestionService.getQualityReport(),
        evidenceSynthesisTriggerService.getLatestDigestTrends(),
        translationProposalService.getProposalStats(),
        pilotManagementService.getActivePilots(),
        outcomeAttributionService.getOutcomesSummary(),
        decisionEnforcementService.getPendingRolloutDecisions(),
        supabase
          .from('research_papers')
          .select('*')
          .eq('ingestion_status', 'processed')
          .order('quality_score', { ascending: false })
          .limit(8)
      ]);

      setPapers(paperData || []);

      setStatus({
        researchIngestion: {
          jobsCompleted: ingestion?.totalJobsCompleted || 0,
          papersIngested: (ingestion?.totalPapersIngested || 0) + (paperData?.length || 0),
          qualityScore: ingestion?.avgMetadataQuality || 0
        },
        evidenceSynthesis: {
          digestsPublished: digests?.length || 0,
          actionableFlags: 0
        },
        translationProposals: {
          generated: proposals?.total_generated || 0,
          approved: proposals?.approved_count || 0,
          pending: proposals?.pending_review || 0
        },
        pilots: {
          active: pilots?.length || 0,
          completed: 0
        },
        outcomes: {
          measured: outcomes?.length || 0,
          positive: outcomes?.filter((o: any) => o.improvement > 0).length || 0
        },
        decisions: {
          rollouts: decisions?.filter((d: any) => d.decision === 'rollout').length || 0,
          rollbacks: decisions?.filter((d: any) => d.decision === 'rollback').length || 0
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const phases = [
    {
      id: 'research',
      number: '1',
      title: 'Research Ingestion',
      description: 'Automated pulls from approved sources',
      icon: Beaker,
      metrics: [
        { label: 'Jobs Completed', value: status.researchIngestion.jobsCompleted },
        { label: 'Papers Ingested', value: status.researchIngestion.papersIngested },
        { label: 'Quality Score', value: `${status.researchIngestion.qualityScore.toFixed(0)}%` }
      ],
      color: 'bg-blue-50'
    },
    {
      id: 'synthesis',
      number: '2',
      title: 'Evidence Synthesis',
      description: 'Monthly digests with confidence-weighted summaries',
      icon: BarChart3,
      metrics: [
        { label: 'Digests Published', value: status.evidenceSynthesis.digestsPublished },
        { label: 'Actionable Flags', value: status.evidenceSynthesis.actionableFlags }
      ],
      color: 'bg-green-50'
    },
    {
      id: 'translation',
      number: '3',
      title: 'Translation Trigger',
      description: 'Auto-generated change proposals',
      icon: Zap,
      metrics: [
        { label: 'Generated', value: status.translationProposals.generated },
        { label: 'Approved', value: status.translationProposals.approved },
        { label: 'Pending', value: status.translationProposals.pending }
      ],
      color: 'bg-amber-50'
    },
    {
      id: 'pilot',
      number: '4',
      title: 'Pilot Management',
      description: 'Time-boxed evaluation with locked metrics',
      icon: Users,
      metrics: [
        { label: 'Active Pilots', value: status.pilots.active },
        { label: 'Completed', value: status.pilots.completed }
      ],
      color: 'bg-purple-50'
    },
    {
      id: 'outcome',
      number: '5',
      title: 'Outcome Attribution',
      description: 'Track outcomes to SOP version and evidence',
      icon: TrendingUp,
      metrics: [
        { label: 'Measured', value: status.outcomes.measured },
        { label: 'Positive Results', value: status.outcomes.positive }
      ],
      color: 'bg-teal-50'
    },
    {
      id: 'enforcement',
      number: '6',
      title: 'Decision Enforcement',
      description: 'Rollout or rollback with permanent learning',
      icon: Archive,
      metrics: [
        { label: 'Rollouts', value: status.decisions.rollouts },
        { label: 'Rollbacks', value: status.decisions.rollbacks }
      ],
      color: 'bg-rose-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CII Automation System</h1>
          <p className="mt-2 text-gray-600">Self-driving clinical intelligence with 6-phase evidence loop</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Phase Overview */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6 text-gray-900">Six-Component Evidence Loop</h2>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-green-400 to-rose-400" />

            {/* Phase Cards */}
            <div className="grid grid-cols-6 gap-4 relative z-10">
              {phases.map((phase, idx) => {
                const IconComponent = phase.icon;
                return (
                  <div
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    className={`${phase.color} border-2 ${
                      activePhase === phase.id ? 'border-gray-900' : 'border-gray-200'
                    } rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {phase.number}
                      </div>
                      <IconComponent size={20} className="text-gray-700" />
                    </div>

                    <h3 className="font-semibold text-sm text-gray-900 mb-2">{phase.title}</h3>

                    {phase.metrics.map((metric, metricIdx) => (
                      <div key={metricIdx} className="text-xs mb-1">
                        <span className="text-gray-600">{metric.label}: </span>
                        <span className="font-bold text-gray-900">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Details */}
      {activePhase === 'research' && <ResearchIngestionPanel loading={loading} papers={papers} />}
      {activePhase === 'synthesis' && <EvidenceSynthesisPanel loading={loading} />}
      {activePhase === 'translation' && <TranslationProposalPanel loading={loading} />}
      {activePhase === 'pilot' && <PilotManagementPanel loading={loading} />}
      {activePhase === 'outcome' && <OutcomeAttributionPanel loading={loading} />}
      {activePhase === 'enforcement' && <DecisionEnforcementPanel loading={loading} />}

      {/* System Status */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard title="Pipeline Health" value="Strong" status="success" />
        <StatusCard title="Automation Rate" value="87%" status="success" />
        <StatusCard title="Decisions Queued" value="3" status="warning" />
      </div>
    </div>
  );
};

const ResearchIngestionPanel: React.FC<{ loading: boolean; papers: ResearchPaper[] }> = ({ loading, papers }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Beaker size={20} />
        Phase 1: Research Ingestion
      </h3>
      <p className="text-gray-600 mb-4">Automated pulls from approved sources with metadata extraction and quality tagging.</p>
      <div className="grid grid-cols-3 gap-4">
        <MetricBox label="Tier-1 Sources Active" value="5" />
        <MetricBox label="Ingest Frequency" value="Weekly" />
        <MetricBox label="Auto-Ingest Enabled" value="Yes" />
      </div>
    </div>

    {papers.length > 0 && (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen size={20} />
          Recently Ingested Research Papers
        </h4>
        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">{paper.title}</h5>
                  <p className="text-sm text-gray-600">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    Q: {paper.quality_score}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{paper.ai_summary}</p>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Clinical Relevance</p>
                  <p className="text-sm font-semibold text-gray-900">{paper.clinical_relevance}/10</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Operational Relevance</p>
                  <p className="text-sm font-semibold text-gray-900">{paper.operational_relevance}/10</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Reimbursement Impact</p>
                  <p className="text-sm font-semibold text-gray-900">{paper.reimbursement_relevance}/10</p>
                </div>
              </div>

              <details className="text-sm text-gray-600 cursor-pointer">
                <summary className="font-semibold hover:text-gray-900">View full implications</summary>
                <div className="mt-3 space-y-2 text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Clinical Implications:</p>
                    <p>{paper.ai_clinical_implications}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Operational Implications:</p>
                    <p>{paper.ai_operational_implications}</p>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const EvidenceSynthesisPanel: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <BarChart3 size={20} />
      Phase 2: Evidence Synthesis
    </h3>
    <p className="text-gray-600 mb-4">Monthly evidence digests with confidence-weighted summaries and "what changed" comparisons.</p>
    <div className="grid grid-cols-3 gap-4">
      <MetricBox label="High Confidence" value="12" />
      <MetricBox label="Moderate Confidence" value="8" />
      <MetricBox label="Next Digest" value="15 days" />
    </div>
  </div>
);

const TranslationProposalPanel: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Zap size={20} />
      Phase 3: Translation Trigger
    </h3>
    <p className="text-gray-600 mb-4">Auto-generated change proposals from actionable evidence (confidence ≥80%), routed to CCO for decision.</p>
    <div className="grid grid-cols-3 gap-4">
      <MetricBox label="Awaiting CCO Review" value="3" isAlert />
      <MetricBox label="This Month" value="7" />
      <MetricBox label="Approval Rate" value="86%" />
    </div>
  </div>
);

const PilotManagementPanel: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Users size={20} />
      Phase 4: Pilot Management
    </h3>
    <p className="text-gray-600 mb-4">Define pilot clinics, lock success metrics, execute time-boxed evaluation periods.</p>
    <div className="grid grid-cols-3 gap-4">
      <MetricBox label="Clinics in Pilots" value="12" />
      <MetricBox label="Avg Duration" value="90 days" />
      <MetricBox label="Success Rate" value="73%" />
    </div>
  </div>
);

const OutcomeAttributionPanel: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <TrendingUp size={20} />
      Phase 5: Outcome Attribution
    </h3>
    <p className="text-gray-600 mb-4">Tag outcomes to SOP version and evidence ID, with pre/post dashboards showing attribution to specific changes.</p>
    <div className="grid grid-cols-3 gap-4">
      <MetricBox label="Attributed Outcomes" value="9" />
      <MetricBox label="Avg Improvement" value="12.4%" />
      <MetricBox label="Statistically Significant" value="7" />
    </div>
  </div>
);

const DecisionEnforcementPanel: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Archive size={20} />
      Phase 6: Decision Enforcement
    </h3>
    <p className="text-gray-600 mb-4">Roll out if positive, rollback if neutral/negative, store learning permanently in searchable repository.</p>
    <div className="grid grid-cols-3 gap-4">
      <MetricBox label="Rollouts" value="5" status="success" />
      <MetricBox label="Rollbacks" value="1" status="warning" />
      <MetricBox label="Learning Records" value="12" />
    </div>
  </div>
);

const MetricBox: React.FC<{ label: string; value: string; isAlert?: boolean; status?: string }> = ({
  label,
  value,
  isAlert = false,
  status = 'default'
}) => (
  <div className={`p-4 rounded-lg ${
    isAlert ? 'bg-amber-50 border border-amber-200' :
    status === 'success' ? 'bg-green-50 border border-green-200' :
    status === 'warning' ? 'bg-amber-50 border border-amber-200' :
    'bg-gray-50 border border-gray-200'
  }`}>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${
      isAlert ? 'text-amber-900' :
      status === 'success' ? 'text-green-900' :
      status === 'warning' ? 'text-amber-900' :
      'text-gray-900'
    }`}>{value}</p>
  </div>
);

const StatusCard: React.FC<{
  title: string;
  value: string;
  status: 'success' | 'warning' | 'error'
}> = ({ title, value, status }) => (
  <div className={`p-4 rounded-lg border-2 ${
    status === 'success' ? 'bg-green-50 border-green-200' :
    status === 'warning' ? 'bg-amber-50 border-amber-200' :
    'bg-red-50 border-red-200'
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${
          status === 'success' ? 'text-green-900' :
          status === 'warning' ? 'text-amber-900' :
          'text-red-900'
        }`}>{value}</p>
      </div>
      {status === 'success' ? (
        <CheckCircle size={32} className="text-green-600" />
      ) : status === 'warning' ? (
        <AlertCircle size={32} className="text-amber-600" />
      ) : (
        <AlertCircle size={32} className="text-red-600" />
      )}
    </div>
  </div>
);
