import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  History,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
} from 'lucide-react';

import { useDraftNoteWithVersions } from '../hooks/useDraftNoteVersions';
import { useSaveDraftNote } from '../hooks/useSaveDraftNote';
import { useValidateDraftNote } from '../hooks/useValidateDraftNote';
import { useSignDraftNote } from '../hooks/useSignDraftNote';
import type { NoteDraft, NoteDraftVersion, RiskScore, SectionStatus } from '../types';

interface DraftReviewPageProps {
  draftId: string;
  patientId?: string;
  onNavigate?: (action: 'back' | 'sign' | 'signed', payload?: string) => void;
}

export function DraftReviewPage({ draftId, patientId, onNavigate }: DraftReviewPageProps) {
  const { data: draftWithVersions, isLoading } = useDraftNoteWithVersions(draftId);
  const saveDraft = useSaveDraftNote();
  const validate = useValidateDraftNote();
  const signNote = useSignDraftNote();

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  const draft = draftWithVersions;
  const versions = draftWithVersions?.versions || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-400">Loading draft...</span>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Draft not found</p>
        <button
          onClick={() => onNavigate?.('back')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          Back to Patient
        </button>
      </div>
    );
  }

  const sp = draft.structured_payload as Record<string, string | null> || {};

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
  const riskScore = (draft.risk_score ?? 0.5) > 0.6 ? 'high' : (draft.risk_score ?? 0.5) > 0.3 ? 'medium' : 'low';

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
              draft.status === 'review' ? 'bg-blue-500/20 text-blue-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {draft.status?.toUpperCase()}
            </span>
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
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {section.content || <span className="text-slate-600 italic">Not completed</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {section.content ? `${section.content.trim().split(/\s+/).length} words` : '—'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Version {draft.current_version}</span>
                <span>•</span>
                <span>Source: {draft.source_mode || 'manual'}</span>
                <span>•</span>
                <span>ID: {draft.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Validation + actions */}
        <div className="w-80 space-y-4">
          {/* Completeness */}
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Completeness</h3>
            <div className="flex items-center justify-center">
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
            <p className="text-center text-sm text-slate-400 mt-2">
              {completeness >= 70 ? 'Ready for sign' : completeness >= 40 ? 'Needs more detail' : 'Incomplete'}
            </p>
          </div>

          {/* Risk */}
          <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Risk Score</h3>
            <div className={`text-center py-3 rounded-lg border ${
              riskScore === 'low' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
              riskScore === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
              'border-red-500/30 bg-red-500/10 text-red-400'
            }`}>
              <span className="text-lg font-semibold uppercase">{riskScore}</span>
            </div>
          </div>

          {/* Version History Drawer Toggle */}
          {showVersionHistory && versions.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Version History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versions.map((v: NoteDraftVersion) => (
                  <div key={v.id} className={`p-3 rounded-lg border ${
                    v.version_number === draft.current_version
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">v{v.version_number}</span>
                      <span className="text-xs text-slate-500">{new Date(v.created_at).toLocaleString()}</span>
                    </div>
                    {v.change_summary && (
                      <p className="text-xs text-slate-400 mt-1">{v.change_summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('back')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Encounter
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                validate.mutate({ noteDraftId: draft.id }, {
                  onSuccess: (result) => {
                    if (result.valid) setShowSignModal(true);
                  }
                });
              }}
              disabled={validate.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {validate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Validate
            </button>
            <button
              onClick={() => setShowSignModal(true)}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              Sign Note
            </button>
          </div>
        </div>
      </footer>

      {/* Sign Confirmation Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Sign Clinical Note</h3>
            <p className="text-sm text-slate-400 mb-6">
              By signing, you confirm this note is accurate and complete. This action is permanent and cannot be edited.
            </p>
            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-800 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white font-medium">{draft.note_type}</p>
                <p className="text-xs text-slate-400">Version {draft.current_version}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const userId = draft.author_user_id;
                    const signed = await signNote.mutateAsync({
                      noteDraftId: draft.id,
                      signedByUserId: userId,
                    });
                    onNavigate?.('signed', signed.id);
                  } catch (err) {
                    console.error('Sign failed:', err);
                  }
                }}
                disabled={signNote.isPending}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                {signNote.isPending ? 'Signing...' : 'Sign & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}