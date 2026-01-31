import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, Award, AlertCircle } from 'lucide-react';
import { researchIntelligenceService, PatientEducationAsset } from '../../services/researchIntelligenceService';
import { PatientProfile } from '../../services/cdsService';

interface PatientEducationPanelProps {
  patientProfile?: PatientProfile;
  readingLevel?: number;
  topicTags?: string[];
}

export const PatientEducationPanel: React.FC<PatientEducationPanelProps> = ({
  patientProfile,
  readingLevel = 6,
  topicTags = []
}) => {
  const [assets, setAssets] = useState<PatientEducationAsset[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEducationAssets();
  }, [readingLevel, topicTags, patientProfile]);

  const loadEducationAssets = async () => {
    setLoading(true);
    try {
      const tags = topicTags.length > 0 ? topicTags : getDefaultTags();
      const educationAssets = await researchIntelligenceService.getEducationAssets({
        readingLevel,
        topicTags: tags
      });
      setAssets(educationAssets);
    } catch (error) {
      console.error('Error loading education assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTags = (): string[] => {
    const tags: string[] = [];

    if (patientProfile?.region === 'lumbar') {
      tags.push('lumbar');
    } else if (patientProfile?.region === 'cervical') {
      tags.push('cervical');
    }

    if (patientProfile?.centralization) {
      tags.push('centralization');
    }

    if (patientProfile?.acuity === 'chronic') {
      tags.push('chronic_pain');
    }

    tags.push('self_management');

    return tags;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-white" />
          <div>
            <h3 className="text-white font-bold text-lg">Your Recovery Guide</h3>
            <p className="text-green-100 text-sm">Evidence-based resources for your condition</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Did you know?</p>
            <p>Understanding your condition helps you recover faster. Read through these materials at your own pace.</p>
          </div>
        </div>

        {/* Education Assets */}
        {assets.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No educational materials available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => (
              <div
                key={asset.asset_id}
                className="border rounded-lg overflow-hidden hover:border-green-400 transition-colors"
              >
                <button
                  onClick={() => setExpandedId(expandedId === asset.asset_id ? null : asset.asset_id)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{asset.title}</p>
                      <div className="flex gap-2 mt-1">
                        {asset.topic_tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${
                      expandedId === asset.asset_id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === asset.asset_id && (
                  <div className="border-t bg-gray-50 px-4 py-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm text-gray-800 space-y-3">
                        {asset.content_md.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {asset.contraindications_banner && (
                        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-800">
                          <p className="font-semibold mb-1">Important:</p>
                          <p>{asset.contraindications_banner}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700 transition-colors">
                        Save for Later
                      </button>
                      <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-white transition-colors">
                        Print or Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recovery Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Daily Recovery Tips</h4>
          <ul className="text-sm text-yellow-900 space-y-1">
            <li>✓ Do your exercises daily for best results</li>
            <li>✓ Track what movements help your symptoms</li>
            <li>✓ Stay active within your comfortable range</li>
            <li>✓ Contact us if symptoms worsen unexpectedly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
