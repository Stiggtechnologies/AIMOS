import { useState } from 'react';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

export type NoteType = 
  | 'initial' 
  | 'followup' 
  | 'progress' 
  | 'discharge' 
  | 'wcb_report' 
  | 'insurer_update';

interface SectionData {
  content: string;
  source: 'manual' | 'ai_assisted' | 'transcribed';
  hasRisk: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface StructuredNoteEditorProps {
  noteType: NoteType;
  isEditable?: boolean;
  onSectionEdit?: (section: string, content: string) => void;
  initialData?: Record<string, SectionData>;
}

const noteTypeLabels: Record<NoteType, string> = {
  initial: 'Initial Assessment',
  followup: 'Follow-up',
  progress: 'Progress Report',
  discharge: 'Discharge Summary',
  wcb_report: 'WCB Report',
  insurer_update: 'Insurer Update',
};

const sections = [
  { key: 'subjective', label: 'Subjective', placeholder: 'Chief complaint, history of present illness, review of systems...' },
  { key: 'objective', label: 'Objective', placeholder: 'Vital signs, physical examination findings, measurements...' },
  { key: 'assessment', label: 'Assessment', placeholder: 'Diagnoses, clinical reasoning, functional status, prognosis...' },
  { key: 'treatment', label: 'Treatment', placeholder: 'Interventions provided, treatment response, adjustments...' },
  { key: 'response', label: 'Response', placeholder: 'Patient response to treatment, progress toward goals...' },
  { key: 'plan', label: 'Plan', placeholder: 'Treatment goals, referrals, follow-up plans, patient education...' },
  { key: 'followup', label: 'Follow-up', placeholder: 'Next appointment, ongoing care instructions...' },
];

const sectionPlaceholders: Record<string, string> = {
  subjective: 'Chief complaint, HPI, ROS, PMH, medications, allergies...',
  objective: 'Vital signs, physical exam findings, measurements, observations...',
  assessment: 'Diagnoses, clinical reasoning, functional status, prognosis...',
  treatment: 'Interventions provided, treatment techniques, dosage/frequency...',
  response: 'Patient response to treatment, goal progress, barriers...',
  plan: 'Treatment goals, interventions, referrals, follow-up schedule...',
  followup: 'Next appointment, home program, patient instructions...',
};

export function StructuredNoteEditor({
  noteType,
  isEditable = true,
  onSectionEdit,
  initialData = {},
}: StructuredNoteEditorProps) {
  const [selectedType, setSelectedType] = useState<NoteType>(noteType);
  const [activeTab, setActiveTab] = useState('subjective');
  const [sectionContent, setSectionContent] = useState<Record<string, SectionData>>(() => {
    const initial: Record<string, SectionData> = {};
    sections.forEach((s) => {
      if (initialData[s.key]) {
        initial[s.key] = initialData[s.key];
      } else {
        initial[s.key] = { content: '', source: 'manual', hasRisk: false };
      }
    });
    return initial;
  });

  const handleContentChange = (section: string, value: string) => {
    setSectionContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        content: value,
      },
    }));
    onSectionEdit?.(section, value);
  };

  const totalWords = Object.values(sectionContent).reduce(
    (acc, data) => acc + (data.content.trim() ? data.content.trim().split(/\s+/).length : 0),
    0
  );

  const getCompletenessForSection = (section: string): boolean => {
    return sectionContent[section]?.content.length > 0;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700/50">
      {/* Note Type Selector */}
      <div className="p-4 border-b border-slate-700/50">
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Note Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as NoteType)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(noteTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700/50 overflow-x-auto">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveTab(section.key)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative
              ${activeTab === section.key
                ? 'text-blue-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
          >
            {section.label}
            {getCompletenessForSection(section.key) && (
              <CheckCircle className="w-3 h-3 inline-block ml-1 text-emerald-500" />
            )}
            {sectionContent[section.key]?.hasRisk && (
              <AlertTriangle className="w-3 h-3 inline-block ml-1 text-amber-500" />
            )}
            {activeTab === section.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Section Content Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {sections.find((s) => s.key === activeTab)?.label}
            </h3>
            <div className="flex items-center gap-2">
              {sectionContent[activeTab]?.source === 'ai_assisted' && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </span>
              )}
              {sectionContent[activeTab]?.source === 'transcribed' && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
                  <FileText className="w-3 h-3" />
                  Transcribed
                </span>
              )}
            </div>
          </div>

          {/* Source Evidence */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-3 h-3" />
            <span>
              Source: {sectionContent[activeTab]?.source === 'manual' ? 'Manual Entry' :
                sectionContent[activeTab]?.source === 'ai_assisted' ? 'AI Assisted' : 'Transcribed'}
            </span>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={sectionContent[activeTab]?.content || ''}
              onChange={(e) => handleContentChange(activeTab, e.target.value)}
              placeholder={sectionPlaceholders[activeTab]}
              disabled={!isEditable}
              className={`w-full h-64 px-4 py-3 bg-slate-800 border rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${sectionContent[activeTab]?.hasRisk
                  ? sectionContent[activeTab]?.riskLevel === 'high'
                    ? 'border-red-500/50 focus:ring-red-500'
                    : 'border-amber-500/50 focus:ring-amber-500'
                  : 'border-slate-600'
                }
                ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            
            {/* Risk Warning */}
            {sectionContent[activeTab]?.hasRisk && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${sectionContent[activeTab]?.riskLevel === 'high'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Potential risk flagged in this section</span>
              </div>
            )}
          </div>

          {/* Character Count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {sectionContent[activeTab]?.content.length || 0} characters
            </span>
            <button
              disabled={!isEditable}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${isEditable
                  ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              <Sparkles className="w-3 h-3" />
              Generate with AI
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Total: <span className="text-white font-medium">{totalWords}</span> words
        </div>
        
        <button
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Validate Note
        </button>
      </div>
    </div>
  );
}

export default StructuredNoteEditor;
