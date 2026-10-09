import { defineLogicFunction } from 'twenty-sdk/define';
import { ClientStatus, ProjectStage, TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_2_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0002-first-cut-email-000000000002';

export const firstCutNotificationHandler = async (payload: {
  record: {
    id: string;
    title: string;
    currentStage: ProjectStage;
    brand?: {
      id: string;
      name: string;
      pocName?: string;
      pocEmail?: string;
    };
    [key: string]: any;
  };
  previousRecord?: {
    currentStage: ProjectStage;
    [key: string]: any;
  };
}) => {
  const isTransitionToFirstCut =
    payload.record.currentStage === ProjectStage.FIRST_CUT_SENT &&
    payload.previousRecord?.currentStage !== ProjectStage.FIRST_CUT_SENT;

  if (!isTransitionToFirstCut) {
    return { skipped: true, reason: 'Not transitioned to FIRST_CUT_SENT' };
  }

  const brand = payload.record.brand;
  const recipientEmail = brand?.pocEmail;

  if (!recipientEmail) {
    console.warn(
      `Project ${payload.record.id} (${payload.record.title}) has no brand POC email configured.`,
    );
    return { error: 'No brand POC email' };
  }

  const emailPayload = {
    to: recipientEmail,
    from: TBM_CONFIG.SMTP_FROM,
    template: 'first_cut_ready',
    variables: {
      brandName: brand?.name || 'Brand Partner',
      pocName: brand?.pocName || 'Team',
      projectTitle: payload.record.title,
      reviewLink: `https://${TBM_CONFIG.DOMAIN}/portal/projects/${payload.record.id}/review`,
    },
  };

  console.log(
    `[Workflow 2] Dispatching First Cut email to ${recipientEmail} for project "${payload.record.title}"`,
  );

  return {
    success: true,
    emailDispatched: emailPayload,
    clientStatusUpdated: ClientStatus.AWAITING_FEEDBACK,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_2_UNIVERSAL_IDENTIFIER,
  name: 'workflow-first-cut-notification',
  description:
    'Dispatches review email notification to Brand POC when first cut is sent',
  databaseEventTriggerSettings: {
    eventName: 'project.updated',
  },
  timeoutSeconds: 20,
  handler: firstCutNotificationHandler,
});
