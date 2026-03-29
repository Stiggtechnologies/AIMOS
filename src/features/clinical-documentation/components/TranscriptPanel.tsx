import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

export type CaptureStatus = 'not_started' | 'recording' | 'paused' | 'stopped';

interface TranscriptSegment {
  id: string;
  speakerLabel: 'clinician' | 'patient' | 'unknown';
  speakerName?: string;
  text: string;
  startMs: number;
  endMs: number;
  isHighlighted?: boolean;
}

interface TranscriptPanelProps {
  encounterId: string;
  captureStatus: CaptureStatus;
  transcriptSegments?: TranscriptSegment[];
  isLoading?: boolean;
  onSegmentClick?: (segmentId: string) => void;
}

const speakerColors = {
  clinician: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  patient: 'bg-slate-600/30 text-slate-300 border-slate-500/40',
  unknown: 'bg-slate-700/30 text-slate-500 border-slate-600/40',
};

const speakerLabels = {
  clinician: 'Clinician',
  patient: 'Patient',
  unknown: 'Unknown',
};

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function TranscriptPanel({
  encounterId,
  captureStatus,
  transcriptSegments = [],
  isLoading = false,
  onSegmentClick,
}: TranscriptPanelProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptSegments, autoScroll]);

  const isRecording = captureStatus === 'recording';
  const isPaused = captureStatus === 'paused';
  const hasTranscript = transcriptSegments.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Live Transcript</h3>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {isPaused && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
                Paused
              </span>
            )}
            {captureStatus === 'stopped' && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                Complete
              </span>
            )}
            {captureStatus === 'not_started' && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-slate-600/50 text-slate-400">
                <MicOff className="w-3 h-3" />
                Not Started
              </span>
            )}
          </div>
        </div>

        {/* Auto-scroll Toggle */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors
            ${autoScroll
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-700 text-slate-400 hover:text-slate-300'}`}
        >
          {autoScroll ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          Auto-scroll
        </button>
      </div>

      {/* Transcript Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-400" />
            <p className="text-sm">Processing transcript...</p>
            <p className="text-xs mt-1">Speech recognition in progress</p>
          </div>
        )}

        {/* Recording (No Transcript Yet) */}
        {!isLoading && isRecording && !hasTranscript && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Mic className="w-8 h-8 mb-3 text-red-400" />
            <p className="text-sm">Recording in progress...</p>
            <p className="text-xs mt-1">Transcript will appear here</p>
          </div>
        )}

        {/* Not Started */}
        {!isLoading && captureStatus === 'not_started' && !hasTranscript && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <MicOff className="w-8 h-8 mb-3 text-slate-600" />
            <p className="text-sm">Start capture to begin recording</p>
            <p className="text-xs mt-1">Transcript will appear here</p>
          </div>
        )}

        {/* No Transcript Available */}
        {!isLoading && captureStatus === 'stopped' && !hasTranscript && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <MessageSquare className="w-8 h-8 mb-3 text-slate-600" />
            <p className="text-sm">Transcript not available</p>
            <p className="text-xs mt-1">Recording may have failed or no audio detected</p>
          </div>
        )}

        {/* Transcript Segments */}
        {hasTranscript && transcriptSegments.map((segment) => (
          <div
            key={segment.id}
            onClick={() => onSegmentClick?.(segment.id)}
            className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-800/50
              ${segment.isHighlighted
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-800/30 border-slate-700/40'}`}
          >
            {/* Speaker Label */}
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${speakerColors[segment.speakerLabel]}`}>
                {segment.speakerName || speakerLabels[segment.speakerLabel]}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {formatTimestamp(segment.startMs)}
              </span>
            </div>
            
            {/* Text */}
            <p className={`text-sm leading-relaxed ${segment.isHighlighted ? 'text-blue-200' : 'text-slate-300'}`}>
              {segment.text}
            </p>
          </div>
        ))}

        {/* Paused State */}
        {!isLoading && isPaused && hasTranscript && (
          <div className="text-center py-2 text-amber-400 text-xs">
            ─── Recording paused ───
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {hasTranscript ? `${transcriptSegments.length} segments` : 'No transcript'}
          </span>
          <span>
            {hasTranscript && formatTimestamp(
              transcriptSegments[transcriptSegments.length - 1]?.endMs || 0
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TranscriptPanel;
