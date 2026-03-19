import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, Award, CircleAlert as AlertCircle, RefreshCw } from 'lucide-react';
import { researchIntelligenceService, PatientEducationAsset } from '../../services/researchIntelligenceService';
import { PatientProfile } from '../../services/cdsService';

interface PatientEducationPanelProps {
  patientProfile?: PatientProfile;
  readingLevel?: number;
  topicTags?: string[];
}

export const PatientEducationPanel: React.FC<PatientEducationPanelProps> = ({
  patientProfile,
  readingLevel = 10,
  topicTags = []
}) => {
  const [assets, setAssets] = useState<PatientEducationAsset[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEducationAssets();
  }, [readingLevel, topicTags, patientProfile]);

  const loadEducationAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const tags = topicTags.length > 0 ? topicTags : getDefaultTags();
      const educationAssets = await researchIntelligenceService.getEducationAssets({
        readingLevel,
        topicTags: tags,
      });
      setAssets(educationAssets);
    } catch (err) {
      console.error('Error loading education assets:', err);
      setError('Unable to load education materials. Please try again.');
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

  const formatTag = (tag: string) =>
    tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center text-center py-8 gap-3">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button
            onClick={loadEducationAssets}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-white" />
          <div>
            <h3 className="text-white font-bold text-lg">Your Recovery Guide</h3>
            <p className="text-green-100 text-sm">
              {assets.length > 0
                ? `${assets.length} evidence-based resource${assets.length !== 1 ? 's' : ''} for your recovery`
                : 'Evidence-based resources for your condition'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Did you know?</p>
            <p>Understanding your condition helps you recover faster. Read through these materials at your own pace.</p>
          </div>
        </div>

        {assets.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No materials available yet</p>
            <p className="text-sm text-gray-400">Your care team will add resources tailored to your treatment.</p>
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
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{asset.title}</p>
                      {(asset.topic_tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(asset.topic_tags ?? []).slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                            >
                              {formatTag(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                      expandedId === asset.asset_id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === asset.asset_id && (
                  <div className="border-t bg-gray-50 px-4 py-4">
                    <div className="text-sm text-gray-800 space-y-2">
                      {(asset.content_md ?? '').split('\n').filter(Boolean).map((paragraph, idx) => (
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
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Daily Recovery Tips</h4>
          <ul className="text-sm text-yellow-900 space-y-1">
            <li>Do your exercises daily for best results</li>
            <li>Track what movements help your symptoms</li>
            <li>Stay active within your comfortable range</li>
            <li>Contact us if symptoms worsen unexpectedly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
