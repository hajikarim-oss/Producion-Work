# TBM CRM Architecture & Data Flow

## 1. Relational Data Model

```mermaid
erDiagram
    BRAND ||--o{ PROJECT : "has many"
    WORKSPACE_MEMBER ||--o{ PROJECT : "assigned to"

    BRAND {
        uuid id PK
        string name
        string pocName
        string pocEmail
        string primaryColor
        string secondaryColor
        enum status "ACTIVE | ARCHIVED"
    }

    WORKSPACE_MEMBER {
        uuid id PK
        string name
        string userEmail
        enum department "CREATIVE | EDITOR | PRODUCTION"
        enum status "ACTIVE | INACTIVE"
        date joinDate
    }

    PROJECT {
        uuid id PK
        string title
        uuid brandId FK
        enum contentType "REEL | VIDEO | CAROUSEL | STATIC | STORY"
        enum currentStage "22 Stages"
        enum editStatus "EDIT_IN_PROGRESS | FIRST_CUT_READY | FIRST_CUT_SENT | REVISING | FINAL"
        enum revisionRound "R0 | R1 | R2 | R3 | R4_PLUS"
        uuid assignedToId FK
        enum department "CREATIVE | EDITOR | PRODUCTION"
        enum clientStatus "🎬 Being crafted | 🎬 Almost ready | 📋 Awaiting feedback | ✏️ Refining | ✅ Approved | 📦 Delivered | 🎉 Complete"
        date targetDelivery
        text internalNotes
        enum priority "HIGH | MEDIUM | LOW"
        date deadline
        timestamp lastUpdated
        formula overallStatus "⚠️ OVERDUE | ✅ On Track"
    }
```

---

## 2. State Machine Pipeline

```mermaid
graph TD
    BR[BRIEF_RECEIVED] --> BC[BRIEF_CALL_DONE]
    BC --> CIP[CONCEPT_IN_PROGRESS]
    CIP --> CS[CONCEPT_SENT]
    CS --> CA[CONCEPT_APPROVED]
    CS --> CIP
    CA --> SIP[SCRIPT_IN_PROGRESS]
    SIP --> SA[SCRIPT_APPROVED]
    SIP --> CA
    SA --> PRE[PRE_PRODUCTION]
    PRE --> SS[SHOOT_SCHEDULED]
    SS --> SD[SHOOT_DONE]
    SD --> RR[RAW_RECEIVED]
    RR --> EIP[EDIT_IN_PROGRESS]
    EIP --> FCR[FIRST_CUT_READY]
    FCR --> FCS[FIRST_CUT_SENT]
    FCS --> CF[CLIENT_FEEDBACK]
    CF --> R1[REVISION_R1]
    CF --> FA[FINAL_APPROVED]
    R1 --> R2[REVISION_R2]
    R1 --> FA
    R2 --> R3[REVISION_R3]
    R2 --> FA
    R3 --> FA
    FA --> DEL[DELIVERED]
    DEL --> INV[INVOICED]
    INV --> CLS[CLOSED]

    style FCS fill:#f97316,stroke:#c2410c,stroke-width:2px,color:#fff
    style R3 fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
    style DEL fill:#22c55e,stroke:#15803d,stroke-width:2px,color:#fff
```

---

## 3. Workflow Automation Dispatchers

1. **Stage Transition Engine (`Workflow 1`):** Intercepts every `project.updated` event, evaluates transition legality against `VALID_STAGE_TRANSITIONS`, auto-timestamps `lastUpdated = NOW()`, and maps `clientStatus`.
2. **Brand POC First-Cut Notification (`Workflow 2`):** When `currentStage` switches to `FIRST_CUT_SENT`, dispatches `first_cut_ready` email to `brand.pocEmail` with deep-link to client review portal.
3. **Revision Escalation (`Workflow 3`):** Fires upon `revisionRound == R3` to alert Sachin directly (`sachin@theboredmonkey.com`).
4. **Stale Task Cron (`Workflow 4`):** Runs daily at 9:00 AM IST (03:30 UTC), querying non-terminal active projects untouched for >24 hours, notifying assignees and CCing Sachin upon >=3 reminders.
5. **Deadline Alert Cron (`Workflow 5`):** Runs daily at 8:00 AM IST (02:30 UTC), finding deliverables due within 3 days.
6. **Brand Welcome (`Workflow 6`):** Triggers upon `brand.created` to send onboarding and portal credentials.
7. **Team Member Welcome (`Workflow 7`):** Triggers upon `workspaceMember.created` to send department-specific orientation links.
