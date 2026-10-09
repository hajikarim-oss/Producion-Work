import {
  defineView,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';
import { PROJECT_UNIVERSAL_IDENTIFIER } from '../objects/project.object';

export const BRAND_YOUR_CONTENT_VIEW_ID =
  'tbm-view-brand-content-0000-0000-000000000001';
export const BRAND_DELIVERY_CALENDAR_VIEW_ID =
  'tbm-view-brand-cal-0000-0000-000000000002';

export const brandViews = [
  // 1. Your Content (Table with client-friendly columns only)
  defineView({
    universalIdentifier: BRAND_YOUR_CONTENT_VIEW_ID,
    name: 'Your Content',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.TABLE,
    icon: 'IconVideo',
    position: 0,
    filters: [
      {
        fieldMetadataUniversalIdentifier: 'brand',
        operand: 'IS',
        value: '@currentUser.brand',
      },
    ],
    sorts: [
      {
        fieldMetadataUniversalIdentifier: 'targetDelivery',
        direction: ViewSortDirection.ASC,
      },
    ],
  }),

  // 2. Delivery Calendar (Calendar)
  defineView({
    universalIdentifier: BRAND_DELIVERY_CALENDAR_VIEW_ID,
    name: 'Delivery Schedule',
    objectUniversalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
    type: ViewType.CALENDAR,
    icon: 'IconCalendarEvent',
    position: 1,
    calendarFieldMetadataUniversalIdentifier: 'targetDelivery',
    filters: [
      {
        fieldMetadataUniversalIdentifier: 'brand',
        operand: 'IS',
        value: '@currentUser.brand',
      },
    ],
  }),
];

export default brandViews;
