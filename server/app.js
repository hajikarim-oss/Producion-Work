const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, '../src/data');

// Load seed data from CSV with quote support
function parseCsv(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(c => c.trim())).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i] !== undefined ? r[i].trim() : ''));
    return obj;
  });
}

// In-Memory Database initialized with CSV seed data
let brands = parseCsv('brands.csv');
let members = parseCsv('team_members.csv');
let rawProjects = parseCsv('projects.csv');

// State Machine Definition
const VALID_STAGE_TRANSITIONS = {
  BRIEF_RECEIVED: ['BRIEF_CALL_DONE'],
  BRIEF_CALL_DONE: ['CONCEPT_IN_PROGRESS'],
  CONCEPT_IN_PROGRESS: ['CONCEPT_SENT'],
  CONCEPT_SENT: ['CONCEPT_APPROVED', 'CONCEPT_IN_PROGRESS'],
  CONCEPT_APPROVED: ['SCRIPT_IN_PROGRESS'],
  SCRIPT_IN_PROGRESS: ['SCRIPT_APPROVED', 'CONCEPT_APPROVED'],
  SCRIPT_APPROVED: ['PRE_PRODUCTION'],
  PRE_PRODUCTION: ['SHOOT_SCHEDULED'],
  SHOOT_SCHEDULED: ['SHOOT_DONE'],
  SHOOT_DONE: ['RAW_RECEIVED'],
  RAW_RECEIVED: ['EDIT_IN_PROGRESS'],
  EDIT_IN_PROGRESS: ['FIRST_CUT_READY'],
  FIRST_CUT_READY: ['FIRST_CUT_SENT'],
  FIRST_CUT_SENT: ['CLIENT_FEEDBACK'],
  CLIENT_FEEDBACK: ['REVISION_R1', 'FINAL_APPROVED'],
  REVISION_R1: ['REVISION_R2', 'FINAL_APPROVED'],
  REVISION_R2: ['REVISION_R3', 'FINAL_APPROVED'],
  REVISION_R3: ['FINAL_APPROVED'],
  FINAL_APPROVED: ['DELIVERED'],
  DELIVERED: ['INVOICED'],
  INVOICED: ['CLOSED'],
  CLOSED: [],
};

function mapStageToClientStatus(stage) {
  switch (stage) {
    case 'BRIEF_RECEIVED':
    case 'BRIEF_CALL_DONE':
    case 'CONCEPT_IN_PROGRESS':
    case 'CONCEPT_SENT':
    case 'CONCEPT_APPROVED':
    case 'SCRIPT_IN_PROGRESS':
    case 'SCRIPT_APPROVED':
    case 'PRE_PRODUCTION':
    case 'SHOOT_SCHEDULED':
    case 'SHOOT_DONE':
    case 'RAW_RECEIVED':
    case 'EDIT_IN_PROGRESS':
      return '🎬 Being crafted';
    case 'FIRST_CUT_READY':
      return '🎬 Almost ready';
    case 'FIRST_CUT_SENT':
    case 'CLIENT_FEEDBACK':
      return '📋 Awaiting your feedback';
    case 'REVISION_R1':
    case 'REVISION_R2':
    case 'REVISION_R3':
      return '✏️ Refining';
    case 'FINAL_APPROVED':
      return '✅ Approved';
    case 'DELIVERED':
      return '📦 Delivered';
    case 'INVOICED':
    case 'CLOSED':
      return '🎉 Complete';
    default:
      return '🎬 Being crafted';
  }
}

function computeOverallStatus(deadlineStr, currentStage) {
  const dl = new Date(deadlineStr).getTime();
  const now = Date.now();
  if (dl < now && currentStage !== 'DELIVERED' && currentStage !== 'CLOSED') {
    return '⚠️ OVERDUE';
  }
  return '✅ On Track';
}

// Hydrate projects with relations
let projects = rawProjects.map(p => {
  const b = brands.find(brand => brand.id === p.brandId);
  const m = members.find(mem => mem.id === p.assignedToId);
  return {
    ...p,
    brandName: b ? b.name : 'Unknown',
    assigneeName: m ? m.name : 'Unassigned',
    assigneeEmail: m ? m.email : '',
    clientStatus: mapStageToClientStatus(p.currentStage),
    overallStatus: computeOverallStatus(p.deadline, p.currentStage),
    lastUpdated: p.lastUpdated || new Date().toISOString(),
  };
});

// Notifications activity log
let notifications = [
  {
    id: 'notif-1',
    time: new Date(Date.now() - 3600000).toISOString(),
    type: 'WORKFLOW_2',
    title: 'First Cut Review Dispatched',
    recipient: 'rajesh@atomberg.com',
    details: 'Project "Zepto 10-Min Grocery Hack" review link emailed to Brand POC.',
  },
  {
    id: 'notif-2',
    time: new Date(Date.now() - 7200000).toISOString(),
    type: 'WORKFLOW_3',
    title: 'Escalation Alert: Revision R3 Reached',
    recipient: 'sachin@theboredmonkey.com',
    details: 'Project "Boat Bassheads Unboxing Reel" reached Revision Round R3. Sachin notified.',
  }
];

// Webhook events log
let webhookEvents = [];

function dispatchWebhook(event, data) {
  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  const secret = process.env.TWENTY_WEBHOOK_SECRET || 'tbm_webhook_secret_key_992178';
  const ts = Math.floor(Date.now() / 1000).toString();
  const rawString = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(`${ts}:${rawString}`).digest('hex');

  webhookEvents.unshift({
    event,
    timestamp: payload.timestamp,
    signature: sig,
    projectId: data.id,
    projectTitle: data.title,
    currentStage: data.currentStage,
  });
  if (webhookEvents.length > 50) webhookEvents.pop();
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Role');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', system: 'TBM Twenty CRM' }));
    return;
  }

  if (pathname === '/api/projects' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(projects));
    return;
  }

  if (pathname === '/api/brands' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(brands));
    return;
  }

  if (pathname === '/api/members' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(members));
    return;
  }

  if (pathname === '/api/notifications' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(notifications));
    return;
  }

  if (pathname === '/api/webhooks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(webhookEvents));
    return;
  }

  // Update Project
  if (pathname.startsWith('/api/projects/') && req.method === 'PATCH') {
    const id = pathname.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const patch = JSON.parse(body);
        const proj = projects.find(p => p.id === id);
        if (!proj) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Project not found' }));
          return;
        }

        const role = req.headers['x-user-role'] || 'ADMIN';

        // Role permission enforcement
        if (role === 'EDITOR') {
          // Can only update editStatus, revisionRound, internalNotes
          const allowedFields = ['editStatus', 'revisionRound', 'internalNotes'];
          for (const key of Object.keys(patch)) {
            if (!allowedFields.includes(key)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Editor role is not allowed to edit field: ${key}` }));
              return;
            }
          }
        } else if (role === 'BRAND_POC') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Brand POC has read-only access' }));
          return;
        }

        // Validate stage transition if changing stage
        if (patch.currentStage && patch.currentStage !== proj.currentStage) {
          const allowed = VALID_STAGE_TRANSITIONS[proj.currentStage] || [];
          if (!allowed.includes(patch.currentStage)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: `Invalid transition: ${proj.currentStage} → ${patch.currentStage}. Allowed next stages: [${allowed.join(', ')}]`
            }));
            return;
          }

          // Trigger Workflow 2 if FIRST_CUT_SENT
          if (patch.currentStage === 'FIRST_CUT_SENT') {
            notifications.unshift({
              id: 'notif-' + Date.now(),
              time: new Date().toISOString(),
              type: 'WORKFLOW_2',
              title: `🎬 First Cut Sent for "${proj.title}"`,
              recipient: proj.brandName + ' POC',
              details: `Automated review invitation dispatched to Brand POC. clientStatus set to "Awaiting your feedback".`,
            });
          }
        }

        // Trigger Workflow 3 if revision reaches R3
        if (patch.revisionRound === 'R3' && proj.revisionRound !== 'R3') {
          notifications.unshift({
            id: 'notif-' + Date.now(),
            time: new Date().toISOString(),
            type: 'WORKFLOW_3',
            title: `⚠️ Revision R3 Escalation: "${proj.title}"`,
            recipient: 'sachin@theboredmonkey.com',
            details: `Project hit 3rd revision round. Urgent notification dispatched to Sachin.`,
          });
        }

        // Apply patch
        Object.assign(proj, patch);
        proj.lastUpdated = new Date().toISOString();
        if (patch.currentStage) {
          proj.clientStatus = mapStageToClientStatus(proj.currentStage);
        }
        proj.overallStatus = computeOverallStatus(proj.deadline, proj.currentStage);

        // Emit Webhook
        dispatchWebhook('project.updated', proj);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(proj));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // Trigger Scheduled Cron Workflow (Simulation)
  if (pathname === '/api/workflows/trigger-cron' && req.method === 'POST') {
    let staleCount = 0;
    let deadlineCount = 0;
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 3600 * 1000;

    projects.forEach(p => {
      const isTerminal = p.currentStage === 'DELIVERED' || p.currentStage === 'CLOSED';
      const dl = new Date(p.deadline).getTime();
      if (!isTerminal && (dl - now) <= threeDaysMs) {
        deadlineCount++;
      }
      const updated = new Date(p.lastUpdated).getTime();
      if (!isTerminal && (now - updated) > 24 * 3600 * 1000) {
        staleCount++;
      }
    });

    notifications.unshift({
      id: 'notif-' + Date.now(),
      time: new Date().toISOString(),
      type: 'SCHEDULED_CRONS',
      title: 'Scheduled 8 AM & 9 AM Cron Tasks Executed',
      recipient: 'sachin@theboredmonkey.com & Assignees',
      details: `Scanned ${projects.length} projects. Dispatched ${deadlineCount} deadline alerts (WF 5) and ${staleCount} stale task reminders (WF 4).`,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, staleCount, deadlineCount }));
    return;
  }

  // Serve Single-Page App HTML
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHtmlApp());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function renderHtmlApp() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBM Project Management — Twenty CRM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0c0d12;
      --bg-surface: #14161f;
      --bg-card: #1a1c27;
      --bg-card-hover: #222533;
      --border-subtle: #252838;
      --border-accent: #373b52;
      --text-main: #f0f2f8;
      --text-muted: #8c92a4;
      --text-faint: #5a5f73;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --accent-purple: #a855f7;
      --accent-cyan: #06b6d4;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-red: #ef4444;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-elevation: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .brand-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      border-radius: 9px;
      display: grid;
      place-items: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    .brand-title {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .nav-section {
      padding: 20px 16px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      font-weight: 700;
    }
    .nav-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 12px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-main);
    }
    .nav-item.active {
      background: var(--primary-glow);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .badge {
      margin-left: auto;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 20px;
      background: var(--border-subtle);
      color: var(--text-muted);
      font-weight: 700;
    }
    .badge.alert {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Main Content */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-base);
    }

    /* Header Bar */
    .top-header {
      height: 64px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }
    .view-title-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .view-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .layer-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .layer-tag.master { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    .layer-tag.team { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .layer-tag.brand { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Role Selector */
    .role-switcher-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: var(--radius-md);
    }
    .role-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-faint);
      text-transform: uppercase;
    }
    .role-select {
      background: transparent;
      border: none;
      color: var(--text-main);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .role-select option {
      background: var(--bg-surface);
      color: var(--text-main);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-ghost {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-main);
    }

    /* Stats strip */
    .stats-strip {
      padding: 16px 28px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: rgba(20, 22, 31, 0.4);
      border-bottom: 1px solid var(--border-subtle);
    }
    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-val {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-main);
    }

    /* Content Area */
    .view-content {
      flex: 1;
      padding: 24px 28px;
      overflow-y: auto;
    }

    /* Table */
    .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-elevation);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }
    th {
      background: rgba(255, 255, 255, 0.02);
      padding: 14px 18px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      font-weight: 700;
    }
    td {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.015);
    }

    /* Status Pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .pill-stage {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    .pill-client {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .pill-overdue {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .pill-track {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* Kanban */
    .kanban-board {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      height: 100%;
    }
    .kanban-col {
      width: 310px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      max-height: 100%;
    }
    .kanban-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .col-title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kanban-cards {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .project-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .project-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-accent);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-brand {
      font-size: 11px;
      font-weight: 700;
      color: #93c5fd;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.35;
    }
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 10px;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      display: none;
      place-items: center;
      z-index: 1000;
    }
    .modal-box {
      width: 580px;
      background: var(--bg-surface);
      border: 1px solid var(--border-accent);
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow-elevation);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .form-input, .form-select, .form-textarea {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-main);
      padding: 10px 14px;
      font-family: inherit;
      font-size: 13.5px;
      outline: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-glow);
    }
    .modal-actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Toast */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 2000;
    }
    .toast {
      padding: 14px 20px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-accent);
      color: var(--text-main);
      font-size: 13px;
      font-weight: 600;
      box-shadow: var(--shadow-elevation);
      animation: slideIn 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast.success { border-color: rgba(16, 185, 129, 0.4); border-left: 4px solid #10b981; }
    .toast.error { border-color: rgba(239, 68, 68, 0.4); border-left: 4px solid #ef4444; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="brand-header">
      <div class="brand-logo">🐒</div>
      <div>
        <div class="brand-title">The Bored Monkey</div>
        <div class="brand-subtitle">Twenty CRM</div>
      </div>
    </div>

    <div class="nav-section">Layer 1: Master (Sachin)</div>
    <div class="nav-items" id="master-nav">
      <div class="nav-item active" onclick="switchView('ALL_PROJECTS')">
        <span>📋</span> All Projects
        <span class="badge" id="badge-all">8</span>
      </div>
      <div class="nav-item" onclick="switchView('PIPELINE')">
        <span>📊</span> Pipeline (Kanban)
      </div>
      <div class="nav-item" onclick="switchView('OVERDUE')">
        <span>⚠️</span> Overdue Tasks
        <span class="badge alert" id="badge-overdue">1</span>
      </div>
      <div class="nav-item" onclick="switchView('BY_BRAND')">
        <span>🏢</span> Projects by Brand
      </div>
    </div>

    <div class="nav-section">Layer 2: Team</div>
    <div class="nav-items">
      <div class="nav-item" onclick="switchView('MY_TASKS')">
        <span>👤</span> My Tasks (Assigned)
      </div>
    </div>

    <div class="nav-section">Layer 3: Brand Portal</div>
    <div class="nav-items">
      <div class="nav-item" onclick="switchView('CLIENT_PORTAL')">
        <span>🎬</span> Your Content (Client)
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="btn btn-ghost" style="width: 100%; justify-content: center;" onclick="triggerCronSimulation()">
        ⚡ Run 8AM/9AM Workflows
      </button>
      <div style="font-size: 11px; color: var(--text-faint); text-align: center;">
        TBM Engine v2.0 • Zero Docker Required
      </div>
    </div>
  </aside>

  <!-- Main Area -->
  <div class="main-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      <div class="view-title-wrap">
        <h1 class="view-title" id="view-title">All Projects</h1>
        <span class="layer-tag master" id="layer-tag">Layer 1: Master</span>
      </div>

      <div class="header-actions">
        <!-- Role Switcher -->
        <div class="role-switcher-wrap">
          <span class="role-label">Active Role:</span>
          <select class="role-select" id="role-selector" onchange="onRoleChange()">
            <option value="ADMIN">Sachin (Admin / Master)</option>
            <option value="EDITOR">Ishan (Editor / Team)</option>
            <option value="CREATIVE">Priya (Creative / Team)</option>
            <option value="BRAND_POC">Rajesh (Atomberg POC / Brand)</option>
          </select>
        </div>

        <button class="btn btn-ghost" onclick="toggleNotifications()">
          🔔 Alerts (<span id="notif-count">2</span>)
        </button>
        <button class="btn btn-primary" id="btn-new-project" onclick="openNewProjectModal()">
          + New Project
        </button>
      </div>
    </header>

    <!-- Stats Strip -->
    <div class="stats-strip" id="stats-strip">
      <div class="stat-card">
        <div class="stat-label">Active Projects</div>
        <div class="stat-val" id="stat-active">7</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Overdue Deliverables</div>
        <div class="stat-val" style="color: #f87171;" id="stat-overdue">1</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revision Rounds >= R3</div>
        <div class="stat-val" style="color: #fbbf24;" id="stat-revisions">1</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Delivered / Complete</div>
        <div class="stat-val" style="color: #34d399;" id="stat-delivered">1</div>
      </div>
    </div>

    <!-- Main Dynamic Content -->
    <main class="view-content" id="view-content">
      <!-- Injected by JavaScript -->
    </main>
  </div>

  <!-- Edit Project Modal -->
  <div class="modal-backdrop" id="edit-modal">
    <div class="modal-box">
      <h2 class="modal-title" id="modal-project-title">Edit Project</h2>
      <div class="form-group" id="group-title">
        <label class="form-label">Project Title</label>
        <input type="text" class="form-input" id="edit-title">
      </div>
      <div class="form-group" id="group-stage">
        <label class="form-label">Pipeline Stage (State Machine)</label>
        <select class="form-select" id="edit-stage"></select>
      </div>
      <div class="form-group" id="group-edit-status">
        <label class="form-label">Edit Status</label>
        <select class="form-select" id="edit-status">
          <option value="EDIT_IN_PROGRESS">Edit in progress</option>
          <option value="FIRST_CUT_READY">First cut ready</option>
          <option value="FIRST_CUT_SENT">First cut sent</option>
          <option value="REVISING">Revising</option>
          <option value="FINAL">Final</option>
        </select>
      </div>
      <div class="form-group" id="group-revision">
        <label class="form-label">Revision Round</label>
        <select class="form-select" id="edit-revision">
          <option value="R0">R0</option>
          <option value="R1">R1</option>
          <option value="R2">R2</option>
          <option value="R3">R3 (Escalates to Sachin)</option>
          <option value="R4_PLUS">R4_PLUS</option>
        </select>
      </div>
      <div class="form-group" id="group-deadline">
        <label class="form-label">Deadline</label>
        <input type="date" class="form-input" id="edit-deadline">
      </div>
      <div class="form-group" id="group-notes">
        <label class="form-label">Internal Notes</label>
        <textarea class="form-textarea" rows="3" id="edit-notes"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeEditModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveProjectChanges()">Save & Validate</button>
      </div>
    </div>
  </div>

  <!-- Toast Stack -->
  <div class="toast-container" id="toast-container"></div>

  <script>
    let projects = [];
    let brands = [];
    let members = [];
    let notifications = [];
    let currentView = 'ALL_PROJECTS';
    let currentRole = 'ADMIN';
    let activeEditingId = null;

    const ALL_STAGES = [
      'BRIEF_RECEIVED', 'BRIEF_CALL_DONE', 'CONCEPT_IN_PROGRESS', 'CONCEPT_SENT',
      'CONCEPT_APPROVED', 'SCRIPT_IN_PROGRESS', 'SCRIPT_APPROVED', 'PRE_PRODUCTION',
      'SHOOT_SCHEDULED', 'SHOOT_DONE', 'RAW_RECEIVED', 'EDIT_IN_PROGRESS',
      'FIRST_CUT_READY', 'FIRST_CUT_SENT', 'CLIENT_FEEDBACK', 'REVISION_R1',
      'REVISION_R2', 'REVISION_R3', 'FINAL_APPROVED', 'DELIVERED', 'INVOICED', 'CLOSED'
    ];

    async function init() {
      await refreshData();
      renderCurrentView();
    }

    async function refreshData() {
      try {
        const [pRes, bRes, mRes, nRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/brands'),
          fetch('/api/members'),
          fetch('/api/notifications')
        ]);
        projects = await pRes.json();
        brands = await bRes.json();
        members = await mRes.json();
        notifications = await nRes.json();
        updateStats();
      } catch (err) {
        showToast('Error syncing data with local server', 'error');
      }
    }

    function updateStats() {
      const active = projects.filter(p => p.currentStage !== 'DELIVERED' && p.currentStage !== 'CLOSED').length;
      const overdue = projects.filter(p => p.overallStatus && p.overallStatus.includes('OVERDUE')).length;
      const r3 = projects.filter(p => p.revisionRound === 'R3').length;
      const delivered = projects.filter(p => p.currentStage === 'DELIVERED' || p.currentStage === 'CLOSED').length;

      document.getElementById('stat-active').textContent = active;
      document.getElementById('stat-overdue').textContent = overdue;
      document.getElementById('stat-revisions').textContent = r3;
      document.getElementById('stat-delivered').textContent = delivered;
      document.getElementById('badge-all').textContent = projects.length;
      document.getElementById('badge-overdue').textContent = overdue;
      document.getElementById('notif-count').textContent = notifications.length;
    }

    function onRoleChange() {
      currentRole = document.getElementById('role-selector').value;
      if (currentRole === 'EDITOR' || currentRole === 'CREATIVE') {
        switchView('MY_TASKS');
      } else if (currentRole === 'BRAND_POC') {
        switchView('CLIENT_PORTAL');
      } else {
        switchView('ALL_PROJECTS');
      }
    }

    function switchView(viewKey) {
      currentView = viewKey;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

      const titleEl = document.getElementById('view-title');
      const tagEl = document.getElementById('layer-tag');
      const newProjBtn = document.getElementById('btn-new-project');

      if (viewKey === 'ALL_PROJECTS') {
        titleEl.textContent = 'All Projects';
        tagEl.textContent = 'Layer 1: Master (Admin)';
        tagEl.className = 'layer-tag master';
        newProjBtn.style.display = 'inline-flex';
      } else if (viewKey === 'PIPELINE') {
        titleEl.textContent = 'Creative Pipeline';
        tagEl.textContent = 'Layer 1: Master (Kanban)';
        tagEl.className = 'layer-tag master';
        newProjBtn.style.display = 'inline-flex';
      } else if (viewKey === 'OVERDUE') {
        titleEl.textContent = 'Overdue Deliverables';
        tagEl.textContent = 'Layer 1: SLA Alerts';
        tagEl.className = 'layer-tag master';
        newProjBtn.style.display = 'none';
      } else if (viewKey === 'BY_BRAND') {
        titleEl.textContent = 'Projects Grouped by Brand';
        tagEl.textContent = 'Layer 1: Brand Grouping';
        tagEl.className = 'layer-tag master';
        newProjBtn.style.display = 'inline-flex';
      } else if (viewKey === 'MY_TASKS') {
        titleEl.textContent = 'My Tasks (Assigned to Me)';
        tagEl.textContent = 'Layer 2: Team Member View';
        tagEl.className = 'layer-tag team';
        newProjBtn.style.display = 'none';
      } else if (viewKey === 'CLIENT_PORTAL') {
        titleEl.textContent = 'Atomberg Brand Portal';
        tagEl.textContent = 'Layer 3: Brand POC View';
        tagEl.className = 'layer-tag brand';
        newProjBtn.style.display = 'none';
      }

      renderCurrentView();
    }

    function renderCurrentView() {
      const container = document.getElementById('view-content');

      if (currentView === 'ALL_PROJECTS') {
        renderTable(projects);
      } else if (currentView === 'OVERDUE') {
        const filtered = projects.filter(p => p.overallStatus && p.overallStatus.includes('OVERDUE'));
        renderTable(filtered);
      } else if (currentView === 'MY_TASKS') {
        // Filter by assigned user (Ishan user_002 if editor, Priya user_003 if creative)
        const targetEmail = currentRole === 'CREATIVE' ? 'priya@theboredmonkey.com' : 'ishan@theboredmonkey.com';
        const filtered = projects.filter(p => p.assigneeEmail === targetEmail);
        renderTable(filtered, true);
      } else if (currentView === 'CLIENT_PORTAL') {
        // Rajesh from Atomberg
        const filtered = projects.filter(p => p.brandName === 'Atomberg');
        renderBrandTable(filtered);
      } else if (currentView === 'PIPELINE') {
        renderKanban();
      } else if (currentView === 'BY_BRAND') {
        renderByBrand();
      }
    }

    function renderTable(data, isTeamView = false) {
      const container = document.getElementById('view-content');
      if (data.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No records found matching this view filter.</div>';
        return;
      }

      let html = \`
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Pipeline Stage</th>
                <th>Revision</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
      \`;

      data.forEach(p => {
        const overdue = p.overallStatus && p.overallStatus.includes('OVERDUE');
        html += \`
          <tr>
            <td style="font-weight: 700;">\${p.title}</td>
            <td><span style="color: #93c5fd; font-weight: 600;">\${p.brandName}</span></td>
            <td><span class="badge">\${p.contentType}</span></td>
            <td><span class="pill pill-stage">\${p.currentStage.replace(/_/g, ' ')}</span></td>
            <td><span class="badge \${p.revisionRound === 'R3' ? 'alert' : ''}">\${p.revisionRound}</span></td>
            <td>\${p.assigneeName}</td>
            <td>\${p.deadline}</td>
            <td><span class="pill \${overdue ? 'pill-overdue' : 'pill-track'}">\${p.overallStatus}</span></td>
            <td>
              <button class="btn btn-ghost" style="padding: 4px 10px; font-size: 12px;" onclick="openEditModal('\${p.id}')">
                \${isTeamView ? 'Update' : 'Edit'}
              </button>
            </td>
          </tr>
        \`;
      });

      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    function renderBrandTable(data) {
      const container = document.getElementById('view-content');
      let html = \`
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 14px 20px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 13.5px; color: #fde68a;">
          🔒 <strong>Brand Portal Active (Atomberg)</strong> — Internal agency fields (assignee, raw stages, internal notes) are hidden. You only see client-friendly statuses and verified deliverables.
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Deliverable Title</th>
                <th>Content Format</th>
                <th>Status (Client View)</th>
                <th>Revision Round</th>
                <th>Target Delivery</th>
                <th>Review Action</th>
              </tr>
            </thead>
            <tbody>
      \`;

      data.forEach(p => {
        html += \`
          <tr>
            <td style="font-weight: 700; font-size: 14px;">\${p.title}</td>
            <td><span class="badge">\${p.contentType}</span></td>
            <td><span class="pill pill-client">\${p.clientStatus}</span></td>
            <td><span class="badge">\${p.revisionRound}</span></td>
            <td><strong>\${p.targetDelivery || p.deadline}</strong></td>
            <td>
              \${p.currentStage === 'FIRST_CUT_SENT'
                ? '<button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="showToast(\\'Opening video review player...\\', \\'success\\')">Review First Cut</button>'
                : '<span style="color: var(--text-faint); font-size: 12px;">In Production</span>'}
            </td>
          </tr>
        \`;
      });

      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    function renderKanban() {
      const container = document.getElementById('view-content');
      const displayStages = [
        { key: 'BRIEF_RECEIVED', label: 'Brief Received' },
        { key: 'CONCEPT_IN_PROGRESS', label: 'Concept in Progress' },
        { key: 'PRE_PRODUCTION', label: 'Pre-Production' },
        { key: 'EDIT_IN_PROGRESS', label: 'Edit in Progress' },
        { key: 'FIRST_CUT_SENT', label: 'First Cut Sent' },
        { key: 'REVISION_R2', label: 'Revisions' },
        { key: 'DELIVERED', label: 'Delivered' }
      ];

      let html = '<div class="kanban-board">';

      displayStages.forEach(st => {
        const colProjects = projects.filter(p => p.currentStage === st.key || (st.key === 'REVISION_R2' && p.currentStage.startsWith('REVISION')));
        html += \`
          <div class="kanban-col">
            <div class="kanban-header">
              <span class="col-title">\${st.label}</span>
              <span class="badge">\${colProjects.length}</span>
            </div>
            <div class="kanban-cards">
        \`;

        colProjects.forEach(p => {
          html += \`
            <div class="project-card" onclick="openEditModal('\${p.id}')">
              <div class="card-top">
                <span class="card-brand">\${p.brandName}</span>
                <span class="badge \${p.priority === 'HIGH' ? 'alert' : ''}">\${p.priority}</span>
              </div>
              <div class="card-title">\${p.title}</div>
              <div class="card-meta">
                <span>👤 \${p.assigneeName}</span>
                <span>📅 \${p.deadline}</span>
              </div>
            </div>
          \`;
        });

        html += '</div></div>';
      });

      html += '</div>';
      container.innerHTML = html;
    }

    function renderByBrand() {
      const container = document.getElementById('view-content');
      let html = '<div style="display: flex; flex-direction: column; gap: 24px;">';

      brands.forEach(b => {
        const brandProjects = projects.filter(p => p.brandId === b.id);
        html += \`
          <div class="table-card">
            <div style="padding: 16px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 800; font-size: 15px; color: \${b.primaryColor || '#93c5fd'};">
                🏢 \${b.name} <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">(POC: \${b.pocName} • \${b.pocEmail})</span>
              </div>
              <span class="badge">\${brandProjects.length} Projects</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
        \`;

        brandProjects.forEach(p => {
          html += \`
            <tr>
              <td style="font-weight: 700;">\${p.title}</td>
              <td><span class="badge">\${p.contentType}</span></td>
              <td><span class="pill pill-stage">\${p.currentStage}</span></td>
              <td>\${p.assigneeName}</td>
              <td>\${p.deadline}</td>
              <td><button class="btn btn-ghost" style="padding: 3px 8px; font-size: 12px;" onclick="openEditModal('\${p.id}')">Edit</button></td>
            </tr>
          \`;
        });

        html += '</tbody></table></div>';
      });

      html += '</div>';
      container.innerHTML = html;
    }

    function openEditModal(projectId) {
      activeEditingId = projectId;
      const proj = projects.find(p => p.id === projectId);
      if (!proj) return;

      document.getElementById('modal-project-title').textContent = 'Edit ' + proj.title;
      document.getElementById('edit-title').value = proj.title;
      document.getElementById('edit-status').value = proj.editStatus || 'EDIT_IN_PROGRESS';
      document.getElementById('edit-revision').value = proj.revisionRound || 'R0';
      document.getElementById('edit-deadline').value = proj.deadline;
      document.getElementById('edit-notes').value = proj.internalNotes || '';

      // Populate stages
      const stageSelect = document.getElementById('edit-stage');
      stageSelect.innerHTML = '';
      ALL_STAGES.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st;
        opt.textContent = st.replace(/_/g, ' ');
        if (st === proj.currentStage) opt.selected = true;
        stageSelect.appendChild(opt);
      });

      // Role permission gating inside the form
      const isEditor = currentRole === 'EDITOR';
      document.getElementById('edit-title').disabled = isEditor;
      document.getElementById('edit-stage').disabled = isEditor;
      document.getElementById('edit-deadline').disabled = isEditor;

      document.getElementById('edit-modal').style.display = 'grid';
    }

    function closeEditModal() {
      document.getElementById('edit-modal').style.display = 'none';
      activeEditingId = null;
    }

    async function saveProjectChanges() {
      if (!activeEditingId) return;

      const payload = {};
      if (currentRole !== 'EDITOR') {
        payload.title = document.getElementById('edit-title').value;
        payload.currentStage = document.getElementById('edit-stage').value;
        payload.deadline = document.getElementById('edit-deadline').value;
      }
      payload.editStatus = document.getElementById('edit-status').value;
      payload.revisionRound = document.getElementById('edit-revision').value;
      payload.internalNotes = document.getElementById('edit-notes').value;

      try {
        const res = await fetch('/api/projects/' + activeEditingId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': currentRole,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Failed to update project', 'error');
          return;
        }

        showToast('Project updated successfully! Workflow validated.', 'success');
        closeEditModal();
        await refreshData();
        renderCurrentView();
      } catch (e) {
        showToast('Network error updating project', 'error');
      }
    }

    async function triggerCronSimulation() {
      try {
        const res = await fetch('/api/workflows/trigger-cron', { method: 'POST' });
        const data = await res.json();
        showToast(\`Cron Workflows Executed! Found \${data.deadlineCount} deadline alerts & \${data.staleCount} stale tasks.\`, 'success');
        await refreshData();
      } catch (e) {
        showToast('Failed to trigger cron simulation', 'error');
      }
    }

    function toggleNotifications() {
      let notifList = notifications.map(n => \`• [\${n.type}] \${n.title} -> \${n.recipient}\`).join('\\n\\n');
      alert('🔔 AUTOMATED WORKFLOW NOTIFICATIONS LOG:\\n\\n' + notifList);
    }

    function openNewProjectModal() {
      showToast('To add a project, import via CSV or REST API endpoint (/api/projects)', 'success');
    }

    function showToast(msg, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.innerHTML = (type === 'success' ? '✅ ' : '❌ ') + msg;
      container.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 4000);
    }

    window.onload = init;
  </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`🚀 TBM PROJECT MANAGEMENT CRM IS LIVE!`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Mode: Full Three-Layer Engine (Master, Team, Brand)`);
  console.log(`   Status: 100% Operational (No Docker required)`);
  console.log(`=============================================================`);
});
