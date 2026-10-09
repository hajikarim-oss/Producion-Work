-- TBM PROJECT MANAGEMENT SYSTEM ON TWENTY / POSTGRESQL SCHEMA
-- Migration: 001_tbm_schema.sql
-- Ready for deployment when PostgreSQL database connection string is provided

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Brands Table (Clients)
CREATE TABLE IF NOT EXISTS tbm_brands (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    poc_name VARCHAR(255) NOT NULL,
    poc_email VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'Growth', -- 'Enterprise', 'Growth', 'Starter'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Team Members Table (Admin, Editors, Creatives)
CREATE TABLE IF NOT EXISTS tbm_team_members (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'MASTER_ADMIN', 'EDITOR', 'CREATIVE_DIRECTOR', 'BRAND_POC'
    department VARCHAR(50) NOT NULL, -- 'MANAGEMENT', 'EDITING', 'CREATIVE', 'OPERATIONS', 'CLIENT'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects Table (Master Deliverables)
CREATE TABLE IF NOT EXISTS tbm_projects (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    brand_id VARCHAR(64) NOT NULL REFERENCES tbm_brands(id) ON DELETE CASCADE,
    assignee_id VARCHAR(64) REFERENCES tbm_team_members(id) ON DELETE SET NULL,
    content_type VARCHAR(64) NOT NULL, -- 'Reels / Shorts', 'Long Form / YouTube', 'Ad Creative', etc.
    current_stage VARCHAR(64) NOT NULL, -- 22 stages state machine
    revision_round VARCHAR(16) DEFAULT 'R0', -- 'R0', 'R1', 'R2', 'R3'
    edit_status VARCHAR(64) DEFAULT 'NOT_STARTED',
    v1_drive_link TEXT,
    final_drive_link TEXT,
    due_date DATE,
    client_facing_status VARCHAR(64) NOT NULL, -- 'SCRIPTING', 'IN_PRODUCTION', 'READY_FOR_CLIENT_REVIEW', etc.
    overall_status VARCHAR(64) DEFAULT 'IN_PROGRESS', -- 'NOT_STARTED', 'IN_PROGRESS', 'OVERDUE', 'DELIVERED', 'ON_HOLD'
    internal_notes TEXT, -- Hidden from Client (Layer 3)
    client_notes TEXT, -- Visible to Client
    is_client_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. State Transitions Audit Log
CREATE TABLE IF NOT EXISTS tbm_stage_transitions_log (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES tbm_projects(id) ON DELETE CASCADE,
    from_stage VARCHAR(64) NOT NULL,
    to_stage VARCHAR(64) NOT NULL,
    changed_by VARCHAR(64) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Workflow Automation Notifications Queue
CREATE TABLE IF NOT EXISTS tbm_workflow_notifications (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES tbm_projects(id) ON DELETE CASCADE,
    notification_type VARCHAR(64) NOT NULL, -- 'FIRST_CUT_COMPLETED', 'R3_ESCALATION', 'DEADLINE_WARNING_24H', 'STALE_TASK_48H', 'CLIENT_FEEDBACK'
    message TEXT NOT NULL,
    target_role VARCHAR(64) NOT NULL,
    sent_to_email VARCHAR(255),
    status VARCHAR(32) DEFAULT 'SENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for Performance & Search
CREATE INDEX IF NOT EXISTS idx_tbm_projects_brand ON tbm_projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_tbm_projects_assignee ON tbm_projects(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tbm_projects_stage ON tbm_projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_tbm_projects_due_date ON tbm_projects(due_date);
CREATE INDEX IF NOT EXISTS idx_tbm_stage_transitions_project ON tbm_stage_transitions_log(project_id);

-- 7. Seed Initial Core TBM Brands
INSERT INTO tbm_brands (id, name, poc_name, poc_email, tier) VALUES
('brand_atomberg', 'Atomberg Technologies', 'Rajesh Kumar', 'rajesh.k@atomberg.com', 'Enterprise'),
('brand_cred', 'CRED', 'Ananya Sharma', 'ananya@cred.club', 'Enterprise'),
('brand_lenskart', 'Lenskart', 'Vikram Malhotra', 'vikram.m@lenskart.in', 'Growth'),
('brand_fimoney', 'Fi Money', 'Rohan Gupta', 'rohan@fi.money', 'Growth'),
('brand_slice', 'Slice', 'Neha Verma', 'neha@sliceit.com', 'Starter')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Initial TBM Team Members
INSERT INTO tbm_team_members (id, name, email, role, department) VALUES
('tm_sachin', 'Sachin (Master Admin)', 'sachin@theboredmonkey.com', 'MASTER_ADMIN', 'MANAGEMENT'),
('tm_ishan', 'Ishan (Lead Editor)', 'ishan@theboredmonkey.com', 'EDITOR', 'EDITING'),
('tm_priya', 'Priya (Creative Lead)', 'priya@theboredmonkey.com', 'CREATIVE_DIRECTOR', 'CREATIVE'),
('tm_kartik', 'Kartik (Motion / VFX)', 'kartik@theboredmonkey.com', 'EDITOR', 'EDITING'),
('tm_rajesh_client', 'Rajesh Kumar (Atomberg)', 'rajesh.k@atomberg.com', 'BRAND_POC', 'CLIENT')
ON CONFLICT (id) DO NOTHING;
