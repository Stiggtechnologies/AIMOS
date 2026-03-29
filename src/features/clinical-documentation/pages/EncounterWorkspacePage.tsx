import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  History,
  Save,
  Trash2,
  RefreshCw,
  Pen,
  ExternalLink,
} from 'lucide-react';

import { EncounterHeader } from './components/EncounterHeader';
import { StructuredNoteEditor } from './components/StructuredNoteEditor';
import { TranscriptPanel } from './components/TranscriptPanel';
import { RiskCompletenessPanel } from './components/RiskCompletenessPanel';
import { SignNoteModal } from './components/SignNoteModal';
import { AddendumModal } from './components/AddendumModal';

type CaptureStatus = 'not_started' | 'recording' | 'paused' | 'stopped';
type NoteType = 'initial' | 'followup' | 'progress' | 'discharge' | 'wcb_report' | 'insurer_update';
type EncounterType = 'initial' | 'followup' | 'reassessment' | 'discharge';
type EncounterModality = 'in_person' | 'virtual' | 'phone';
type RiskScore = 'low' | 'medium' | 'high';

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

interface TranscriptSegment {
  id: string;
  speakerLabel: 'clinician' | 'patient' | 'unknown';
  speakerName?: string;
  text: string;
  startMs: number;
  endMs: number;
}

interface EncounterWorkspacePageProps {
  encounterId?: string;
  patientId?: string;
  initialEncounterType?: EncounterType;
  initialModality?: EncounterModality;
  initialPatientName?: string;
  initialClinicName?: string;
}

export function EncounterWorkspacePage({
  encounterId = 'enc-00000000-0000-0000-0000-000000000000',
  patientId = 'pat-00000000-0000-0000-0000-000000000000',
  initialEncounterType = 'followup',
  initialModality = 'in_person',
  initialPatientName = 'John Doe',
  initialClinicName = 'Alberta Injury Management',
}: EncounterWorkspacePageProps) {
  // State
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('not_started');
  const [noteType, setNoteType] = useState<NoteType>('followup');
  const [completenessScore, setCompletenessScore] = useState(45);
  const [riskScore, setRiskScore] = useState<RiskScore>('medium');
  const [isSignable, setIsSignable] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showAddendumModal, setShowAddendumModal] = useState(false);

  // Mock data
  const blockingIssues: BlockingIssue[] = [
    { id: '1', description: 'Missing treatment intervention details', category: 'Completeness' },
    { id: '2', description: 'No follow-up plan specified', category: 'Completeness' },
  ];

  const warningIssues: WarningIssue[] = [
    { id: '1', description: 'Subjective section could use more detail', category: 'Quality' },
  ];

  const sectionStatuses: SectionStatus[] = [
    { key: 'subjective', label: 'Subjective', isComplete: true },
    { key: 'objective', label: 'Objective', isComplete: true },
    { key: 'assessment', label: 'Assessment', isComplete: false },
    { key: 'treatment', label: 'Treatment', isComplete: false },
    { key: 'response', label: 'Response', isComplete: true },
    { key: 'plan', label: 'Plan', isComplete: false },
    { key: 'followup', label: 'Follow-up', isComplete: false },
  ];

  const transcriptSegments: TranscriptSegment[] = [
    {
      id: '1',
      speakerLabel: 'clinician',
      speakerName: 'Dr. Smith',
      text: 'Good morning, how are you feeling today?',
      startMs: 0,
      endMs: 4000,
    },
    {
      id: '2',
      speakerLabel: 'patient',
      text: 'Hi doctor, my back has been getting better but I still have some pain when I twist.',
      startMs: 4500,
      endMs: 12000,
    },
    {
      id: '3',
      speakerLabel: 'clinician',
      speakerName: 'Dr. Smith',
      text: 'I see. Can you rate the pain on a scale of 1 to 10?',
      startMs: 12500,
      endMs: 16000,
    },
  ];

  // Handlers
  const handleStartCapture = () => setCaptureStatus('recording');
  const handlePauseCapture = () => setCaptureStatus('paused');
  const handleStopCapture = () => setCaptureStatus('stopped');
  
  const handleValidate = () => {
    // Mock validation - update scores
    setCompletenessScore(75);
    setRiskScore('low');
    setIsSignable(true);
  };

  const handleSign = () => {
    console.log('Signing note...');
    setShowSignModal(false);
  };

  const handleAddendum = () => {
    setShowAddendumModal(false);
  };

  const handleSectionEdit = (section: string, content: string) => {
    // Update completeness based on content
    if (content.length > 50) {
      const updated = [...sectionStatuses];
      const idx = updated.findIndex(s => s.key === section);
      if (idx >= 0 && !updated[idx].isComplete) {
        updated[idx].isComplete = true;
      }
      const completeCount = updated.filter(s => s.isComplete).length;
      setCompletenessScore(Math.round((completeCount / updated.length) * 100));
      setIsSignable(completenessScore >= 70 && blockingIssues.length === 0);
    }
  };

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

      {/* Main Content - 3 Column Layout */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Encounter Header (3 cols) */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6">
              <EncounterHeader
                encounterId={encounterId}
                patientId={patientId}
                patientName={initialPatientName}
                encounterType={initialEncounterType}
                modality={initialModality}
                captureStatus={captureStatus}
                clinicName={initialClinicName}
                scheduledStart={new Date().toISOString()}
                onStartCapture={handleStartCapture}
                onPauseCapture={handlePauseCapture}
                onStopCapture={handleStopCapture}
              />
            </div>
          </div>

          {/* Center Column - Note Editor (6 cols) */}
          <div className="col-span-12 lg:col-span-6">
            <StructuredNoteEditor
              noteType={noteType}
              isEditable={true}
              onSectionEdit={handleSectionEdit}
            />
          </div>

          {/* Right Column - Transcript + Risk/Completeness (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Transcript Panel */}
            <TranscriptPanel
              encounterId={encounterId}
              captureStatus={captureStatus}
              transcriptSegments={transcriptSegments}
              isLoading={false}
            />

            {/* Risk/Completeness Panel */}
            <RiskCompletenessPanel
              completenessScore={completenessScore}
              riskScore={riskScore}
              blockingIssues={blockingIssues}
              warningIssues={warningIssues}
              sectionStatuses={sectionStatuses}
              isSignable={isSignable}
              onValidate={handleValidate}
            />
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors">
              <Trash2 className="w-4 h-4" />
              Discard Draft
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            {autoSaveEnabled && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Auto-save enabled
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddendumModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Add Addendum
            </button>
            <button
              onClick={() => setShowSignModal(true)}
              disabled={!isSignable}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all
                ${isSignable
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
              <Pen className="w-4 h-4" />
              Review & Sign
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SignNoteModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSign={handleSign}
        noteType={noteType}
        patientName={initialPatientName}
        signingUserName="Dr. Smith"
        isLoading={false}
      />

      <AddendumModal
        isOpen={showAddendumModal}
        onClose={() => setShowAddendumModal(false)}
        onSubmit={handleAddendum}
        signedNoteId="note-123"
        signedNoteType="Follow-up Note"
        patientName={initialPatientName}
      />

      {/* Spacer for fixed footer */}
      <div className="h-24" />
    </div>
  );
}

export default EncounterWorkspacePage;
