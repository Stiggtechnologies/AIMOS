import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Clock, Plug, RefreshCw } from 'lucide-react';
import type { IntegrationConfig } from '../../services/aimAutomationService';

const INTEGRATION_META: Record<string, { label: string; description: string; category: string }> = {
  facebook_ads: { label: 'Facebook Ads', description: 'Lead generation, campaign management, and conversion tracking', category: 'Paid Advertising' },
  instagram: { label: 'Instagram', description: 'Organic content posting and story publishing', category: 'Social Media' },
  linkedin: { label: 'LinkedIn', description: 'Professional content, employer program outreach', category: 'Social Media' },
  google_business: { label: 'Google Business Profile', description: 'Review management, posts, and local SEO', category: 'Local Presence' },
  tiktok: { label: 'TikTok', description: 'Short-form video content and lead forms', category: 'Social Media' },
  google_ads: { label: 'Google Ads', description: 'Search and display advertising, conversion uploads', category: 'Paid Advertising' },
  n8n: { label: 'n8n Orchestration', description: 'Workflow automation and trigger management', category: 'Automation' },
  openai: { label: 'OpenAI', description: 'AI-powered content generation and analysis', category: 'AI / Intelligence' },
};

const STATUS_CONFIG = {
  connected: { label: 'Connected', color: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500', icon: CheckCircle },
  disconnected: { label: 'Disconnected', color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400', icon: XCircle },
  error: { label: 'Error', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500', icon: AlertCircle },
  pending: { label: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: Clock },
};

interface IntegrationsViewProps {
  configs: IntegrationConfig[];
  loading: boolean;
}

export default function IntegrationsView({ configs, loading }: IntegrationsViewProps) {
  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const categories = Array.from(
    new Set(Object.values(INTEGRATION_META).map(m => m.category))
  );

  const byCategory = (cat: string) => {
    const names = Object.entries(INTEGRATION_META)
      .filter(([, m]) => m.category === cat)
      .map(([name]) => name);

    return configs
      .filter(c => names.includes(c.integration_name))
      .sort((a, b) => a.integration_name.localeCompare(b.integration_name));
  };

  const allConfigs = configs;
  const connectedCount = allConfigs.filter(c => c.status === 'connected').length;
  const errorCount = allConfigs.filter(c => c.status === 'error').length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Connected', value: connectedCount, color: 'text-green-600' },
          { label: 'Errors', value: errorCount, color: errorCount > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Total', value: allConfigs.length, color: 'text-gray-900' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {categories.map(cat => {
        const catConfigs = byCategory(cat);
        if (catConfigs.length === 0) return null;

        return (
          <div key={cat} className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {catConfigs.map(config => {
                const meta = INTEGRATION_META[config.integration_name];
                const statusCfg = STATUS_CONFIG[config.status];
                const Icon = statusCfg.icon;

                return (
                  <div
                    key={config.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 ${config.status === 'error' ? 'border-red-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${statusCfg.color}`}>
                          <Plug className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{meta?.label ?? config.integration_name}</p>
                          <p className="text-xs text-gray-500">{config.aim_locations?.name}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </div>
                    </div>

                    {meta && <p className="text-xs text-gray-500 mb-3">{meta.description}</p>}

                    {config.error_message && (
                      <div className="p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700 mb-3">
                        {config.error_message}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {config.last_verified_at ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          {new Date(config.last_verified_at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span>Never verified</span>
                      )}
                      {config.status === 'error' && (
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Reconnect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {allConfigs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Plug className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No integrations configured</p>
          <p className="text-sm text-gray-400 mt-1">Select a location to view its integrations</p>
        </div>
      )}
    </div>
  );
}
