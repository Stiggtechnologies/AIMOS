import type { ModuleKey } from '../../types/enterprise';
import { useAuth } from '../../contexts/AuthContext';

// Command Center
import { CommandCenter, ExecutiveCommandCenter, ClinicCommandCenter, ClinicianCommandCenter, RegionalOpsCommandCenter, RevenueCycleCommandCenter, GrowthCommandCenter, NetworkCommandCenter, StrategyCommandCenter } from '../command-center';
import { NotificationsCenter } from '../NotificationsCenter';
import AIAssistantDashboard from '../AIAssistantDashboard';
import AlertsView from '../command-center/AlertsView';
import TasksView from '../command-center/TasksView';

// Operations
import OperationsEngineView from '../operations/OperationsEngineView';
import SchedulerView from '../aim-os/SchedulerView';
import StaffingView from '../operations/StaffingView';
import CapacityView from '../operations/CapacityView';
import LaunchManagementDashboard from '../launches/LaunchManagementDashboard';
import LaunchDetailView from '../launches/LaunchDetailView';
import BranchLaunchReadinessDashboard from '../launches/BranchLaunchReadinessDashboard';
import LaunchPlaybookManager from '../launches/LaunchPlaybookManager';
import NewClinicPerformanceDashboard from '../launches/NewClinicPerformanceDashboard';
import AcquisitionIntegrationDashboard from '../launches/AcquisitionIntegrationDashboard';
import PartnerClinicsView from '../partners/PartnerClinicsView';
import PartnerDashboard from '../partners/PartnerDashboard';
import AfterHoursView from '../after-hours/AfterHoursView';
import CommunicationsView from '../communications/CommunicationsView';
import ClinicsView from '../intranet/ClinicsView';
import CaseAgingView from '../operations/CaseAgingView';
import WorkflowAutomationView from '../operations/WorkflowAutomationView';
import OperationalAIAgentsView from '../operations/OperationalAIAgentsView';
import { ExcellenceDemoView } from '../operations/ExcellenceDemoView';

// Clinical
import { ClinicalIntelligenceDashboard } from '../aim-os/ClinicalIntelligenceDashboard';
import ClinicianMobileDashboard from '../clinician/ClinicianMobileDashboard';
import ClinicalQualityView from '../aim-os/ClinicalQualityView';
import { ClinicalChartingWorkflow } from '../clinician/ClinicalChartingWorkflow';
import PatientPortalDashboard from '../patient/PatientPortalDashboard';
import GymRehabWorkflow from '../clinic/GymRehabWorkflow';
import { PatientEducationPanel } from '../patient/PatientEducationPanel';
import { SemanticSearchPanel } from '../aim-os/SemanticSearchPanel';
import { CIIAutomationDashboard } from '../aim-os/CIIAutomationDashboard';
import { EvidenceLibraryAdmin } from '../aim-os/EvidenceLibraryAdmin';
import CasesView from '../clinical/CasesView';
import AssessmentsView from '../clinical/AssessmentsView';
import TreatmentPlansView from '../clinical/TreatmentPlansView';
import ExerciseProgramsView from '../clinical/ExerciseProgramsView';
import RTWRTSView from '../clinical/RTWRTSView';
import ClinicalDocumentsView from '../clinical/ClinicalDocumentsView';

// Revenue
import FinancialView from '../aim-os/FinancialView';
import CashFlowView from '../aim-os/CashFlowView';
import RevenueAnalyticsView from '../aim-os/RevenueAnalyticsView';
import PricingPayerView from '../aim-os/PricingPayerView';
import RevenueReportImport from '../operations/RevenueReportImport';
import RetailProductsView from '../clinic/RetailProductsView';
import { ExecutiveFinancialDashboard } from '../finance/ExecutiveFinancialDashboard';
import ClaimsView from '../revenue/ClaimsView';
import InvoicesView from '../revenue/InvoicesView';
import PaymentsView from '../revenue/PaymentsView';
import InventoryView from '../revenue/InventoryView';

// Growth
import GrowthOSDashboard from '../growth-os/GrowthOSDashboard';
import IntakePipelineView from '../growth-os/IntakePipelineView';
import MarketingIntelligenceView from '../growth-os/MarketingIntelligenceView';
import ReferralGrowthView from '../growth-os/ReferralGrowthView';
import RevOpsView from '../growth-os/RevOpsView';
import GrowthPlaybooksView from '../growth-os/GrowthPlaybooksView';
import CRMDashboard from '../crm/CRMDashboard';
import CallTrackingView from '../call-tracking/CallTrackingView';
import IntakeConversionView from '../crm/IntakeConversionView';
import DemandAcquisitionView from '../crm/DemandAcquisitionView';
import ExperienceReputationView from '../aim-os/ExperienceReputationView';
import ReviewsView from '../growth/ReviewsView';
import TrainerReferralsView from '../growth/TrainerReferralsView';
import EmployerProgramsView from '../growth/EmployerProgramsView';

// Intelligence
import ExecutiveAnalyticsView from '../aim-os/ExecutiveAnalyticsView';
import ExecutiveIntelligenceView from '../aim-os/ExecutiveIntelligenceView';
import ReferralIntelligenceView from '../aim-os/ReferralIntelligenceView';
import { UtilizationView } from '../aim-os/UtilizationView';
import { AgentExecutionDashboard } from '../agents/AgentExecutionDashboard';
import AgentsView from '../AgentsView';
import AnalyticsView from '../AnalyticsView';
import AcquisitionView from '../intelligence/AcquisitionView';
import ForecastingView from '../intelligence/ForecastingView';
import ReportsView from '../intelligence/ReportsView';
import BenchmarkingView from '../intelligence/BenchmarkingView';

// Strategy
import StrategyOKRView from '../aim-os/StrategyOKRView';
import ValuationReadinessView from '../aim-os/ValuationReadinessView';
import CapitalAllocationView from '../aim-os/CapitalAllocationView';
import InternalControlsView from '../aim-os/InternalControlsView';
import VendorRiskView from '../aim-os/VendorRiskView';
import InitiativesView from '../strategy/InitiativesView';
import ExpansionPipelineView from '../strategy/ExpansionPipelineView';
import BudgetsView from '../strategy/BudgetsView';
import ForecastsView from '../strategy/ForecastsView';
import { DigitalGovernanceView } from '../digital-governance';
import AIGovernanceView from '../aim-os/AIGovernanceView';

// Workforce
import PeopleView from '../intranet/PeopleView';
import CandidatePipeline from '../CandidatePipeline';
import JobsView from '../JobsView';
import CredentialsView from '../operations/CredentialsView';
import AcademyView from '../intranet/AcademyView';
import WorkforceHealthView from '../aim-os/WorkforceHealthView';
import OrgStructureView from '../workforce/OrgStructureView';
import RecruitingView from '../workforce/RecruitingView';
import TalentDashboard from '../Dashboard';

// Supply Chain
import { ProcurementDashboard } from '../procurement/ProcurementDashboard';
import { QuickPurchaseRequest } from '../procurement/QuickPurchaseRequest';

// Enterprise OS
import { ScorecardEngine } from '../enterprise-os/ScorecardEngine';
import { GoalCascadeEngine } from '../enterprise-os/GoalCascadeEngine';
import { MeetingCadenceEngine } from '../enterprise-os/MeetingCadenceEngine';
import { KPIGovernanceView } from '../enterprise-os/KPIGovernanceView';
import { FHIREventBusView } from '../enterprise-os/FHIREventBusView';

// Patient Experience
import PatientExperienceDashboard from '../patient-experience/PatientExperienceDashboard';

// Admin
import SOPHubView from '../intranet/SOPHubView';
import FormsView from '../intranet/FormsView';
import ServicePortfolioView from '../aim-os/ServicePortfolioView';
import ClinicIntegrationView from '../aim-os/ClinicIntegrationView';
import AIMOSDashboard from '../aim-os/AIMOSDashboard';
import AnnouncementsView from '../intranet/AnnouncementsView';
import DocumentLibraryView from '../intranet/DocumentLibraryView';
import ComplianceView from '../intranet/ComplianceView';
import DashboardsView from '../intranet/DashboardsView';
import { AdminSeedContentPage } from '../admin/AdminSeedContentPage';
import MetaSystemsView from '../aim-os/MetaSystemsView';
import ApprovalHistoryView from '../aim-os/ApprovalHistoryView';
import AuditLogViewer from '../admin/AuditLogViewer';
import EnhancedAgentsDashboard from '../agents/EnhancedAgentsDashboard';

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

    // ─── COMMAND CENTER ─────────────────────────────────────────────────────────
    case 'command_center':
      switch (currentSubModule) {
        case 'network':
          return <NetworkCommandCenter onNavigate={handleNavigate} />;
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
        case 'strategy':
          return <StrategyCommandCenter onNavigate={handleNavigate} />;
        case 'alerts':
          return <AlertsView />;
        case 'tasks':
          return <TasksView />;
        default:
          return getRoleBasedCommandCenter();
      }

    // ─── OPERATIONS ─────────────────────────────────────────────────────────────
    case 'operations': {
      if (currentSubModule.startsWith('launch-detail:')) {
        const launchId = currentSubModule.split(':')[1];
        return <LaunchDetailView launchId={launchId} onBack={() => onNavigate('operations', 'launches')} />;
      }
      switch (currentSubModule) {
        case 'schedule':
          return <SchedulerView />;
        case 'rooms':
        case 'capacity':
          return <CapacityView />;
        case 'staffing':
        case 'staff':
          return <StaffingView />;
        case 'tasks':
          return <WorkflowAutomationView />;
        case 'case-aging':
          return <CaseAgingView />;
        case 'ai-agents':
          return <EnhancedAgentsDashboard />;
        case 'excellence':
          return <ExcellenceDemoView />;
        case 'clinics':
          return <ClinicsView />;
        case 'launches':
          return <LaunchManagementDashboard onNavigate={onNavigate} />;
        case 'launch-detail':
          return <LaunchDetailView onBack={() => onNavigate('operations', 'launches')} />;
        case 'launch-readiness':
          return <BranchLaunchReadinessDashboard onNavigate={onNavigate} />;
        case 'launch-playbooks':
          return <LaunchPlaybookManager onNavigate={onNavigate} />;
        case 'launch-performance':
          return <NewClinicPerformanceDashboard onNavigate={onNavigate} />;
        case 'acquisition-integration':
          return <AcquisitionIntegrationDashboard onNavigate={onNavigate} />;
        case 'partners':
          return <PartnerClinicsView />;
        case 'partner-dashboard':
          return <PartnerDashboard />;
        case 'after-hours':
          return <AfterHoursView />;
        case 'communications':
          return <CommunicationsView />;
        case 'equipment':
          return <ProcurementDashboard />;
        default:
          return <OperationsEngineView />;
      }
    }

    // ─── CLINICAL ────────────────────────────────────────────────────────────────
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
        case 'gym-rehab':
          return <GymRehabWorkflow />;
        case 'patient-education':
          return <PatientEducationPanel />;
        case 'evidence':
          return <EvidenceLibraryAdmin />;
        case 'semantic-search':
          return <SemanticSearchPanel />;
        case 'cii':
          return <CIIAutomationDashboard />;
        case 'cases':
          return <CasesView />;
        case 'assessments':
          return <AssessmentsView />;
        case 'treatment-plans':
          return <TreatmentPlansView />;
        case 'exercises':
          return <ExerciseProgramsView />;
        case 'rtw-rts':
          return <RTWRTSView />;
        case 'documents':
          return <ClinicalDocumentsView />;
        default:
          return <ClinicalIntelligenceDashboard />;
      }

    // ─── REVENUE ─────────────────────────────────────────────────────────────────
    case 'revenue':
      switch (currentSubModule) {
        case 'claims':
          return <ClaimsView />;
        case 'invoices':
          return <InvoicesView />;
        case 'payments':
          return <PaymentsView />;
        case 'ar':
          return <FinancialView />;
        case 'cash-flow':
          return <CashFlowView />;
        case 'analytics':
        case 'revenue-analytics':
          return <RevenueAnalyticsView />;
        case 'fee-schedules':
        case 'pricing':
          return <PricingPayerView />;
        case 'retail':
          return <RetailProductsView />;
        case 'inventory':
          return <InventoryView />;
        case 'executive-finance':
          return <ExecutiveFinancialDashboard />;
        case 'import':
          return <RevenueReportImport />;
        case 'dashboard':
        default:
          return <FinancialView />;
      }

    // ─── GROWTH ──────────────────────────────────────────────────────────────────
    case 'growth':
      switch (currentSubModule) {
        case 'leads':
        case 'pipeline':
          return <IntakePipelineView />;
        case 'intake-conversion':
          return <IntakeConversionView />;
        case 'marketing':
        case 'campaigns':
          return <MarketingIntelligenceView />;
        case 'demand-acquisition':
          return <DemandAcquisitionView />;
        case 'referral-sources':
          return <ReferralGrowthView />;
        case 'trainers':
          return <TrainerReferralsView />;
        case 'employers':
          return <EmployerProgramsView />;
        case 'reviews':
          return <ReviewsView />;
        case 'experience':
          return <ExperienceReputationView />;
        case 'call-tracking':
          return <CallTrackingView />;
        case 'crm':
          return <CRMDashboard />;
        case 'revops':
          return <RevOpsView />;
        case 'playbooks':
          return <GrowthPlaybooksView />;
        case 'dashboard':
        default:
          return <GrowthOSDashboard />;
      }

    // ─── INTELLIGENCE ─────────────────────────────────────────────────────────────
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
        case 'acquisition':
          return <AcquisitionView />;
        case 'forecasting':
          return <ForecastingView />;
        case 'benchmarking':
          return <BenchmarkingView />;
        case 'reports':
          return <ReportsView />;
        case 'agent-execution':
          return <AgentExecutionDashboard />;
        case 'agents':
          return <AgentsView />;
        case 'analytics':
          return <AnalyticsView />;
        case 'dashboard':
        default:
          return <ExecutiveIntelligenceView />;
      }

    // ─── STRATEGY ────────────────────────────────────────────────────────────────
    case 'strategy':
      switch (currentSubModule) {
        case 'okrs':
        case 'strategic-plan':
          return <StrategyOKRView />;
        case 'budgets':
          return <BudgetsView />;
        case 'forecasts':
          return <ForecastsView />;
        case 'capital':
          return <CapitalAllocationView />;
        case 'controls':
          return <InternalControlsView />;
        case 'valuation':
          return <ValuationReadinessView />;
        case 'risk':
          return <VendorRiskView />;
        case 'vendor':
          return <VendorRiskView />;
        case 'governance':
          return <DigitalGovernanceView />;
        case 'ai-governance':
          return <AIGovernanceView />;
        case 'scorecard':
          return <ScorecardEngine />;
        case 'goal-cascade':
          return <GoalCascadeEngine />;
        case 'meeting-cadence':
          return <MeetingCadenceEngine />;
        case 'kpi-governance':
          return <KPIGovernanceView />;
        case 'fhir-event-bus':
          return <FHIREventBusView />;
        case 'initiatives':
          return <InitiativesView />;
        case 'expansion':
          return <ExpansionPipelineView />;
        case 'dashboard':
        default:
          return <StrategyOKRView />;
      }

    // ─── WORKFORCE ───────────────────────────────────────────────────────────────
    case 'workforce':
      switch (currentSubModule) {
        case 'people':
          return <PeopleView />;
        case 'org-structure':
          return <OrgStructureView />;
        case 'recruiting':
          return <RecruitingView />;
        case 'candidates':
          return <CandidatePipeline />;
        case 'jobs':
          return <JobsView />;
        case 'credentials':
          return <CredentialsView />;
        case 'academy':
          return <AcademyView />;
        case 'workforce-health':
          return <WorkforceHealthView />;
        case 'capacity-planning':
          return <CapacityView />;
        case 'roles':
          return <PeopleView />;
        case 'talent-metrics':
          return <TalentDashboard />;
        default:
          return <PeopleView />;
      }

    // ─── SUPPLY CHAIN ────────────────────────────────────────────────────────────
    case 'supply_chain':
      switch (currentSubModule) {
        case 'purchase':
          return <QuickPurchaseRequest />;
        case 'equipment':
        case 'vendors':
        case 'inventory':
        case 'budgets':
        case 'dashboard':
        default:
          return <ProcurementDashboard />;
      }

    // ─── ADMIN ───────────────────────────────────────────────────────────────────
    case 'admin':
      switch (currentSubModule) {
        case 'users':
        case 'roles':
          return <PeopleView />;
        case 'sops':
        case 'policies':
          return <SOPHubView />;
        case 'forms':
          return <FormsView />;
        case 'services':
        case 'fee-schedules':
          return <ServicePortfolioView />;
        case 'integrations':
          return <ClinicIntegrationView />;
        case 'announcements':
          return <AnnouncementsView />;
        case 'documents':
          return <DocumentLibraryView />;
        case 'compliance':
          return <ComplianceView />;
        case 'dashboards':
          return <DashboardsView />;
        case 'meta-systems':
          return <MetaSystemsView />;
        case 'approvals':
          return <ApprovalHistoryView />;
        case 'seed':
          return <AdminSeedContentPage />;
        case 'audit-log':
          return <AuditLogViewer />;
        case 'settings':
        default:
          return <AIMOSDashboard />;
      }

    // ─── PATIENT EXPERIENCE ──────────────────────────────────────────────────────
    case 'patient_experience':
      return <PatientExperienceDashboard />;

    default:
      return <CommandCenter onNavigate={handleNavigate} />;
  }
}
