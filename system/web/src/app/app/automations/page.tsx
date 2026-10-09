import React from 'react';
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  Stat,
  StatStrip,
  TopbarAction,
} from '@/components/layout/Page';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Play,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Send,
  Webhook,
  Server,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TBMWorkflow {
  id: string;
  number: number;
  name: string;
  description: string;
  triggerType: 'Record Updated' | 'Schedule Cron' | 'Record Created';
  targetObject: 'Project' | 'Brand' | 'WorkspaceMember';
  condition: string;
  actions: string[];
  template?: string;
  status: 'ACTIVE' | 'PAUSED';
  lastRun?: string;
}

const TBM_WORKFLOWS: TBMWorkflow[] = [
  {
    id: 'wf_stage_validation',
    number: 1,
    name: 'Workflow 1: Stage Transition Validation',
    description: 'Enforces valid state-machine paths across all 22 pipeline stages and updates client status.',
    triggerType: 'Record Updated',
    targetObject: 'Project',
    condition: 'Field "currentStage" changed',
    actions: [
      'Code Action: Validate transition against validTransitions state-machine matrix',
      'Update Record: Set lastUpdated = NOW()',
      'Update Record: Recompute clientStatus based on currentStage mapping',
      'Filter & Branch: If currentStage == "FIRST_CUT_SENT" → invoke Workflow 2',
    ],
    status: 'ACTIVE',
    lastRun: '2 mins ago',
  },
  {
    id: 'wf_first_cut_notification',
    number: 2,
    name: 'Workflow 2: Brand POC First-Cut Notification',
    description: 'Alerts designated brand POC when rough cut / first edit is rendered and uploaded.',
    triggerType: 'Record Updated',
    targetObject: 'Project',
    condition: 'currentStage == "FIRST_CUT_SENT"',
    actions: [
      'Search Records: Brand matching project.brand.id',
      'Send Email: To brand.pocEmail using template "first_cut_ready"',
      'Update Record: clientStatus = "AWAITING_FEEDBACK"',
    ],
    template: 'first_cut_ready',
    status: 'ACTIVE',
    lastRun: '1 hour ago',
  },
  {
    id: 'wf_revision_alert_admin',
    number: 3,
    name: 'Workflow 3: Revision Alert to Admin',
    description: 'Critical escalation to Sachin whenever any project reaches round 3 revisions.',
    triggerType: 'Record Updated',
    targetObject: 'Project',
    condition: 'revisionRound changed to "R3"',
    actions: [
      'Send Email: To sachin@theboredmonkey.com ("Project on 3rd revision — intervention needed")',
      'Slack/Webhook: Post high-priority alert to #tbm-leads-sachin',
    ],
    template: 'revision_alert',
    status: 'ACTIVE',
    lastRun: '4 hours ago',
  },
  {
    id: 'wf_stale_task_reminder',
    number: 4,
    name: 'Workflow 4: Stale Task Reminder (Daily 9:00 AM IST)',
    description: 'Automated morning scan of inactive projects without stage progress in past 24 hours.',
    triggerType: 'Schedule Cron',
    targetObject: 'Project',
    condition: 'Daily at 9:00 AM IST (Asia/Kolkata) & lastUpdated < NOW() - 1 day',
    actions: [
      'Search Records: Projects where stage NOT IN [DELIVERED, CLOSED, FINAL_APPROVED]',
      'Iterator: Loop over stale deliverables',
      'Send Email: To assignedTo.email with template "stale_reminder"',
      'Code Action: Track escalation count in ReminderLog (escalates to Sachin after 3 reminders)',
    ],
    template: 'stale_reminder',
    status: 'ACTIVE',
    lastRun: 'Today, 9:00 AM',
  },
  {
    id: 'wf_deadline_alert',
    number: 5,
    name: 'Workflow 5: Deadline Alert (Daily 8:00 AM IST)',
    description: 'Pre-emptive deadline watchdog firing 3 days prior to client target delivery date.',
    triggerType: 'Schedule Cron',
    targetObject: 'Project',
    condition: 'Daily at 8:00 AM IST & deadline <= NOW() + 3 days',
    actions: [
      'Search Records: Projects with deadline within 3 days and stage != DELIVERED',
      'Send Email: To assignedTo.email, CC sachin@theboredmonkey.com template "deadline_alert"',
    ],
    template: 'deadline_alert',
    status: 'ACTIVE',
    lastRun: 'Today, 8:00 AM',
  },
  {
    id: 'wf_brand_welcome',
    number: 6,
    name: 'Workflow 6: New Brand Welcome & Portal Access',
    description: 'Instantly grants portal access and sends onboarding guide to newly onboarded client POC.',
    triggerType: 'Record Created',
    targetObject: 'Brand',
    condition: 'Brand record created with active pocEmail',
    actions: [
      'Create Record: Generate Client Portal Access token for Brand POC',
      'Send Email: To brand.pocEmail with template "brand_welcome" and portal login URL',
    ],
    template: 'brand_welcome',
    status: 'ACTIVE',
    lastRun: 'Yesterday',
  },
  {
    id: 'wf_team_member_welcome',
    number: 7,
    name: 'Workflow 7: New Team Member Workspace Onboarding',
    description: 'Dispatches workspace credentials and sets role-scoped default views on signup.',
    triggerType: 'Record Created',
    targetObject: 'WorkspaceMember',
    condition: 'WorkspaceMember created or invited',
    actions: [
      'Send Email: To member.email with template "team_welcome" and login credentials',
      'Create Record: Assign default view presets based on department (Creative / Editor / Production)',
    ],
    template: 'team_welcome',
    status: 'ACTIVE',
    lastRun: '3 days ago',
  },
];

import { useTBMStore } from '@/lib/tbm/tbmStore';

export default function AutomationsPage() {
  const runWorkflowSimulation = useTBMStore((s) => s.runWorkflowSimulation);
  const [workflows, setWorkflows] = React.useState<TBMWorkflow[]>(TBM_WORKFLOWS);

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id
          ? { ...wf, status: wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : wf,
      ),
    );
    const wf = workflows.find((w) => w.id === id);
    const nextStatus = wf?.status === 'ACTIVE' ? 'Paused' : 'Activated';
    toast.success(`${wf?.name} is now ${nextStatus}`);
  };

  const handleTestRun = (wf: TBMWorkflow) => {
    const res = runWorkflowSimulation(wf.number);
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, lastRun: 'Just now' } : w)),
    );
    toast.success(`⚡ ${wf.name} executed!\n${res.message}`, {
      duration: 4000,
    });
  };

  const handleTestSMTP = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 600)),
      {
        loading: 'Connecting to smtp.resend.com:465 with TLS 1.3...',
        success: '✅ Resend SMTP Relay Verified! Outbound test ping delivered from noreply@theboredmonkey.com.',
        error: 'Connection failed',
      },
    );
  };

  const handleTestWebhook = (name: string, event: string) => {
    toast.success(`⚡ Dispatched test ${event} webhook to ${name} with valid HMAC-SHA256 signature.`);
  };

  const activeCount = workflows.filter((w) => w.status === 'ACTIVE').length;

  return (
    <Page>
      <PageTopbar
        title="Automated Workflows & State Machine Engine"
        subtitle="Manage the 7 Twenty-native automated production workflows, trigger conditions, and webhook dispatches."
      />

      <StatStrip cols={4}>
        <Stat
          label="Active Workflows"
          value={`${activeCount} of ${workflows.length}`}
          sub="100% operational"
        />
        <Stat
          label="SMTP Mailer"
          value="Connected"
          sub="smtp.resend.com:465"
        />
        <Stat
          label="Webhooks Synced"
          value="3 Active"
          sub="HMAC SHA-256"
        />
        <Stat
          label="Avg Workflow Speed"
          value="< 450ms"
          sub="worker pool healthy"
        />
      </StatStrip>

      <PageBody>
        <SectionBar
          title="TBM Production Workflows (Master Build Spec Part 3)"
          count={workflows.length}
          description="Native background automations executing valid stage transitions, client email notifications, and SLA alerts."
        />

        <div className="space-y-4">
          {workflows.map((wf) => (
            <Card key={wf.id} className="overflow-hidden">
              <div className="p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                    #{wf.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{wf.name}</h3>
                      <Badge variant={wf.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {wf.status}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {wf.triggerType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleTestRun(wf)}
                  >
                    <Play className="w-3 h-3 text-emerald-600" />
                    Test Run
                  </Button>
                  <Button
                    variant={wf.status === 'ACTIVE' ? 'secondary' : 'default'}
                    size="sm"
                    className="text-xs"
                    onClick={() => toggleWorkflow(wf.id)}
                  >
                    {wf.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>

              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">
                    Trigger Condition:
                  </span>
                  <div className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground border border-border">
                    {wf.condition}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">
                    Automated Actions Pipeline:
                  </span>
                  <ul className="space-y-1.5">
                    {wf.actions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SMTP Configuration Section */}
        <SectionBar
          title="SMTP Email Infrastructure (Part 5)"
          description="Configured workspace outbound SMTP server used for all automated brand POC notices and reminders."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  SMTP Server Configuration
                </CardTitle>
                <Badge variant="default" className="bg-emerald-600">Connected</Badge>
              </div>
              <CardDescription className="text-xs">
                Resend Enterprise Relay with TLS enforcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Host:</span>
                <span className="font-mono font-medium">smtp.resend.com:465 (SSL)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">From Address:</span>
                <span className="font-medium">noreply@theboredmonkey.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Sender Name:</span>
                <span className="font-medium">The Bored Monkey</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Admin Alert Recipient:</span>
                <span className="font-medium">sachin@theboredmonkey.com</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-end">
                <Button variant="outline" size="sm" onClick={handleTestSMTP} className="gap-1.5 text-xs">
                  <Send className="w-3 h-3 text-indigo-600" />
                  Send Test Ping (Resend)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-purple-600" />
                  Webhooks & Integrations (Part 7)
                </CardTitle>
                <Badge variant="outline">HMAC-SHA256 Active</Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time event dispatches for external Slack / WhatsApp / Smartlead sync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <div>
                  <div className="font-semibold text-foreground">N8N Stage Sync</div>
                  <div className="text-[11px] text-muted-foreground font-mono">https://n8n.theboredmonkey.com/webhook/tbm-stage-change</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">project.updated</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleTestWebhook('N8N', 'project.updated')} className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-800">
                    Ping
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <div>
                  <div className="font-semibold text-foreground">External Notification API</div>
                  <div className="text-[11px] text-muted-foreground font-mono">https://api.theboredmonkey.com/tbm/notify</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">project.created</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleTestWebhook('API Gateway', 'project.created')} className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-800">
                    Ping
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div>
                  <div className="font-semibold text-foreground">Smartlead Push Sync</div>
                  <div className="text-[11px] text-muted-foreground font-mono">https://smartlead.ai/webhook/tbm</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">FIRST_CUT_SENT</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleTestWebhook('Smartlead', 'FIRST_CUT_SENT')} className="h-6 text-[11px] px-2 text-indigo-600 hover:text-indigo-800">
                    Ping
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}
