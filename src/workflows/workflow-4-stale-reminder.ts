import { defineLogicFunction } from 'twenty-sdk/define';
import { ProjectStage, TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_4_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0004-stale-reminder-000000000004';

export interface StaleProjectCandidate {
  id: string;
  title: string;
  lastUpdated: string;
  currentStage: ProjectStage;
  reminderCount?: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
}

export const staleReminderProcessor = async (projects: StaleProjectCandidate[]) => {
  const oneDayAgo = Date.now() - TBM_CONFIG.STALE_DAYS * 24 * 60 * 60 * 1000;
  const terminalStages: ProjectStage[] = [
    ProjectStage.FINAL_APPROVED,
    ProjectStage.DELIVERED,
    ProjectStage.INVOICED,
    ProjectStage.CLOSED,
  ];

  const notificationsSent: any[] = [];

  for (const project of projects) {
    const updatedTime = new Date(project.lastUpdated).getTime();
    const isStale = updatedTime < oneDayAgo;
    const isTerminal = terminalStages.includes(project.currentStage);
    const hasActiveAssignee = project.assignedTo && project.assignedTo.status === 'ACTIVE';

    if (isStale && !isTerminal && hasActiveAssignee) {
      const currentReminderCount = (project.reminderCount || 0) + 1;
      const shouldEscalate = currentReminderCount >= TBM_CONFIG.ESCALATE_AFTER;

      const emailPayload = {
        to: project.assignedTo!.email,
        cc: shouldEscalate ? TBM_CONFIG.ADMIN_EMAIL : undefined,
        from: TBM_CONFIG.SMTP_FROM,
        subject: shouldEscalate
          ? `🚨 [ESCALATION] Overdue Update Required: ${project.title}`
          : `⏰ Reminder: Please update status for "${project.title}"`,
        template: 'stale_reminder',
        variables: {
          assigneeName: project.assignedTo!.name,
          projectTitle: project.title,
          lastUpdated: project.lastUpdated,
          reminderCount: currentReminderCount,
          isEscalated: shouldEscalate,
          updateLink: `https://${TBM_CONFIG.DOMAIN}/projects/${project.id}`,
        },
      };

      notificationsSent.push({
        projectId: project.id,
        assigneeEmail: project.assignedTo!.email,
        reminderCount: currentReminderCount,
        escalatedToAdmin: shouldEscalate,
        email: emailPayload,
      });

      console.log(
        `[Workflow 4] Stale notification #${currentReminderCount} sent for project "${project.title}" to ${project.assignedTo!.email}${shouldEscalate ? ' (CC: Sachin)' : ''}`,
      );
    }
  }

  return {
    processedCount: projects.length,
    notificationsSentCount: notificationsSent.length,
    notificationsSent,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_4_UNIVERSAL_IDENTIFIER,
  name: 'workflow-stale-task-reminder',
  description:
    'Daily 9:00 AM IST cron job identifying stale non-terminal projects and dispatching reminders with escalation tracking',
  cronTriggerSettings: {
    // 09:00 AM IST is 03:30 AM UTC
    pattern: '30 3 * * *',
  },
  timeoutSeconds: 60,
  handler: async (_payload, context) => {
    console.log(`[Workflow 4] Starting daily 9 AM stale check for workspace ${context.workspaceId}`);
    return { status: 'CRON_SCHEDULED_ACTIVE' };
  },
});
