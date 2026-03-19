import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { aimAutomationService } from '../../services/aimAutomationService';
import type {
  AimLocation, ContentPost, ContentApproval, ReviewTriage,
  CampaignHealth, CampaignAlert, PolicyRule, AuditLogEntry,
  IntegrationConfig, SocialAccount, KpiSnapshot, ResponseTemplate,
  PostStatus,
} from '../../services/aimAutomationService';
import AimAutomationShell, { type AutomationView } from './AimAutomationShell';
import OverviewDashboard from './OverviewDashboard';
import ContentQueueView from './ContentQueueView';
import ApprovalCenterView from './ApprovalCenterView';
import ReviewTriageView from './ReviewTriageView';
import ExceptionCenterView from './ExceptionCenterView';
import CampaignHealthView from './CampaignHealthView';
import LocationsView from './LocationsView';
import IntegrationsView from './IntegrationsView';
import PolicyRulesView from './PolicyRulesView';
import AuditLogView from './AuditLogView';
import SettingsView from './SettingsView';
import WorkflowOpsView from './WorkflowOpsView';

export default function AimAutomationDashboard() {
  const [activeView, setActiveView] = useState<AutomationView>('overview');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [locations, setLocations] = useState<AimLocation[]>([]);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [approvals, setApprovals] = useState<ContentApproval[]>([]);
  const [reviews, setReviews] = useState<ReviewTriage[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignHealth[]>([]);
  const [campaignAlerts, setCampaignAlerts] = useState<CampaignAlert[]>([]);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [kpiSnapshots, setKpiSnapshots] = useState<KpiSnapshot[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);

  const [locationsLoading, setLocationsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    aimAutomationService.getLocations()
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLocationsLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        postsData, approvalsData, reviewsData, campaignsData,
        alertsData, rulesData, auditData, integrationsData,
        accountsData, kpiData, templatesData,
      ] = await Promise.allSettled([
        aimAutomationService.getContentPosts(selectedLocationId ? { locationId: selectedLocationId } : undefined),
        aimAutomationService.getPendingApprovals(selectedLocationId ?? undefined),
        aimAutomationService.getReviews(selectedLocationId ? { locationId: selectedLocationId } : undefined),
        aimAutomationService.getCampaignHealth(selectedLocationId ?? undefined),
        aimAutomationService.getCampaignAlerts(false),
        aimAutomationService.getPolicyRules(selectedLocationId ?? undefined),
        aimAutomationService.getAuditLog({ locationId: selectedLocationId ?? undefined }),
        aimAutomationService.getIntegrationConfigs(selectedLocationId ?? undefined),
        aimAutomationService.getSocialAccounts(selectedLocationId ?? undefined),
        aimAutomationService.getKpiSnapshots(selectedLocationId ?? undefined),
        aimAutomationService.getResponseTemplates(selectedLocationId ?? undefined),
      ]);

      if (postsData.status === 'fulfilled') setPosts(postsData.value);
      if (approvalsData.status === 'fulfilled') setApprovals(approvalsData.value);
      if (reviewsData.status === 'fulfilled') setReviews(reviewsData.value);
      if (campaignsData.status === 'fulfilled') setCampaigns(campaignsData.value);
      if (alertsData.status === 'fulfilled') setCampaignAlerts(alertsData.value);
      if (rulesData.status === 'fulfilled') setPolicyRules(rulesData.value);
      if (auditData.status === 'fulfilled') setAuditLog(auditData.value);
      if (integrationsData.status === 'fulfilled') setIntegrations(integrationsData.value);
      if (accountsData.status === 'fulfilled') setSocialAccounts(accountsData.value);
      if (kpiData.status === 'fulfilled') setKpiSnapshots(kpiData.value);
      if (templatesData.status === 'fulfilled') setTemplates(templatesData.value);
    } finally {
      setDataLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (!locationsLoading) loadData();
  }, [locationsLoading, loadData]);

  const handleUpdatePostStatus = useCallback(async (postId: string, status: PostStatus) => {
    await aimAutomationService.updatePostStatus(postId, status);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
  }, []);

  const handleDecideApproval = useCallback(async (
    approvalId: string,
    decision: 'approved' | 'rejected',
    feedback?: string,
  ) => {
    await aimAutomationService.decideApproval(approvalId, decision, feedback);
    setApprovals(prev => prev.map(a => a.id === approvalId
      ? { ...a, status: decision, feedback: feedback ?? '', decided_at: new Date().toISOString() }
      : a
    ));
  }, []);

  const handleUpdateReview = useCallback(async (
    reviewId: string,
    updates: Partial<ReviewTriage>,
  ) => {
    await aimAutomationService.updateReview(reviewId, updates as Parameters<typeof aimAutomationService.updateReview>[1]);
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await aimAutomationService.resolveAlert(alertId, user?.id ?? '');
    setCampaignAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_resolved: true } : a));
  }, []);

  const handleRetryPost = useCallback(async (postId: string) => {
    await aimAutomationService.updatePostStatus(postId, 'draft');
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'draft' } : p));
  }, []);

  const handleToggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    await aimAutomationService.togglePolicyRule(ruleId, isActive);
    setPolicyRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: isActive } : r));
  }, []);

  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const openAlerts = campaignAlerts.filter(a => !a.is_resolved).length;
  const criticalReviews = reviews.filter(r => r.priority === 'critical' && r.status !== 'archived').length;

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewDashboard
            kpiSnapshots={kpiSnapshots}
            campaignHealth={campaigns}
            reviews={reviews}
            posts={posts}
            alerts={campaignAlerts}
            loading={dataLoading}
          />
        );
      case 'content-queue':
        return (
          <ContentQueueView
            posts={posts}
            loading={dataLoading}
            onUpdateStatus={handleUpdatePostStatus}
          />
        );
      case 'approval-center':
        return (
          <ApprovalCenterView
            approvals={approvals}
            loading={dataLoading}
            onDecide={handleDecideApproval}
          />
        );
      case 'review-triage':
        return (
          <ReviewTriageView
            reviews={reviews}
            templates={templates}
            loading={dataLoading}
            onUpdateReview={handleUpdateReview}
          />
        );
      case 'exception-center':
        return (
          <ExceptionCenterView
            alerts={campaignAlerts}
            failedPosts={posts.filter(p => p.status === 'failed' || p.status === 'held')}
            loading={dataLoading}
            onResolveAlert={handleResolveAlert}
            onRetryPost={handleRetryPost}
          />
        );
      case 'campaign-health':
        return (
          <CampaignHealthView
            campaigns={campaigns}
            alerts={campaignAlerts}
            loading={dataLoading}
            onResolveAlert={handleResolveAlert}
          />
        );
      case 'locations':
        return (
          <LocationsView
            locations={locations}
            socialAccounts={socialAccounts}
            loading={locationsLoading}
          />
        );
      case 'integrations':
        return (
          <IntegrationsView
            configs={integrations}
            loading={dataLoading}
          />
        );
      case 'policy-rules':
        return (
          <PolicyRulesView
            rules={policyRules}
            loading={dataLoading}
            onToggle={handleToggleRule}
          />
        );
      case 'audit-log':
        return (
          <AuditLogView
            entries={auditLog}
            loading={dataLoading}
          />
        );
      case 'settings':
        return <SettingsView locations={locations} />;
      case 'workflow-ops':
        return <WorkflowOpsView />;
      default:
        return null;
    }
  };

  return (
    <AimAutomationShell
      activeView={activeView}
      onViewChange={setActiveView}
      locations={locations}
      selectedLocationId={selectedLocationId}
      onLocationChange={setSelectedLocationId}
      pendingApprovals={pendingApprovals}
      openAlerts={openAlerts}
      criticalReviews={criticalReviews}
    >
      {renderView()}
    </AimAutomationShell>
  );
}
