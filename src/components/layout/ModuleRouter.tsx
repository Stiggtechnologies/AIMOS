import { lazy, Suspense } from 'react';
import type { ModuleKey } from '../../types/enterprise';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorBoundary } from '../shared/ErrorBoundary';

// ─── COMMAND CENTER ─────────────────────────────────────────────────────────
const CommandCenter = lazy(() => import('../command-center/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ExecutiveCommandCenter = lazy(() => import('../command-center/ExecutiveCommandCenter').then(m => ({ default: m.ExecutiveCommandCenter ?? m.default })));
const ClinicCommandCenter = lazy(() => import('../command-center/ClinicCommandCenter').then(m => ({ default: m.ClinicCommandCenter ?? m.default })));
const ClinicianCommandCenter = lazy(() => import('../command-center/ClinicianCommandCenter').then(m => ({ default: m.ClinicianCommandCenter ?? m.default })));
const RegionalOpsCommandCenter = lazy(() => import('../command-center/RegionalOpsCommandCenter').then(m => ({ default: m.RegionalOpsCommandCenter ?? m.default })));
const RevenueCycleCommandCenter = lazy(() => import('../command-center/RevenueCycleCommandCenter').then(m => ({ default: m.RevenueCycleCommandCenter ?? m.default })));
const GrowthCommandCenter = lazy(() => import('../command-center/GrowthCommandCenter').then(m => ({ default: m.GrowthCommandCenter ?? m.default })));
const NetworkCommandCenter = lazy(() => import('../command-center/NetworkCommandCenter').then(m => ({ default: m.NetworkCommandCenter ?? m.default })));
const StrategyCommandCenter = lazy(() => import('../command-center/StrategyCommandCenter').then(m => ({ default: m.StrategyCommandCenter ?? m.default })));
const NotificationsCenter = lazy(() => import('../NotificationsCenter').then(m => ({ default: m.NotificationsCenter })));
const AIAssistantDashboard = lazy(() => import('../AIAssistantDashboard'));
const AlertsView = lazy(() => import('../command-center/AlertsView'));
const TasksView = lazy(() => import('../command-center/TasksView'));

// ─── OPERATIONS ──────────────────────────────────────────────────────────────
const OperationsEngineView = lazy(() => import('../operations/OperationsEngineView'));
const SchedulerView = lazy(() => import('../aim-os/SchedulerView'));
const StaffingView = lazy(() => import('../operations/StaffingView'));
const CapacityView = lazy(() => import('../operations/CapacityView'));
const LaunchManagementDashboard = lazy(() => import('../launches/LaunchManagementDashboard'));
const LaunchDetailView = lazy(() => import('../launches/LaunchDetailView'));
const BranchLaunchReadinessDashboard = lazy(() => import('../launches/BranchLaunchReadinessDashboard'));
const LaunchPlaybookManager = lazy(() => import('../launches/LaunchPlaybookManager'));
const NewClinicPerformanceDashboard = lazy(() => import('../launches/NewClinicPerformanceDashboard'));
const AcquisitionIntegrationDashboard = lazy(() => import('../launches/AcquisitionIntegrationDashboard'));
const PartnerClinicsView = lazy(() => import('../partners/PartnerClinicsView'));
const PartnerDashboard = lazy(() => import('../partners/PartnerDashboard'));
const AfterHoursView = lazy(() => import('../after-hours/AfterHoursView'));
const CommunicationsView = lazy(() => import('../communications/CommunicationsView'));
const ClinicsView = lazy(() => import('../intranet/ClinicsView'));
const CaseAgingView = lazy(() => import('../operations/CaseAgingView'));
const WorkflowAutomationView = lazy(() => import('../operations/WorkflowAutomationView'));
const OperationalAIAgentsView = lazy(() => import('../operations/OperationalAIAgentsView'));
const ExcellenceDemoView = lazy(() => import('../operations/ExcellenceDemoView').then(m => ({ default: m.ExcellenceDemoView })));

// ─── CLINICAL ────────────────────────────────────────────────────────────────
const ClinicalIntelligenceDashboard = lazy(() => import('../aim-os/ClinicalIntelligenceDashboard').then(m => ({ default: m.ClinicalIntelligenceDashboard })));
const ClinicianMobileDashboard = lazy(() => import('../clinician/ClinicianMobileDashboard'));
const ClinicalQualityView = lazy(() => import('../aim-os/ClinicalQualityView'));
const ClinicalChartingWorkflow = lazy(() => import('../clinician/ClinicalChartingWorkflow').then(m => ({ default: m.ClinicalChartingWorkflow })));
const PatientPortalDashboard = lazy(() => import('../patient/PatientPortalDashboard'));
const GymRehabWorkflow = lazy(() => import('../clinic/GymRehabWorkflow'));
const PatientEducationPanel = lazy(() => import('../patient/PatientEducationPanel').then(m => ({ default: m.PatientEducationPanel })));
const SemanticSearchPanel = lazy(() => import('../aim-os/SemanticSearchPanel').then(m => ({ default: m.SemanticSearchPanel })));
const CIIAutomationDashboard = lazy(() => import('../aim-os/CIIAutomationDashboard').then(m => ({ default: m.CIIAutomationDashboard })));
const EvidenceLibraryAdmin = lazy(() => import('../aim-os/EvidenceLibraryAdmin').then(m => ({ default: m.EvidenceLibraryAdmin })));
const PatientsView = lazy(() => import('../clinical/PatientsView'));
const CasesView = lazy(() => import('../clinical/CasesView'));
const AssessmentsView = lazy(() => import('../clinical/AssessmentsView'));
const TreatmentPlansView = lazy(() => import('../clinical/TreatmentPlansView'));
const ExerciseProgramsView = lazy(() => import('../clinical/ExerciseProgramsView'));
const RTWRTSView = lazy(() => import('../clinical/RTWRTSView'));
const ClinicalDocumentsView = lazy(() => import('../clinical/ClinicalDocumentsView'));

// ─── REVENUE ─────────────────────────────────────────────────────────────────
const FinancialView = lazy(() => import('../aim-os/FinancialView'));
const CashFlowView = lazy(() => import('../aim-os/CashFlowView'));
const RevenueAnalyticsView = lazy(() => import('../aim-os/RevenueAnalyticsView'));
const PricingPayerView = lazy(() => import('../aim-os/PricingPayerView'));
const RevenueReportImport = lazy(() => import('../operations/RevenueReportImport'));
const RetailProductsView = lazy(() => import('../clinic/RetailProductsView'));
const ExecutiveFinancialDashboard = lazy(() => import('../finance/ExecutiveFinancialDashboard').then(m => ({ default: m.ExecutiveFinancialDashboard })));
const ClaimsView = lazy(() => import('../revenue/ClaimsView'));
const InvoicesView = lazy(() => import('../revenue/InvoicesView'));
const PaymentsView = lazy(() => import('../revenue/PaymentsView'));
const InventoryView = lazy(() => import('../revenue/InventoryView'));

// ─── GROWTH ENGINE ────────────────────────────────────────────────────────────
const AIMGrowthEngineDashboard = lazy(() => import('../growth-engine/AIMGrowthEngineDashboard').then(m => ({ default: m.AIMGrowthEngineDashboard })));
const LeadPipelineKanban = lazy(() => import('../growth-engine/LeadPipelineKanban').then(m => ({ default: m.LeadPipelineKanban })));
const ChannelAttributionView = lazy(() => import('../growth-engine/ChannelAttributionView').then(m => ({ default: m.ChannelAttributionView })));
const MessengerIntakeFlow = lazy(() => import('../growth-engine/MessengerIntakeFlow').then(m => ({ default: m.MessengerIntakeFlow })));
const AutomationEngineView = lazy(() => import('../growth-engine/AutomationEngineView').then(m => ({ default: m.AutomationEngineView })));
const LandingPageGallery = lazy(() => import('../growth-engine/LandingPageIntake').then(m => ({ default: m.LandingPageGallery })));
const LandingPageIntake = lazy(() => import('../growth-engine/LandingPageIntake').then(m => ({ default: m.LandingPageIntake })));

// ─── GROWTH ──────────────────────────────────────────────────────────────────
const GrowthOSDashboard = lazy(() => import('../growth-os/GrowthOSDashboard'));
const IntakePipelineView = lazy(() => import('../growth-os/IntakePipelineView'));
const MarketingIntelligenceView = lazy(() => import('../growth-os/MarketingIntelligenceView'));
const ReferralGrowthView = lazy(() => import('../growth-os/ReferralGrowthView'));
const RevOpsView = lazy(() => import('../growth-os/RevOpsView'));
const GrowthPlaybooksView = lazy(() => import('../growth-os/GrowthPlaybooksView'));
const CRMDashboard = lazy(() => import('../crm/CRMDashboard'));
const CallTrackingView = lazy(() => import('../call-tracking/CallTrackingView'));
const IntakeConversionView = lazy(() => import('../crm/IntakeConversionView'));
const DemandAcquisitionView = lazy(() => import('../crm/DemandAcquisitionView'));
const ExperienceReputationView = lazy(() => import('../aim-os/ExperienceReputationView'));
const ReviewsView = lazy(() => import('../growth/ReviewsView'));
const TrainerReferralsView = lazy(() => import('../growth/TrainerReferralsView'));
const EmployerProgramsView = lazy(() => import('../growth/EmployerProgramsView'));

// ─── INTELLIGENCE ─────────────────────────────────────────────────────────────
const ExecutiveAnalyticsView = lazy(() => import('../aim-os/ExecutiveAnalyticsView'));
const ExecutiveIntelligenceView = lazy(() => import('../aim-os/ExecutiveIntelligenceView'));
const ReferralIntelligenceView = lazy(() => import('../aim-os/ReferralIntelligenceView'));
const UtilizationView = lazy(() => import('../aim-os/UtilizationView').then(m => ({ default: m.UtilizationView })));
const AgentExecutionDashboard = lazy(() => import('../agents/AgentExecutionDashboard').then(m => ({ default: m.AgentExecutionDashboard })));
const AgentsView = lazy(() => import('../AgentsView'));
const AnalyticsView = lazy(() => import('../AnalyticsView'));
const AcquisitionView = lazy(() => import('../intelligence/AcquisitionView'));
const ForecastingView = lazy(() => import('../intelligence/ForecastingView'));
const ReportsView = lazy(() => import('../intelligence/ReportsView'));
const BenchmarkingView = lazy(() => import('../intelligence/BenchmarkingView'));

// ─── STRATEGY ────────────────────────────────────────────────────────────────
const StrategyOKRView = lazy(() => import('../aim-os/StrategyOKRView'));
const ValuationReadinessView = lazy(() => import('../aim-os/ValuationReadinessView'));
const CapitalAllocationView = lazy(() => import('../aim-os/CapitalAllocationView'));
const InternalControlsView = lazy(() => import('../aim-os/InternalControlsView'));
const VendorRiskView = lazy(() => import('../aim-os/VendorRiskView'));
const InitiativesView = lazy(() => import('../strategy/InitiativesView'));
const ExpansionPipelineView = lazy(() => import('../strategy/ExpansionPipelineView'));
const BudgetsView = lazy(() => import('../strategy/BudgetsView'));
const ForecastsView = lazy(() => import('../strategy/ForecastsView'));
const DigitalGovernanceView = lazy(() => import('../digital-governance').then(m => ({ default: m.DigitalGovernanceView })));
const AIGovernanceView = lazy(() => import('../aim-os/AIGovernanceView'));
const ScorecardEngine = lazy(() => import('../enterprise-os/ScorecardEngine').then(m => ({ default: m.ScorecardEngine })));
const GoalCascadeEngine = lazy(() => import('../enterprise-os/GoalCascadeEngine').then(m => ({ default: m.GoalCascadeEngine })));
const MeetingCadenceEngine = lazy(() => import('../enterprise-os/MeetingCadenceEngine').then(m => ({ default: m.MeetingCadenceEngine })));
const KPIGovernanceView = lazy(() => import('../enterprise-os/KPIGovernanceView').then(m => ({ default: m.KPIGovernanceView })));
const FHIREventBusView = lazy(() => import('../enterprise-os/FHIREventBusView').then(m => ({ default: m.FHIREventBusView })));

// ─── WORKFORCE ───────────────────────────────────────────────────────────────
const PeopleView = lazy(() => import('../intranet/PeopleView'));
const CandidatePipeline = lazy(() => import('../CandidatePipeline'));
const JobsView = lazy(() => import('../JobsView'));
const CredentialsView = lazy(() => import('../operations/CredentialsView'));
const AcademyView = lazy(() => import('../intranet/AcademyView'));
const WorkforceHealthView = lazy(() => import('../aim-os/WorkforceHealthView'));
const OrgStructureView = lazy(() => import('../workforce/OrgStructureView'));
const RecruitingView = lazy(() => import('../workforce/RecruitingView'));
const TalentDashboard = lazy(() => import('../Dashboard'));

// ─── SUPPLY CHAIN ────────────────────────────────────────────────────────────
const ProcurementDashboard = lazy(() => import('../procurement/ProcurementDashboard').then(m => ({ default: m.ProcurementDashboard })));
const QuickPurchaseRequest = lazy(() => import('../procurement/QuickPurchaseRequest').then(m => ({ default: m.QuickPurchaseRequest })));

// ─── PATIENT EXPERIENCE ──────────────────────────────────────────────────────
const PatientExperienceDashboard = lazy(() => import('../patient-experience/PatientExperienceDashboard'));

// ─── CALL AGENT ──────────────────────────────────────────────────────────────
const CallAgentShell = lazy(() => import('../call-agent/CallAgentShell').then(m => ({ default: m.CallAgentShell })));

// ─── AIM AUTOMATION ──────────────────────────────────────────────────────────
const AimAutomationDashboard = lazy(() => import('../automation/AimAutomationDashboard'));

// ─── ADMIN ───────────────────────────────────────────────────────────────────
const SOPHubView = lazy(() => import('../intranet/SOPHubView'));
const FormsView = lazy(() => import('../intranet/FormsView'));
const ServicePortfolioView = lazy(() => import('../aim-os/ServicePortfolioView'));
const ClinicIntegrationView = lazy(() => import('../aim-os/ClinicIntegrationView'));
const AIMOSDashboard = lazy(() => import('../aim-os/AIMOSDashboard'));
const AnnouncementsView = lazy(() => import('../intranet/AnnouncementsView'));
const DocumentLibraryView = lazy(() => import('../intranet/DocumentLibraryView'));
const ComplianceView = lazy(() => import('../intranet/ComplianceView'));
const DashboardsView = lazy(() => import('../intranet/DashboardsView'));
const AdminSeedContentPage = lazy(() => import('../admin/AdminSeedContentPage').then(m => ({ default: m.AdminSeedContentPage })));
const MetaSystemsView = lazy(() => import('../aim-os/MetaSystemsView'));
const ApprovalHistoryView = lazy(() => import('../aim-os/ApprovalHistoryView'));
const AuditLogViewer = lazy(() => import('../admin/AuditLogViewer'));
const EnhancedAgentsDashboard = lazy(() => import('../agents/EnhancedAgentsDashboard'));

// ─── LOADING FALLBACK ────────────────────────────────────────────────────────
function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-sm text-gray-500">Loading module...</p>
      </div>
    </div>
  );
}

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
      case 'contractor':
        return <ClinicianCommandCenter onNavigate={handleNavigate} />;
      case 'regional_director':
        return <RegionalOpsCommandCenter onNavigate={handleNavigate} />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  const renderModule = () => {
    switch (currentModule) {

      // ─── COMMAND CENTER ───────────────────────────────────────────────────
      case 'command_center':
        switch (currentSubModule) {
          case 'network': return <NetworkCommandCenter onNavigate={handleNavigate} />;
          case 'notifications': return <NotificationsCenter />;
          case 'ai-insights': return <AIAssistantDashboard />;
          case 'executive': return <ExecutiveCommandCenter onNavigate={handleNavigate} />;
          case 'regional': return <RegionalOpsCommandCenter onNavigate={handleNavigate} />;
          case 'clinic': return <ClinicCommandCenter onNavigate={handleNavigate} />;
          case 'clinician': return <ClinicianCommandCenter onNavigate={handleNavigate} />;
          case 'revenue-cycle': return <RevenueCycleCommandCenter onNavigate={handleNavigate} />;
          case 'growth': return <GrowthCommandCenter onNavigate={handleNavigate} />;
          case 'strategy': return <StrategyCommandCenter onNavigate={handleNavigate} />;
          case 'alerts': return <AlertsView />;
          case 'tasks': return <TasksView />;
          default: return getRoleBasedCommandCenter();
        }

      // ─── OPERATIONS ───────────────────────────────────────────────────────
      case 'operations': {
        if (currentSubModule.startsWith('launch-detail:')) {
          const launchId = currentSubModule.split(':')[1];
          return <LaunchDetailView launchId={launchId} onBack={() => onNavigate('operations', 'launches')} />;
        }
        switch (currentSubModule) {
          case 'schedule': return <SchedulerView />;
          case 'rooms':
          case 'capacity': return <CapacityView />;
          case 'staffing':
          case 'staff': return <StaffingView />;
          case 'tasks': return <WorkflowAutomationView />;
          case 'case-aging': return <CaseAgingView />;
          case 'ai-agents': return <EnhancedAgentsDashboard />;
          case 'excellence': return <ExcellenceDemoView />;
          case 'clinics': return <ClinicsView />;
          case 'launches': return <LaunchManagementDashboard onNavigate={onNavigate} />;
          case 'launch-detail': return <LaunchDetailView onBack={() => onNavigate('operations', 'launches')} />;
          case 'launch-readiness': return <BranchLaunchReadinessDashboard onNavigate={onNavigate} />;
          case 'launch-playbooks': return <LaunchPlaybookManager onNavigate={onNavigate} />;
          case 'launch-performance': return <NewClinicPerformanceDashboard onNavigate={onNavigate} />;
          case 'acquisition-integration': return <AcquisitionIntegrationDashboard onNavigate={onNavigate} />;
          case 'partners': return <PartnerClinicsView />;
          case 'partner-dashboard': return <PartnerDashboard />;
          case 'after-hours': return <AfterHoursView />;
          case 'communications': return <CommunicationsView />;
          case 'equipment': return <ProcurementDashboard />;
          default: return <OperationsEngineView />;
        }
      }

      // ─── CLINICAL ─────────────────────────────────────────────────────────
      case 'clinical':
        switch (currentSubModule) {
          case 'patients': return <PatientsView />;
          case 'visits':
          case 'charting': return <ClinicalChartingWorkflow />;
          case 'outcomes': return <ClinicalQualityView />;
          case 'intelligence': return <ClinicalIntelligenceDashboard />;
          case 'mobile': return <ClinicianMobileDashboard />;
          case 'gym-rehab': return <GymRehabWorkflow />;
          case 'patient-education': return <PatientEducationPanel />;
          case 'evidence': return <EvidenceLibraryAdmin />;
          case 'semantic-search': return <SemanticSearchPanel />;
          case 'cii': return <CIIAutomationDashboard />;
          case 'cases': return <CasesView />;
          case 'assessments': return <AssessmentsView />;
          case 'treatment-plans': return <TreatmentPlansView />;
          case 'exercises': return <ExerciseProgramsView />;
          case 'rtw-rts': return <RTWRTSView />;
          case 'documents': return <ClinicalDocumentsView />;
          default: return <ClinicalIntelligenceDashboard />;
        }

      // ─── REVENUE ──────────────────────────────────────────────────────────
      case 'revenue':
        switch (currentSubModule) {
          case 'claims': return <ClaimsView />;
          case 'invoices': return <InvoicesView />;
          case 'payments': return <PaymentsView />;
          case 'ar': return <FinancialView />;
          case 'cash-flow': return <CashFlowView />;
          case 'analytics':
          case 'revenue-analytics': return <RevenueAnalyticsView />;
          case 'fee-schedules':
          case 'pricing': return <PricingPayerView />;
          case 'retail': return <RetailProductsView />;
          case 'inventory': return <InventoryView />;
          case 'executive-finance': return <ExecutiveFinancialDashboard onNavigate={handleNavigate} />;
          case 'import': return <RevenueReportImport />;
          case 'dashboard':
          default: return <FinancialView />;
        }

      // ─── GROWTH ───────────────────────────────────────────────────────────
      case 'growth':
        switch (currentSubModule) {
          case 'growth-engine': return <AIMGrowthEngineDashboard onNavigate={onNavigate} />;
          case 'growth-engine-pipeline': return <LeadPipelineKanban />;
          case 'growth-engine-attribution': return <ChannelAttributionView />;
          case 'growth-engine-messenger': return <MessengerIntakeFlow />;
          case 'growth-engine-landing': return <LandingPageGallery onSelect={slug => onNavigate('growth', `landing-page:${slug}`)} />;
          case 'growth-engine-automation': return <AutomationEngineView />;
          case 'leads':
          case 'pipeline': return <LeadPipelineKanban />;
          case 'intake-conversion': return <IntakeConversionView />;
          case 'marketing':
          case 'campaigns': return <MarketingIntelligenceView />;
          case 'demand-acquisition': return <DemandAcquisitionView />;
          case 'referral-sources': return <ReferralGrowthView />;
          case 'trainers': return <TrainerReferralsView />;
          case 'employers': return <EmployerProgramsView />;
          case 'reviews': return <ReviewsView />;
          case 'experience': return <ExperienceReputationView />;
          case 'call-tracking': return <CallTrackingView />;
          case 'crm': return <CRMDashboard />;
          case 'revops': return <RevOpsView />;
          case 'playbooks': return <GrowthPlaybooksView />;
          case 'dashboard':
          default: {
            if (currentSubModule.startsWith('landing-page:')) {
              const slug = currentSubModule.split(':')[1];
              return <LandingPageIntake slug={slug as import('../growth-engine/LandingPageIntake').LandingPageSlug} />;
            }
            return <GrowthOSDashboard />;
          }
        }

      // ─── INTELLIGENCE ─────────────────────────────────────────────────────
      case 'intelligence':
        switch (currentSubModule) {
          case 'clinic-performance': return <ExecutiveAnalyticsView />;
          case 'clinical-outcomes': return <ClinicalQualityView />;
          case 'revenue-analytics': return <RevenueAnalyticsView />;
          case 'referral-analytics': return <ReferralIntelligenceView />;
          case 'utilization': return <UtilizationView />;
          case 'acquisition': return <AcquisitionView />;
          case 'forecasting': return <ForecastingView />;
          case 'benchmarking': return <BenchmarkingView />;
          case 'reports': return <ReportsView onNavigate={onNavigate} />;
          case 'agent-execution': return <AgentExecutionDashboard />;
          case 'agents': return <AgentsView />;
          case 'analytics': return <AnalyticsView />;
          case 'dashboard':
          default: return <ExecutiveIntelligenceView />;
        }

      // ─── STRATEGY ─────────────────────────────────────────────────────────
      case 'strategy':
        switch (currentSubModule) {
          case 'okrs':
          case 'strategic-plan': return <StrategyOKRView />;
          case 'budgets': return <BudgetsView />;
          case 'forecasts': return <ForecastsView />;
          case 'capital': return <CapitalAllocationView />;
          case 'controls': return <InternalControlsView />;
          case 'valuation': return <ValuationReadinessView />;
          case 'risk':
          case 'vendor': return <VendorRiskView />;
          case 'governance': return <DigitalGovernanceView />;
          case 'ai-governance': return <AIGovernanceView />;
          case 'scorecard': return <ScorecardEngine />;
          case 'goal-cascade': return <GoalCascadeEngine />;
          case 'meeting-cadence': return <MeetingCadenceEngine />;
          case 'kpi-governance': return <KPIGovernanceView />;
          case 'fhir-event-bus': return <FHIREventBusView />;
          case 'initiatives': return <InitiativesView />;
          case 'expansion': return <ExpansionPipelineView />;
          case 'dashboard':
          default: return <StrategyOKRView />;
        }

      // ─── WORKFORCE ────────────────────────────────────────────────────────
      case 'workforce':
        switch (currentSubModule) {
          case 'people': return <PeopleView />;
          case 'org-structure': return <OrgStructureView />;
          case 'recruiting': return <RecruitingView />;
          case 'candidates': return <CandidatePipeline />;
          case 'jobs': return <JobsView />;
          case 'credentials': return <CredentialsView />;
          case 'academy': return <AcademyView />;
          case 'workforce-health': return <WorkforceHealthView />;
          case 'capacity-planning': return <CapacityView />;
          case 'roles': return <PeopleView />;
          case 'talent-metrics': return <TalentDashboard />;
          default: return <PeopleView />;
        }

      // ─── SUPPLY CHAIN ─────────────────────────────────────────────────────
      case 'supply_chain':
        switch (currentSubModule) {
          case 'purchase': return <QuickPurchaseRequest />;
          case 'equipment':
          case 'vendors':
          case 'inventory':
          case 'budgets':
          case 'dashboard':
          default: return <ProcurementDashboard />;
        }

      // ─── ADMIN ────────────────────────────────────────────────────────────
      case 'admin':
        switch (currentSubModule) {
          case 'users':
          case 'roles': return <PeopleView />;
          case 'sops':
          case 'policies': return <SOPHubView />;
          case 'forms': return <FormsView />;
          case 'services':
          case 'fee-schedules': return <ServicePortfolioView />;
          case 'integrations': return <ClinicIntegrationView />;
          case 'announcements': return <AnnouncementsView />;
          case 'documents': return <DocumentLibraryView />;
          case 'compliance': return <ComplianceView />;
          case 'dashboards': return <DashboardsView />;
          case 'meta-systems': return <MetaSystemsView />;
          case 'approvals': return <ApprovalHistoryView />;
          case 'seed': return <AdminSeedContentPage />;
          case 'audit-log': return <AuditLogViewer />;
          case 'settings':
          default: return <AIMOSDashboard />;
        }

      // ─── PATIENT EXPERIENCE ───────────────────────────────────────────────
      case 'patient_experience':
        return <PatientExperienceDashboard />;

      // ─── CALL AGENT ───────────────────────────────────────────────────────
      case 'call_agent':
        return <CallAgentShell />;

      // ─── AIM AUTOMATION ───────────────────────────────────────────────────
      case 'aim_automation':
        return <AimAutomationDashboard />;

      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<ModuleLoading />}>
        {renderModule()}
      </Suspense>
    </ErrorBoundary>
  );
}
