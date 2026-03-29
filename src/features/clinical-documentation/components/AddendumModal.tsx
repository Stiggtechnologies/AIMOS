import { useState } from 'react';
import {
  X,
  FileText,
  Send,
  AlertCircle,
} from 'lucide-react';

export type AddendumType = 'clinician_addendum' | 'correction_response' | 'clarification';

interface AddendumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { addendumType: AddendumType; reason: string; addendumText: string }) => void;
  signedNoteId?: string;
  signedNoteType?: string;
  patientName?: string;
}

const addendumTypeLabels: Record<AddendumType, string> = {
  clinician_addendum: 'Clinician Addendum',
  correction_response: 'Correction Response',
  clarification: 'Clarification',
};

export function AddendumModal({
  isOpen,
  onClose,
  onSubmit,
  signedNoteId,
  signedNoteType,
  patientName,
}: AddendumModalProps) {
  const [addendumType, setAddendumType] = useState<AddendumType>('clinician_addendum');
  const [reason, setReason] = useState('');
  const [addendumText, setAddendumText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the addendum');
      return;
    }
    if (!addendumText.trim()) {
      setError('Please provide the addendum text');
      return;
    }

    setError(null);
    onSubmit({
      addendumType,
      reason: reason.trim(),
      addendumText: addendumText.trim(),
    });

    // Reset form
    setAddendumType('clinician_addendum');
    setReason('');
    setAddendumText('');
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
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Addendum</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Note Reference */}
          {signedNoteId && (
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">Adding to</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {signedNoteType || 'Clinical Note'}
                  </p>
                  {patientName && (
                    <p className="text-xs text-slate-400">{patientName}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  ID: {signedNoteId.slice(0, 8)}...
                </span>
              </div>
            </div>
          )}

          {/* Addendum Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Addendum Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(addendumTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAddendumType(value as AddendumType)}
                  className={`p-3 rounded-lg text-xs font-medium text-center transition-all
                    ${addendumType === value
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Reason for Addendum <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this addendum is being created..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>

          {/* Addendum Text Field */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Addendum Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={addendumText}
              onChange={(e) => setAddendumText(e.target.value)}
              placeholder="Enter the addendum content..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>

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
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit Addendum
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddendumModal;
