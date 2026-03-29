import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, FileText, History, Save, Trash2, Pen, Loader as Loader2 } from 'lucide-react';

import { EncounterHeader } from '../components/EncounterHeader';
import { StructuredNoteEditor } from '../components/StructuredNoteEditor';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { RiskCompletenessPanel } from '../components/RiskCompletenessPanel';
import { SignNoteModal } from '../components/SignNoteModal';
import { AddendumModal } from '../components/AddendumModal';

import { useAuth } from '../../../contexts/AuthContext';
import { useEncounter } from '../hooks/useEncounter';
import { useSaveDraftNote } from '../hooks/useSaveDraftNote';
import { useValidateDraftNote } from '../hooks/useValidateDraftNote';
import { useSignDraftNote } from '../hooks/useSignDraftNote';
import { noteService } from '../services';
import type {
  NoteType,
  EncounterType,
  EncounterModality,
  RiskScore,
  NoteDraft,
  SaveDraftNoteVersionInput,
} from '../types';

// Map UI note types to DB note_type values
const NOTE_TYPE_MAP: Record<string, string> = {
  initial: 'initial',
  followup: 'followup',
  progress: 'progress',
  discharge: 'discharge',
  wcb_report: 'assessment',
  insurer_update: 'assessment',
};

type CaptureStatus = 'not_started' | 'recording' | 'paused' | 'stopped';

interface BlockingIssue {
  id: string;
  description: string;
  category: string;
}

interface WarningIssue {
  id: string;
  description: string;
  category: string;
}

interface SectionStatus {
  key: string;
  label: string;
  isComplete: boolean;
}

interface EncounterWorkspacePageProps {
  encounterId?: string;
  patientId?: string;
  initialEncounterType?: EncounterType;
  initialModality?: EncounterModality;
  initialPatientName?: string;
  initialClinicName?: string;
  currentUserId?: string;
}

export function EncounterWorkspacePage({
  encounterId,
  patientId,
  initialEncounterType,
  initialModality,
  initialPatientName,
  initialClinicName,
}: EncounterWorkspacePageProps) {
  // --- Auth context: real user ---
  const { user } = useAuth();
  const realUserId = user?.id || 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9'; // fallback only for dev

  // --- Core IDs (fallback to test data in dev) ---
  const realEncounterId = encounterId || '00000000-4444-0000-0000-000000000001';
  const realPatientId = patientId || '00000000-2222-0000-0000-000000000001';
  const realClinicId = '00000000-1111-0000-0000-000000000001';
  const realCaseId = '00000000-3333-0000-0000-000000000001';

  // --- Data hooks ---
  const { data: encounter, isLoading: encLoading } = useEncounter(realEncounterId);
  const saveDraft = useSaveDraftNote();
  const validate = useValidateDraftNote();
  const signNote = useSignDraftNote();

  // --- Local state ---
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('not_started');
  const [noteType, setNoteType] = useState<NoteType>('followup');
  const [completenessScore, setCompletenessScore] = useState(0);
  const [riskScore, setRiskScore] = useState<RiskScore>('medium');
  const [isSignable, setIsSignable] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Current draft reference (set on creation/load)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // SOAP section state
  const [sections, setSections] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    treatment: '',
    response: '',
    plan: '',
    followUp: '',
  });

  // Blocking / warning issues
  const [blockingIssues, setBlockingIssues] = useState<BlockingIssue[]>([]);
  const [warningIssues, setWarningIssues] = useState<WarningIssue[]>([]);

  const [sectionStatuses, setSectionStatuses] = useState<SectionStatus[]>([
    { key: 'subjective', label: 'Subjective', isComplete: false },
    { key: 'objective', label: 'Objective', isComplete: false },
    { key: 'assessment', label: 'Assessment', isComplete: false },
    { key: 'treatment', label: 'Treatment', isComplete: false },
    { key: 'response', label: 'Response', isComplete: false },
    { key: 'plan', label: 'Plan', isComplete: false },
    { key: 'followup', label: 'Follow-up', isComplete: false },
  ]);

  // --- Load existing draft for this encounter on mount ---
  useEffect(() => {
    if (!realEncounterId) return;
    (async () => {
      try {
        const result = await noteService.listPatientDraftNotes(realPatientId, { limit: 10 });
        const existing = result.data.find(
          (d: NoteDraft) => d.encounter_id === realEncounterId && d.status === 'draft'
        );
        if (existing) {
          setCurrentDraftId(existing.id);
          const sp = existing.structured_payload as Record<string, string | null> || {};
          setSections({
            subjective: sp.subjective_section || '',
            objective: sp.objective_section || '',
            assessment: sp.assessment_section || '',
            treatment: sp.treatment_section || '',
            response: sp.response_section || '',
            plan: sp.plan_section || '',
            followUp: sp.follow_up_section || '',
          });
          setNoteType((existing.note_type as NoteType) || 'followup');
        }
      } catch (err) {
        console.error('Failed to load existing draft:', err);
      }
    })();
  }, [realEncounterId, realPatientId]);

  // --- Recompute completeness when sections change ---
  const recomputeCompleteness = useCallback(() => {
    const filled = Object.values(sections).filter(v => v.trim().length > 20).length;
    const score = Math.round((filled / 7) * 100);
    setCompletenessScore(score);

    setSectionStatuses(prev =>
      prev.map(s => ({ ...s, isComplete: sections[s.key as keyof typeof sections]?.trim().length > 20 }))
    );

    const hasBlocking = sections.assessment.trim().length < 20 || sections.plan.trim().length < 20;
    setIsSignable(score >= 60 && !hasBlocking);

    if (score < 40) setRiskScore('high');
    else if (score < 70) setRiskScore('medium');
    else setRiskScore('low');

    setBlockingIssues(
      sections.assessment.trim().length < 20
        ? [{ id: '1', description: 'Assessment section is required', category: 'Completeness' }]
        : sections.plan.trim().length < 20
        ? [{ id: '2', description: 'Plan section is required', category: 'Completeness' }]
        : []
    );

    setWarningIssues(
      sections.subjective.trim().length < 20
        ? [{ id: '1', description: 'Subjective section could use more detail', category: 'Quality' }]
        : []
    );
  }, [sections]);

  useEffect(() => {
    recomputeCompleteness();
  }, [recomputeCompleteness]);

  // --- Handlers ---
  const handleStartCapture = () => setCaptureStatus('recording');
  const handlePauseCapture = () => setCaptureStatus('paused');
  const handleStopCapture = () => setCaptureStatus('stopped');

  const handleSectionEdit = (sectionKey: string, content: string) => {
    setSections(prev => ({ ...prev, [sectionKey]: content }));
  };

  const handleSave = async () => {
    if (!realPatientId || !realClinicId) return;
    setIsSaving(true);
    try {
      const dbNoteType = NOTE_TYPE_MAP[noteType] || 'progress';

      if (currentDraftId) {
        // Save version snapshot
        const structured_payload = {
          subjective_section: sections.subjective,
          objective_section: sections.objective,
          assessment_section: sections.assessment,
          treatment_section: sections.treatment,
          response_section: sections.response,
          plan_section: sections.plan,
          follow_up_section: sections.followUp,
        };
        const versionInput: SaveDraftNoteVersionInput = {
          note_draft_id: currentDraftId,
          version_number: 0,
          structured_payload,
          created_by_user_id: realUserId,
        };
        await saveDraft.mutateAsync(versionInput);
      } else {
        // Create new draft
        const result = await saveDraft.mutateAsync({
          encounter_id: realEncounterId,
          patient_id: realPatientId,
          case_id: realCaseId,
          clinic_id: realClinicId,
          author_user_id: realUserId,
          note_type: dbNoteType,
          structured_payload: {
            subjective_section: sections.subjective,
            objective_section: sections.objective,
            assessment_section: sections.assessment,
            treatment_section: sections.treatment,
            response_section: sections.response,
            plan_section: sections.plan,
            follow_up_section: sections.followUp,
          },
        });
        // @ts-ignore – result.id
        if (result?.id) setCurrentDraftId(result.id);
      }
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save trigger (auto-save disabled by default)
  const handleValidate = async () => {
    // Always save first if no draft exists
    if (!currentDraftId) {
      await handleSave();
    }
    if (!currentDraftId) return;

    try {
      const result = await validate.mutateAsync({ noteDraftId: currentDraftId });
      setBlockingIssues(result.errors.map((e, i) => ({ id: String(i), description: e, category: 'Validation' })));
      setWarningIssues([]);
      if (result.valid) setIsSignable(true);
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  const handleSign = async () => {
    if (!currentDraftId || !realUserId) return;
    try {
      const signedNote = await signNote.mutateAsync({
        noteDraftId: currentDraftId,
        signedByUserId: realUserId,
      });
      // Redirect to signed record page
      // @ts-ignore
      window.location.href = `/clinical-documentation/signed/${signedNote.id}`;
    } catch (err) {
      console.error('Sign failed:', err);
    }
  };

  const effectiveEncounterType = (encounter?.encounter_type as EncounterType) || initialEncounterType || 'followup';
  const effectiveModality = (encounter?.modality as EncounterModality) || initialModality || 'in_person';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Patient</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <History className="w-4 h-4" />
              <span className="text-sm">Prior Notes</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
              <span className="text-sm">View Signed Record</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="text-xs text-slate-500">
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            <span className="text-sm text-slate-400">Auto-save</span>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSaveEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Loading state */}
      {encLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-400">Loading encounter...</span>
        </div>
      )}

      {/* Main Content */}
      {!encLoading && (
        <main className="p-6 pb-24">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-3">
              <div className="sticky top-6">
                <EncounterHeader
                  encounterId={realEncounterId}
                  patientId={realPatientId}
                  patientName={initialPatientName || 'TEST Patient'}
                  encounterType={effectiveEncounterType}
                  modality={effectiveModality}
                  captureStatus={captureStatus}
                  clinicName={initialClinicName || 'TEST - AIMOS Staging Clinic'}
                  scheduledStart={encounter?.scheduled_start || new Date().toISOString()}
                  onStartCapture={handleStartCapture}
                  onPauseCapture={handlePauseCapture}
                  onStopCapture={handleStopCapture}
                />
              </div>
            </div>

            {/* Center Column */}
            <div className="col-span-12 lg:col-span-6">
              <StructuredNoteEditor
                noteType={noteType}
                isEditable={true}
                onSectionEdit={handleSectionEdit}
                sections={sections}
              />
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <TranscriptPanel
                encounterId={realEncounterId}
                captureStatus={captureStatus}
                transcriptSegments={[]}
                isLoading={false}
              />
              <RiskCompletenessPanel
                completenessScore={completenessScore}
                riskScore={riskScore}
                blockingIssues={blockingIssues}
                warningIssues={warningIssues}
                sectionStatuses={sectionStatuses}
                isSignable={isSignable}
                onValidate={handleValidate}
                isValidating={validate.isPending}
              />
            </div>
          </div>
        </main>
      )}

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || saveDraft.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {isSaving || saveDraft.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors">
              <Trash2 className="w-4 h-4" />
              Discard Draft
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddendumModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
            >
              <Pen className="w-4 h-4" />
              Add Addendum
            </button>
            <button
              onClick={() => setShowSignModal(true)}
              disabled={!isSignable || signNote.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {signNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <FileText className="w-4 h-4" />
              Review & Sign
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSignModal && (
        <SignNoteModal
          onClose={() => setShowSignModal(false)}
          onSign={handleSign}
          isSigning={signNote.isPending}
          noteType={noteType}
          patientId={realPatientId}
        />
      )}
      {showAddendumModal && (
        <AddendumModal
          onClose={() => setShowAddendumModal(false)}
          onAdd={async () => setShowAddendumModal(false)}
        />
      )}
    </div>
  );
}