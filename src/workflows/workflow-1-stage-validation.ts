import { defineLogicFunction } from 'twenty-sdk/define';
import { ProjectStage } from '../config/tbm.config';
import {
  mapStageToClientStatus,
  validateStageTransition,
} from './stage-machine';

export const WORKFLOW_1_UNIVERSAL_IDENTIFIER =
  'tbm-wf-0001-stage-validation-000000000001';

export const stageValidationHandler = async (payload: {
  record: {
    id: string;
    currentStage: ProjectStage;
    [key: string]: any;
  };
  previousRecord?: {
    currentStage: ProjectStage;
    [key: string]: any;
  };
}) => {
  const from = payload.previousRecord?.currentStage || ProjectStage.BRIEF_RECEIVED;
  const to = payload.record.currentStage;

  if (from !== to) {
    // 1. Enforce strict validation
    validateStageTransition(from, to);
  }

  // 2. Compute clientStatus & update timestamp
  const computedClientStatus = mapStageToClientStatus(to);
  const now = new Date().toISOString();

  return {
    ...payload.record,
    lastUpdated: now,
    clientStatus: computedClientStatus,
    shouldNotifyFirstCut: to === ProjectStage.FIRST_CUT_SENT,
  };
};

export default defineLogicFunction({
  universalIdentifier: WORKFLOW_1_UNIVERSAL_IDENTIFIER,
  name: 'workflow-stage-validation',
  description:
    'Validates stage transitions, updates lastUpdated timestamp, and computes clientStatus',
  databaseEventTriggerSettings: {
    eventName: 'project.updated',
  },
  timeoutSeconds: 15,
  handler: stageValidationHandler,
});
