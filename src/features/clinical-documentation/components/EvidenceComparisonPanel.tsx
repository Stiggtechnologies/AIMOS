import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Mic,
  FileText,
  ClipboardList,
  Sparkles,
  Pen,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export type SourceType = 'transcript' | 'prior_note' | 'intake' | 'ai' | 'clinician' | 'none';

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface NoteSection {
  key: string;
  label: string;
  paragraphs: NoteParagraph[];
  isComplete: boolean;
}

export interface NoteParagraph {
  id: string;
  section: string;
  content: string;
  source: SourceType;
  confidence?: number;
  evidenceSnippet?: string;
  speaker?: string;
  timestamp?: string;
  status: 'accepted' | 'edited' | 'rejected' | 'pending';
}

interface PriorNote {
  id: string;
  type: string;
  date: string;
  content: string;
}

interface IntakeField {
  name: string;
  value: string;
}

interface EvidenceComparisonPanelProps {
  noteSections: NoteSection[];
  transcriptSegments: TranscriptSegment[];
  priorNotes: PriorNote[];
  intakeData: IntakeField[];
  activeSection: string | null;
  onToggleSection: (key: string) => void;
}

const sourceConfig: Record<SourceType, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  transcript: {
    label: 'Transcript',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    icon: <Mic className="w-3.5 h-3.5" />,
  },
  prior_note: {
    label: 'Prior Note',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20 border-slate-500/30',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  intake: {
    label: 'Intake',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    icon: <ClipboardList className="w-3.5 h-3.5" />,
  },
  ai: {
    label: 'AI Generated',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  clinician: {
    label: 'Clinician Entry',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 border-amber-500/30',
    icon: <Pen className="w-3.5 h-3.5" />,
  },
  none: {
    label: 'No Source',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20 border-slate-500/30',
    icon: null,
  },
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function TranscriptEvidenceView({ segment }: { segment: TranscriptSegment }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 rounded border border-blue-500/20 bg-blue-500/5 p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors w-full justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" />
          <span className="font-medium">{segment.speaker}</span>
          <span className="text-slate-500">@ {formatTime(segment.startMs)} – {formatTime(segment.endMs)}</span>
        </span>
        <span className="text-slate-500">{expanded ? 'hide' : 'show'}</span>
      </button>
      {expanded && (
        <div className="mt-2">
          <p className="text-slate-300 text-sm italic border-l-2 border-blue-500/40 pl-3">
            "{segment.text}"
          </p>
        </div>
      )}
    </div>
  );
}

function PriorNoteEvidenceView({ note }: { note: PriorNote }) {
  return (
    <div className="mt-2 rounded border border-slate-500/20 bg-slate-500/5 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <FileText className="w-3.5 h-3.5" />
        <span className="font-medium">{note.type}</span>
        <span className="text-slate-500">— {note.date}</span>
      </div>
      <p className="text-slate-400 text-xs line-clamp-2">{note.content}</p>
    </div>
  );
}

function AIConfidenceView({ confidence }: { confidence: number }) {
  return (
    <div className="mt-2 rounded border border-purple-500/20 bg-purple-500/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs text-purple-400 font-medium">AI Confidence: {Math.round(confidence * 100)}%</span>
      </div>
      <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
        <ExternalLink className="w-3 h-3" />
        Verify this
      </button>
    </div>
  );
}

export function EvidenceComparisonPanel({
  noteSections,
  transcriptSegments,
  priorNotes,
  intakeData,
  activeSection,
  onToggleSection,
}: EvidenceComparisonPanelProps) {
  return (
    <div className="space-y-2">
      {noteSections.map(section => {
        const cfg = sourceConfig;
        const sectionParagraphs = section.paragraphs;
        const sourceCount = new Set(sectionParagraphs.map(p => p.source)).size;

        return (
          <div key={section.key} className="rounded-lg border border-slate-700 overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => onToggleSection(section.key)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {activeSection === section.key ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-medium text-white">{section.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {sourceCount} source{sourceCount !== 1 ? 's' : ''}
                </span>
                {/* Source chips */}
                <div className="flex items-center gap-1">
                  {[...new Set(sectionParagraphs.map(p => p.source))].slice(0, 3).map(src => (
                    <span
                      key={src}
                      className={`text-xs px-1.5 py-0.5 rounded border ${cfg[src].bgColor} ${cfg[src].color}`}
                    >
                      {cfg[src].icon}
                    </span>
                  ))}
                </div>
              </div>
            </button>

            {/* Expanded evidence */}
            {activeSection === section.key && (
              <div className="border-t border-slate-700 bg-slate-800/20 p-3 space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {sectionParagraphs.map(para => {
                  const src = cfg[para.source];
                  return (
                    <div key={para.id} className="rounded border border-slate-700/50 bg-slate-900/50 p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border flex items-center gap-1 ${src.bgColor} ${src.color}`}>
                          {src.icon}
                          {src.label}
                        </span>
                        {para.confidence !== undefined && (
                          <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            {Math.round(para.confidence * 100)}% conf
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{para.content}</p>

                      {/* Source-specific evidence */}
                      {para.source === 'transcript' && para.evidenceSnippet && (
                        <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2">
                          <p className="text-xs text-blue-300 italic">
                            "{para.evidenceSnippet}"
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            — {para.speaker} @ {para.timestamp}
                          </p>
                        </div>
                      )}
                      {para.source === 'ai' && para.confidence !== undefined && (
                        <AIConfidenceView confidence={para.confidence} />
                      )}
                      {para.source === 'prior_note' && (
                        <div className="rounded border border-slate-500/20 bg-slate-500/5 p-2">
                          <p className="text-xs text-slate-400">From prior clinical note</p>
                        </div>
                      )}
                      {para.source === 'intake' && (
                        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2">
                          <p className="text-xs text-emerald-400">From patient intake form</p>
                        </div>
                      )}
                      {para.source === 'clinician' && (
                        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
                          <p className="text-xs text-amber-400">Manually entered by clinician</p>
                        </div>
                      )}
                      {para.source === 'none' && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <AlertTriangle className="w-3 h-3" />
                          No source — manually entered text
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}