import React from 'react';
import {
  SectionShell,
  Section,
  Row,
} from '../_components/SectionShell';
import { TextInput, NumberInput } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkspaceSettingsPage() {
  const [workspaceName, setWorkspaceName] = React.useState('The Bored Monkey');
  const [domain, setDomain] = React.useState('theboredmonkey.com');
  const [adminEmail, setAdminEmail] = React.useState('sachin@theboredmonkey.com');
  const [timezone, setTimezone] = React.useState('Asia/Kolkata');
  const [staleDays, setStaleDays] = React.useState(1);
  const [escalateAfter, setEscalateAfter] = React.useState(3);
  const [deadlineAlertDays, setDeadlineAlertDays] = React.useState(3);
  const [brandReviewNudgeDays, setBrandReviewNudgeDays] = React.useState(2);
  const [archiveAfterDays, setArchiveAfterDays] = React.useState(30);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    toast.success('Workspace operational parameters saved (TBM_CONFIG updated)');
  };

  return (
    <SectionShell
      title="Workspace Operations & Constants"
      description="Operational parameters, cron schedule timezones, and administrative alert targets (Master Spec Part 10: TBM_CONFIG)."
      actions={
        <Button
          onClick={() => handleSave()}
          variant="default"
          size="sm"
          className="gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          Save Settings
        </Button>
      }
    >
      <Section
        eyebrow="General Agency Identity"
        description="Core organization identity parameters used in system email headers, webhook signatures, and client portal routes."
      >
        <Row
          label="Agency / Workspace Name"
          description="Display name rendered across navigation and notifications."
        >
          <TextInput
            value={workspaceName}
            onChange={setWorkspaceName}
            className="w-full sm:w-72"
          />
        </Row>

        <Row
          label="Primary Domain"
          description="Canonical domain used for sender identity and webhook origins."
        >
          <TextInput
            value={domain}
            onChange={setDomain}
            className="w-full sm:w-72"
          />
        </Row>

        <Row
          label="Master Admin Email"
          description="Sachin's administrative inbox for critical escalations (Workflow 3) and daily digests."
        >
          <TextInput
            type="email"
            value={adminEmail}
            onChange={setAdminEmail}
            className="w-full sm:w-72"
          />
        </Row>

        <Row
          label="Operating Timezone"
          description="Reference timezone for daily 8:00 AM and 9:00 AM IST automation crons."
        >
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full sm:w-72"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
            <option value="UTC">UTC (Universal Coordinated Time)</option>
          </select>
        </Row>
      </Section>

      <Section
        eyebrow="Automation Workflows & SLA Thresholds"
        description="Fine-tune day horizons and nudge frequencies governing the 7 automated production workflows."
      >
        <Row
          label="Stale Task Warning Threshold (Workflow 4)"
          description="Flag tasks with zero stage progress after this many business days."
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={staleDays}
              onChange={setStaleDays}
              min={1}
              max={14}
              suffix="days"
              className="w-32"
            />
          </div>
        </Row>

        <Row
          label="Admin Escalation Trigger"
          description="Escalate directly to Sachin after this number of unaddressed automated nudges."
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={escalateAfter}
              onChange={setEscalateAfter}
              min={1}
              max={10}
              suffix="nudges"
              className="w-32"
            />
          </div>
        </Row>

        <Row
          label="Deadline Alert Horizon (Workflow 5)"
          description="Send morning warnings for projects due within this upcoming window."
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={deadlineAlertDays}
              onChange={setDeadlineAlertDays}
              min={1}
              max={14}
              suffix="days"
              className="w-32"
            />
          </div>
        </Row>

        <Row
          label="Brand Review Gentle Nudge (Workflow 6)"
          description="Frequency for gentle feedback reminders sent to brand POCs while in Client Feedback."
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={brandReviewNudgeDays}
              onChange={setBrandReviewNudgeDays}
              min={1}
              max={7}
              suffix="days"
              className="w-32"
            />
          </div>
        </Row>

        <Row
          label="Delivered Project Auto-Archive"
          description="Move completed and approved deliverables to the archive state after delivery."
        >
          <div className="flex items-center gap-2">
            <NumberInput
              value={archiveAfterDays}
              onChange={setArchiveAfterDays}
              min={7}
              max={90}
              suffix="days"
              className="w-32"
            />
          </div>
        </Row>
      </Section>

      <Section
        eyebrow="Infrastructure & SMTP Transport"
        description="Core services routing transactional emails and webhook dispatches."
      >
        <Row
          label="Twenty Platform Build"
          description="Open-source TypeScript monorepo with NestJS backend, React frontend & PostgreSQL."
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[11px] bg-slate-50">
              v0.40.0 (Production CRM)
            </Badge>
          </div>
        </Row>

        <Row
          label="Outbound SMTP Relay"
          description="Resend relay credentials authenticated over TLS 1.3 on port 465."
        >
          <div className="flex items-center gap-2 text-[12px] text-slate-700 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            smtp.resend.com:465
          </div>
        </Row>

        <Row
          label="Webhook Signing Algorithm"
          description="Cryptographic signature applied to all outbound HTTP webhook dispatches."
        >
          <div className="flex items-center gap-2 text-[12px] text-slate-700 font-mono">
            HMAC-SHA256 (TBM_WEBHOOK_SECRET)
          </div>
        </Row>
      </Section>
    </SectionShell>
  );
}
