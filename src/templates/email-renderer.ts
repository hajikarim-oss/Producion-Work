import * as templatesData from './templates.json';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
}

export function renderEmail(
  templateId: string,
  variables: Record<string, any>,
): { subject: string; html: string } {
  const template = (templatesData.templates as EmailTemplate[]).find(
    t => t.id === templateId,
  );

  if (!template) {
    throw new Error(`Email template not found: ${templateId}`);
  }

  let subject = template.subject;
  let html = template.bodyHtml;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    const safeValue = value !== undefined && value !== null ? String(value) : '';
    subject = subject.replace(regex, safeValue);
    html = html.replace(regex, safeValue);
  }

  return { subject, html };
}
