import { defineRole } from 'twenty-sdk/define';
import { BRAND_UNIVERSAL_IDENTIFIER } from '../objects/brand.object';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const MANAGER_ROLE_UNIVERSAL_IDENTIFIER =
  'tbm-role-manager-0000-0000-000000000002';

export default defineRole({
  universalIdentifier: MANAGER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Manager',
  description: 'Operations manager with full project and brand control without system settings access',
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
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: BRAND_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    },
  ],
});
