import React, { useState } from 'react';
import { Search, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import { semanticSearchService, SearchResult } from '../../services/semanticSearchService';

export const SemanticSearchPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'semantic' | 'outcome'>('semantic');

  const outcomes = [
    'pain',
    'function',
    'disability',
    'RTW',
    'recurrence',
    'satisfaction',
    'utilization',
  ];

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults = await semanticSearchService.semanticSearchClaims(
        searchQuery,
        10,
        0.3
      );
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOutcomeSearch = async () => {
    if (!selectedOutcome) return;

    setLoading(true);
    try {
      const searchResults = await semanticSearchService.searchByOutcome(
        selectedOutcome,
        10
      );
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSemanticSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <h3 className="text-white font-bold text-lg">Evidence Discovery</h3>
        <p className="text-purple-100 text-sm mt-1">Find similar evidence using semantic search</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('semantic')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'semantic'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Semantic Search
          </button>
          <button
            onClick={() => setActiveTab('outcome')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'outcome'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            By Outcome
          </button>
        </div>

        {/* Semantic Search Tab */}
        {activeTab === 'semantic' && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900">
              Search for Similar Evidence
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Describe what you're looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSemanticSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Outcome Search Tab */}
        {activeTab === 'outcome' && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900">
              Filter by Patient Outcome
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((outcome) => (
                <button
                  key={outcome}
                  onClick={() => {
                    setSelectedOutcome(outcome);
                    setLoading(true);
                    semanticSearchService
                      .searchByOutcome(outcome, 10)
                      .then(setResults)
                      .finally(() => setLoading(false));
                  }}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedOutcome === outcome
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {outcome.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Searching evidence...</span>
            </div>
          )}

          {!loading && results.length === 0 && (searchQuery.trim() || selectedOutcome) && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">No relevant evidence found. Try different search terms.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Found {results.length} relevant evidence claims</p>
              {results.map((result) => (
                <div
                  key={result.claim_id}
                  className="border rounded-lg p-4 hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{result.claim_text}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-600">
                        {(result.similarity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-600 mb-2">
                    <span className="bg-gray-100 px-2 py-1 rounded">{result.evidence_level}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Confidence: {(result.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {result.clinical_tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {result.clinical_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {result.clinical_tags.length > 3 && (
                        <span className="text-xs text-gray-600">
                          +{result.clinical_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-900">
          <p className="font-medium mb-1">How it works</p>
          <p>Semantic search uses AI embeddings to find evidence similar in meaning to your query, not just keyword matches.</p>
        </div>
      </div>
    </div>
  );
};
