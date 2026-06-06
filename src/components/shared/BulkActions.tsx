import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Download, Mail, Archive, Tag, MoreHorizontal } from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  onClick: (selectedIds: string[]) => void | Promise<void>;
  confirmMessage?: string;
}

interface BulkActionsProps<T> {
  items: T[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  getItemId: (item: T) => string;
  actions: BulkAction[];
  className?: string;
}

export function BulkActions<T>({
  items,
  selectedIds,
  onSelectionChange,
  getItemId,
  actions,
  className = ''
}: BulkActionsProps<T>) {
  const [showConfirm, setShowConfirm] = useState<{ action: BulkAction; show: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(getItemId)));
    }
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.confirmMessage) {
      setShowConfirm({ action, show: true });
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setIsProcessing(true);
    try {
      await action.onClick(Array.from(selectedIds));
      onSelectionChange(new Set());
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
      setShowConfirm(null);
    }
  };

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className={`flex items-center justify-between py-3 px-4 bg-gray-50 border-b border-gray-200 ${className}`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : someSelected ? (
              <div className="w-5 h-5 border-2 border-blue-600 rounded flex items-center justify-center bg-blue-100">
                <div className="w-2 h-2 bg-blue-600 rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `Select all ${items.length}`}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <div className="h-5 w-px bg-gray-300" />
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-2">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses(action.variant)}`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-6">{showConfirm.action.confirmMessage}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(showConfirm.action)}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-lg disabled:opacity-50 ${getVariantClasses(showConfirm.action.variant)}`}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'danger',
    onClick: onDelete,
    confirmMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.'
  }),

  archive: (onArchive: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    variant: 'default',
    onClick: onArchive
  }),

  export: (onExport: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    variant: 'default',
    onClick: onExport
  }),

  email: (onEmail: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: 'email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    variant: 'default',
    onClick: onEmail
  }),

  tag: (onTag: (ids: string[]) => void | Promise<void>): BulkAction => ({
    id: 'tag',
    label: 'Add Tags',
    icon: <Tag className="w-4 h-4" />,
    variant: 'default',
    onClick: onTag
  })
};
