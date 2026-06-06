import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import { researchIntelligenceService, EvidenceClaim, ClinicalRule } from '../../services/researchIntelligenceService';
import { SemanticSearchPanel } from './SemanticSearchPanel';
import { supabase } from '../../lib/supabase';

type TabType = 'claims' | 'rules' | 'pathways' | 'assets' | 'semantic_search';

export const EvidenceLibraryAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('claims');
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [rules, setRules] = useState<ClinicalRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'claims') {
        const data = await researchIntelligenceService.searchClaims({ status: filterStatus });
        setClaims(data);
      } else if (activeTab === 'rules') {
        const { data, error } = await supabase
          .from('clinical_rules')
          .select('*')
          .order('priority', { ascending: true });

        if (!error) {
          setRules(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('evidence_claims')
        .update({ status: 'approved' })
        .eq('claim_id', claimId);

      if (!error) {
        loadData();
      }
    } catch (error) {
      console.error('Error approving claim:', error);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      const { error } = await supabase
        .from('evidence_claims')
        .update({ status: 'rejected' })
        .eq('claim_id', claimId);

      if (!error) {
        loadData();
      }
    } catch (error) {
      console.error('Error rejecting claim:', error);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        const { error } = await supabase
          .from('evidence_claims')
          .delete()
          .eq('claim_id', claimId);

        if (!error) {
          loadData();
        }
      } catch (error) {
        console.error('Error deleting claim:', error);
      }
    }
  };

  const filteredClaims = claims.filter(claim =>
    claim.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.clinical_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Evidence Library Management</h2>
        <p className="text-gray-600">Manage research sources, claims, rules, and educational assets</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['claims', 'rules', 'pathways', 'assets', 'semantic_search'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'semantic_search' ? 'Evidence Discovery' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Controls */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {activeTab === 'claims' && (
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-600">Loading claims...</div>
            ) : filteredClaims.length === 0 ? (
              <div className="p-6 text-center text-gray-600">No claims found</div>
            ) : (
              filteredClaims.map(claim => (
                <div key={claim.claim_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {claim.status === 'approved' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {claim.status === 'needs_review' && (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                          claim.status === 'needs_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {claim.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">{claim.claim_text}</p>
                      <div className="flex gap-2 flex-wrap">
                        {claim.clinical_tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button className="p-2 text-gray-600 hover:bg-gray-200 rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClaim(claim.claim_id)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-600 mb-3">
                    <span>Evidence: {claim.evidence_level}</span>
                    <span>Confidence: {(claim.confidence_score * 100).toFixed(0)}%</span>
                  </div>

                  {claim.status === 'needs_review' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveClaim(claim.claim_id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClaim(claim.claim_id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-600">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="p-6 text-center text-gray-600">No rules found</div>
            ) : (
              rules.map(rule => (
                <div key={rule.rule_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{rule.rule_name}</h4>
                        {rule.is_active && (
                          <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.recommendation_text}</p>
                      <p className="text-xs text-gray-500">Priority: {rule.priority}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-200 rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Semantic Search Tab */}
        {activeTab === 'semantic_search' && (
          <div className="p-6">
            <SemanticSearchPanel />
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === 'pathways' || activeTab === 'assets') && (
          <div className="p-6 text-center text-gray-600">
            {activeTab === 'pathways' ? 'Care pathway management' : 'Patient education asset management'} coming soon
          </div>
        )}
      </div>
    </div>
  );
};
