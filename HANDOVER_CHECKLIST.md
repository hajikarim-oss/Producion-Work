# TBM Project Management System on Twenty — Handover Checklist

## Part 11 Mandatory Checks

### Data Integrity
- [x] **Every Project has a valid `brand` relation** — Verified (8/8 seed projects reference existing brands; no orphans).
- [x] **Every Project has a valid `assignedTo` relation** — Verified (8/8 seed projects reference valid workspace members).
- [x] **No duplicate Project IDs** — Verified (all project IDs unique).
- [x] **`lastUpdated` accurate to the minute** — Verified (auto-stamped on transition).
- [x] **Formula `overallStatus` computes correctly** — Verified (`IF(deadline < TODAY() AND currentStage != 'DELIVERED' AND currentStage != 'CLOSED', '⚠️ OVERDUE', '✅ On Track')`).

### State Machine
- [x] **Cannot jump from `BRIEF_RECEIVED` to `DELIVERED`** — Verified (illegal direct jump rejected with Error).
- [x] **All 22 states reachable via valid path** — Verified (graph traversal reaches all 22 states).
- [x] **`clientStatus` maps correctly to `currentStage`** — Verified (deterministic mapping for all 22 states).
- [x] **Invalid transition throws error (not silent)** — Verified (`validateStageTransition` throws descriptive error).

### Permissions
- [x] **Editor cannot see `clientStatus` or `internalNotes`** — Verified in `editor.role.ts`.
- [x] **Editor cannot edit `title`, `brand`, or `currentStage`** — Verified in `editor.role.ts` (`canUpdate: false`).
- [x] **Editor can edit only 3 fields: `editStatus`, `revisionRound`, `notes/internalNotes`** — Verified.
- [x] **Brand POC cannot see `currentStage`, `internalNotes`, `priority`, `deadline`, `assignedTo`** — Verified in `brand-poc.role.ts`.
- [x] **Brand POC only sees their brand's projects** — Verified via `CURRENT_USER_BRAND` row predicate and brand view filter.
- [x] **Inactive member cannot log in / has zero permissions** — Verified in role definitions.
- [x] **Admin has full access** — Verified in `admin.role.ts`.

### Automations
- [x] **Stage change fires `lastUpdated` stamp** — Verified in Workflow 1.
- [x] **First Cut Sent fires brand POC email** — Verified in Workflow 2.
- [x] **Revision R3 fires Sachin alert** — Verified in Workflow 3.
- [x] **Stale task fires daily reminder with escalation (CC Sachin on #3)** — Verified in Workflow 4.
- [x] **Deadline alert fires 3 days before (CC Sachin)** — Verified in Workflow 5.
- [x] **New brand fires welcome email** — Verified in Workflow 6.
- [x] **New team member fires welcome email** — Verified in Workflow 7.

### Webhooks & Security
- [x] **Webhook fires on record create/update/delete** — Verified in `webhook-server.ts`.
- [x] **HMAC signature validates** — Verified with `crypto.timingSafeEqual` in `webhook-verifier.ts`.
- [x] **Timestamp replay attack prevention** — Verified (rejects >300s clock drift).

### Batch Operations
- [x] **Batch import chunks to <=60 records/call** — Verified in `migrate-sheets.ts`.
