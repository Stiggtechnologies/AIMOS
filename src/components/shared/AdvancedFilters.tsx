import React, { useState } from 'react';
import { Filter, X, Save, ChevronDown } from 'lucide-react';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'multiSelect';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValue {
  [key: string]: any;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterValue;
}

interface AdvancedFiltersProps {
  configs: FilterConfig[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onSave?: (name: string, filters: FilterValue) => void;
  savedFilters?: SavedFilter[];
  onLoadSaved?: (filters: FilterValue) => void;
}

export function AdvancedFilters({
  configs,
  values,
  onChange,
  onSave,
  savedFilters = [],
  onLoadSaved
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleChange = (id: string, value: any) => {
    onChange({ ...values, [id]: value });
  };

  const handleClear = () => {
    const clearedValues: FilterValue = {};
    configs.forEach(config => {
      clearedValues[config.id] = config.type === 'multiSelect' ? [] : '';
    });
    onChange(clearedValues);
  };

  const handleSave = () => {
    if (filterName.trim() && onSave) {
      onSave(filterName, values);
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const activeFilterCount = Object.values(values).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  }).length;

  const renderFilterInput = (config: FilterConfig) => {
    const value = values[config.id];

    switch (config.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(config.id, e.target.value)}
            placeholder={config.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(config.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {config.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'multiSelect':
        return (
          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              handleChange(config.id, selected);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            size={Math.min(config.options?.length || 3, 5)}
          >
            {config.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(config.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'dateRange':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) => handleChange(config.id, { ...value, start: e.target.value })}
              placeholder="Start"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) => handleChange(config.id, { ...value, end: e.target.value })}
              placeholder="End"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(config.id, e.target.value)}
            placeholder={config.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center space-x-2">
          {savedFilters.length > 0 && onLoadSaved && (
            <select
              onChange={(e) => {
                const saved = savedFilters.find(f => f.id === e.target.value);
                if (saved) onLoadSaved(saved.filters);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Load saved filter...</option>
              {savedFilters.map(filter => (
                <option key={filter.id} value={filter.id}>{filter.name}</option>
              ))}
            </select>
          )}

          {activeFilterCount > 0 && (
            <>
              {onSave && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              )}
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-1 text-sm"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map(config => (
              <div key={config.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.label}
                </label>
                {renderFilterInput(config)}
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter Preset</h3>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!filterName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
