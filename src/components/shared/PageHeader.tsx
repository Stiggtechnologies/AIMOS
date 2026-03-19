import { type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface BadgeConfig {
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'teal';
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  badge?: BadgeConfig;
  onRefresh?: () => void;
  loading?: boolean;
  breadcrumb?: Breadcrumb[];
}

const BADGE_COLORS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
  teal: 'bg-teal-50 text-teal-700 border border-teal-200',
};

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  badge,
  onRefresh,
  loading,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="mt-0.5 flex-shrink-0 text-gray-500">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mb-1">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 text-xs">/</span>}
                  {crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
            {badge && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_COLORS[badge.color ?? 'gray']}`}>
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

export default PageHeader;
