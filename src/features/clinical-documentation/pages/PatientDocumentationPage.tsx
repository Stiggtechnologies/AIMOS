import { useState } from 'react';
import { ArrowLeft, FileText, Shield, Clock, Plus, TriangleAlert as AlertTriangle, Loader as Loader2, Calendar, ChevronRight, CircleCheck as CheckCircle, CreditCard as Edit3 } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { usePatientSignedNotes } from '../hooks/usePatientSignedNotes';
import { useDocumentationSummary } from '../hooks/useDocumentationSummary';
import { noteService } from '../services';
import { useQuery } from '@tanstack/react-query';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { NoteDraft, SignedNote, Encounter } from '../types';
import { documentationService } from '../services';

interface PatientDocumentationPageProps {
  patientId: string;
  patientName?: string;
  onNavigate?: (module: string, subModule: string) => void;
}

function usePatientDraftNotesReal(patientId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.patient(patientId),
    queryFn: () => noteService.listPatientDraftNotes(patientId, { limit: 20 }),
    enabled: !!patientId,
  });
}

function usePatientEncounters(patientId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.encounters.patient(patientId),
    queryFn: () => documentationService.getEncountersForPatient(patientId, { limit: 20 }),
    enabled: !!patientId,
  });
}

type TabId = 'overview' | 'drafts' | 'signed' | 'encounters';

const NOTE_TYPE_LABELS: Record<string, string> = {
  initial: 'Initial Assessment',
  progress: 'Progress Note',
  soap: 'SOAP Note',
  discharge: 'Discharge',
  assessment: 'Assessment',
  followup: 'Follow-up',
  referral: 'Referral',
  letter: 'Letter',
  custom: 'Custom',
};

function getRiskColor(score: number | null) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score > 0.6) return 'text-red-400';
  if (score > 0.3) return 'text-amber-400';
  return 'text-emerald-400';
}

function getRiskLabel(score: number | null) {
  if (score === null || score === undefined) return 'Unknown';
  if (score > 0.6) return 'High';
  if (score > 0.3) return 'Medium';
  return 'Low';
}

export function PatientDocumentationPage({ patientId, patientName, onNavigate }: PatientDocumentationPageProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: summary, isLoading: summaryLoading } = useDocumentationSummary(patientId);
  const { data: draftsResult, isLoading: draftsLoading } = usePatientDraftNotesReal(patientId);
  const { data: signedResult, isLoading: signedLoading } = usePatientSignedNotes(patientId);
  const { data: encountersResult, isLoading: encountersLoading } = usePatientEncounters(patientId);

  const drafts = draftsResult?.data || [];
  const signedNotes = signedResult?.data || [];
  const encounters = encountersResult?.data || [];

  const handleNewEncounter = () => {
    if (!patientId) return;
    const clinicId = profile?.primary_clinic_id || '';
    onNavigate?.('clinical-documentation', `encounter:new?patientId=${patientId}&clinicId=${clinicId}`);
  };

  const handleOpenDraft = (draft: NoteDraft) => {
    if (draft.encounter_id) {
      onNavigate?.('clinical-documentation', `encounter:${draft.encounter_id}?patientId=${patientId}&draftId=${draft.id}`);
    } else {
      onNavigate?.('clinical-documentation', `draft:${draft.id}`);
    }
  };

  const handleOpenDraftReview = (draft: NoteDraft) => {
    onNavigate?.('clinical-documentation', `draft:${draft.id}`);
  };

  const handleOpenSignedNote = (note: SignedNote) => {
    onNavigate?.('clinical-documentation', `signed:${note.id}`);
  };

  const handleOpenEncounter = (encounter: Encounter) => {
    onNavigate?.('clinical-documentation', `encounter:${encounter.id}?patientId=${patientId}`);
  };

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-amber-400" />
        <p className="text-lg font-medium text-white">No patient selected</p>
        <button
          onClick={() => onNavigate?.('clinical', 'patients')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'drafts', label: 'Drafts', count: drafts.filter(d => d.status === 'draft').length },
    { id: 'signed', label: 'Signed Notes', count: signedNotes.length },
    { id: 'encounters', label: 'Encounters', count: encounters.length },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('clinical', 'patients')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Patients</span>
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <div>
              <p className="text-sm font-semibold text-white">{patientName || 'Patient'}</p>
              <p className="text-xs text-slate-400">Clinical Documentation Hub</p>
            </div>
          </div>

          <button
            onClick={handleNewEncounter}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Encounter
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {summaryLoading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-slate-400">Loading summary...</span>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Drafts', value: drafts.filter(d => d.status === 'draft').length, icon: Edit3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Signed Notes', value: signedNotes.length, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Encounters', value: encounters.length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Total Records', value: signedNotes.length + drafts.length, icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-900 rounded-xl border border-slate-700/50 p-4">
                      <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Drafts */}
                  <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Recent Drafts</h3>
                      <button onClick={() => setActiveTab('drafts')} className="text-xs text-blue-400 hover:text-blue-300">
                        View all
                      </button>
                    </div>
                    {drafts.length === 0 ? (
                      <p className="text-sm text-slate-500">No active drafts.</p>
                    ) : (
                      <div className="space-y-2">
                        {drafts.slice(0, 4).map(draft => (
                          <button
                            key={draft.id}
                            onClick={() => handleOpenDraft(draft)}
                            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                draft.status === 'draft' ? 'bg-amber-400' : 'bg-blue-400'
                              }`} />
                              <div className="min-w-0">
                                <p className="text-sm text-slate-200 truncate">{NOTE_TYPE_LABELS[draft.note_type] || draft.note_type}</p>
                                <p className="text-xs text-slate-500">{new Date(draft.updated_at || draft.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs ${getRiskColor(draft.risk_score)}`}>
                                {getRiskLabel(draft.risk_score)}
                              </span>
                              <span className="text-xs text-slate-500">
                                {Math.round((draft.completeness_score ?? 0) * 100)}%
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Signed Notes */}
                  <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Recent Signed Notes</h3>
                      <button onClick={() => setActiveTab('signed')} className="text-xs text-blue-400 hover:text-blue-300">
                        View all
                      </button>
                    </div>
                    {signedNotes.length === 0 ? (
                      <p className="text-sm text-slate-500">No signed notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {signedNotes.slice(0, 4).map(note => (
                          <button
                            key={note.id}
                            onClick={() => handleOpenSignedNote(note)}
                            className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-slate-200 truncate">{NOTE_TYPE_LABELS[note.note_type] || note.note_type}</p>
                                <p className="text-xs text-slate-500">
                                  Signed {note.signed_at ? new Date(note.signed_at).toLocaleDateString() : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {note.status === 'amended' && (
                                <span className="text-xs text-amber-400">Amended</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DRAFTS TAB */}
        {activeTab === 'drafts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} found</p>
              <button
                onClick={handleNewEncounter}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Encounter
              </button>
            </div>

            {draftsLoading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-slate-400">Loading drafts...</span>
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-700/50">
                <Edit3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No drafts yet</p>
                <p className="text-xs text-slate-600 mt-1">Start a new encounter to create a note</p>
                <button
                  onClick={handleNewEncounter}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white"
                >
                  New Encounter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map(draft => {
                  const completeness = Math.round((draft.completeness_score ?? 0) * 100);
                  return (
                    <div key={draft.id} className="bg-slate-900 rounded-xl border border-slate-700/50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                            draft.status === 'draft' ? 'bg-amber-400' :
                            draft.status === 'in_review' ? 'bg-blue-400' : 'bg-slate-400'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-base font-medium text-white">
                              {NOTE_TYPE_LABELS[draft.note_type] || draft.note_type}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Updated {new Date(draft.updated_at || draft.created_at).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                draft.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
                                draft.status === 'in_review' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {draft.status?.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-400">
                                {completeness}% complete
                              </span>
                              <span className={`text-xs ${getRiskColor(draft.risk_score)}`}>
                                Risk: {getRiskLabel(draft.risk_score)}
                              </span>
                              <span className="text-xs text-slate-500">v{draft.current_version}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleOpenDraftReview(draft)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleOpenDraft(draft)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Completeness bar */}
                      <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            completeness >= 70 ? 'bg-emerald-500' :
                            completeness >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SIGNED NOTES TAB */}
        {activeTab === 'signed' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{signedNotes.length} signed note{signedNotes.length !== 1 ? 's' : ''}</p>

            {signedLoading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-slate-400">Loading signed notes...</span>
              </div>
            ) : signedNotes.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-700/50">
                <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No signed notes yet</p>
                <p className="text-xs text-slate-600 mt-1">Sign a draft note to create a permanent record</p>
              </div>
            ) : (
              <div className="space-y-3">
                {signedNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => handleOpenSignedNote(note)}
                    className="w-full bg-slate-900 rounded-xl border border-slate-700/50 p-5 text-left hover:border-emerald-500/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-base font-medium text-white">
                              {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                            </p>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                              SIGNED
                            </span>
                            {note.status === 'amended' && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                                AMENDED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {note.signed_at ? new Date(note.signed_at).toLocaleString() : '—'}
                            </span>
                            {note.version_number && (
                              <span className="text-xs text-slate-500">v{note.version_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Immutable
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ENCOUNTERS TAB */}
        {activeTab === 'encounters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{encounters.length} encounter{encounters.length !== 1 ? 's' : ''}</p>
              <button
                onClick={handleNewEncounter}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Encounter
              </button>
            </div>

            {encountersLoading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-slate-400">Loading encounters...</span>
              </div>
            ) : encounters.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-700/50">
                <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No encounters yet</p>
                <button
                  onClick={handleNewEncounter}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white"
                >
                  Start First Encounter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {encounters.map(encounter => (
                  <button
                    key={encounter.id}
                    onClick={() => handleOpenEncounter(encounter)}
                    className="w-full bg-slate-900 rounded-xl border border-slate-700/50 p-4 text-left hover:border-blue-500/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          encounter.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                          encounter.status === 'completed' ? 'bg-emerald-400' :
                          encounter.status === 'cancelled' ? 'bg-red-400' :
                          'bg-slate-400'
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white capitalize">
                              {encounter.encounter_type?.replace('_', ' ')} Encounter
                            </p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              encounter.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              encounter.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              encounter.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {encounter.status?.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {encounter.created_at ? new Date(encounter.created_at).toLocaleString() : '—'}
                            {encounter.modality && ` · ${encounter.modality.replace('_', ' ')}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
