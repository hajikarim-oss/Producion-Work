# The Bored Monkey (TBM) Project Management CRM on Twenty

> Turnkey Creative Operations & Project Management Platform rebuilt on Twenty's open-source architecture. Preserving the familiar three-layer Google Sheets operational model (Master, Team, Brand) with robust relational models, deterministic state machines, automated role gating, and scheduled background workers.

---

## 1. System Overview & The Three Layers

The system unifies all content agency operations into **one workspace** through role-scoped data contracts and views:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TBM WORKSPACE (TWENTY)                          │
├──────────────────┬───────────────────────┬─────────────────────────────┤
│ 1. MASTER LAYER  │ 2. TEAM LAYER         │ 3. BRAND LAYER              │
│ (Admin / Sachin) │ (Editors / Creative)  │ (Client POCs)               │
├──────────────────┼───────────────────────┼─────────────────────────────┤
│ • Full CRUD      │ • Assigned tasks only │ • Brand-scoped records only │
│ • All projects   │ • Row-level filtered  │ • Internal fields stripped  │
│ • Kanban stages  │ • Edit: status, notes │ • Client-friendly statuses  │
│ • "This Week" dl │ • Auto "My Tasks" nav │ • Read-only review portal   │
└──────────────────┴───────────────────────┴─────────────────────────────┘
```

---

## 2. Directory Structure

```
tbm-crm/
├── docker/
│   ├── docker-compose.yml       # Production stack (Server, Worker, PG16, Redis, Mailpit)
│   ├── .env                     # Generated 32-byte encryption secrets and SMTP config
│   └── verify-deployment.js     # Healthcheck verification script
├── src/
│   ├── config/
│   │   └── tbm.config.ts        # Constants (Timezone, deadlines, SLA thresholds, enums)
│   ├── objects/
│   │   ├── project.object.ts    # Core Project object (15 fields, 22 stages, formula)
│   │   └── brand.object.ts      # Client Brand object (POC contact, color tokens)
│   ├── fields/
│   │   └── team-member.fields.ts# WorkspaceMember extensions (department, status, joinDate)
│   ├── roles/
│   │   ├── admin.role.ts        # Sachin (full system administration)
│   │   ├── manager.role.ts      # Operations Manager (full project & brand ops)
│   │   ├── editor.role.ts       # Video Editor (row-level predicate + 3 editable fields)
│   │   ├── creative.role.ts     # Creative Lead (row-level predicate + concept/scripting)
│   │   └── brand-poc.role.ts    # Brand Client POC (strict field masking & brand predicate)
│   ├── views/
│   │   ├── master.views.ts      # All Projects, Kanban Pipeline, Overdue, Calendar, By Brand
│   │   ├── team.views.ts        # My Tasks, My Pipeline, My Overdue
│   │   └── brand.views.ts       # Your Content, Delivery Schedule Calendar
│   ├── workflows/
│   │   ├── stage-machine.ts     # State machine validation graph & clientStatus mapper
│   │   ├── workflow-1-stage-validation.ts       # Stage enforcement & timestamping
│   │   ├── workflow-2-first-cut-notification.ts # POC review notification on First Cut Sent
│   │   ├── workflow-3-revision-alert.ts         # Revision Round 3 escalation to Sachin
│   │   ├── workflow-4-stale-reminder.ts         # 9:00 AM IST daily stale check & escalation
│   │   ├── workflow-5-deadline-alert.ts         # 8:00 AM IST daily 3-day deadline warning
│   │   ├── workflow-6-brand-welcome.ts          # New brand portal welcome dispatcher
│   │   └── workflow-7-team-welcome.ts           # Workspace onboarding dispatcher
│   ├── templates/
│   │   ├── templates.json       # All 7 branded HTML/text email templates
│   │   └── email-renderer.ts    # Template interpolation engine
│   ├── integrations/
│   │   ├── webhook-verifier.ts  # HMAC SHA-256 signature verifier with timestamp drift check
│   │   └── webhook-server.ts    # Webhook receiver for project/brand events
│   ├── scripts/
│   │   ├── migrate-sheets.ts    # Batch CSV importer (<=60 records/call)
│   │   └── reconcile-data.ts    # Audit reconciliation script
│   └── data/
│       ├── brands.csv           # Seed brand accounts
│       ├── team_members.csv     # Seed agency team members
│       └── projects.csv         # Seed deliverables
└── tests/
    ├── run-audit.js             # Automated test runner checking all Part 11 requirements
    └── system.test.ts           # Vitest/Jest system test suite
```

---

## 3. Quick Start & Deployment

### Step 1: Start Docker Stack
```bash
cd tbm-crm/docker
docker compose up -d
```

### Step 2: Verify Service Health
```bash
node verify-deployment.js
```
The server will be reachable at `http://localhost:3000` (or your configured `SERVER_URL`).
Mailpit (test email viewer) is available at `http://localhost:8025`.

### Step 3: Run the Verification & Audit Suite
```bash
node tbm-crm/tests/run-audit.js
```
Expected output: **`AUDIT SUMMARY: 22/22 CHECKS PASSED (100% COMPLIANT)`**.

---

## 4. Workflows & State Machine

The pipeline enforces 22 distinct stages from `BRIEF_RECEIVED` to `CLOSED`. Direct illegal state leaps (e.g. from `BRIEF_RECEIVED` directly to `DELIVERED`) are blocked.

Client status mappings are auto-derived:
- Early & production stages (`BRIEF_RECEIVED` → `EDIT_IN_PROGRESS`) = **🎬 Being crafted**
- `FIRST_CUT_READY` = **🎬 Almost ready**
- `FIRST_CUT_SENT` & `CLIENT_FEEDBACK` = **📋 Awaiting your feedback**
- `REVISION_R1` to `REVISION_R3` = **✏️ Refining**
- `FINAL_APPROVED` = **✅ Approved**
- `DELIVERED` = **📦 Delivered**
- `INVOICED` & `CLOSED` = **🎉 Complete**
