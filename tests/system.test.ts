import { ClientStatus, ProjectStage, RevisionRound, TBM_CONFIG } from '../src/config/tbm.config';
import { verifyTwentyWebhookSignature } from '../src/integrations/webhook-verifier';
import { runMigration } from '../src/scripts/migrate-sheets';
import { runReconciliation } from '../src/scripts/reconcile-data';
import { renderEmail } from '../src/templates/email-renderer';
import {
  mapStageToClientStatus,
  validateStageTransition,
} from '../src/workflows/stage-machine';
import { stageValidationHandler } from '../src/workflows/workflow-1-stage-validation';
import { firstCutNotificationHandler } from '../src/workflows/workflow-2-first-cut-notification';
import { revisionAlertHandler } from '../src/workflows/workflow-3-revision-alert';
import { staleReminderProcessor } from '../src/workflows/workflow-4-stale-reminder';
import { deadlineAlertProcessor } from '../src/workflows/workflow-5-deadline-alert';

describe('TBM Project Management System Test Suite', () => {
  describe('Part 3 & Phase 5: State Machine & Transition Validation', () => {
    it('should permit valid linear state transition (BRIEF_RECEIVED -> BRIEF_CALL_DONE)', () => {
      expect(() =>
        validateStageTransition(
          ProjectStage.BRIEF_RECEIVED,
          ProjectStage.BRIEF_CALL_DONE,
        ),
      ).not.toThrow();
    });

    it('should reject invalid stage jump (BRIEF_RECEIVED -> DELIVERED) with descriptive error', () => {
      expect(() =>
        validateStageTransition(
          ProjectStage.BRIEF_RECEIVED,
          ProjectStage.DELIVERED,
        ),
      ).toThrow(/Invalid transition: BRIEF_RECEIVED → DELIVERED/);
    });

    it('should correctly map internal technical stages to client-friendly statuses', () => {
      expect(mapStageToClientStatus(ProjectStage.BRIEF_RECEIVED)).toBe(ClientStatus.BEING_CRAFTED);
      expect(mapStageToClientStatus(ProjectStage.EDIT_IN_PROGRESS)).toBe(ClientStatus.BEING_CRAFTED);
      expect(mapStageToClientStatus(ProjectStage.FIRST_CUT_READY)).toBe(ClientStatus.ALMOST_READY);
      expect(mapStageToClientStatus(ProjectStage.FIRST_CUT_SENT)).toBe(ClientStatus.AWAITING_FEEDBACK);
      expect(mapStageToClientStatus(ProjectStage.REVISION_R1)).toBe(ClientStatus.REFINING);
      expect(mapStageToClientStatus(ProjectStage.FINAL_APPROVED)).toBe(ClientStatus.APPROVED);
      expect(mapStageToClientStatus(ProjectStage.DELIVERED)).toBe(ClientStatus.DELIVERED);
      expect(mapStageToClientStatus(ProjectStage.CLOSED)).toBe(ClientStatus.COMPLETE);
    });

    it('Workflow 1: should update lastUpdated and compute clientStatus upon valid stage transition', async () => {
      const res = await stageValidationHandler({
        record: {
          id: 'test-proj-1',
          currentStage: ProjectStage.FIRST_CUT_SENT,
        },
        previousRecord: {
          currentStage: ProjectStage.FIRST_CUT_READY,
        },
      });

      expect(res.clientStatus).toBe(ClientStatus.AWAITING_FEEDBACK);
      expect(res.lastUpdated).toBeDefined();
      expect(res.shouldNotifyFirstCut).toBe(true);
    });

    it('Workflow 2: should dispatch notification when project transitions to FIRST_CUT_SENT', async () => {
      const result = await firstCutNotificationHandler({
        record: {
          id: 'test-proj-2',
          title: 'Mixer Grinder Reel',
          currentStage: ProjectStage.FIRST_CUT_SENT,
          brand: {
            id: 'brand-1',
            name: 'Atomberg',
            pocEmail: 'poc@atomberg.com',
          },
        },
        previousRecord: {
          currentStage: ProjectStage.FIRST_CUT_READY,
        },
      });

      expect(result.success).toBe(true);
      expect(result.emailDispatched.to).toBe('poc@atomberg.com');
      expect(result.clientStatusUpdated).toBe(ClientStatus.AWAITING_FEEDBACK);
    });

    it('Workflow 3: should send alert to Sachin when project hits revision round R3', async () => {
      const res = await revisionAlertHandler({
        record: {
          id: 'test-proj-3',
          title: 'Bassheads Unboxing',
          revisionRound: RevisionRound.R3,
          brand: { name: 'Boat' },
          assignedTo: { name: 'Ishan', email: 'ishan@theboredmonkey.com' },
        },
        previousRecord: {
          revisionRound: RevisionRound.R2,
        },
      });

      expect(res.success).toBe(true);
      expect(res.alertDispatched.to).toBe(TBM_CONFIG.ADMIN_EMAIL);
      expect(res.alertDispatched.variables.revisionRound).toBe(RevisionRound.R3);
    });

    it('Workflow 4: should identify stale tasks and escalate to Sachin after threshold', async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const candidates = [
        {
          id: 'stale-1',
          title: 'Stale Reel',
          lastUpdated: twoDaysAgo,
          currentStage: ProjectStage.EDIT_IN_PROGRESS,
          reminderCount: 2, // Next reminder is #3 -> should escalate
          assignedTo: {
            id: 'u-1',
            name: 'Ishan',
            email: 'ishan@theboredmonkey.com',
            status: 'ACTIVE',
          },
        },
      ];

      const res = await staleReminderProcessor(candidates);
      expect(res.notificationsSentCount).toBe(1);
      expect(res.notificationsSent[0].escalatedToAdmin).toBe(true);
      expect(res.notificationsSent[0].email.cc).toBe(TBM_CONFIG.ADMIN_EMAIL);
    });

    it('Workflow 5: should alert assignees for upcoming deadlines within 3 days', async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
      const candidates = [
        {
          id: 'deadline-1',
          title: 'Urgent Video',
          deadline: tomorrow,
          currentStage: ProjectStage.EDIT_IN_PROGRESS,
          assignedTo: {
            name: 'Rohan',
            email: 'rohan@theboredmonkey.com',
          },
        },
      ];

      const res = await deadlineAlertProcessor(candidates);
      expect(res.alertsSent).toBe(1);
      expect(res.sentAlerts[0].email.cc).toBe(TBM_CONFIG.ADMIN_EMAIL);
    });
  });

  describe('Part 5 & Phase 7: Email Template Renderer', () => {
    it('should correctly render first_cut_ready template with variables', () => {
      const rendered = renderEmail('first_cut_ready', {
        pocName: 'Rajesh',
        projectTitle: 'Smart Fan Reel',
        reviewLink: 'https://theboredmonkey.com/review/123',
      });

      expect(rendered.subject).toContain('Smart Fan Reel');
      expect(rendered.html).toContain('Rajesh');
      expect(rendered.html).toContain('https://theboredmonkey.com/review/123');
    });

    it('should render brand_welcome template', () => {
      const rendered = renderEmail('brand_welcome', {
        brandName: 'Zepto',
        pocName: 'Pooja',
        portalLink: 'https://theboredmonkey.com/portal/zepto',
        supportEmail: 'sachin@theboredmonkey.com',
      });

      expect(rendered.html).toContain('Zepto');
      expect(rendered.html).toContain('Pooja');
    });
  });

  describe('Part 7 & Phase 6: Webhook HMAC SHA-256 Verification', () => {
    const crypto = require('crypto');
    const secret = 'test_webhook_secret_key';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ event: 'project.updated', data: { id: 'p1' } });
    const stringToSign = `${timestamp}:${payload}`;
    const validSignature = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex');

    it('should validate matching HMAC SHA-256 signatures', () => {
      const result = verifyTwentyWebhookSignature(payload, validSignature, timestamp, secret);
      expect(result.isValid).toBe(true);
    });

    it('should reject tampered signature', () => {
      const result = verifyTwentyWebhookSignature(payload, 'tampered_signature_12345678', timestamp, secret);
      expect(result.isValid).toBe(false);
    });

    it('should reject replay attacks with expired timestamps (>300s)', () => {
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 500).toString();
      const oldStringToSign = `${oldTimestamp}:${payload}`;
      const oldSignature = crypto.createHmac('sha256', secret).update(oldStringToSign).digest('hex');

      const result = verifyTwentyWebhookSignature(payload, oldSignature, oldTimestamp, secret);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('Part 8 & Phase 8: Migration & Reconciliation', () => {
    it('should successfully run CSV migration and batching', async () => {
      const report = await runMigration();
      expect(report.success).toBe(true);
      expect(report.brandsImported).toBeGreaterThan(0);
      expect(report.membersImported).toBeGreaterThan(0);
      expect(report.projectsImported).toBeGreaterThan(0);
      expect(report.batchCount).toBeGreaterThan(0);
    });

    it('should pass all Part 11 mandatory reconciliation checks', () => {
      const audit = runReconciliation();
      expect(audit.allPassed).toBe(true);
      expect(audit.checks.length).toBe(8);
    });
  });
});
