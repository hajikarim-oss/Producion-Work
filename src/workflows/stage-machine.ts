import { ClientStatus, ProjectStage } from '../config/tbm.config';

/**
 * Valid stage transition mapping for TBM Content Workflow State Machine
 */
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

/**
 * Maps internal technical pipeline stage to client-facing friendly status
 */
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

/**
 * Validates a state transition. Throws descriptive Error if invalid.
 */
export function validateStageTransition(
  from: ProjectStage,
  to: ProjectStage,
): boolean {
  if (from === to) return true;
  const allowed = VALID_STAGE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(
      `Invalid transition: ${from} → ${to}. Allowed transitions from ${from}: [${(
        allowed || []
      ).join(', ')}]`,
    );
  }
  return true;
}
