import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, FileText, History, Save, Trash2, TriangleAlert as AlertTriangle, Loader as Loader2, Mic, MicOff, Upload } from 'lucide-react';

import { EncounterHeader } from '../components/EncounterHeader';
import { StructuredNoteEditor } from '../components/StructuredNoteEditor';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { RiskCompletenessPanel } from '../components/RiskCompletenessPanel';
import { SignNoteModal } from '../components/SignNoteModal';

import { useAuth } from '../../../contexts/AuthContext';
import { useEncounter } from '../hooks/useEncounter';
import { useEncounterTranscript } from '../hooks/useEncounterTranscript';
import { useSaveDraftNote } from '../hooks/useSaveDraftNote';
import { useValidateDraftNote } from '../hooks/useValidateDraftNote';
import { useSignDraftNote } from '../hooks/useSignDraftNote';
import { noteService, encounterService } from '../services';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { documentationQueryKeys } from '../utils/queryKeys';
import type {
  NoteType,
  EncounterType,
  EncounterModality,
  RiskScore,
  NoteDraft,
  SaveDraftNoteVersionInput,
  TranscriptSegment,
} from '../types';

const NOTE_TYPE_MAP: Record<string, string> = {
  initial: 'initial',
  followup: 'progress',
  progress: 'progress',
  discharge: 'discharge',
  wcb_report: 'assessment',
  insurer_update: 'assessment',
  soap: 'soap',
  assessment: 'assessment',
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
  patientName?: string;
  clinicId?: string;
  caseId?: string;
  initialEncounterType?: EncounterType;
  initialModality?: EncounterModality;
  initialPatientName?: string;
  initialClinicName?: string;
  onNavigate?: (module: string, subModule: string) => void;
}

function useTranscriptSegments(transcriptId: string | null | undefined) {
  return useQuery({
    queryKey: documentationQueryKeys.transcripts.segments(transcriptId || ''),
    queryFn: () => encounterService.getTranscriptSegments(transcriptId!),
    enabled: !!transcriptId,
    refetchInterval: (query) => {
      return query.state.data && query.state.data.length > 0 ? false : 5000;
    },
  });
}

export function EncounterWorkspacePage({
  encounterId,
  patientId,
  patientName,
  clinicId,
  caseId,
  initialEncounterType,
  initialModality,
  initialPatientName,
  initialClinicName,
  onNavigate,
}: EncounterWorkspacePageProps) {
  const { user, profile } = useAuth();

  const userId = user?.id;
  const effectiveClinicId = clinicId || profile?.primary_clinic_id || null;
  const effectivePatientId = patientId || null;
  const effectiveCaseId = caseId || null;

  const [resolvedEncounterId, setResolvedEncounterId] = useState<string | null>(
    encounterId && encounterId !== 'new' ? encounterId : null
  );
  const [isCreatingEncounter, setIsCreatingEncounter] = useState(false);
  const [encounterCreateError, setEncounterCreateError] = useState<string | null>(null);

  const { data: encounter, isLoading: encLoading, error: encError } = useEncounter(resolvedEncounterId || '');

  const { data: transcript, isLoading: transcriptLoading } = useEncounterTranscript(resolvedEncounterId || '');
  const { data: transcriptSegments, isLoading: segmentsLoading } = useTranscriptSegments(transcript?.id);

  const saveDraft = useSaveDraftNote();
  const validate = useValidateDraftNote();
  const signNote = useSignDraftNote();

  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('not_started');
  const [noteType, setNoteType] = useState<NoteType>('followup');
  const [completenessScore, setCompletenessScore] = useState(0);
  const [riskScore, setRiskScore] = useState<RiskScore>('medium');
  const [isSignable, setIsSignable] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [sectionValues, setSectionValues] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    treatment: '',
    response: '',
    plan: '',
    followUp: '',
  });

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

  // Create encounter if encounterId is 'new'
  useEffect(() => {
    if (encounterId !== 'new') return;
    if (!userId || !effectivePatientId || !effectiveClinicId) return;
    if (resolvedEncounterId || isCreatingEncounter) return;

    setIsCreatingEncounter(true);
    setEncounterCreateError(null);

    encounterService.createEncounter({
      patientId: effectivePatientId,
      clinicId: effectiveClinicId,
      providerUserId: userId,
      encounterType: initialEncounterType || 'followup',
      modality: initialModality || 'in_person',
      caseId: effectiveCaseId || undefined,
      actualStart: new Date().toISOString(),
      ambientCaptureEnabled: false,
    }).then(enc => {
      setResolvedEncounterId(enc.id);
      setIsCreatingEncounter(false);
    }).catch(err => {
      setEncounterCreateError(err instanceof Error ? err.message : 'Failed to create encounter.');
      setIsCreatingEncounter(false);
    });
  }, [encounterId, userId, effectivePatientId, effectiveClinicId, resolvedEncounterId, isCreatingEncounter, initialEncounterType, initialModality, effectiveCaseId]);

  // Load existing draft for this encounter on mount
  useEffect(() => {
    if (!effectivePatientId) return;
    setDraftLoadError(null);

    (async () => {
      try {
        const result = await noteService.listPatientDraftNotes(effectivePatientId, { limit: 20 });
        const existing = resolvedEncounterId
          ? result.data.find((d: NoteDraft) => d.encounter_id === resolvedEncounterId && d.status === 'draft')
          : result.data.find((d: NoteDraft) => d.status === 'draft');

        if (existing) {
          setCurrentDraftId(existing.id);
          const sp = (existing.structured_payload as Record<string, string | null>) || {};
          setSectionValues({
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
        setDraftLoadError('Failed to load existing draft. Starting a new draft.');
        console.error('Failed to load existing draft:', err);
      }
    })();
  }, [resolvedEncounterId, effectivePatientId]);

  const recomputeCompleteness = useCallback(() => {
    const filled = Object.values(sectionValues).filter(v => v.trim().length > 20).length;
    const score = Math.round((filled / 7) * 100);
    setCompletenessScore(score);

    setSectionStatuses(prev =>
      prev.map(s => ({
        ...s,
        isComplete: (sectionValues[s.key as keyof typeof sectionValues] || sectionValues[s.key === 'followup' ? 'followUp' : s.key as keyof typeof sectionValues])?.trim().length > 20,
      }))
    );

    const hasAssessment = sectionValues.assessment.trim().length >= 20;
    const hasPlan = sectionValues.plan.trim().length >= 20;
    setIsSignable(score >= 60 && hasAssessment && hasPlan);

    if (score < 40) setRiskScore('high');
    else if (score < 70) setRiskScore('medium');
    else setRiskScore('low');

    const newBlocking: BlockingIssue[] = [];
    if (!hasAssessment) newBlocking.push({ id: '1', description: 'Assessment section is required', category: 'Completeness' });
    if (!hasPlan) newBlocking.push({ id: '2', description: 'Plan section is required', category: 'Completeness' });
    setBlockingIssues(newBlocking);

    setWarningIssues(
      sectionValues.subjective.trim().length < 20
        ? [{ id: '1', description: 'Subjective section could use more detail', category: 'Quality' }]
        : []
    );
  }, [sectionValues]);

  useEffect(() => {
    recomputeCompleteness();
  }, [recomputeCompleteness]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !currentDraftId) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 30000);
    return () => clearTimeout(timer);
  });

  const handleStartCapture = async () => {
    setAudioError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setAudioError('Recording error occurred. You can still chart manually.');
        setCaptureStatus('stopped');
      };

      recorder.start(1000);
      setCaptureStatus('recording');
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setAudioError('Microphone access denied. You can still chart manually.');
      } else {
        setAudioError('Unable to start recording. You can still chart manually.');
      }
    }
  };

  const handlePauseCapture = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setCaptureStatus('paused');
    }
  };

  const handleResumeCapture = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setCaptureStatus('recording');
    }
  };

  const handleStopCapture = async () => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      audioStreamRef.current?.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;

      if (audioChunksRef.current.length === 0) return;
      if (!userId || !resolvedEncounterId) return;

      setIsUploadingAudio(true);
      try {
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const storagePath = `encounter-audio/${resolvedEncounterId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('clinical-audio')
          .upload(storagePath, audioBlob, { contentType: mimeType, upsert: true });

        if (uploadError) {
          setAudioError(`Audio upload failed: ${uploadError.message}. Chart will not include audio.`);
        } else {
          await encounterService.uploadTranscript(resolvedEncounterId, storagePath, userId);
        }
      } catch (err) {
        setAudioError('Audio upload failed. Chart notes are preserved.');
        console.error('Audio upload error:', err);
      } finally {
        setIsUploadingAudio(false);
      }
    };

    if (recorder.state !== 'inactive') recorder.stop();
    setCaptureStatus('stopped');
  };

  const handleSectionEdit = (sectionKey: string, content: string) => {
    setSectionValues(prev => ({ ...prev, [sectionKey]: content }));
    if (saveError) setSaveError(null);
  };

  const handleSave = async () => {
    if (!effectivePatientId || !effectiveClinicId || !userId) {
      setSaveError('Cannot save: missing patient, clinic, or user context.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const dbNoteType = NOTE_TYPE_MAP[noteType] || 'progress';
      const structured_payload = {
        subjective_section: sectionValues.subjective,
        objective_section: sectionValues.objective,
        assessment_section: sectionValues.assessment,
        treatment_section: sectionValues.treatment,
        response_section: sectionValues.response,
        plan_section: sectionValues.plan,
        follow_up_section: sectionValues.followUp,
      };

      if (currentDraftId) {
        const versionInput: SaveDraftNoteVersionInput = {
          note_draft_id: currentDraftId,
          version_number: 0,
          structured_payload,
          created_by_user_id: userId,
        };
        await saveDraft.mutateAsync(versionInput);
      } else {
        const result = await saveDraft.mutateAsync({
          encounter_id: resolvedEncounterId,
          patient_id: effectivePatientId,
          case_id: effectiveCaseId,
          clinic_id: effectiveClinicId,
          author_user_id: userId,
          note_type: dbNoteType,
          structured_payload,
        });
        if (result && 'id' in result) setCurrentDraftId((result as { id: string }).id);
      }
      setLastSavedAt(new Date());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.');
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
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
    if (!currentDraftId || !userId) return;
    setSignError(null);
    try {
      const signedNote = await signNote.mutateAsync({
        noteDraftId: currentDraftId,
        signedByUserId: userId,
      });
      setShowSignModal(false);
      if (onNavigate) {
        onNavigate('clinical-documentation', `signed:${signedNote.id}`);
      }
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Signing failed. Please try again.');
      console.error('Sign failed:', err);
    }
  };

  const handleBackToPatient = () => {
    if (effectivePatientId && onNavigate) {
      onNavigate('clinical-documentation', `patient:${effectivePatientId}`);
    } else if (onNavigate) {
      onNavigate('clinical', 'patients');
    }
  };

  const handleViewDraft = () => {
    if (currentDraftId && onNavigate) {
      onNavigate('clinical-documentation', `draft:${currentDraftId}`);
    }
  };

  const handleApplyAIContent = (sectionKey: string, content: string) => {
    setSectionValues(prev => ({ ...prev, [sectionKey]: content }));
  };

  const effectiveEncounterType = (encounter?.encounter_type as EncounterType) || initialEncounterType || 'followup';
  const effectiveModality = (encounter?.modality as EncounterModality) || initialModality || 'in_person';
  const displayPatientName = patientName || initialPatientName || 'Patient';
  const displayClinicName = initialClinicName || profile?.primary_clinic_id || 'Clinic';

  const mappedTranscriptSegments: Array<{
    id: string;
    speakerLabel: 'clinician' | 'patient' | 'unknown';
    speakerName?: string;
    text: string;
    startMs: number;
    endMs: number;
  }> = (transcriptSegments || []).map((seg: TranscriptSegment) => ({
    id: seg.id,
    speakerLabel: (seg.speaker_label as 'clinician' | 'patient' | 'unknown') || 'unknown',
    speakerName: undefined,
    text: seg.text,
    startMs: seg.start_ms ?? 0,
    endMs: seg.end_ms ?? 0,
  }));

  const isTranscriptLoading = transcriptLoading || segmentsLoading;
  const transcriptStatus = transcript?.transcript_status;
  const isTranscriptProcessing = transcriptStatus === 'processing' || transcriptStatus === 'pending';

  // Guard: no user
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">Not authenticated</p>
        <p className="text-sm mt-2">Please sign in to access the encounter workspace.</p>
      </div>
    );
  }

  // Guard: no patient context
  if (!effectivePatientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">No patient selected</p>
        <p className="text-sm mt-2">Open this workspace from a patient encounter.</p>
        <button
          onClick={handleBackToPatient}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  // Guard: missing clinic context
  if (!effectiveClinicId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">No clinic context</p>
        <p className="text-sm mt-2">A clinic must be assigned to your account to chart notes.</p>
        <button onClick={handleBackToPatient} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToPatient}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Patient</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            {currentDraftId && (
              <button
                onClick={handleViewDraft}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="text-sm">Draft Review</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {draftLoadError && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {draftLoadError}
              </span>
            )}
            {audioError && (
              <span className="text-xs text-amber-400 flex items-center gap-1 max-w-xs truncate">
                <MicOff className="w-3 h-3 flex-shrink-0" />
                {audioError}
              </span>
            )}
            {isUploadingAudio && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Uploading audio...
              </span>
            )}
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

      {/* Creating encounter spinner */}
      {isCreatingEncounter && (
        <div className="flex items-center justify-center py-8 bg-slate-900/50 border-b border-slate-800">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-3" />
          <span className="text-slate-400 text-sm">Creating encounter record...</span>
        </div>
      )}

      {encounterCreateError && (
        <div className="mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">{encounterCreateError} You can still chart below — the note will be saved without an encounter reference.</p>
        </div>
      )}

      {/* Loading state */}
      {encLoading && resolvedEncounterId && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-400">Loading encounter...</span>
        </div>
      )}

      {/* Encounter error */}
      {!encLoading && encError && resolvedEncounterId && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Failed to load encounter details. You can still chart notes below.</p>
        </div>
      )}

      {/* Main Content */}
      {!encLoading && (
        <main className="p-6 pb-28">
          {saveError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{saveError}</span>
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-3">
              <div className="sticky top-6">
                <EncounterHeader
                  encounterId={resolvedEncounterId || 'new'}
                  patientId={effectivePatientId}
                  patientName={displayPatientName}
                  encounterType={effectiveEncounterType}
                  modality={effectiveModality}
                  captureStatus={captureStatus}
                  clinicName={displayClinicName}
                  scheduledStart={encounter?.scheduled_start || new Date().toISOString()}
                  onStartCapture={handleStartCapture}
                  onPauseCapture={captureStatus === 'paused' ? handleResumeCapture : handlePauseCapture}
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
                sectionValues={sectionValues}
                encounterId={resolvedEncounterId || undefined}
                patientId={effectivePatientId}
                clinicId={effectiveClinicId}
                onApplyAIContent={handleApplyAIContent}
                onValidate={handleValidate}
                isValidating={validate.isPending}
              />
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <TranscriptPanel
                encounterId={resolvedEncounterId || 'new'}
                captureStatus={captureStatus}
                transcriptSegments={mappedTranscriptSegments}
                isLoading={isTranscriptLoading || isTranscriptProcessing}
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
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || saveDraft.isPending || !effectivePatientId || !effectiveClinicId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              {isSaving || saveDraft.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => {
                setSectionValues({ subjective: '', objective: '', assessment: '', treatment: '', response: '', plan: '', followUp: '' });
                setCurrentDraftId(null);
                setSaveError(null);
              }}
              disabled={!currentDraftId && Object.values(sectionValues).every(v => !v.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-sm font-medium text-slate-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentDraftId && (
              <button
                onClick={handleViewDraft}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Review Draft
              </button>
            )}
            <button
              onClick={() => { setShowSignModal(true); setSignError(null); }}
              disabled={!isSignable || signNote.isPending || !currentDraftId}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {signNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Review & Sign
            </button>
          </div>
        </div>
      </footer>

      {/* Sign Modal */}
      {showSignModal && (
        <SignNoteModal
          isOpen={showSignModal}
          onClose={() => { setShowSignModal(false); setSignError(null); }}
          onSign={handleSign}
          isLoading={signNote.isPending}
          noteType={noteType}
          patientName={displayPatientName}
          signingUserName={profile?.display_name || user?.email || 'Clinician'}
          error={signError}
        />
      )}
    </div>
  );
}
