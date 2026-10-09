import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Brand,
  Project,
  TBMNotification,
  TBMRole,
  TeamMember,
  TransitionLog,
} from './types';
import {
  ClientStatus,
  computeOverallStatus,
  mapStageToClientStatus,
  ProjectStage,
  VALID_STAGE_TRANSITIONS,
} from './types';
import { INITIAL_BRANDS, INITIAL_MEMBERS, INITIAL_PROJECTS, INITIAL_AUDIT_LOGS } from './seedData';

interface TBMState {
  projects: Project[];
  brands: Brand[];
  members: TeamMember[];
  notifications: TBMNotification[];
  auditLogs: TransitionLog[];
  activeRole: TBMRole;
  setActiveRole: (role: TBMRole) => void;
  updateProject: (
    id: string,
    patch: Partial<Project>,
  ) => { success: boolean; error?: string };
  addProject: (project: Omit<Project, 'id' | 'lastUpdated' | 'overallStatus' | 'clientStatus'>) => void;
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  escalateProject: (id: string, reason?: string) => void;
  extendSLA: (id: string, newDate: string, reason: string) => void;
  runWorkflowSimulation: (workflowNumber: number) => { success: boolean; message: string; affectedCount: number };
  triggerScheduledWorkflows: () => { staleCount: number; deadlineCount: number };
  resetToInitial: () => void;
}

export const useTBMStore = create<TBMState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      brands: INITIAL_BRANDS,
      members: INITIAL_MEMBERS,
      auditLogs: INITIAL_AUDIT_LOGS,
      activeRole: 'ADMIN',
      notifications: [
        {
          id: 'notif-init-1',
          time: new Date(Date.now() - 3600000).toISOString(),
          type: 'WORKFLOW_2',
          title: 'First Cut Review Dispatched',
          recipient: 'Pooja Verma (Zepto POC)',
          details: 'Project "Zepto 10-Min Grocery Hack" preview link emailed to Brand POC.',
        },
        {
          id: 'notif-init-2',
          time: new Date(Date.now() - 7200000).toISOString(),
          type: 'WORKFLOW_3',
          title: 'Escalation Alert: Revision R3 Reached',
          recipient: 'sachin@theboredmonkey.com',
          details: 'Project "Boat Bassheads Unboxing Reel" reached Revision Round R3. Sachin notified.',
        },
      ],

      setActiveRole: (role: TBMRole) => set({ activeRole: role }),

      updateProject: (id: string, patch: Partial<Project>) => {
        const { projects, activeRole, notifications } = get();
        const existing = projects.find((p) => p.id === id);
        if (!existing) return { success: false, error: 'Project not found' };

        // 1. Role permission enforcement
        if (activeRole === 'EDITOR' || activeRole === 'CREATIVE') {
          const allowedFields = ['editStatus', 'revisionRound', 'internalNotes', 'notes', 'reviewUrl'];
          for (const key of Object.keys(patch)) {
            if (!allowedFields.includes(key)) {
              return {
                success: false,
                error: `${activeRole} role is not permitted to edit field "${key}". Only edit status, revision round, notes, and review link can be modified.`,
              };
            }
          }
        } else if (activeRole === 'BRAND_POC') {
          const allowedFields = ['currentStage', 'clientStatus', 'revisionRound', 'notes'];
          for (const key of Object.keys(patch)) {
            if (!allowedFields.includes(key)) {
              return {
                success: false,
                error: `Brand POC cannot modify internal field "${key}". Only deliverable approval and feedback notes are allowed.`,
              };
            }
          }
          if (
            patch.currentStage &&
            patch.currentStage !== ProjectStage.FINAL_APPROVED &&
            patch.currentStage !== ProjectStage.REVISION_R1 &&
            patch.currentStage !== ProjectStage.REVISION_R2 &&
            patch.currentStage !== ProjectStage.REVISION_R3
          ) {
            return {
              success: false,
              error: `Brand POC can only submit approvals or revision requests.`,
            };
          }
        }

        // 2. State machine stage validation
        if (patch.currentStage && patch.currentStage !== existing.currentStage) {
          const allowedTransitions = VALID_STAGE_TRANSITIONS[existing.currentStage] || [];
          if (!allowedTransitions.includes(patch.currentStage)) {
            return {
              success: false,
              error: `Invalid transition: ${existing.currentStage} → ${patch.currentStage}. Allowed next stages: [${allowedTransitions.join(', ')}]`,
            };
          }
        }

        const newNotifications = [...notifications];

        // 3. Workflow 2: First-cut notification trigger
        if (patch.currentStage === ProjectStage.FIRST_CUT_SENT && existing.currentStage !== ProjectStage.FIRST_CUT_SENT) {
          newNotifications.unshift({
            id: 'notif-' + Date.now(),
            time: new Date().toISOString(),
            type: 'WORKFLOW_2',
            title: `🎬 First Cut Sent for "${existing.title}"`,
            recipient: `${existing.brandName} POC`,
            details: `Automated review link dispatched to ${existing.brandName} POC. Status updated to "Awaiting your feedback".`,
          });
        }

        // 4. Workflow 3: Revision R3 Escalation
        if (patch.revisionRound === 'R3' && existing.revisionRound !== 'R3') {
          newNotifications.unshift({
            id: 'notif-' + Date.now(),
            time: new Date().toISOString(),
            type: 'WORKFLOW_3',
            title: `⚠️ Revision R3 Alert: "${existing.title}"`,
            recipient: 'sachin@theboredmonkey.com',
            details: `Deliverable hit 3rd round of revisions. Urgent notification emailed to Sachin.`,
          });
        }

        // 5. Compute derived fields
        const targetStage = patch.currentStage || existing.currentStage;
        const targetDeadline = patch.deadline || existing.deadline;
        const computedClientStatus = mapStageToClientStatus(targetStage);
        const computedOverallStatus = computeOverallStatus(targetDeadline, targetStage);

        const newAuditLogs = [...(get().auditLogs || [])];
        if (patch.currentStage && patch.currentStage !== existing.currentStage) {
          const automations: string[] = ['Workflow 1: Stage Validation'];
          if (patch.currentStage === ProjectStage.FIRST_CUT_SENT) {
            automations.push('Workflow 2: First-Cut Notification to POC');
          }
          if (patch.revisionRound === 'R3' || existing.revisionRound === 'R3') {
            automations.push('Workflow 3: R3 Revision Alert to Sachin');
          }
          automations.push('Twenty HMAC Webhook (n8n)');

          const actorName =
            activeRole === 'ADMIN'
              ? 'Sachin'
              : activeRole === 'EDITOR'
                ? 'Ishan'
                : activeRole === 'CREATIVE'
                  ? 'Priya'
                  : 'Rajesh (POC)';

          newAuditLogs.unshift({
            id: 'log_' + Date.now(),
            projectId: existing.id,
            projectTitle: existing.title,
            brandName: existing.brandName,
            fromStage: existing.currentStage,
            toStage: patch.currentStage,
            clientStatus: computedClientStatus,
            actor: actorName,
            actorRole: activeRole,
            isValidated: true,
            automationsFired: automations,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
          });
        }

        const updatedProject: Project = {
          ...existing,
          ...patch,
          clientStatus: computedClientStatus,
          overallStatus: computedOverallStatus,
          lastUpdated: new Date().toISOString(),
        };

        const updatedProjects = projects.map((p) => (p.id === id ? updatedProject : p));

        set({
          projects: updatedProjects,
          notifications: newNotifications,
          auditLogs: newAuditLogs,
        });

        return { success: true };
      },

      addProject: (newP) => {
        const { projects, brands, members, auditLogs } = get();
        const brand = brands.find((b) => b.id === newP.brandId);
        const member = members.find((m) => m.id === newP.assignedToId);
        const id = 'proj_' + String(projects.length + 1).padStart(3, '0');
        const clientStatus = mapStageToClientStatus(newP.currentStage);
        const overallStatus = computeOverallStatus(newP.deadline, newP.currentStage);

        const project: Project = {
          ...newP,
          id,
          brandName: brand?.name || 'Unassigned Brand',
          assigneeName: member?.name || 'Unassigned',
          assigneeEmail: member?.email || '',
          clientStatus,
          overallStatus,
          lastUpdated: new Date().toISOString(),
        };

        const newAuditLogs = [...(auditLogs || [])];
        newAuditLogs.unshift({
          id: 'log_' + Date.now(),
          projectId: id,
          projectTitle: project.title,
          brandName: project.brandName,
          fromStage: ProjectStage.BRIEF_RECEIVED,
          toStage: ProjectStage.BRIEF_RECEIVED,
          clientStatus: ClientStatus.BEING_CRAFTED,
          actor: 'Sachin',
          actorRole: 'ADMIN',
          isValidated: true,
          automationsFired: ['Workflow 1: Stage Validation', 'Workflow 6: Brand Welcome & Portal Access'],
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
        });

        set({
          projects: [project, ...projects],
          auditLogs: newAuditLogs,
        });
      },

      addBrand: (newB) => {
        const { brands, auditLogs } = get();
        const id = 'brand_' + newB.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const brand: Brand = {
          ...newB,
          id,
          status: newB.status || 'ACTIVE',
        };
        const newAuditLogs = [...(auditLogs || [])];
        newAuditLogs.unshift({
          id: 'log_' + Date.now(),
          projectId: id,
          projectTitle: `New Brand Retainer: ${brand.name}`,
          brandName: brand.name,
          fromStage: ProjectStage.BRIEF_RECEIVED,
          toStage: ProjectStage.BRIEF_RECEIVED,
          clientStatus: ClientStatus.BEING_CRAFTED,
          actor: 'Sachin',
          actorRole: 'ADMIN',
          isValidated: true,
          automationsFired: ['Workflow 6: Brand Welcome & Portal Access'],
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
        });
        set({
          brands: [...brands, brand],
          auditLogs: newAuditLogs,
        });
      },

      updateBrand: (id, patch) => {
        const { brands } = get();
        set({
          brands: brands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        });
      },

      escalateProject: (id: string, reason = 'Turnaround SLA breach') => {
        const { projects, notifications, auditLogs } = get();
        const proj = projects.find((p) => p.id === id);
        if (!proj) return;
        const updatedProjects = projects.map((p) =>
          p.id === id
            ? {
                ...p,
                priority: 'HIGH' as any,
                internalNotes: `${p.internalNotes || ''}\n[⚡ Escalated to Sachin on ${new Date().toLocaleDateString()}]: ${reason}`,
              }
            : p
        );
        const newNotifs: TBMNotification[] = [
          {
            id: 'notif-' + Date.now(),
            time: new Date().toISOString(),
            type: 'WORKFLOW_2',
            title: `⚡ Urgent Escalation: "${proj.title}"`,
            recipient: 'sachin@theboredmonkey.com & Slack #tbm-leads',
            details: `Escalated directly to Sachin's attention. Reason: ${reason}.`,
          },
          ...notifications,
        ];
        const newAuditLogs: TransitionLog[] = [
          {
            id: 'log_' + Date.now(),
            projectId: proj.id,
            projectTitle: proj.title,
            brandName: proj.brandName,
            fromStage: proj.currentStage,
            toStage: proj.currentStage,
            clientStatus: proj.clientStatus,
            actor: 'System Watchtower',
            actorRole: 'ADMIN',
            isValidated: true,
            automationsFired: ['Workflow 3: Admin Escalation Trigger', 'Slack Webhook #tbm-leads-sachin'],
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
          },
          ...auditLogs,
        ];
        set({ projects: updatedProjects, notifications: newNotifs, auditLogs: newAuditLogs });
      },

      extendSLA: (id: string, newDate: string, reason: string) => {
        const { projects, auditLogs } = get();
        const proj = projects.find((p) => p.id === id);
        if (!proj) return;
        const updatedProjects = projects.map((p) =>
          p.id === id
            ? {
                ...p,
                deadline: newDate,
                targetDelivery: newDate,
                overallStatus: '✅ On Track' as const,
                internalNotes: `${p.internalNotes || ''}\n[SLA Extended to ${newDate} by Admin]: ${reason}`,
              }
            : p
        );
        const newAuditLogs: TransitionLog[] = [
          {
            id: 'log_' + Date.now(),
            projectId: proj.id,
            projectTitle: proj.title,
            brandName: proj.brandName,
            fromStage: proj.currentStage,
            toStage: proj.currentStage,
            clientStatus: proj.clientStatus,
            actor: 'Sachin',
            actorRole: 'ADMIN',
            isValidated: true,
            automationsFired: ['Workflow 1: SLA Extension Registered'],
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
          },
          ...auditLogs,
        ];
        set({ projects: updatedProjects, auditLogs: newAuditLogs });
      },

      runWorkflowSimulation: (workflowNumber: number) => {
        const { projects, brands, members, notifications, auditLogs } = get();
        let affectedCount = 0;
        let message = '';
        const now = Date.now();

        switch (workflowNumber) {
          case 1: {
            message = `Validated all ${projects.length} project stage transitions. All 22 state machine stages compliant.`;
            affectedCount = projects.length;
            break;
          }
          case 2: {
            const readyItems = projects.filter(
              (p) => p.currentStage === ProjectStage.FIRST_CUT_READY || p.currentStage === ProjectStage.FIRST_CUT_SENT
            );
            affectedCount = readyItems.length;
            message = `Found ${readyItems.length} first-cut deliverables. Review email notifications queued for designated brand POCs.`;
            break;
          }
          case 3: {
            const r3Items = projects.filter((p) => p.revisionRound === RevisionRound.R3);
            affectedCount = r3Items.length;
            message = `Found ${r3Items.length} projects in R3 revision round. Escalation alerts dispatched to sachin@theboredmonkey.com.`;
            break;
          }
          case 4: {
            const staleItems = projects.filter((p) => {
              const isTerminal = p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED;
              return !isTerminal && now - new Date(p.lastUpdated).getTime() > 24 * 3600 * 1000;
            });
            affectedCount = staleItems.length;
            message = `Identified ${staleItems.length} inactive tasks without updates in 24h. Morning reminders sent to assigned editors.`;
            break;
          }
          case 5: {
            const nearDeadline = projects.filter((p) => {
              const isTerminal = p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED;
              const diff = new Date(p.deadline).getTime() - now;
              return !isTerminal && diff <= 3 * 24 * 3600 * 1000 && diff >= 0;
            });
            affectedCount = nearDeadline.length;
            message = `Scanned ${nearDeadline.length} deliverables due within 72 hours. Pre-emptive deadline warnings dispatched.`;
            break;
          }
          case 6: {
            affectedCount = brands.length;
            message = `Verified portal access keys for ${brands.length} brand POCs. Onboarding credentials active.`;
            break;
          }
          case 7: {
            affectedCount = members.length;
            message = `Checked workspace permissions & default role views for all ${members.length} team members.`;
            break;
          }
          default: {
            message = 'Workflow executed.';
            affectedCount = 1;
          }
        }

        const newNotification: TBMNotification = {
          id: 'notif-wf-sim-' + Date.now(),
          time: new Date().toISOString(),
          type: `WORKFLOW_${workflowNumber}`,
          title: `Automated Workflow #${workflowNumber} Executed`,
          recipient: 'Production Engine & Assignees',
          details: message,
        };

        const newAuditLogs: TransitionLog[] = [
          {
            id: 'log_wf_' + Date.now(),
            projectId: `wf_${workflowNumber}`,
            projectTitle: `Workflow #${workflowNumber} Engine Run`,
            brandName: 'System Engine',
            fromStage: ProjectStage.BRIEF_RECEIVED,
            toStage: ProjectStage.BRIEF_RECEIVED,
            clientStatus: ClientStatus.BEING_CRAFTED,
            actor: 'Sachin (Admin)',
            actorRole: 'ADMIN',
            isValidated: true,
            automationsFired: [`Workflow #${workflowNumber} Dispatcher`],
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ', today',
          },
          ...auditLogs,
        ];

        set({
          notifications: [newNotification, ...notifications],
          auditLogs: newAuditLogs,
        });

        return { success: true, message, affectedCount };
      },

      triggerScheduledWorkflows: () => {
        const { projects, notifications } = get();
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 3600 * 1000;
        let staleCount = 0;
        let deadlineCount = 0;

        projects.forEach((p) => {
          const isTerminal = p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED;
          const dl = new Date(p.deadline).getTime();
          if (!isTerminal && dl - now <= threeDaysMs) deadlineCount++;

          const updated = new Date(p.lastUpdated).getTime();
          if (!isTerminal && now - updated > 24 * 3600 * 1000) staleCount++;
        });

        const newNotification: TBMNotification = {
          id: 'notif-cron-' + Date.now(),
          time: new Date().toISOString(),
          type: 'SCHEDULED_CRONS',
          title: 'Daily 8:00 AM & 9:00 AM Automated Workflows Executed',
          recipient: 'sachin@theboredmonkey.com & Team Assignees',
          details: `Processed ${projects.length} projects. Dispatched ${deadlineCount} deadline warnings (WF 5) and ${staleCount} stale update reminders (WF 4).`,
        };

        set({ notifications: [newNotification, ...notifications] });
        return { staleCount, deadlineCount };
      },

      resetToInitial: () => {
        set({
          projects: INITIAL_PROJECTS,
          brands: INITIAL_BRANDS,
          members: INITIAL_MEMBERS,
          auditLogs: INITIAL_AUDIT_LOGS,
        });
      },
    }),
    {
      name: 'tbm_project_management_real_v4',
      version: 4,
      migrate: () => ({
        projects: INITIAL_PROJECTS,
        brands: INITIAL_BRANDS,
        members: INITIAL_MEMBERS,
        auditLogs: INITIAL_AUDIT_LOGS,
        activeRole: 'ADMIN' as TBMRole,
        notifications: [],
      }),
    },
  ),
);

// Auto-heal if loaded from an outdated browser storage cache with < 50 projects
if (typeof window !== 'undefined') {
  const currentCount = useTBMStore.getState().projects?.length || 0;
  if (currentCount < 50) {
    useTBMStore.getState().resetToInitial();
  }
}
