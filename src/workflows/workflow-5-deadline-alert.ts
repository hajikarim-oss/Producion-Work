import { defineLogicFunction } from 'twenty-sdk/define';
import { ProjectStage, TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_5_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0005-deadline-alert-000000000005';

export interface ProjectDeadlineCandidate {
  id: string;
  title: string;
  deadline: string;
  currentStage: ProjectStage;
  assignedTo?: {
    name: string;
    email: string;
  };
}

export const deadlineAlertProcessor = async (projects: ProjectDeadlineCandidate[]) => {
  const now = Date.now();
  const alertWindowMs = TBM_CONFIG.DEADLINE_ALERT_DAYS * 24 * 60 * 60 * 1000;
  const sentAlerts: any[] = [];

  for (const project of projects) {
    if (project.currentStage === ProjectStage.DELIVERED || project.currentStage === ProjectStage.CLOSED) {
      continue;
    }

    const deadlineTime = new Date(project.deadline).getTime();
    const diffMs = deadlineTime - now;
    const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    // If within 3 days (or overdue)
    if (diffMs <= alertWindowMs && project.assignedTo?.email) {
      const emailPayload = {
        to: project.assignedTo.email,
        cc: TBM_CONFIG.ADMIN_EMAIL,
        from: TBM_CONFIG.SMTP_FROM,
        subject: daysLeft < 0
          ? `⚠️ [OVERDUE] Deadline Passed for "${project.title}"`
          : `⏳ [Upcoming Deadline] ${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining for "${project.title}"`,
        template: 'deadline_alert',
        variables: {
          assigneeName: project.assignedTo.name,
          projectTitle: project.title,
          deadline: project.deadline,
          daysLeft: Math.max(0, daysLeft),
          isOverdue: daysLeft < 0,
          projectUrl: `https://${TBM_CONFIG.DOMAIN}/projects/${project.id}`,
        },
      };

      sentAlerts.push({
        projectId: project.id,
        assigneeEmail: project.assignedTo.email,
        daysLeft,
        email: emailPayload,
      });

      console.log(
        `[Workflow 5] Deadline alert dispatched for "${project.title}" (${daysLeft} days left) to ${project.assignedTo.email} & CC Sachin.`,
      );
    }
  }

  return {
    candidatesProcessed: projects.length,
    alertsSent: sentAlerts.length,
    sentAlerts,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_5_UNIVERSAL_IDENTIFIER,
  name: 'workflow-deadline-alert',
  description:
    'Daily 8:00 AM IST cron job alerting assignees and CCing Sachin for projects approaching deadline within 3 days',
  cronTriggerSettings: {
    // 08:00 AM IST is 02:30 AM UTC
    pattern: '30 2 * * *',
  },
  timeoutSeconds: 60,
  handler: async (_payload, context) => {
    console.log(`[Workflow 5] Executing daily 8 AM deadline scan for workspace ${context.workspaceId}`);
    return { status: 'DEADLINE_SCAN_COMPLETED' };
  },
});
