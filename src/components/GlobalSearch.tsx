import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, FileText, Building, Users, Briefcase, Rocket, HeartPulse } from 'lucide-react';
import { globalSearchService, SearchResult } from '../services/globalSearchService';
import { useAuth } from '../contexts/AuthContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadRecentSearches();
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await globalSearchService.search(query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const loadRecentSearches = async () => {
    if (!user) return;
    try {
      const recent = await globalSearchService.getRecentSearches(user.id);
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    if (user) {
      await globalSearchService.saveSearch(user.id, query);
    }
    onNavigate(result.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'clinic':
        return <Building className="w-5 h-5 text-blue-500" />;
      case 'provider':
        return <HeartPulse className="w-5 h-5 text-green-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'sop':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'job':
        return <Briefcase className="w-5 h-5 text-indigo-500" />;
      case 'candidate':
        return <Users className="w-5 h-5 text-pink-500" />;
      case 'launch':
        return <Rocket className="w-5 h-5 text-red-500" />;
      case 'partner':
        return <Building className="w-5 h-5 text-teal-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'clinic':
        return 'bg-blue-100 text-blue-800';
      case 'provider':
        return 'bg-green-100 text-green-800';
      case 'document':
        return 'bg-purple-100 text-purple-800';
      case 'sop':
        return 'bg-orange-100 text-orange-800';
      case 'job':
        return 'bg-indigo-100 text-indigo-800';
      case 'candidate':
        return 'bg-pink-100 text-pink-800';
      case 'launch':
        return 'bg-red-100 text-red-800';
      case 'partner':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-16 px-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl">
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search clinics, providers, documents, jobs, and more..."
              className="flex-1 ml-3 text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div className="ml-3 flex items-center space-x-1 text-xs text-gray-400">
              <kbd className="px-2 py-1 bg-gray-100 rounded">ESC</kbd>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Searching...</div>
            ) : query.trim().length < 2 ? (
              <div className="p-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.slice(0, 5).map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(search)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Tips</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Use ↑↓ arrows to navigate results</li>
                    <li>• Press Enter to open selected result</li>
                    <li>• Search across clinics, providers, documents, and more</li>
                  </ul>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                      idx === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{result.title}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadgeColor(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600">{result.subtitle}</p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-500 mt-1">{result.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Type to search</span>
              <span>↑↓ to navigate</span>
              <span>↵ to select</span>
            </div>
            <div>
              {results.length > 0 && <span>{results.length} results</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
