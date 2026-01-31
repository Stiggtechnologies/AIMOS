import React, { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';
import { cdsService, PatientProfile, CDSRecommendation } from '../../services/cdsService';
import { researchIntelligenceService } from '../../services/researchIntelligenceService';

interface EvidenceOverlayProps {
  patientProfile: PatientProfile;
  onSelectPathway?: (pathwayId: string) => void;
  onSelectEducation?: (assetId: string) => void;
}

export const EvidenceOverlay: React.FC<EvidenceOverlayProps> = ({
  patientProfile,
  onSelectPathway,
  onSelectEducation
}) => {
  const [recommendations, setRecommendations] = useState<CDSRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [patientProfile]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await cdsService.getRecommendations(patientProfile);
      setRecommendations(recs);
      const alerts = cdsService.getSafetyAlerts(patientProfile);
      setSafetyAlerts(alerts);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCitations = async (claimId: string) => {
    const citations = await researchIntelligenceService.getClaimCitations(claimId);
    alert(`Citations: ${JSON.stringify(citations, null, 2)}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-white font-bold text-lg">Evidence Overlay</h3>
        <p className="text-blue-100 text-sm mt-1">Matched MDT evidence for current findings</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Safety Alerts */}
        {safetyAlerts.length > 0 && (
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Safety Alerts</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {safetyAlerts.map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Patient Signals */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3">Current Signals</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Centralization:</span>
              <span className={`font-semibold ${patientProfile.centralization ? 'text-green-600' : 'text-gray-600'}`}>
                {patientProfile.centralization ? 'Present' : patientProfile.centralization === false ? 'Absent' : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Directional Preference:</span>
              <span className="font-semibold text-gray-900">{patientProfile.directional_preference || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Region:</span>
              <span className="font-semibold text-gray-900">{patientProfile.region}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Acuity:</span>
              <span className="font-semibold text-gray-900">{patientProfile.acuity}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Recommendations</h4>

          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">No recommendations available for current profile.</p>
          ) : (
            recommendations.map((rec, idx) => (
              <div key={idx} className="border rounded-lg hover:border-blue-400 transition-colors">
                <button
                  onClick={() => setExpandedRule(expandedRule === rec.title ? null : rec.title)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    {rec.type === 'rule' && <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                    {rec.type === 'education' && <BookOpen className="h-5 w-5 text-green-600 flex-shrink-0" />}
                    {rec.type === 'pathway' && <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{rec.type}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedRule === rec.title ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedRule === rec.title && (
                  <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Clinician Guidance:</p>
                      <p className="text-sm text-gray-800">{rec.clinicianText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Patient Explanation:</p>
                      <p className="text-sm text-gray-800">{rec.patientText}</p>
                    </div>

                    {rec.linkedClaims && rec.linkedClaims.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Supporting Evidence:</p>
                        {rec.linkedClaims.map((claim) => (
                          <div key={claim.claim_id} className="text-xs bg-white p-2 rounded border border-gray-200 mb-2">
                            <p className="text-gray-900 font-medium mb-1">{claim.claim_text}</p>
                            <div className="flex items-center justify-between text-gray-600">
                              <span>{claim.evidence_level}</span>
                              <button
                                onClick={() => handleViewCitations(claim.claim_id)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Show Trace
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors">
            Apply to Plan
          </button>
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50 transition-colors">
            Share with Patient
          </button>
        </div>
      </div>
    </div>
  );
};
