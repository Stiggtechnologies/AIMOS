import { launchService, type ClinicLaunch, type LaunchTask, type LaunchRisk } from './launchService';

export interface LaunchInsight {
  id: string;
  type: 'risk' | 'suggestion' | 'warning' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
  confidence: number;
  metadata?: Record<string, any>;
}

class LaunchAIService {
  async generateLaunchInsights(launchId: string): Promise<LaunchInsight[]> {
    const insights: LaunchInsight[] = [];

    try {
      const launch = await launchService.getLaunchById(launchId);
      if (!launch) return insights;

      const overdueTasks = await launchService.getOverdueTasks(launchId);
      const criticalRisks = await launchService.getCriticalRisks(launchId);
      const tasks = await launchService.getTasks(launchId);
      const blockers = await launchService.getLaunchBlockers(launchId);

      insights.push(...this.analyzeSchedule(launch, overdueTasks, tasks));
      insights.push(...this.analyzeRisks(criticalRisks));
      insights.push(...this.analyzeBlockers(blockers));
      insights.push(...this.analyzeDependencies(tasks));
      insights.push(...this.compareToHistoricalLaunches(launch));
      insights.push(...this.suggestMitigations(launch, criticalRisks, overdueTasks));

    } catch (error) {
      console.error('Error generating launch insights:', error);
    }

    return insights.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private analyzeSchedule(
    launch: ClinicLaunch,
    overdueTasks: any[],
    allTasks: LaunchTask[]
  ): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    if (overdueTasks.length > 0) {
      const gateBlocKers = overdueTasks.filter(t => t.is_gate_blocker);

      if (gateBlocKers.length > 0) {
        insights.push({
          id: `schedule-gate-blockers-${launch.id}`,
          type: 'warning',
          severity: 'critical',
          title: 'Gate-Blocking Tasks Overdue',
          message: `${gateBlocKers.length} gate-blocking tasks are overdue. These will prevent phase advancement.`,
          action: 'Review overdue tasks',
          actionUrl: `/launches/${launch.id}/tasks?filter=overdue`,
          confidence: 1.0,
          metadata: { count: gateBlocKers.length, tasks: gateBlocKers }
        });
      } else {
        insights.push({
          id: `schedule-overdue-${launch.id}`,
          type: 'warning',
          severity: overdueTasks.length > 5 ? 'high' : 'medium',
          title: 'Tasks Overdue',
          message: `${overdueTasks.length} tasks are past their due date. Launch timeline may be at risk.`,
          action: 'Review schedule',
          confidence: 0.9,
          metadata: { count: overdueTasks.length }
        });
      }
    }

    const targetDate = new Date(launch.target_open_date);
    const today = new Date();
    const daysUntilOpen = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilOpen < 30 && launch.overall_completion_pct < 80) {
      insights.push({
        id: `schedule-behind-${launch.id}`,
        type: 'risk',
        severity: 'high',
        title: 'Launch Behind Schedule',
        message: `Only ${daysUntilOpen} days until target open date, but launch is ${launch.overall_completion_pct.toFixed(0)}% complete. Consider adjusting timeline or adding resources.`,
        action: 'Review project plan',
        confidence: 0.85,
        metadata: { daysUntilOpen, completionPct: launch.overall_completion_pct }
      });
    }

    const tasksNearDue = allTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const due = new Date(t.due_date);
      const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    if (tasksNearDue.length > 0) {
      insights.push({
        id: `schedule-upcoming-${launch.id}`,
        type: 'suggestion',
        severity: 'low',
        title: 'Tasks Due This Week',
        message: `${tasksNearDue.length} tasks are due in the next 7 days. Ensure resources are allocated.`,
        confidence: 0.95,
        metadata: { count: tasksNearDue.length }
      });
    }

    return insights;
  }

  private analyzeRisks(criticalRisks: any[]): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    if (criticalRisks.length > 0) {
      insights.push({
        id: `risks-critical-${Date.now()}`,
        type: 'risk',
        severity: 'critical',
        title: 'Unresolved Critical Risks',
        message: `${criticalRisks.length} critical or high-severity risks require immediate attention.`,
        action: 'Review risk register',
        confidence: 1.0,
        metadata: { count: criticalRisks.length, risks: criticalRisks }
      });

      const oldRisks = criticalRisks.filter(r => {
        const identified = new Date(r.identified_date);
        const daysOld = Math.floor((new Date().getTime() - identified.getTime()) / (1000 * 60 * 60 * 24));
        return daysOld > 14;
      });

      if (oldRisks.length > 0) {
        insights.push({
          id: `risks-stale-${Date.now()}`,
          type: 'warning',
          severity: 'high',
          title: 'Stale Risk Mitigation',
          message: `${oldRisks.length} critical risks have been open for over 2 weeks without resolution.`,
          action: 'Escalate risks',
          confidence: 0.9,
          metadata: { count: oldRisks.length }
        });
      }
    }

    return insights;
  }

  private analyzeBlockers(blockers: any): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    if (blockers.has_blockers) {
      const criticalBlockers = blockers.blockers.filter((b: any) => b.severity === 'critical');

      if (criticalBlockers.length > 0) {
        insights.push({
          id: `blockers-critical-${Date.now()}`,
          type: 'warning',
          severity: 'critical',
          title: 'Critical Launch Blockers',
          message: `${criticalBlockers.length} critical blockers identified. Launch progression may be halted.`,
          action: 'Address blockers',
          confidence: 1.0,
          metadata: { blockers: criticalBlockers }
        });
      }
    }

    return insights;
  }

  private analyzeDependencies(tasks: LaunchTask[]): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    const tasksWithDependencies = tasks.filter(t =>
      t.depends_on_task_ids.length > 0 && t.status !== 'completed'
    );

    for (const task of tasksWithDependencies) {
      const dependencies = tasks.filter(t => task.depends_on_task_ids.includes(t.id));
      const incompleteDeps = dependencies.filter(d => d.status !== 'completed');

      if (incompleteDeps.length > 0 && task.status === 'in_progress') {
        insights.push({
          id: `dependency-${task.id}`,
          type: 'warning',
          severity: 'medium',
          title: 'Dependency Risk',
          message: `Task "${task.task_name}" is in progress but has ${incompleteDeps.length} incomplete dependencies.`,
          action: 'Review dependencies',
          confidence: 0.8,
          metadata: { taskId: task.id, dependencies: incompleteDeps }
        });
      }
    }

    return insights;
  }

  private compareToHistoricalLaunches(launch: ClinicLaunch): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    if (launch.overall_completion_pct > 50) {
      const targetDate = new Date(launch.target_open_date);
      const plannedStart = new Date(launch.planned_start_date);
      const actualStart = launch.actual_start_date ? new Date(launch.actual_start_date) : plannedStart;

      const plannedDuration = Math.floor((targetDate.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24));
      const actualDuration = Math.floor((targetDate.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));

      if (actualDuration > plannedDuration * 1.2) {
        insights.push({
          id: `historical-duration-${launch.id}`,
          type: 'suggestion',
          severity: 'medium',
          title: 'Extended Timeline',
          message: `This launch is taking 20% longer than originally planned. Consider if additional resources or scope adjustments are needed.`,
          confidence: 0.75,
          metadata: { plannedDuration, actualDuration }
        });
      }
    }

    return insights;
  }

  private suggestMitigations(
    launch: ClinicLaunch,
    risks: any[],
    overdueTasks: any[]
  ): LaunchInsight[] {
    const insights: LaunchInsight[] = [];

    if (launch.status === 'at_risk' && launch.overall_completion_pct < 50) {
      insights.push({
        id: `mitigation-staffing-${launch.id}`,
        type: 'suggestion',
        severity: 'high',
        title: 'Consider Additional Resources',
        message: 'Launch is at risk with low completion. Consider adding staff or extending timeline to ensure quality execution.',
        action: 'Review resource plan',
        confidence: 0.7
      });
    }

    if (overdueTasks.length > 3 && risks.filter(r => r.severity === 'critical').length === 0) {
      insights.push({
        id: `mitigation-risk-identification-${launch.id}`,
        type: 'suggestion',
        severity: 'medium',
        title: 'Document Schedule Risks',
        message: 'Multiple overdue tasks detected but no critical risks logged. Consider formally documenting schedule risks and mitigation plans.',
        action: 'Add risk to register',
        confidence: 0.65
      });
    }

    return insights;
  }

  async detectScheduleSlippage(launchId: string): Promise<boolean> {
    const launch = await launchService.getLaunchById(launchId);
    if (!launch) return false;

    const targetDate = new Date(launch.target_open_date);
    const today = new Date();
    const daysUntilOpen = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const expectedCompletion = Math.max(0, Math.min(100, 100 - (daysUntilOpen / 180) * 100));

    return launch.overall_completion_pct < (expectedCompletion - 15);
  }

  async predictStaffingRisk(launchId: string): Promise<{ hasRisk: boolean; message: string }> {
    const tasks = await launchService.getTasks(launchId, { status: 'not_started' });
    const unassignedCriticalTasks = tasks.filter(t => !t.assigned_to && t.is_required);

    if (unassignedCriticalTasks.length > 5) {
      return {
        hasRisk: true,
        message: `${unassignedCriticalTasks.length} critical tasks are unassigned. Staffing gaps may delay launch.`
      };
    }

    return { hasRisk: false, message: 'Staffing allocation appears adequate.' };
  }

  async suggestNextActions(launchId: string): Promise<string[]> {
    const suggestions: string[] = [];
    const tasks = await launchService.getTasks(launchId);
    const risks = await launchService.getCriticalRisks(launchId);
    const overdue = await launchService.getOverdueTasks(launchId);

    if (overdue.length > 0) {
      suggestions.push(`Address ${overdue.length} overdue tasks to get back on schedule`);
    }

    if (risks.length > 0) {
      suggestions.push(`Update mitigation plans for ${risks.length} critical risks`);
    }

    const upcomingGateBlocKers = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed' || !t.is_gate_blocker) return false;
      const due = new Date(t.due_date);
      const daysUntilDue = Math.floor((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 14;
    });

    if (upcomingGateBlocKers.length > 0) {
      suggestions.push(`Focus on ${upcomingGateBlocKers.length} gate-blocking tasks due in next 2 weeks`);
    }

    const unassignedRequired = tasks.filter(t => !t.assigned_to && t.is_required);
    if (unassignedRequired.length > 3) {
      suggestions.push(`Assign owners to ${unassignedRequired.length} required tasks`);
    }

    return suggestions;
  }
}

export const launchAIService = new LaunchAIService();
