import {
  defineRole,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';
import { BRAND_UNIVERSAL_IDENTIFIER } from '../objects/brand.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const BRAND_POC_ROLE_UNIVERSAL_IDENTIFIER =
  'tbm-role-brand-poc-0000-0000-000000000005';

export default defineRole({
  universalIdentifier: BRAND_POC_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Brand POC',
  description: 'Client Brand Point of Contact read-only portal view',
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
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
      rowLevelPermissionPredicateGroups: [
        {
          predicates: [
            {
              field: 'brand',
              operator: RowLevelPermissionPredicateOperand.IS,
              value: 'CURRENT_USER_BRAND',
            },
          ],
        },
      ],
    },
    {
      objectUniversalIdentifier: BRAND_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  fieldPermissions: [
    // Client-Friendly Fields (READ ONLY)
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'title',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'clientStatus',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'revisionRound',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'targetDelivery',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'contentType',
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    },

    // Hidden Internal Fields (CRITICAL: ZERO ACCESS FOR CLIENT POC)
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'currentStage',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'internalNotes',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'priority',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'deadline',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'assignedTo',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'department',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
    {
      objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
      fieldName: 'overallStatus',
      canReadFieldValue: false,
      canUpdateFieldValue: false,
    },
  ],
});
