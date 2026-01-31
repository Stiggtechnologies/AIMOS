import { Activity, Building2, TrendingUp, DollarSign, AlertCircle, FileText, Heart, AlertTriangle, Database, GitMerge, Lightbulb, Layers, Receipt, Package, Smile, Shield, Coins, Target, ShieldAlert, Award, BarChart3, Wallet, LineChart, Calendar } from 'lucide-react';
import { useState } from 'react';
import ClinicalQualityView from './ClinicalQualityView';
import ReferralIntelligenceView from './ReferralIntelligenceView';
import ExecutiveIntelligenceView from './ExecutiveIntelligenceView';
import ExecutiveAnalyticsView from './ExecutiveAnalyticsView';
import UtilizationView from './UtilizationView';
import IncidentResolutionView from './IncidentResolutionView';
import AIGovernanceView from './AIGovernanceView';
import WorkforceHealthView from './WorkforceHealthView';
import ClinicIntegrationView from './ClinicIntegrationView';
import EmergencyView from './EmergencyView';
import FinancialView from './FinancialView';
import MetaSystemsView from './MetaSystemsView';
import PricingPayerView from './PricingPayerView';
import ServicePortfolioView from './ServicePortfolioView';
import ExperienceReputationView from './ExperienceReputationView';
import VendorRiskView from './VendorRiskView';
import CapitalAllocationView from './CapitalAllocationView';
import StrategyOKRView from './StrategyOKRView';
import InternalControlsView from './InternalControlsView';
import ValuationReadinessView from './ValuationReadinessView';
import RevenueAnalyticsView from './RevenueAnalyticsView';
import CashFlowView from './CashFlowView';
import SchedulerView from './SchedulerView';
import { AdminSeedContentPage } from '../admin/AdminSeedContentPage';

type ModuleView = 'dashboard' | 'scheduler' | 'executive_intelligence' | 'executive_analytics' | 'clinical_quality' | 'referrals' | 'utilization' | 'financial' | 'revenue_analytics' | 'cash_flow' | 'incidents' | 'governance' | 'workforce' | 'emergency' | 'data_gov' | 'integrations' | 'meta_systems' | 'pricing_payer' | 'service_portfolio' | 'experience_reputation' | 'vendor_risk' | 'capital_allocation' | 'strategy_okr' | 'internal_controls' | 'valuation_readiness' | 'admin_seed';

export default function AIMOSDashboard() {
  const [activeView, setActiveView] = useState<ModuleView>('dashboard');

  const modules = [
    {
      id: 'scheduler' as ModuleView,
      name: 'Scheduler',
      description: 'AI-powered scheduling intelligence',
      icon: Calendar,
      color: 'blue',
      stats: { label: 'Today', value: '24 appts' }
    },
    {
      id: 'executive_intelligence' as ModuleView,
      name: 'Executive Intelligence',
      description: 'Real-time insights and performance signals',
      icon: Lightbulb,
      color: 'amber',
      stats: { label: 'Active Alerts', value: '3' }
    },
    {
      id: 'executive_analytics' as ModuleView,
      name: 'Executive Analytics',
      description: 'Cross-module analytics & reporting',
      icon: LineChart,
      color: 'indigo',
      stats: { label: 'Health Score', value: '85.2' }
    },
    {
      id: 'clinical_quality' as ModuleView,
      name: 'Clinical Quality & Outcomes',
      description: 'Track and benchmark clinical outcomes',
      icon: Activity,
      color: 'blue',
      stats: { label: 'Tracked Episodes', value: '1,234' }
    },
    {
      id: 'referrals' as ModuleView,
      name: 'Referral Intelligence',
      description: 'Protect referral-driven revenue',
      icon: Building2,
      color: 'green',
      stats: { label: 'Active Sources', value: '47' }
    },
    {
      id: 'utilization' as ModuleView,
      name: 'Utilization & Leakage',
      description: 'Identify capacity loss',
      icon: TrendingUp,
      color: 'purple',
      stats: { label: 'Avg Utilization', value: '87%' }
    },
    {
      id: 'financial' as ModuleView,
      name: 'Financial Signals',
      description: 'Executive-grade insights',
      icon: DollarSign,
      color: 'emerald',
      stats: { label: 'Revenue/Visit', value: '$184' }
    },
    {
      id: 'revenue_analytics' as ModuleView,
      name: 'Revenue Analytics',
      description: 'Service mix & revenue breakdown',
      icon: BarChart3,
      color: 'blue',
      stats: { label: 'Total Revenue', value: '$337K' }
    },
    {
      id: 'cash_flow' as ModuleView,
      name: 'Cash Flow',
      description: 'Banking & liquidity management',
      icon: Wallet,
      color: 'green',
      stats: { label: 'Current Balance', value: '$9.1K' }
    },
    {
      id: 'pricing_payer' as ModuleView,
      name: 'Pricing & Payers',
      description: 'Protect margin at the source',
      icon: Receipt,
      color: 'teal',
      stats: { label: 'Active Contracts', value: '5' }
    },
    {
      id: 'service_portfolio' as ModuleView,
      name: 'Service Portfolio',
      description: 'Prevent accidental growth',
      icon: Package,
      color: 'sky',
      stats: { label: 'Active Services', value: '8' }
    },
    {
      id: 'experience_reputation' as ModuleView,
      name: 'Experience & Reputation',
      description: 'Experience drives referrals',
      icon: Smile,
      color: 'pink',
      stats: { label: 'NPS Score', value: '72' }
    },
    {
      id: 'incidents' as ModuleView,
      name: 'Incident Resolution',
      description: 'Root cause → action → resolution',
      icon: AlertCircle,
      color: 'orange',
      stats: { label: 'Open Actions', value: '12' }
    },
    {
      id: 'governance' as ModuleView,
      name: 'Knowledge Governance',
      description: 'Prevent SOP drift',
      icon: FileText,
      color: 'indigo',
      stats: { label: 'Documents', value: '342' }
    },
    {
      id: 'workforce' as ModuleView,
      name: 'Workforce Health',
      description: 'Reduce burnout risk',
      icon: Heart,
      color: 'pink',
      stats: { label: 'High Risk', value: '3' }
    },
    {
      id: 'vendor_risk' as ModuleView,
      name: 'Vendor Risk',
      description: 'Clinics fail through vendors, not staff',
      icon: Shield,
      color: 'slate',
      stats: { label: 'SPOFs', value: '2' }
    },
    {
      id: 'emergency' as ModuleView,
      name: 'Emergency Mode',
      description: 'Business continuity',
      icon: AlertTriangle,
      color: 'red',
      stats: { label: 'Active Events', value: '0' }
    },
    {
      id: 'data_gov' as ModuleView,
      name: 'AI Readiness',
      description: 'Prepare for AI agents',
      icon: Database,
      color: 'cyan',
      stats: { label: 'AI-Safe Fields', value: '892' }
    },
    {
      id: 'integrations' as ModuleView,
      name: 'M&A & Acquisitions',
      description: 'Day 0/30/90 integration tracking',
      icon: GitMerge,
      color: 'violet',
      stats: { label: 'Active', value: '4' }
    },
    {
      id: 'capital_allocation' as ModuleView,
      name: 'Capital Allocation',
      description: 'PE-grade investment governance',
      icon: Coins,
      color: 'green',
      stats: { label: 'ROI', value: '24%' }
    },
    {
      id: 'strategy_okr' as ModuleView,
      name: 'Strategy & OKRs',
      description: 'Prevents execution drift at scale',
      icon: Target,
      color: 'blue',
      stats: { label: 'On Track', value: '87%' }
    },
    {
      id: 'internal_controls' as ModuleView,
      name: 'Internal Controls',
      description: 'Fraud prevention & duty segregation',
      icon: ShieldAlert,
      color: 'red',
      stats: { label: 'Violations', value: '0' }
    },
    {
      id: 'valuation_readiness' as ModuleView,
      name: 'Exit & Valuation',
      description: 'Maximize enterprise value & multiples',
      icon: Award,
      color: 'emerald',
      stats: { label: 'Readiness', value: '78%' }
    },
    {
      id: 'meta_systems' as ModuleView,
      name: 'Meta Systems',
      description: 'Strategic governance & readiness',
      icon: Layers,
      color: 'slate',
      stats: { label: 'Systems', value: '10' }
    },
    {
      id: 'admin_seed' as ModuleView,
      name: 'Admin Seed Content',
      description: 'Populate demo and reference data',
      icon: Database,
      color: 'cyan',
      stats: { label: 'Tasks', value: '5' }
    }
  ];

  const colorClasses = {
    amber: 'from-amber-500 to-amber-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600',
    violet: 'from-violet-500 to-violet-600',
    slate: 'from-slate-500 to-slate-600',
    teal: 'from-teal-500 to-teal-600',
    sky: 'from-sky-500 to-sky-600'
  };

  if (activeView === 'scheduler') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <SchedulerView />
      </div>
    );
  }

  if (activeView === 'executive_intelligence') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ExecutiveIntelligenceView />
      </div>
    );
  }

  if (activeView === 'executive_analytics') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ExecutiveAnalyticsView />
      </div>
    );
  }

  if (activeView === 'clinical_quality') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ClinicalQualityView />
      </div>
    );
  }

  if (activeView === 'referrals') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ReferralIntelligenceView />
      </div>
    );
  }

  if (activeView === 'utilization') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <UtilizationView />
      </div>
    );
  }

  if (activeView === 'financial') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <FinancialView />
      </div>
    );
  }

  if (activeView === 'revenue_analytics') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <RevenueAnalyticsView />
      </div>
    );
  }

  if (activeView === 'cash_flow') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <CashFlowView />
      </div>
    );
  }

  if (activeView === 'incidents') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <IncidentResolutionView />
      </div>
    );
  }

  if (activeView === 'governance') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <AIGovernanceView />
      </div>
    );
  }

  if (activeView === 'workforce') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <WorkforceHealthView />
      </div>
    );
  }

  if (activeView === 'emergency') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <EmergencyView />
      </div>
    );
  }

  if (activeView === 'integrations') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ClinicIntegrationView />
      </div>
    );
  }

  if (activeView === 'meta_systems') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <MetaSystemsView />
      </div>
    );
  }

  if (activeView === 'pricing_payer') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <PricingPayerView />
      </div>
    );
  }

  if (activeView === 'service_portfolio') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ServicePortfolioView />
      </div>
    );
  }

  if (activeView === 'experience_reputation') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ExperienceReputationView />
      </div>
    );
  }

  if (activeView === 'vendor_risk') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <VendorRiskView />
      </div>
    );
  }

  if (activeView === 'capital_allocation') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <CapitalAllocationView />
      </div>
    );
  }

  if (activeView === 'strategy_okr') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <StrategyOKRView />
      </div>
    );
  }

  if (activeView === 'internal_controls') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <InternalControlsView />
      </div>
    );
  }

  if (activeView === 'valuation_readiness') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <ValuationReadinessView />
      </div>
    );
  }

  if (activeView === 'admin_seed') {
    return (
      <div>
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <AdminSeedContentPage />
      </div>
    );
  }

  if (activeView !== 'dashboard') {
    return (
      <div className="p-6">
        <button onClick={() => setActiveView('dashboard')} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Back to AIM OS
        </button>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This module is available. Full UI implementation coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AIM Operating System</h1>
        <p className="text-gray-600 mt-2">Enterprise-grade operating modules for multi-clinic management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveView(module.id)}
            className="text-left bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-2 border-transparent hover:border-gray-200"
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[module.color as keyof typeof colorClasses]} mb-4`}>
              <module.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{module.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">{module.stats.label}</span>
              <span className="text-sm font-semibold text-gray-900">{module.stats.value}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">About AIM OS</h2>
        <p className="text-sm text-blue-800 leading-relaxed">
          AIM Operating System provides enterprise-grade capabilities for multi-clinic healthcare operations.
          Each module is designed to be secure, scalable, PHIPA/PIPEDA-aligned, and AI-ready for future agent integration.
        </p>
      </div>
    </div>
  );
}
