import { useState } from 'react';
import {
  X,
  FileSignature,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export type NoteType = 
  | 'initial' 
  | 'followup' 
  | 'progress' 
  | 'discharge' 
  | 'wcb_report' 
  | 'insurer_update';

interface SignNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => void;
  noteType: NoteType;
  patientName: string;
  signingUserName?: string;
  isLoading?: boolean;
  error?: string | null;
}

const noteTypeLabels: Record<NoteType, string> = {
  initial: 'Initial Assessment',
  followup: 'Follow-up',
  progress: 'Progress Report',
  discharge: 'Discharge Summary',
  wcb_report: 'WCB Report',
  insurer_update: 'Insurer Update',
};

const attestationText = `I confirm that this clinical note accurately reflects the encounter documented herein. I have reviewed the content for accuracy and completeness, and I attest that the information represents a true and faithful record of the clinical encounter. I understand that signing this note constitutes a legal medical record and that any false or misleading information may result in professional disciplinary action.`;

export function SignNoteModal({
  isOpen,
  onClose,
  onSign,
  noteType,
  patientName,
  signingUserName = 'Provider',
  isLoading = false,
  error = null,
}: SignNoteModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSign = () => {
    if (confirmed) {
      onSign();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileSignature className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Sign Clinical Note</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Note Type & Patient */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Note Type</p>
              <p className="text-sm font-medium text-white">
                {noteTypeLabels[noteType]}
              </p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Patient</p>
              <p className="text-sm font-medium text-white">{patientName}</p>
            </div>
          </div>

          {/* Attestation Statement */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Attestation Statement</p>
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-300 leading-relaxed">
                {attestationText}
              </p>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
            </div>
            <span className="text-sm text-slate-300">
              I confirm this note accurately reflects the clinical encounter
            </span>
          </label>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700/50 bg-slate-800/30">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!confirmed || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white transition-all
              ${confirmed && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-slate-600 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Sign Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignNoteModal;
