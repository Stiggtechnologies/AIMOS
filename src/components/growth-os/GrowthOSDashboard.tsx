import { useState } from 'react';
import { TrendingUp, Users, Target, DollarSign, Zap, BookOpen, ArrowLeft } from 'lucide-react';
import MarketingIntelligenceView from './MarketingIntelligenceView';
import IntakePipelineView from './IntakePipelineView';
import ReferralGrowthView from './ReferralGrowthView';
import RevOpsView from './RevOpsView';
import GrowthPlaybooksView from './GrowthPlaybooksView';

type GrowthModule =
  | 'dashboard'
  | 'marketing'
  | 'intake'
  | 'referral'
  | 'revops'
  | 'playbooks';

export default function GrowthOSDashboard() {
  const [activeModule, setActiveModule] = useState<GrowthModule>('dashboard');

  if (activeModule !== 'dashboard') {
    return (
      <div className="p-6">
        <button
          onClick={() => setActiveModule('dashboard')}
          className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Growth OS
        </button>
        {activeModule === 'marketing' && <MarketingIntelligenceView />}
        {activeModule === 'intake' && <IntakePipelineView />}
        {activeModule === 'referral' && <ReferralGrowthView />}
        {activeModule === 'revops' && <RevOpsView />}
        {activeModule === 'playbooks' && <GrowthPlaybooksView />}
      </div>
    );
  }

  const modules = [
    {
      id: 'marketing' as const,
      name: 'Marketing Intelligence',
      description: 'Campaign tracking, lead generation, and ROI analysis',
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500',
      stat: '4 Active Campaigns',
      statColor: 'text-blue-600'
    },
    {
      id: 'intake' as const,
      name: 'Sales & Intake Pipeline',
      description: 'Lead conversion tracking and intake management',
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      stat: '23 Active Leads',
      statColor: 'text-green-600'
    },
    {
      id: 'referral' as const,
      name: 'Referral Growth Engine',
      description: 'Partner relationships and referral expansion',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
      stat: '47 Active Partners',
      statColor: 'text-amber-600'
    },
    {
      id: 'revops' as const,
      name: 'Revenue Operations',
      description: 'Cross-functional revenue intelligence and bottleneck detection',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      stat: '87% Conversion Rate',
      statColor: 'text-emerald-600'
    },
    {
      id: 'playbooks' as const,
      name: 'Growth Playbooks',
      description: 'Local clinic growth campaigns and execution tracking',
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-500',
      stat: '3 Active Playbooks',
      statColor: 'text-violet-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-2 rounded-lg mr-3">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Growth OS</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Complete demand creation to revenue capture system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group border border-gray-200 hover:border-emerald-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-gradient-to-r ${module.gradient} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {module.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {module.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`text-sm font-semibold ${module.statColor}`}>
                  {module.stat}
                </span>
                <span className="text-xs text-gray-500 group-hover:text-emerald-600 transition-colors">
                  View Details →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="bg-emerald-500 p-2 rounded-lg mr-4">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">
              About Growth OS
            </h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              Growth OS is your complete Revenue Operations platform, connecting marketing demand creation
              to revenue capture. Track campaigns, manage intake pipelines, nurture referral partnerships,
              identify bottlenecks, and execute local growth strategies - all in one unified system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
