export enum ProjectStage {
  BRIEF_RECEIVED = 'BRIEF_RECEIVED',
  BRIEF_CALL_DONE = 'BRIEF_CALL_DONE',
  CONCEPT_IN_PROGRESS = 'CONCEPT_IN_PROGRESS',
  CONCEPT_SENT = 'CONCEPT_SENT',
  CONCEPT_APPROVED = 'CONCEPT_APPROVED',
  SCRIPT_IN_PROGRESS = 'SCRIPT_IN_PROGRESS',
  SCRIPT_APPROVED = 'SCRIPT_APPROVED',
  PRE_PRODUCTION = 'PRE_PRODUCTION',
  SHOOT_SCHEDULED = 'SHOOT_SCHEDULED',
  SHOOT_DONE = 'SHOOT_DONE',
  RAW_RECEIVED = 'RAW_RECEIVED',
  EDIT_IN_PROGRESS = 'EDIT_IN_PROGRESS',
  FIRST_CUT_READY = 'FIRST_CUT_READY',
  FIRST_CUT_SENT = 'FIRST_CUT_SENT',
  CLIENT_FEEDBACK = 'CLIENT_FEEDBACK',
  REVISION_R1 = 'REVISION_R1',
  REVISION_R2 = 'REVISION_R2',
  REVISION_R3 = 'REVISION_R3',
  FINAL_APPROVED = 'FINAL_APPROVED',
  DELIVERED = 'DELIVERED',
  INVOICED = 'INVOICED',
  CLOSED = 'CLOSED',
}

export enum RevisionRound {
  R0 = 'R0',
  R1 = 'R1',
  R2 = 'R2',
  R3 = 'R3',
  R4_PLUS = 'R4_PLUS',
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ContentType {
  REEL = 'REEL',
  VIDEO = 'VIDEO',
  CAROUSEL = 'CAROUSEL',
  STATIC = 'STATIC',
  STORY = 'STORY',
}

export enum EditStatus {
  EDIT_IN_PROGRESS = 'EDIT_IN_PROGRESS',
  FIRST_CUT_READY = 'FIRST_CUT_READY',
  FIRST_CUT_SENT = 'FIRST_CUT_SENT',
  REVISING = 'REVISING',
  FINAL = 'FINAL',
}

export enum Department {
  CREATIVE = 'CREATIVE',
  EDITOR = 'EDITOR',
  PRODUCTION = 'PRODUCTION',
}

export enum ClientStatus {
  BEING_CRAFTED = '🎬 Being crafted',
  ALMOST_READY = '🎬 Almost ready',
  AWAITING_FEEDBACK = '📋 Awaiting your feedback',
  REFINING = '✏️ Refining',
  APPROVED = '✅ Approved',
  DELIVERED = '📦 Delivered',
  COMPLETE = '🎉 Complete',
}

export type TBMRole = 'ADMIN' | 'EDITOR' | 'CREATIVE' | 'BRAND_POC';
export const TBMRole = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  CREATIVE: 'CREATIVE',
  BRAND_POC: 'BRAND_POC',
} as const;

export const ROLE_CONFIGS = {
  ADMIN: { name: 'Sachin', title: 'Master Admin' },
  EDITOR: { name: 'Ishan', title: 'Lead Editor' },
  CREATIVE: { name: 'Priya', title: 'Creative Lead' },
  BRAND_POC: { name: 'Rajesh', title: 'Brand POC' },
};

export interface Project {
  id: string;
  title: string;
  brandId: string;
  brandName: string;
  contentType: ContentType;
  currentStage: ProjectStage;
  editStatus: EditStatus;
  revisionRound: RevisionRound;
  assignedToId: string;
  assigneeName: string;
  assigneeEmail: string;
  department: Department;
  clientStatus: ClientStatus;
  targetDelivery: string;
  internalNotes: string;
  notes?: string;
  reviewUrl?: string;
  isClientVisible?: boolean;
  priority: Priority;
  deadline: string;
  lastUpdated: string;
  overallStatus: '⚠️ OVERDUE' | '✅ On Track';
}
export const Project = {};

export interface Brand {
  id: string;
  name: string;
  pocName: string;
  pocEmail: string;
  pocPhone?: string;
  tier?: string;
  monthlyRetainer?: number;
  deliverableQuota?: number;
  primaryColor: string;
  secondaryColor: string;
  status: 'ACTIVE' | 'ARCHIVED';
}
export const Brand = {};

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: Department;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
}
export const TeamMember = {};

export interface TBMNotification {
  id: string;
  time: string;
  type: string;
  title: string;
  recipient: string;
  details: string;
}
export const TBMNotification = {};

export const VALID_STAGE_TRANSITIONS: Record<ProjectStage, ProjectStage[]> = {
  [ProjectStage.BRIEF_RECEIVED]: [ProjectStage.BRIEF_CALL_DONE],
  [ProjectStage.BRIEF_CALL_DONE]: [ProjectStage.CONCEPT_IN_PROGRESS],
  [ProjectStage.CONCEPT_IN_PROGRESS]: [ProjectStage.CONCEPT_SENT],
  [ProjectStage.CONCEPT_SENT]: [
    ProjectStage.CONCEPT_APPROVED,
    ProjectStage.CONCEPT_IN_PROGRESS,
  ],
  [ProjectStage.CONCEPT_APPROVED]: [ProjectStage.SCRIPT_IN_PROGRESS],
  [ProjectStage.SCRIPT_IN_PROGRESS]: [
    ProjectStage.SCRIPT_APPROVED,
    ProjectStage.CONCEPT_APPROVED,
  ],
  [ProjectStage.SCRIPT_APPROVED]: [ProjectStage.PRE_PRODUCTION],
  [ProjectStage.PRE_PRODUCTION]: [ProjectStage.SHOOT_SCHEDULED],
  [ProjectStage.SHOOT_SCHEDULED]: [ProjectStage.SHOOT_DONE],
  [ProjectStage.SHOOT_DONE]: [ProjectStage.RAW_RECEIVED],
  [ProjectStage.RAW_RECEIVED]: [ProjectStage.EDIT_IN_PROGRESS],
  [ProjectStage.EDIT_IN_PROGRESS]: [ProjectStage.FIRST_CUT_READY],
  [ProjectStage.FIRST_CUT_READY]: [ProjectStage.FIRST_CUT_SENT],
  [ProjectStage.FIRST_CUT_SENT]: [ProjectStage.CLIENT_FEEDBACK],
  [ProjectStage.CLIENT_FEEDBACK]: [
    ProjectStage.REVISION_R1,
    ProjectStage.FINAL_APPROVED,
  ],
  [ProjectStage.REVISION_R1]: [
    ProjectStage.REVISION_R2,
    ProjectStage.FINAL_APPROVED,
  ],
  [ProjectStage.REVISION_R2]: [
    ProjectStage.REVISION_R3,
    ProjectStage.FINAL_APPROVED,
  ],
  [ProjectStage.REVISION_R3]: [ProjectStage.FINAL_APPROVED],
  [ProjectStage.FINAL_APPROVED]: [ProjectStage.DELIVERED],
  [ProjectStage.DELIVERED]: [ProjectStage.INVOICED],
  [ProjectStage.INVOICED]: [ProjectStage.CLOSED],
  [ProjectStage.CLOSED]: [],
};

export function mapStageToClientStatus(stage: ProjectStage): ClientStatus {
  switch (stage) {
    case ProjectStage.BRIEF_RECEIVED:
    case ProjectStage.BRIEF_CALL_DONE:
    case ProjectStage.CONCEPT_IN_PROGRESS:
    case ProjectStage.CONCEPT_SENT:
    case ProjectStage.CONCEPT_APPROVED:
    case ProjectStage.SCRIPT_IN_PROGRESS:
    case ProjectStage.SCRIPT_APPROVED:
    case ProjectStage.PRE_PRODUCTION:
    case ProjectStage.SHOOT_SCHEDULED:
    case ProjectStage.SHOOT_DONE:
    case ProjectStage.RAW_RECEIVED:
    case ProjectStage.EDIT_IN_PROGRESS:
      return ClientStatus.BEING_CRAFTED;

    case ProjectStage.FIRST_CUT_READY:
      return ClientStatus.ALMOST_READY;

    case ProjectStage.FIRST_CUT_SENT:
    case ProjectStage.CLIENT_FEEDBACK:
      return ClientStatus.AWAITING_FEEDBACK;

    case ProjectStage.REVISION_R1:
    case ProjectStage.REVISION_R2:
    case ProjectStage.REVISION_R3:
      return ClientStatus.REFINING;

    case ProjectStage.FINAL_APPROVED:
      return ClientStatus.APPROVED;

    case ProjectStage.DELIVERED:
      return ClientStatus.DELIVERED;

    case ProjectStage.INVOICED:
    case ProjectStage.CLOSED:
      return ClientStatus.COMPLETE;

    default:
      return ClientStatus.BEING_CRAFTED;
  }
}

export interface TransitionLog {
  id: string;
  projectId: string;
  projectTitle: string;
  brandName: string;
  fromStage: ProjectStage;
  toStage: ProjectStage;
  clientStatus: ClientStatus;
  actor: string;
  actorRole: TBMRole;
  isValidated: boolean;
  automationsFired: string[];
  timestamp: string;
}

export function computeOverallStatus(
  deadlineStr: string,
  currentStage: ProjectStage,
): '⚠️ OVERDUE' | '✅ On Track' {
  const dl = new Date(deadlineStr).getTime();
  const now = Date.now();
  if (
    dl < now &&
    currentStage !== ProjectStage.DELIVERED &&
    currentStage !== ProjectStage.CLOSED
  ) {
    return '⚠️ OVERDUE';
  }
  return '✅ On Track';
}
