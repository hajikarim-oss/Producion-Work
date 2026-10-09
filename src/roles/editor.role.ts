import {
  defineRole,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const EDITOR_ROLE_UNIVERSAL_IDENTIFIER =
  'tbm-role-editor-0000-0000-000000000003';

export default defineRole({
  universalIdentifier: EDITOR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Editor',
  description: 'Post-production video editor assigned to projects',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
      rowLevelPermissionPredicateGroups: [
        {
          predicates: [
            {
              field: 'assignedTo',
              operator: RowLevelPermissionPredicateOperand.IS,
              value: 'CURRENT_USER',
            },
          ],
        },
      ],
    },
  ],
  fieldPermissions: [
    // Can edit only 3 fields: editStatus, revisionRound, internalNotes
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'editStatus',
      canReadFieldValue: true,
      canUpdateFieldValue: true,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'revisionRound',
      canReadFieldValue: true,
      canUpdateFieldValue: true,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'internalNotes',
      canReadFieldValue: true,
      canUpdateFieldValue: true,
    },
    // Read-only project metadata
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'title',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'brand',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'contentType',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'deadline',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'priority',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'currentStage',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    // Hidden internal fields
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'clientStatus',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
  ],
});
