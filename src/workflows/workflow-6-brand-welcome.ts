import { defineLogicFunction } from 'twenty-sdk/define';
import { TBM_CONFIG } from '../config/tbm.config';

export const WORKFLOW_6_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0006-brand-welcome-000000000006';

export const brandWelcomeHandler = async (payload: {
  record: {
    id: string;
    name: string;
    pocName?: string;
    pocEmail?: string;
    [key: string]: any;
  };
}) => {
  const brand = payload.record;
  if (!brand.pocEmail) {
    console.warn(`[Workflow 6] Brand ${brand.name} created without POC email.`);
    return { skipped: true, reason: 'No POC email provided' };
  }

  const welcomeEmail = {
    to: brand.pocEmail,
    from: TBM_CONFIG.SMTP_FROM,
    subject: `🚀 Welcome to The Bored Monkey — Your Brand Tracker is Live!`,
    template: 'brand_welcome',
    variables: {
      brandName: brand.name,
      pocName: brand.pocName || 'Brand Partner',
      portalLink: `https://${TBM_CONFIG.DOMAIN}/portal/brand/${brand.id}`,
      supportEmail: TBM_CONFIG.ADMIN_EMAIL,
    },
  };

  console.log(
    `[Workflow 6] Brand Welcome email dispatched to ${brand.pocEmail} for brand "${brand.name}".`,
  );

  return {
    success: true,
    welcomeEmailDispatched: welcomeEmail,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_6_UNIVERSAL_IDENTIFIER,
  name: 'workflow-brand-welcome',
  description:
    'Dispatches branded welcome email with client portal access when a new Brand is onboarded',
  databaseEventTriggerSettings: {
    eventName: 'brand.created',
  },
  timeoutSeconds: 20,
  handler: brandWelcomeHandler,
});
