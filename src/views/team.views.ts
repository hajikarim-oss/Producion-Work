import {
  defineView,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const TEAM_MY_TASKS_VIEW_ID =
  'tbm-view-team-tasks-0000-0000-000000000001';
export const TEAM_MY_PIPELINE_VIEW_ID =
  'tbm-view-team-pipeline-0000-0000-000000000002';
export const TEAM_MY_OVERDUE_VIEW_ID =
  'tbm-view-team-overdue-0000-0000-000000000003';

export const teamViews = [
  // 1. My Tasks (Table)
  defineView({
    universalIdentifier: TEAM_MY_TASKS_VIEW_ID,
    name: 'My Tasks',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconCheckbox',
    position: 0,
    filters: [
      {
        fieldMetadataUniversalIdentifier: 'assignedTo',
        operand: 'IS',
        value: '@currentUser',
      },
      {
        fieldMetadataUniversalIdentifier: 'currentStage',
        operand: 'IS_NOT_ANY_OF',
        value: ['DELIVERED', 'CLOSED'],
      },
    ],
    sorts: [
      {
        fieldMetadataUniversalIdentifier: 'deadline',
        direction: ViewSortDirection.ASC,
      },
    ],
  }),

  // 2. My Pipeline (Kanban)
  defineView({
    universalIdentifier: TEAM_MY_PIPELINE_VIEW_ID,
    name: 'My Pipeline',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.KANBAN,
    icon: 'IconLayoutKanban',
    position: 1,
    kanbanFieldMetadataUniversalIdentifier: 'currentStage',
    filters: [
      {
        fieldMetadataUniversalIdentifier: 'assignedTo',
        operand: 'IS',
        value: '@currentUser',
      },
    ],
  }),

  // 3. Overdue (Mine)
  defineView({
    universalIdentifier: TEAM_MY_OVERDUE_VIEW_ID,
    name: 'My Overdue Tasks',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconAlertCircle',
    position: 2,
    filters: [
      {
        fieldMetadataUniversalIdentifier: 'assignedTo',
        operand: 'IS',
        value: '@currentUser',
      },
      {
        fieldMetadataUniversalIdentifier: 'overallStatus',
        operand: 'CONTAINS',
        value: 'OVERDUE',
      },
    ],
    sorts: [
      {
        fieldMetadataUniversalIdentifier: 'deadline',
        direction: ViewSortDirection.ASC,
      },
    ],
  }),
];

export default teamViews;
