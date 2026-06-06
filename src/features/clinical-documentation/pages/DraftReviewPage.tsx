import { useState } from 'react';
import { ArrowLeft, FileText, History, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader as Loader2, Shield } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useDraftNoteWithVersions } from '../hooks/useDraftNoteVersions';
import { useValidateDraftNote } from '../hooks/useValidateDraftNote';
import { useSignDraftNote } from '../hooks/useSignDraftNote';
import type { NoteDraftVersion } from '../types';

interface DraftReviewPageProps {
  draftId: string;
  patientId?: string;
  onNavigate?: (action: 'back' | 'sign' | 'signed' | 'encounter', payload?: string) => void;
}

export function DraftReviewPage({ draftId, patientId, onNavigate }: DraftReviewPageProps) {
  const { user, profile } = useAuth();
  const { data: draftWithVersions, isLoading, error: loadError } = useDraftNoteWithVersions(draftId);
  const validate = useValidateDraftNote();
  const signNote = useSignDraftNote();

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  const draft = draftWithVersions;
  const versions = draftWithVersions?.versions || [];

  if (!draftId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">No draft selected</p>
        <button
          onClick={() => onNavigate?.('back')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-400">Loading draft...</span>
      </div>
    );
  }

  if (loadError || !draft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-red-400" />
        <p className="text-lg font-medium text-white">Draft not found</p>
        <p className="text-sm mt-1 text-slate-500">
          {loadError instanceof Error ? loadError.message : 'This draft may have been signed or deleted.'}
        </p>
        <button
          onClick={() => onNavigate?.('back')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          Back to Patient
        </button>
      </div>
    );
  }

  const sp = (draft.structured_payload as Record<string, string | null>) || {};

  const sections = [
    { key: 'subjective_section', label: 'Subjective', content: sp.subjective_section },
    { key: 'objective_section', label: 'Objective', content: sp.objective_section },
    { key: 'assessment_section', label: 'Assessment', content: sp.assessment_section },
    { key: 'treatment_section', label: 'Treatment', content: sp.treatment_section },
    { key: 'response_section', label: 'Response', content: sp.response_section },
    { key: 'plan_section', label: 'Plan', content: sp.plan_section },
    { key: 'follow_up_section', label: 'Follow-up', content: sp.follow_up_section },
  ];

  const completeness = (draft.completeness_score ?? 0) * 100;
  const riskLevel = (draft.risk_score ?? 0.5) > 0.6 ? 'high' : (draft.risk_score ?? 0.5) > 0.3 ? 'medium' : 'low';

  const handleValidate = async () => {
    setValidationErrors([]);
    setIsValidated(false);
    try {
      const result = await validate.mutateAsync({ noteDraftId: draft.id });
      setValidationErrors(result.errors);
      setIsValidated(true);
      if (result.valid) setShowSignModal(true);
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'Validation failed.']);
    }
  };

  const handleSign = async () => {
    const signingUserId = user?.id;
    if (!signingUserId) {
      setSignError('You must be logged in to sign notes.');
      return;
    }
    setSignError(null);
    try {
      const signed = await signNote.mutateAsync({
        noteDraftId: draft.id,
        signedByUserId: signingUserId,
      });
      setShowSignModal(false);
      onNavigate?.('signed', signed.id);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Signing failed. Please try again.');
      console.error('Sign failed:', err);
    }
  };

  const isAlreadySigned = draft.status === 'signed';
  const signerDisplayName = profile?.display_name || user?.email || 'Clinician';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('back')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <span className="text-sm text-slate-300 font-medium">
              {draft.note_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} — Draft Review
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              draft.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
              draft.status === 'in_review' ? 'bg-blue-500/20 text-blue-400' :
              draft.status === 'signed' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {draft.status?.toUpperCase()}
            </span>
            {isAlreadySigned && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Shield className="w-3 h-3" />
                Immutable — Use addendum to amend
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <History className="w-4 h-4" />
              Version History ({versions.length})
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 pb-24 flex gap-6">
        {/* Left: Note content */}
        <div className="flex-1 space-y-4">
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Validation Issues</span>
              </div>
              <ul className="space-y-1">
                {validationErrors.map((e, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isValidated && validationErrors.length === 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">All validation checks passed. Ready to sign.</span>
            </div>
          )}

          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Structured Note Content</h2>
            <div className="space-y-6">
              {sections.map(section => (
                <div key={section.key} className="border-b border-slate-800 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-400">{section.label}</h3>
                    {section.content && section.content.trim().length > 20 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  {section.content ? (
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  ) : (
                    <p className="text-slate-600 italic text-sm">Not completed</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {section.content ? `${section.content.trim().split(/\s+/).length} words` : '—'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3 text-sm text-slate-400 flex-wrap">
              <span>Version {draft.current_version}</span>
              <span>•</span>
              <span>Source: {draft.source_mode || 'manual'}</span>
              <span>•</span>
              <span>Author: {draft.author_user_id?.slice(0, 8)}</span>
              <span>•</span>
              <span>ID: {draft.id.slice(0, 8)}</span>
              {draft.updated_at && (
                <>
                  <span>•</span>
                  <span>Updated: {new Date(draft.updated_at).toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Validation + Version History */}
        <div className="w-80 space-y-4">
          {/* Completeness */}
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Completeness</h3>
            <div className="flex items-center justify-center mb-2">
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
                completeness >= 70 ? 'bg-emerald-500/20' :
                completeness >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'
              }`}>
                <span className={`text-2xl font-bold ${
                  completeness >= 70 ? 'text-emerald-400' :
                  completeness >= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>{Math.round(completeness)}%</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-400">
              {completeness >= 70 ? 'Ready for sign' : completeness >= 40 ? 'Needs more detail' : 'Incomplete'}
            </p>
            <div className="mt-3 space-y-1">
              {sections.map(s => (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  {s.content && s.content.trim().length > 20 ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Risk Score</h3>
            <div className={`text-center py-3 rounded-lg border ${
              riskLevel === 'low' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
              riskLevel === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
              'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
              <span className="text-lg font-semibold uppercase">{riskLevel}</span>
            </div>
          </div>

          {/* Version History */}
          {showVersionHistory && (
            <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Version History
                <span className="ml-2 text-xs text-slate-500">{versions.length} versions</span>
              </h3>
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500">No version history yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.map((v: NoteDraftVersion) => (
                    <div key={v.id} className={`p-3 rounded-lg border ${
                      v.version_number === draft.current_version
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">
                          v{v.version_number}
                          {v.version_number === draft.current_version && (
                            <span className="ml-1 text-xs text-blue-400">(current)</span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      {v.change_summary && (
                        <p className="text-xs text-slate-400 mt-1">{v.change_summary}</p>
                      )}
                      <p className="text-xs text-slate-500">{new Date(v.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => onNavigate?.('back')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Encounter
          </button>

          {!isAlreadySigned && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleValidate}
                disabled={validate.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {validate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                Validate & Sign
              </button>
              <button
                onClick={() => { setShowSignModal(true); setSignError(null); }}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                Sign Note
              </button>
            </div>
          )}

          {isAlreadySigned && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Shield className="w-4 h-4" />
              Signed — View in signed note record
            </div>
          )}
        </div>
      </footer>

      {/* Sign Confirmation Modal */}
      {showSignModal && !isAlreadySigned && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sign Clinical Note</h3>
                <p className="text-xs text-slate-400">This action is permanent and legally binding</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800 rounded-lg mb-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Note Type</span>
                <span className="text-white">{draft.note_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Version</span>
                <span className="text-white">v{draft.current_version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Signing As</span>
                <span className="text-white">{signerDisplayName}</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              By signing, I attest that this note is accurate, complete, and reflects the clinical encounter. Signed notes cannot be edited — use an addendum for corrections.
            </p>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
              />
              <span className="text-sm text-slate-300">I confirm this note is accurate and ready to sign</span>
            </label>

            {signError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{signError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSignModal(false); setConfirmed(false); setSignError(null); }}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!confirmed || signNote.isPending}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
              >
                {signNote.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing...
                  </span>
                ) : 'Sign & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
