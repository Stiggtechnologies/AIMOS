import type { ModuleKey } from '../../types/enterprise';
import { useAuth } from '../../contexts/AuthContext';

import { CommandCenter, ExecutiveCommandCenter, ClinicCommandCenter, ClinicianCommandCenter, RegionalOpsCommandCenter, RevenueCycleCommandCenter, GrowthCommandCenter } from '../command-center';
import { NotificationsCenter } from '../NotificationsCenter';
import AIAssistantDashboard from '../AIAssistantDashboard';

import OperationsEngineView from '../operations/OperationsEngineView';
import SchedulerView from '../aim-os/SchedulerView';
import StaffingView from '../operations/StaffingView';
import CapacityView from '../operations/CapacityView';
import LaunchManagementDashboard from '../launches/LaunchManagementDashboard';
import PartnerClinicsView from '../partners/PartnerClinicsView';
import AfterHoursView from '../after-hours/AfterHoursView';
import CommunicationsView from '../communications/CommunicationsView';

import { ClinicalIntelligenceDashboard } from '../aim-os/ClinicalIntelligenceDashboard';
import ClinicianMobileDashboard from '../clinician/ClinicianMobileDashboard';
import ClinicalQualityView from '../aim-os/ClinicalQualityView';
import { ClinicalChartingWorkflow } from '../clinician/ClinicalChartingWorkflow';
import PatientPortalDashboard from '../patient/PatientPortalDashboard';

import FinancialView from '../aim-os/FinancialView';
import CashFlowView from '../aim-os/CashFlowView';
import RevenueAnalyticsView from '../aim-os/RevenueAnalyticsView';
import PricingPayerView from '../aim-os/PricingPayerView';
import RevenueReportImport from '../operations/RevenueReportImport';

import GrowthOSDashboard from '../growth-os/GrowthOSDashboard';
import IntakePipelineView from '../growth-os/IntakePipelineView';
import MarketingIntelligenceView from '../growth-os/MarketingIntelligenceView';
import ReferralGrowthView from '../growth-os/ReferralGrowthView';
import RevOpsView from '../growth-os/RevOpsView';
import GrowthPlaybooksView from '../growth-os/GrowthPlaybooksView';
import CRMDashboard from '../crm/CRMDashboard';
import CallTrackingView from '../call-tracking/CallTrackingView';

import ExecutiveAnalyticsView from '../aim-os/ExecutiveAnalyticsView';
import ExecutiveIntelligenceView from '../aim-os/ExecutiveIntelligenceView';
import ReferralIntelligenceView from '../aim-os/ReferralIntelligenceView';
import UtilizationView from '../aim-os/UtilizationView';
import { AgentExecutionDashboard } from '../agents/AgentExecutionDashboard';

import StrategyOKRView from '../aim-os/StrategyOKRView';
import ValuationReadinessView from '../aim-os/ValuationReadinessView';
import CapitalAllocationView from '../aim-os/CapitalAllocationView';
import InternalControlsView from '../aim-os/InternalControlsView';
import VendorRiskView from '../aim-os/VendorRiskView';
import { DigitalGovernanceView } from '../digital-governance';

import PeopleView from '../intranet/PeopleView';
import ClinicsView from '../intranet/ClinicsView';
import SOPHubView from '../intranet/SOPHubView';
import FormsView from '../intranet/FormsView';

import AIMOSDashboard from '../aim-os/AIMOSDashboard';

interface ModuleRouterProps {
  currentModule: ModuleKey;
  currentSubModule: string;
  onNavigate: (module: ModuleKey, subModule: string) => void;
}

export function ModuleRouter({ currentModule, currentSubModule, onNavigate }: ModuleRouterProps) {
  const { profile } = useAuth();

  const handleNavigate = (module: string, subModule: string) => {
    onNavigate(module as ModuleKey, subModule);
  };

  const getRoleBasedCommandCenter = () => {
    const role = profile?.role;
    switch (role) {
      case 'executive':
      case 'admin':
        return <ExecutiveCommandCenter onNavigate={handleNavigate} />;
      case 'clinic_manager':
        return <ClinicCommandCenter onNavigate={handleNavigate} />;
      case 'clinician':
        return <ClinicianCommandCenter onNavigate={handleNavigate} />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  switch (currentModule) {
    case 'command_center':
      switch (currentSubModule) {
        case 'notifications':
          return <NotificationsCenter />;
        case 'ai-insights':
          return <AIAssistantDashboard />;
        case 'executive':
          return <ExecutiveCommandCenter onNavigate={handleNavigate} />;
        case 'regional':
          return <RegionalOpsCommandCenter onNavigate={handleNavigate} />;
        case 'clinic':
          return <ClinicCommandCenter onNavigate={handleNavigate} />;
        case 'clinician':
          return <ClinicianCommandCenter onNavigate={handleNavigate} />;
        case 'revenue-cycle':
          return <RevenueCycleCommandCenter onNavigate={handleNavigate} />;
        case 'growth':
          return <GrowthCommandCenter onNavigate={handleNavigate} />;
        default:
          return getRoleBasedCommandCenter();
      }

    case 'operations':
      switch (currentSubModule) {
        case 'schedule':
          return <SchedulerView />;
        case 'staff':
          return <StaffingView />;
        case 'rooms':
        case 'capacity':
          return <CapacityView />;
        case 'launches':
          return <LaunchManagementDashboard />;
        case 'partners':
          return <PartnerClinicsView />;
        case 'after-hours':
          return <AfterHoursView />;
        case 'communications':
          return <CommunicationsView />;
        case 'clinics':
          return <ClinicsView />;
        default:
          return <OperationsEngineView />;
      }

    case 'clinical':
      switch (currentSubModule) {
        case 'patients':
          return <PatientPortalDashboard />;
        case 'visits':
        case 'charting':
          return <ClinicalChartingWorkflow />;
        case 'outcomes':
          return <ClinicalQualityView />;
        case 'intelligence':
          return <ClinicalIntelligenceDashboard />;
        case 'mobile':
          return <ClinicianMobileDashboard />;
        default:
          return <ClinicalIntelligenceDashboard />;
      }

    case 'revenue':
      switch (currentSubModule) {
        case 'import':
          return <RevenueReportImport />;
        case 'cash-flow':
          return <CashFlowView />;
        case 'analytics':
          return <RevenueAnalyticsView />;
        case 'fee-schedules':
        case 'pricing':
          return <PricingPayerView />;
        default:
          return <FinancialView />;
      }

    case 'growth':
      switch (currentSubModule) {
        case 'leads':
        case 'pipeline':
          return <IntakePipelineView />;
        case 'marketing':
          return <MarketingIntelligenceView />;
        case 'referral-sources':
        case 'trainers':
          return <ReferralGrowthView />;
        case 'revops':
          return <RevOpsView />;
        case 'playbooks':
          return <GrowthPlaybooksView />;
        case 'crm':
          return <CRMDashboard />;
        case 'call-tracking':
          return <CallTrackingView />;
        default:
          return <GrowthOSDashboard />;
      }

    case 'intelligence':
      switch (currentSubModule) {
        case 'clinic-performance':
          return <ExecutiveAnalyticsView />;
        case 'clinical-outcomes':
          return <ClinicalQualityView />;
        case 'revenue-analytics':
          return <RevenueAnalyticsView />;
        case 'referral-analytics':
          return <ReferralIntelligenceView />;
        case 'utilization':
          return <UtilizationView />;
        case 'agent-execution':
          return <AgentExecutionDashboard />;
        default:
          return <ExecutiveIntelligenceView />;
      }

    case 'strategy':
      switch (currentSubModule) {
        case 'okrs':
          return <StrategyOKRView />;
        case 'budgets':
        case 'capital':
          return <CapitalAllocationView />;
        case 'controls':
          return <InternalControlsView />;
        case 'valuation':
          return <ValuationReadinessView />;
        case 'risk':
        case 'vendor':
          return <VendorRiskView />;
        case 'governance':
          return <DigitalGovernanceView />;
        default:
          return <StrategyOKRView />;
      }

    case 'admin':
      switch (currentSubModule) {
        case 'users':
          return <PeopleView />;
        case 'sops':
        case 'policies':
          return <SOPHubView />;
        case 'forms':
          return <FormsView />;
        default:
          return <AIMOSDashboard />;
      }

    default:
      return <CommandCenter onNavigate={handleNavigate} />;
  }
}
