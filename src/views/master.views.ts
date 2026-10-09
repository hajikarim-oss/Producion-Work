import {
  defineView,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const MASTER_ALL_PROJECTS_VIEW_ID =
  'tbm-view-master-all-0000-0000-000000000001';
export const MASTER_PIPELINE_KANBAN_VIEW_ID =
  'tbm-view-master-kanban-0000-0000-000000000002';
export const MASTER_OVERDUE_VIEW_ID =
  'tbm-view-master-overdue-0000-0000-000000000003';
export const MASTER_THIS_WEEK_CALENDAR_VIEW_ID =
  'tbm-view-master-week-0000-0000-000000000004';
export const MASTER_BY_BRAND_VIEW_ID =
  'tbm-view-master-brand-0000-0000-000000000005';

export const masterViews = [
  // 1. All Projects (Table)
  defineView({
    universalIdentifier: MASTER_ALL_PROJECTS_VIEW_ID,
    name: 'All Projects',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconList',
    position: 0,
    sorts: [
      {
        fieldMetadataUniversalIdentifier: 'deadline',
        direction: ViewSortDirection.ASC,
      },
    ],
  }),

  // 2. Pipeline (Kanban)
  defineView({
    universalIdentifier: MASTER_PIPELINE_KANBAN_VIEW_ID,
    name: 'Pipeline',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.KANBAN,
    icon: 'IconLayoutKanban',
    position: 1,
    kanbanFieldMetadataUniversalIdentifier: 'currentStage',
    sorts: [
      {
        fieldMetadataUniversalIdentifier: 'priority',
        direction: ViewSortDirection.DESC,
      },
    ],
  }),

  // 3. Overdue (Table)
  defineView({
    universalIdentifier: MASTER_OVERDUE_VIEW_ID,
    name: 'Overdue Projects',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconAlertTriangle',
    position: 2,
    filters: [
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

  // 4. This Week (Calendar)
  defineView({
    universalIdentifier: MASTER_THIS_WEEK_CALENDAR_VIEW_ID,
    name: 'This Week Deadlines',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.CALENDAR,
    icon: 'IconCalendar',
    position: 3,
    calendarFieldMetadataUniversalIdentifier: 'deadline',
  }),

  // 5. By Brand (Grouped Table)
  defineView({
    universalIdentifier: MASTER_BY_BRAND_VIEW_ID,
    name: 'Projects by Brand',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconBuildingStore',
    position: 4,
    kanbanFieldMetadataUniversalIdentifier: 'brand',
  }),
];

export default masterViews;
