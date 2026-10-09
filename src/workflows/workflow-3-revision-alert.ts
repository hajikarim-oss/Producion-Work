import { defineLogicFunction } from 'twenty-sdk/define';
import { RevisionRound, TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_3_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0003-revision-alert-000000000003';

export const revisionAlertHandler = async (payload: {
  record: {
    id: string;
    title: string;
    revisionRound: RevisionRound;
    brand?: { name: string };
    assignedTo?: { name: string; email: string };
    [key: string]: any;
  };
  previousRecord?: {
    revisionRound: RevisionRound;
    [key: string]: any;
  };
}) => {
  const isTransitionToR3 =
    payload.record.revisionRound === RevisionRound.R3 &&
    payload.previousRecord?.revisionRound !== RevisionRound.R3;

  if (!isTransitionToR3) {
    return { skipped: true };
  }

  const alertEmail = {
    to: TBM_CONFIG.ADMIN_EMAIL,
    from: TBM_CONFIG.SMTP_FROM,
    subject: `⚠️ Escalation Alert: "${payload.record.title}" has reached Revision Round 3`,
    template: 'revision_alert',
    variables: {
      adminName: TBM_CONFIG.ADMIN_NAME,
      projectTitle: payload.record.title,
      brandName: payload.record.brand?.name || 'Unassigned Brand',
      assigneeName: payload.record.assignedTo?.name || 'Unassigned',
      revisionRound: payload.record.revisionRound,
      projectUrl: `https://${TBM_CONFIG.DOMAIN}/projects/${payload.record.id}`,
    },
  };

  console.log(
    `[Workflow 3] Escalation: Revision R3 alert triggered for "${payload.record.title}". Emailing Sachin.`,
  );

  return {
    success: true,
    alertDispatched: alertEmail,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_3_UNIVERSAL_IDENTIFIER,
  name: 'workflow-revision-r3-alert',
  description: 'Sends urgent escalation alert to Sachin when a project hits Revision Round 3',
  databaseEventTriggerSettings: {
    eventName: 'project.updated',
  },
  timeoutSeconds: 15,
  handler: revisionAlertHandler,
});
