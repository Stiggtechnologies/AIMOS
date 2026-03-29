import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  History,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  ChevronRight,
  Loader2,
  Pen,
  Check,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { VersionHistoryDrawer } from '../components/VersionHistoryDrawer';
import { EvidenceComparisonPanel } from '../components/EvidenceComparisonPanel';
import { SectionCompletenessCheck } from '../components/SectionCompletenessCheck';
import { SignNoteModal } from '../components/SignNoteModal';

type NoteType = 'initial' | 'followup' | 'progress' | 'discharge' | 'wcb_report' | 'insurer_update';
type DraftStatus = 'draft' | 'reviewed' | 'ready_for_sign';

interface NoteParagraph {
  id: string;
  section: string;
  content: string;
  source: 'transcript' | 'prior_note' | 'intake' | 'ai' | 'clinician' | 'none';
  confidence?: number;
  evidenceSnippet?: string;
  speaker?: string;
  timestamp?: string;
  status: 'accepted' | 'edited' | 'rejected' | 'pending';
}

interface NoteSection {
  key: string;
  label: string;
  paragraphs: NoteParagraph[];
  isComplete: boolean;
}

interface Version {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  changeSummary: string;
  isCurrent: boolean;
}

interface BlockingIssue {
  id: string;
  description: string;
  category: string;
  suggestion?: string;
}

interface WarningIssue {
  id: string;
  description: string;
  category: string;
  suggestion?: string;
}

interface SectionCompleteness {
  key: string;
  label: string;
  isComplete: boolean;
  missingItems: string[];
  riskItems: string[];
}

// --- Stub Data ---
const STUB_PATIENT_NAME = 'Sarah Mitchell';
const STUB_DRAFT_STATUS: DraftStatus = 'ready_for_sign';
const STUB_NOTE_TYPE: NoteType = 'followup';
const STUB_VERSION_NUMBER = 3;

const STUB_PARAGRAPHS: NoteParagraph[] = [
  {
    id: 'p1',
    section: 'subjective',
    content: 'Patient reports significant reduction in lower back pain since last visit. Pain score decreased from 7/10 to 3/10 with current treatment plan.',
    source: 'transcript',
    confidence: 0.97,
    evidenceSnippet: 'So since the last time we met, I would say the pain has gotten much better. I think it was around a 7 before and now it is maybe a 3.',
    speaker: 'Patient',
    timestamp: '02:14',
    status: 'accepted',
  },
  {
    id: 'p2',
    section: 'subjective',
    content: 'Patient reports improved sleep quality and reduced reliance on pain medication. No new injuries or functional limitations reported.',
    source: 'ai',
    confidence: 0.89,
    status: 'pending',
  },
  {
    id: 'p3',
    section: 'subjective',
    content: 'Patient is compliant with prescribed home exercise program, performing exercises 5 days per week.',
    source: 'transcript',
    confidence: 0.95,
    evidenceSnippet: 'I have been doing my exercises almost every day. I think I missed maybe one or two days in the whole week.',
    speaker: 'Patient',
    timestamp: '04:32',
    status: 'accepted',
  },
  {
    id: 'p4',
    section: 'objective',
    content: 'Lumbar spine range of motion improved: flexion increased from 40° to 65°, extension from 15° to 22°. No neural tension signs present.',
    source: 'clinician',
    status: 'accepted',
  },
  {
    id: 'p5',
    section: 'objective',
    content: 'Core strength assessment: MMT 4+/5 for transverse abdominis activation, patient able to maintain neutral spine during functional movements.',
    source: 'ai',
    confidence: 0.91,
    status: 'pending',
  },
  {
    id: 'p6',
    section: 'assessment',
    content: 'Patient demonstrating excellent progress toward treatment goals. Current phase: strengthening and functional restoration.',
    source: 'clinician',
    status: 'accepted',
  },
  {
    id: 'p7',
    section: 'treatment',
    content: 'Continued PT 2x/week for 6 weeks with focus on progressive core stabilization, gait training, and work simulation as appropriate.',
    source: 'ai',
    confidence: 0.94,
    status: 'pending',
  },
  {
    id: 'p8',
    section: 'response',
    content: 'Positive response to manual therapy and supervised exercise. Patient tolerating treatment well with no adverse reactions.',
    source: 'clinician',
    status: 'accepted',
  },
  {
    id: 'p9',
    section: 'plan',
    content: 'Continue current plan with progression to sports-specific exercises at Week 4. Reassess outcome measures at 6-week mark.',
    source: 'clinician',
    status: 'accepted',
  },
  {
    id: 'p10',
    section: 'followup',
    content: 'Follow-up scheduled in 2 weeks to monitor progress. Patient educated on warning signs requiring immediate attention (increased pain, neurological symptoms).',
    source: 'prior_note',
    status: 'accepted',
  },
];

const STUB_SECTIONS: NoteSection[] = [
  { key: 'subjective', label: 'Subjective', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'subjective'), isComplete: true },
  { key: 'objective', label: 'Objective', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'objective'), isComplete: true },
  { key: 'assessment', label: 'Assessment', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'assessment'), isComplete: true },
  { key: 'treatment', label: 'Treatment', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'treatment'), isComplete: true },
  { key: 'response', label: 'Response', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'response'), isComplete: true },
  { key: 'plan', label: 'Plan', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'plan'), isComplete: true },
  { key: 'followup', label: 'Follow-up', paragraphs: STUB_PARAGRAPHS.filter(p => p.section === 'followup'), isComplete: true },
];

const STUB_COMPLETENESS: SectionCompleteness[] = [
  { key: 'subjective', label: 'Subjective', isComplete: true, missingItems: [], riskItems: [] },
  { key: 'objective', label: 'Objective', isComplete: true, missingItems: [], riskItems: [] },
  { key: 'assessment', label: 'Assessment', isComplete: true, missingItems: [], riskItems: [] },
  { key: 'treatment', label: 'Treatment', isComplete: true, missingItems: [], riskItems: [] },
  { key: 'response', label: 'Response', isComplete: true, missingItems: [], riskItems: [] },
  { key: 'plan', label: 'Plan', isComplete: false, missingItems: ['Duration/frequency specified'], riskItems: [] },
  { key: 'followup', label: 'Follow-up', isComplete: true, missingItems: [], riskItems: [] },
];

const STUB_BLOCKING: BlockingIssue[] = [
  { id: 'b1', description: 'Treatment plan missing duration and frequency specifics', category: 'Completeness', suggestion: 'Add "2x/week for 6 weeks" to treatment section' },
];

const STUB_WARNINGS: WarningIssue[] = [
  { id: 'w1', description: 'Pain score change not documented with specific measurement tool used', category: 'Documentation', suggestion: 'Specify if NPRS, VAS, or other scale used' },
  { id: 'w2', description: 'Medication use mentioned but not verified against pharmacy data', category: 'Verification', suggestion: 'Cross-reference with pharmacy records' },
];

const STUB_VERSIONS: Version[] = [
  { id: 'v1', version: 1, timestamp: '2026-03-28T14:22:00Z', author: 'Dr. James Chen', changeSummary: 'Initial draft generated by AI from transcript', isCurrent: false },
  { id: 'v2', version: 2, timestamp: '2026-03-28T15:45:00Z', author: 'Dr. James Chen', changeSummary: 'Accepted all transcript-sourced paragraphs, minor edits to assessment', isCurrent: false },
  { id: 'v3', version: 3, timestamp: '2026-03-29T08:10:00Z', author: 'Dr. James Chen', changeSummary: 'Added response section and follow-up plan', isCurrent: true },
];

const STUB_TRANSCRIPT_SEGMENTS = [
  { id: 'ts1', speaker: 'Patient', text: 'So since the last time we met, I would say the pain has gotten much better. I think it was around a 7 before and now it is maybe a 3.', startMs: 134000, endMs: 142000 },
  { id: 'ts2', speaker: 'Clinician', text: 'That is great progress. How about your sleep? Has the pain been affecting your rest at night?', startMs: 144000, endMs: 149000 },
  { id: 'ts3', speaker: 'Patient', text: 'I have been doing my exercises almost every day. I think I missed maybe one or two days in the whole week.', startMs: 272000, endMs: 278000 },
];

// --- Component ---
export function DraftReviewPage() {
  const [paragraphs, setParagraphs] = useState<NoteParagraph[]>(STUB_PARAGRAPHS);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleParagraphAction = (id: string, action: 'accept' | 'edit' | 'reject') => {
    setHasChanges(true);
    setParagraphs(prev => prev.map(p => {
      if (p.id !== id) return p;
      const statusMap: Record<string, NoteParagraph['status']> = {
        accept: 'accepted',
        edit: 'edited',
        reject: 'rejected',
      };
      return { ...p, status: statusMap[action] };
    }));
  };

  const handleRejectAllAI = () => {
    setHasChanges(true);
    setParagraphs(prev => prev.map(p => {
      if (p.source === 'ai') return { ...p, status: 'rejected' as const };
      return p;
    }));
  };

  const handleSaveDraft = () => {
    // Stub: would save via service
    setHasChanges(false);
  };

  const handleSign = () => {
    setShowSignModal(false);
    // Stub: would submit signed note
  };

  const handleDiscard = () => {
    // Stub: would discard and navigate back
    setShowDiscardConfirm(false);
  };

  const sections = [...new Set(paragraphs.map(p => p.section))];

  const statusConfig: Record<DraftStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Draft', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30', icon: <FileText className="w-3.5 h-3.5" /> },
    reviewed: { label: 'Reviewed', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    ready_for_sign: { label: 'Ready to Sign', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };

  const noteTypeLabels: Record<NoteType, string> = {
    initial: 'Initial Assessment',
    followup: 'Follow-up',
    progress: 'Progress Report',
    discharge: 'Discharge Summary',
    wcb_report: 'WCB Report',
    insurer_update: 'Insurer Update',
  };

  const sourceColors: Record<string, string> = {
    transcript: 'border-l-blue-500 bg-blue-500/5',
    prior_note: 'border-l-slate-500 bg-slate-500/5',
    intake: 'border-l-emerald-500 bg-emerald-500/5',
    ai: 'border-l-purple-500 bg-purple-500/5',
    clinician: 'border-l-amber-500 bg-amber-500/5',
    none: 'border-l-slate-600 bg-slate-600/5',
  };

  const sourceChipColors: Record<string, string> = {
    transcript: 'bg-blue-500/20 text-blue-400',
    prior_note: 'bg-slate-500/20 text-slate-400',
    intake: 'bg-emerald-500/20 text-emerald-400',
    ai: 'bg-purple-500/20 text-purple-400',
    clinician: 'bg-amber-500/20 text-amber-400',
    none: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Encounter</span>
          </button>
          <div className="w-px h-6 bg-slate-700" />
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">Review & Sign</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${noteTypeLabels[STUB_NOTE_TYPE] ? sourceChipColors.intake : ''}`}>
              {noteTypeLabels[STUB_NOTE_TYPE]}
            </span>
            <span className="text-slate-500 text-sm">|</span>
            <span className="text-slate-300 text-sm font-medium">{STUB_PATIENT_NAME}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig[STUB_DRAFT_STATUS].color}`}>
            {statusConfig[STUB_DRAFT_STATUS].icon}
            {statusConfig[STUB_DRAFT_STATUS].label}
          </div>
          <div className="text-slate-400 text-xs border border-slate-700 rounded px-2 py-1">
            v{STUB_VERSION_NUMBER}
          </div>
          <button
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors text-xs px-3 py-1.5 border border-slate-700 rounded hover:border-slate-600"
          >
            <History className="w-3.5 h-3.5" />
            View Version History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Structured Note */}
        <div className="flex-1 overflow-y-auto border-r border-slate-800 p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Final Draft — Structured Note
            </h2>

            {STUB_SECTIONS.map(section => (
              <div key={section.key} className="mb-8">
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{section.label}</h3>
                    {section.isComplete ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <button
                    onClick={() => {}}
                    className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>

                {/* Paragraphs */}
                <div className="space-y-3">
                  {section.paragraphs.map(para => (
                    <div
                      key={para.id}
                      className={`rounded-r-lg border-l-4 p-4 ${sourceColors[para.source]}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceChipColors[para.source]}`}>
                          {para.source.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          {para.confidence !== undefined && (
                            <span className="text-xs text-slate-500">
                              {Math.round(para.confidence * 100)}% confident
                            </span>
                          )}
                          {para.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleParagraphAction(para.id, 'accept')}
                                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="Accept"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleParagraphAction(para.id, 'edit')}
                                className="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                                title="Edit"
                              >
                                <Pen className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleParagraphAction(para.id, 'reject')}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {para.status === 'accepted' && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Accepted
                            </span>
                          )}
                          {para.status === 'edited' && (
                            <span className="text-xs text-blue-400 flex items-center gap-1">
                              <Pen className="w-3.5 h-3.5" /> Edited
                            </span>
                          )}
                          {para.status === 'rejected' && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed">{para.content}</p>
                      {para.evidenceSnippet && (
                        <p className="text-slate-500 text-xs mt-2 italic">
                          "{para.evidenceSnippet}" — {para.speaker} @ {para.timestamp}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Evidence + Risk/Completeness */}
        <div className="w-[420px] overflow-y-auto flex flex-col">
          {/* Evidence Comparison Panel */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              Evidence Comparison
            </h3>
            <EvidenceComparisonPanel
              noteSections={STUB_SECTIONS}
              transcriptSegments={STUB_TRANSCRIPT_SEGMENTS}
              priorNotes={[]}
              intakeData={[]}
              activeSection={activeSection}
              onToggleSection={(key) => setActiveSection(activeSection === key ? null : key)}
            />
          </div>

          {/* Risk & Completeness Panel */}
          <div className="p-4 flex-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Completeness & Risk
            </h3>

            {/* Section completeness */}
            <div className="space-y-2 mb-6">
              {STUB_COMPLETENESS.map(sec => (
                <SectionCompletenessCheck
                  key={sec.key}
                  section={sec.key}
                  label={sec.label}
                  isComplete={sec.isComplete}
                  missingItems={sec.missingItems}
                  riskItems={sec.riskItems}
                />
              ))}
            </div>

            {/* Blocking issues */}
            {STUB_BLOCKING.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Blocking Issues ({STUB_BLOCKING.length})
                </h4>
                <div className="space-y-2">
                  {STUB_BLOCKING.map(issue => (
                    <div key={issue.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-sm text-red-300 font-medium">{issue.description}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-slate-400 mt-1">💡 {issue.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {STUB_WARNINGS.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warnings ({STUB_WARNINGS.length})
                </h4>
                <div className="space-y-2">
                  {STUB_WARNINGS.map(warning => (
                    <div key={warning.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-sm text-amber-300">{warning.description}</p>
                      {warning.suggestion && (
                        <p className="text-xs text-slate-400 mt-1">💡 {warning.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign eligibility */}
            <div className={`rounded-lg border p-4 ${STUB_BLOCKING.length > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
              <div className="flex items-center gap-2">
                {STUB_BLOCKING.length > 0 ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300 font-medium">
                      {STUB_BLOCKING.length} blocking issue{STUB_BLOCKING.length > 1 ? 's' : ''} must be resolved
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">Ready to sign</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiscardConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Discard & Start Over
          </button>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
          )}
          <button
            onClick={handleRejectAllAI}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors text-sm"
          >
            <XCircle className="w-4 h-4" />
            Reject All AI Suggestions
          </button>
          <button
            onClick={() => setShowSignModal(true)}
            disabled={STUB_BLOCKING.length > 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Sign Note
          </button>
        </div>
      </div>

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        draftId="stub-draft-1"
        versions={STUB_VERSIONS}
      />

      {/* Sign Note Modal */}
      <SignNoteModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSign={handleSign}
        noteType={STUB_NOTE_TYPE}
        patientName={STUB_PATIENT_NAME}
      />

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-lg font-semibold text-white mb-2">Discard this draft?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently delete draft v{STUB_VERSION_NUMBER} and return you to the encounter workspace. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-sm transition-colors"
              >
                Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}