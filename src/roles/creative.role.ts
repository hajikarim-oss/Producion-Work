import {
  defineRole,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const CREATIVE_ROLE_UNIVERSAL_IDENTIFIER =
  'tbm-role-creative-0000-0000-000000000004';

export default defineRole({
  universalIdentifier: CREATIVE_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Creative',
  description: 'Creative team member (concept, script, art direction)',
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
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'internalNotes',
      canReadFieldValue: true,
      canUpdateFieldValue: true,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'currentStage',
      canReadFieldValue: true,
      canUpdateFieldValue: true,
    },
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
      fieldName: 'clientStatus',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
  ],
});
