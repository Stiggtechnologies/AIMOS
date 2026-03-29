import { useState } from 'react';
import {
  X,
  History,
  ChevronRight,
  RotateCcw,
  GitCompare,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';

export interface Version {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  changeSummary: string;
  isCurrent: boolean;
}

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  draftId: string;
  versions: Version[];
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  draftId,
  versions,
}: VersionHistoryDrawerProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVersionSelect = (id: string) => {
    if (selectedVersions.includes(id)) {
      setSelectedVersions(prev => prev.filter(v => v !== id));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions(prev => [...prev, id]);
    }
  };

  const handleRestore = (versionId: string) => {
    // Stub: would trigger service call
    console.log('Restore version:', versionId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-slate-900 border-l border-slate-700 z-50 flex flex-col animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors ${
              compareMode
                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare versions
          </button>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {versions.map((version, idx) => (
            <div
              key={version.id}
              className={`rounded-lg border transition-colors ${
                version.isCurrent
                  ? 'border-blue-500/30 bg-blue-500/5'
                  : selectedVersions.includes(version.id)
                  ? 'border-blue-400/50 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              {/* Version header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {compareMode && (
                    <button
                      onClick={() => handleVersionSelect(version.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedVersions.includes(version.id)
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {selectedVersions.includes(version.id) && (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        Version {version.version}
                      </span>
                      {version.isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(version.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.author}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                    className={`text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 ${
                      expandedVersion === version.id ? 'text-white' : ''
                    }`}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expandedVersion === version.id ? 'rotate-90' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Change summary */}
              <div className="px-4 pb-3">
                <p className="text-sm text-slate-400">{version.changeSummary}</p>
              </div>

              {/* Expanded: restore action */}
              {expandedVersion === version.id && (
                <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/20">
                  <p className="text-xs text-slate-500 mb-2">Timestamp: {version.timestamp}</p>
                  {!version.isCurrent && (
                    <button
                      onClick={() => handleRestore(version.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore this version
                    </button>
                  )}
                  {version.isCurrent && (
                    <p className="text-xs text-slate-500">This is the active version</p>
                  )}
                  {compareMode && (
                    <button
                      onClick={() => handleVersionSelect(version.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      Select for comparison
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Compare banner */}
          {compareMode && selectedVersions.length === 2 && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-300 mb-3">
                Comparing version {versions.find(v => v.id === selectedVersions[0])?.version} with version {versions.find(v => v.id === selectedVersions[1])?.version}
              </p>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Run Comparison
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}