import React, { useState } from 'react';
import { Plus, Save, X, ChevronRight, FileText } from 'lucide-react';
import { EvidenceOverlay } from '../aim-os/EvidenceOverlay';
import { PatientProfile } from '../../services/cdsService';

interface ChartingNote {
  timestamp: string;
  type: 'assessment' | 'intervention' | 'progress';
  content: string;
  findings?: string[];
}

interface ClinicalChartingProps {
  patientId: string;
  patientProfile: PatientProfile;
  onSave?: (note: ChartingNote) => void;
}

export const ClinicalChartingWorkflow: React.FC<ClinicalChartingProps> = ({
  patientProfile,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'intervention' | 'progress'>('assessment');
  const [noteContent, setNoteContent] = useState('');
  const [findings, setFindings] = useState<string[]>([]);
  const [newFinding, setNewFinding] = useState('');
  const [showEvidencePanel, setShowEvidencePanel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddFinding = () => {
    if (newFinding.trim()) {
      setFindings([...findings, newFinding]);
      setNewFinding('');
    }
  };

  const handleRemoveFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    setIsSaving(true);
    try {
      const note: ChartingNote = {
        timestamp: new Date().toISOString(),
        type: activeTab,
        content: noteContent,
        findings,
      };

      if (onSave) {
        await onSave(note);
      }

      setNoteContent('');
      setFindings([]);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const tabLabels = {
    assessment: 'Initial Assessment',
    intervention: 'Intervention Notes',
    progress: 'Progress Report',
  };

  return (
    <div className="h-full flex gap-6">
      {/* Main Charting Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Clinical Charting</h2>
          <p className="text-gray-600 text-sm mt-1">Document patient assessment, interventions, and progress with evidence guidance</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['assessment', 'intervention', 'progress'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Findings Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-900">Key Findings</label>
              <span className="text-xs text-gray-600">{findings.length} findings</span>
            </div>

            <div className="space-y-2">
              {findings.map((finding, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 flex-1">{finding}</span>
                  <button
                    onClick={() => handleRemoveFinding(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFinding}
                onChange={e => setNewFinding(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddFinding()}
                placeholder="Add a clinical finding..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddFinding}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          {/* Note Content */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">Clinical Notes</label>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder={`Document your ${activeTab} findings, observations, and clinical impressions...`}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{noteContent.length} characters</span>
              <span>Auto-saved every 30 seconds</span>
            </div>
          </div>

          {/* Related Standards */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Documentation Standards</h4>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Include objective findings and measurements</li>
              <li>• Document patient-reported outcomes and goals</li>
              <li>• Note any contraindications or precautions</li>
              <li>• Reference clinical rules when applicable</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveNote}
            disabled={isSaving || !noteContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Evidence Panel */}
      {showEvidencePanel && (
        <div className="w-96 flex flex-col">
          <button
            onClick={() => setShowEvidencePanel(false)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex-1 overflow-auto">
            <EvidenceOverlay
              patientProfile={patientProfile}
              onSelectPathway={(pathwayId) => {
                console.log('Selected pathway:', pathwayId);
              }}
              onSelectEducation={(assetId) => {
                console.log('Selected education:', assetId);
              }}
            />
          </div>
        </div>
      )}

      {/* Minimize Button */}
      {!showEvidencePanel && (
        <button
          onClick={() => setShowEvidencePanel(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-lg shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="Show Evidence Overlay"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};
