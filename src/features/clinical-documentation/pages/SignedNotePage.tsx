import { useState } from 'react';
import { ArrowLeft, Shield, FileText, TriangleAlert as AlertTriangle, Loader as Loader2, CircleCheck as CheckCircle, Clock, Plus, Hash, User, ChevronDown, ChevronUp } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useSignedNote } from '../hooks/useSignedNote';
import { useCreateAddendum } from '../hooks/useCreateAddendum';
import type { NoteAddendum, AddendumType, SignedNoteWithAddenda } from '../types';
import { noteService } from '../services';
import { useQuery } from '@tanstack/react-query';
import { documentationQueryKeys } from '../utils/queryKeys';

interface SignedNotePageProps {
  signedNoteId: string;
  onNavigate?: (module: string, subModule: string) => void;
}

function useSignedNoteWithAddenda(signedNoteId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.signed.withAddenda(signedNoteId),
    queryFn: () => noteService.getSignedNoteWithAddenda(signedNoteId),
    enabled: !!signedNoteId,
  });
}

const SECTION_LABELS: Record<string, string> = {
  subjective_section: 'Subjective',
  objective_section: 'Objective',
  assessment_section: 'Assessment',
  treatment_section: 'Treatment',
  response_section: 'Response',
  plan_section: 'Plan',
  follow_up_section: 'Follow-up',
};

const ADDENDUM_TYPE_LABELS: Record<AddendumType, string> = {
  correction: 'Correction',
  clarification: 'Clarification',
  addition: 'Addition',
  restatement: 'Restatement',
};

const ADDENDUM_TYPE_COLORS: Record<AddendumType, string> = {
  correction: 'text-red-400 bg-red-500/10 border-red-500/30',
  clarification: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  addition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  restatement: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export function SignedNotePage({ signedNoteId, onNavigate }: SignedNotePageProps) {
  const { user, profile } = useAuth();
  const { data: signedNoteWithAddenda, isLoading, error } = useSignedNoteWithAddenda(signedNoteId);
  const createAddendum = useCreateAddendum();

  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [addendumType, setAddendumType] = useState<AddendumType>('clarification');
  const [addendumReason, setAddendumReason] = useState('');
  const [addendumText, setAddendumText] = useState('');
  const [addendumError, setAddendumError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['subjective_section', 'objective_section', 'assessment_section', 'plan_section'])
  );

  if (!signedNoteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">No signed note selected</p>
        <button onClick={() => onNavigate?.('clinical', 'patients')} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm">
          Back to Patients
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-400">Loading signed note...</span>
      </div>
    );
  }

  if (error || !signedNoteWithAddenda) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-red-400" />
        <p className="text-lg font-medium text-white">Signed note not found</p>
        <p className="text-sm mt-1 text-slate-500">
          {error instanceof Error ? error.message : 'This note may have been removed or you lack permission to view it.'}
        </p>
        <button onClick={() => onNavigate?.('clinical', 'patients')} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm">
          Back to Patients
        </button>
      </div>
    );
  }

  const note = signedNoteWithAddenda as SignedNoteWithAddenda;
  const addenda = note.addenda || [];
  const signedPayload = (note.signed_payload as Record<string, unknown>) || {};
  const versionHash = note.version_hash || null;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmitAddendum = async () => {
    if (!addendumReason.trim() || !addendumText.trim()) {
      setAddendumError('Reason and addendum text are both required.');
      return;
    }
    if (!user?.id) {
      setAddendumError('You must be logged in to submit an addendum.');
      return;
    }
    if (!note.clinic_id) {
      setAddendumError('Clinic context is missing. Cannot submit addendum.');
      return;
    }
    setAddendumError(null);
    try {
      await createAddendum.mutateAsync({
        signed_note_id: note.id,
        clinic_id: note.clinic_id,
        addendum_type: addendumType,
        reason: addendumReason.trim(),
        addendum_text: addendumText.trim(),
        created_by_user_id: user.id,
      });
      setShowAddendumModal(false);
      setAddendumReason('');
      setAddendumText('');
      setAddendumType('clarification');
    } catch (err) {
      setAddendumError(err instanceof Error ? err.message : 'Failed to submit addendum.');
    }
  };

  const noteTypeLabel = note.note_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Clinical Note';
  const signerName = profile?.display_name || user?.email || 'Clinician';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (note.patient_id) onNavigate?.('clinical-documentation', `patient:${note.patient_id}`);
                else onNavigate?.('clinical', 'patients');
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Patient</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">{noteTypeLabel}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                SIGNED
              </span>
              {note.status === 'amended' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                  AMENDED
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => { setShowAddendumModal(true); setAddendumError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Addendum
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 pb-16 space-y-6">
        {/* Signature metadata card */}
        <div className="bg-slate-900 rounded-xl border border-emerald-500/30 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Digitally Signed Clinical Note</p>
              <p className="text-xs text-slate-400">This note is immutable. Use an addendum to make corrections or additions.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Signed By
              </p>
              <p className="text-sm text-white">{signerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Signed At
              </p>
              <p className="text-sm text-white">
                {note.signed_at ? new Date(note.signed_at).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Note Type
              </p>
              <p className="text-sm text-white">{noteTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Version
              </p>
              <p className="text-sm text-white">v{note.version_number ?? 1}</p>
            </div>
          </div>

          {versionHash && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Integrity Hash</p>
              <p className="text-xs font-mono text-slate-400 break-all">{versionHash}</p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-500">
            <span>Note ID: {note.id?.slice(0, 16)}...</span>
            <span>•</span>
            <span>Draft ID: {note.note_draft_id?.slice(0, 16)}...</span>
          </div>
        </div>

        {/* Signed note content */}
        <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Signed Note Content</h2>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">Read-only</span>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(SECTION_LABELS).map(([key, label]) => {
              const content = signedPayload[key] as string | null;
              const hasContent = content && content.trim().length > 0;
              const isExpanded = expandedSections.has(key);

              return (
                <div key={key} className={`rounded-lg border ${
                  hasContent ? 'border-slate-700 bg-slate-800/30' : 'border-slate-800 bg-slate-900/30'
                }`}>
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {hasContent ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${hasContent ? 'text-blue-400' : 'text-slate-500'}`}>
                        {label}
                      </span>
                      {hasContent && (
                        <span className="text-xs text-slate-500">
                          {content!.trim().split(/\s+/).length} words
                        </span>
                      )}
                    </div>
                    {hasContent && (
                      isExpanded
                        ? <ChevronUp className="w-4 h-4 text-slate-500" />
                        : <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {isExpanded && hasContent && (
                    <div className="px-4 pb-4">
                      <div className="h-px bg-slate-700 mb-3" />
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap select-none">
                        {content}
                      </p>
                    </div>
                  )}

                  {!hasContent && (
                    <div className="px-4 pb-4">
                      <p className="text-slate-600 italic text-sm">Not documented</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Addenda timeline */}
        <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Addenda</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {addenda.length === 0 ? 'No addenda on this note' : `${addenda.length} addendum${addenda.length > 1 ? 'a' : ''}`}
              </p>
            </div>
            <button
              onClick={() => { setShowAddendumModal(true); setAddendumError(null); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Addendum
            </button>
          </div>

          {addenda.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No addenda have been added to this note.</p>
              <p className="text-xs text-slate-600 mt-1">Use addenda to make corrections or add clinical context.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addenda.map((addendum: NoteAddendum, index: number) => (
                <div key={addendum.id} className="relative pl-6">
                  {index < addenda.length - 1 && (
                    <div className="absolute left-2 top-8 bottom-0 w-px bg-slate-700" />
                  )}
                  <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600" />

                  <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          ADDENDUM_TYPE_COLORS[addendum.addendum_type as AddendumType] || 'text-slate-400 bg-slate-700 border-slate-600'
                        }`}>
                          {ADDENDUM_TYPE_LABELS[addendum.addendum_type as AddendumType] || addendum.addendum_type}
                        </span>
                        {addendum.status === 'approved' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {addendum.status === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(addendum.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-0.5">Reason</p>
                      <p className="text-sm text-slate-300">{addendum.reason}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Addendum</p>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{addendum.addendum_text}</p>
                    </div>

                    {addendum.section_affected && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-500">
                          Section affected: <span className="text-slate-400">{SECTION_LABELS[addendum.section_affected] || addendum.section_affected}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Addendum Modal */}
      {showAddendumModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Add Addendum</h3>
                <p className="text-xs text-slate-400">Amend signed note without altering the original record</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Addendum Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['clarification', 'correction', 'addition', 'restatement'] as AddendumType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setAddendumType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      addendumType === type
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {ADDENDUM_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for Addendum <span className="text-red-400">*</span>
              </label>
              <textarea
                value={addendumReason}
                onChange={e => setAddendumReason(e.target.value)}
                placeholder="Briefly explain why this addendum is being added..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Addendum Text <span className="text-red-400">*</span>
              </label>
              <textarea
                value={addendumText}
                onChange={e => setAddendumText(e.target.value)}
                placeholder="Enter the addendum content..."
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {addendumError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{addendumError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddendumModal(false); setAddendumError(null); setAddendumReason(''); setAddendumText(''); }}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAddendum}
                disabled={createAddendum.isPending || !addendumReason.trim() || !addendumText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
              >
                {createAddendum.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Addendum'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
