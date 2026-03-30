import { useState, useEffect } from 'react';
import { FileText, Sparkles, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Loader as Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
  sectionValues?: Record<string, string>;
  encounterId?: string;
  patientId?: string;
  clinicId?: string;
  onApplyAIContent?: (sectionKey: string, content: string) => void;
  onValidate?: () => void;
  isValidating?: boolean;
}

const noteTypeLabels: Record<NoteType, string> = {
  initial: 'Initial Assessment',
  followup: 'Follow-up',
  progress: 'Progress Report',
  discharge: 'Discharge Summary',
  wcb_report: 'WCB Report',
  insurer_update: 'Insurer Update',
};

const soapSections = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'response', label: 'Response' },
  { key: 'plan', label: 'Plan' },
  { key: 'followup', label: 'Follow-up' },
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

const sectionAIInstructions: Record<string, string> = {
  subjective: 'Generate a detailed subjective section including chief complaint, history of present illness, and relevant past medical history.',
  objective: 'Generate a detailed objective section including relevant physical examination findings and measurable observations.',
  assessment: 'Generate a clinical assessment including working diagnosis, clinical reasoning, and functional status.',
  treatment: 'Generate a treatment section describing interventions provided during this encounter.',
  response: 'Generate a response section describing the patient\'s response to treatment and progress toward goals.',
  plan: 'Generate a plan section including treatment goals, next steps, referrals, and follow-up schedule.',
  followup: 'Generate a follow-up section with next appointment details and home program instructions.',
};

export function StructuredNoteEditor({
  noteType,
  isEditable = true,
  onSectionEdit,
  initialData = {},
  sectionValues,
  encounterId,
  patientId,
  clinicId,
  onApplyAIContent,
  onValidate,
  isValidating = false,
}: StructuredNoteEditorProps) {
  const [selectedType, setSelectedType] = useState<NoteType>(noteType);
  const [activeTab, setActiveTab] = useState('subjective');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [sectionContent, setSectionContent] = useState<Record<string, SectionData>>(() => {
    const initial: Record<string, SectionData> = {};
    soapSections.forEach((s) => {
      if (initialData[s.key]) {
        initial[s.key] = initialData[s.key];
      } else {
        initial[s.key] = { content: sectionValues?.[s.key] || '', source: 'manual', hasRisk: false };
      }
    });
    return initial;
  });

  // Sync when parent sectionValues change (e.g. draft load, AI apply)
  useEffect(() => {
    if (!sectionValues) return;
    setSectionContent(prev => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(sectionValues)) {
        const resolvedKey = key === 'followUp' ? 'followup' : key;
        if (next[resolvedKey] !== undefined && next[resolvedKey].content !== value) {
          next[resolvedKey] = { ...next[resolvedKey], content: value };
        }
      }
      return next;
    });
  }, [sectionValues]);

  const handleContentChange = (section: string, value: string) => {
    setSectionContent(prev => ({
      ...prev,
      [section]: { ...prev[section], content: value, source: 'manual' },
    }));
    onSectionEdit?.(section, value);
    onApplyAIContent?.(section, value);
  };

  const handleGenerateAI = async () => {
    if (!isEditable) return;
    setIsGeneratingAI(true);
    setAiError(null);

    const currentContent = sectionContent[activeTab]?.content || '';

    const systemPrompt = `You are an expert physiotherapy and rehabilitation clinician assistant specializing in clinical documentation.
Generate professional, evidence-based clinical note content for the ${activeTab} section of a ${noteTypeLabels[selectedType]} note.
Write in first-person clinical narrative. Be concise, specific, and clinically accurate.
If previous content exists, expand and improve it rather than replacing it entirely.
Output ONLY the section content text — no labels, no headings, no preamble.`;

    const userPrompt = `${sectionAIInstructions[activeTab] || `Generate content for the ${activeTab} section.`}

Context:
- Note Type: ${noteTypeLabels[selectedType]}
- Section: ${activeTab}
- Encounter ID: ${encounterId || 'not set'}
- Patient ID: ${patientId || 'not set'}
${currentContent ? `\nExisting content to improve:\n${currentContent}` : ''}`;

    try {
      const { data, error } = await supabase.functions.invoke('openai-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: 600,
          context: {
            encounterId: encounterId || null,
            patientId: patientId || null,
            clinicId: clinicId || null,
            section: activeTab,
            noteType: selectedType,
          },
        },
      });

      if (error) throw new Error(error.message || 'AI generation failed');

      const generated: string =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        data?.message ||
        '';

      if (!generated.trim()) {
        throw new Error('AI returned empty content. Please try again.');
      }

      setSectionContent(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], content: generated.trim(), source: 'ai_assisted' },
      }));

      onSectionEdit?.(activeTab, generated.trim());
      onApplyAIContent?.(activeTab, generated.trim());
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const totalWords = Object.values(sectionContent).reduce(
    (acc, data) => acc + (data.content.trim() ? data.content.trim().split(/\s+/).length : 0),
    0
  );

  const isSectionComplete = (key: string): boolean =>
    (sectionContent[key]?.content?.length || 0) > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700/50">
      {/* Note Type Selector */}
      <div className="p-4 border-b border-slate-700/50">
        <label className="block text-xs font-medium text-slate-400 mb-2">Note Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as NoteType)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(noteTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700/50 overflow-x-auto">
        {soapSections.map((section) => (
          <button
            key={section.key}
            onClick={() => { setActiveTab(section.key); setAiError(null); }}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative
              ${activeTab === section.key
                ? 'text-blue-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
          >
            {section.label}
            {isSectionComplete(section.key) && (
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
              {soapSections.find((s) => s.key === activeTab)?.label}
            </h3>
            <div className="flex items-center gap-2">
              {sectionContent[activeTab]?.source === 'ai_assisted' && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
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

          {/* Source Label */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-3 h-3" />
            <span>
              Source:{' '}
              {sectionContent[activeTab]?.source === 'ai_assisted'
                ? 'AI Assisted — review before signing'
                : sectionContent[activeTab]?.source === 'transcribed'
                ? 'Transcribed'
                : 'Manual Entry'}
            </span>
          </div>

          {/* AI Error */}
          {aiError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{aiError}</p>
            </div>
          )}

          {/* Textarea */}
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
                  : 'border-slate-600'}
                ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
            />

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

          {/* Footer Row */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{sectionContent[activeTab]?.content?.length || 0} characters</span>
            <button
              onClick={handleGenerateAI}
              disabled={!isEditable || isGeneratingAI}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${isEditable && !isGeneratingAI
                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Generate with AI
                </>
              )}
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
          onClick={onValidate}
          disabled={isValidating || !onValidate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Validate Note
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default StructuredNoteEditor;
