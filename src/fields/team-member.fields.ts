import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const WORKSPACE_MEMBER_DEPARTMENT_FIELD_ID =
  'tbm-field-wsm-dept-0000-0000-000000000001';
export const WORKSPACE_MEMBER_STATUS_FIELD_ID =
  'tbm-field-wsm-stat-0000-0000-000000000002';
export const WORKSPACE_MEMBER_JOIN_DATE_FIELD_ID =
  'tbm-field-wsm-join-0000-0000-000000000003';

export const teamMemberFields = [
  defineField({
    universalIdentifier: WORKSPACE_MEMBER_DEPARTMENT_FIELD_ID,
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS?.workspaceMember
        ?.universalIdentifier || 'workspace-member-standard',
    name: 'department',
    type: FieldType.SELECT,
    label: 'Department',
    description: 'Agency functional department',
    options: [
      { value: 'CREATIVE', label: 'Creative', position: 0, color: 'purple' },
      { value: 'EDITOR', label: 'Editor', position: 1, color: 'blue' },
      { value: 'PRODUCTION', label: 'Production', position: 2, color: 'green' },
    ],
  }),
  defineField({
    universalIdentifier: WORKSPACE_MEMBER_STATUS_FIELD_ID,
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS?.workspaceMember
        ?.universalIdentifier || 'workspace-member-standard',
    name: 'status',
    type: FieldType.SELECT,
    label: 'Status',
    description: 'Workspace member availability status',
    options: [
      { value: 'ACTIVE', label: 'Active', position: 0, color: 'green' },
      { value: 'INACTIVE', label: 'Inactive', position: 1, color: 'red' },
    ],
    defaultValue: `'ACTIVE'`,
  }),
  defineField({
    universalIdentifier: WORKSPACE_MEMBER_JOIN_DATE_FIELD_ID,
    objectUniversalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS?.workspaceMember
        ?.universalIdentifier || 'workspace-member-standard',
    name: 'joinDate',
    type: FieldType.DATE,
    label: 'Join Date',
    description: 'Date joined The Bored Monkey team',
  }),
];

export default teamMemberFields;
