import { defineRole } from 'twenty-sdk/define';

export const ADMIN_ROLE_UNIVERSAL_IDENTIFIER =
  'tbm-role-admin-0000-0000-000000000001';

export default defineRole({
  universalIdentifier: ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Admin (Sachin)',
  description: 'Full administrative access across all objects, fields, and settings',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: true,
  canUpdateAllSettings: true,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: true,
});
