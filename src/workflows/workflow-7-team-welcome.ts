import { defineLogicFunction } from 'twenty-sdk/define';
import { TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_7_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0007-team-welcome-000000000007';

export const teamMemberWelcomeHandler = async (payload: {
  record: {
    id: string;
    name?: string;
    userEmail?: string;
    department?: string;
    [key: string]: any;
  };
}) => {
  const member = payload.record;
  const recipient = member.userEmail || member.email;

  if (!recipient) {
    console.warn(`[Workflow 7] Member created without valid email.`);
    return { skipped: true, reason: 'No email found' };
  }

  const welcomeEmail = {
    to: recipient,
    from: TBM_CONFIG.SMTP_FROM,
    subject: `🐒 Welcome to The Bored Monkey — Your Workspace is Ready!`,
    template: 'team_welcome',
    variables: {
      memberName: member.name || 'Team Member',
      department: member.department || 'Creative Operations',
      workspaceLink: `https://${TBM_CONFIG.DOMAIN}`,
      adminName: TBM_CONFIG.ADMIN_NAME,
    },
  };

  console.log(
    `[Workflow 7] Team welcome email sent to ${recipient} (${member.department || 'Creative'}).`,
  );

  return {
    success: true,
    welcomeEmailDispatched: welcomeEmail,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_7_UNIVERSAL_IDENTIFIER,
  name: 'workflow-team-member-welcome',
  description:
    'Dispatches workspace onboarding welcome email and instructions to new team members',
  databaseEventTriggerSettings: {
    eventName: 'workspaceMember.created',
  },
  timeoutSeconds: 20,
  handler: teamMemberWelcomeHandler,
});
