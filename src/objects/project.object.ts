import { defineObject, FieldType } from 'twenty-sdk/define';
import {
  ContentType,
  Department,
  EditStatus,
  Priority,
  ProjectStage,
  RevisionRound,
} from '../config/tbm.config';

export const PROJECT_UNIVERSAL_IDENTIFIER =
  'tbm-project-0001-0000-0000-000000000001';

export default defineObject({
  universalIdentifier: PROJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'project',
  namePlural: 'projects',
  labelSingular: 'Project',
  labelPlural: 'Projects',
  description: 'A content project from brief to delivery',
  icon: 'IconMovie',
  fields: [
    // Core identity
    {
      name: 'title',
      type: FieldType.TEXT,
      label: 'Project Title',
      description: 'The title of the creative deliverable',
    },
    {
      name: 'brand',
      type: FieldType.RELATION,
      label: 'Brand',
      relation: {
        targetObject: 'brand',
        type: 'MANY_TO_ONE',
      },
    },
    {
      name: 'contentType',
      type: FieldType.SELECT,
      label: 'Content Type',
      options: [
        { value: ContentType.REEL, label: 'Reel', position: 0, color: 'purple' },
        { value: ContentType.VIDEO, label: 'Video', position: 1, color: 'blue' },
        { value: ContentType.CAROUSEL, label: 'Carousel', position: 2, color: 'green' },
        { value: ContentType.STATIC, label: 'Static', position: 3, color: 'gray' },
        { value: ContentType.STORY, label: 'Story', position: 4, color: 'orange' },
      ],
    },

    // Pipeline stages (the state machine)
    {
      name: 'currentStage',
      type: FieldType.SELECT,
      label: 'Current Stage',
      options: Object.values(ProjectStage).map((v, i) => ({
        value: v,
        label: v.replace(/_/g, ' '),
        position: i,
      })),
      defaultValue: `'${ProjectStage.BRIEF_RECEIVED}'`,
    },
    {
      name: 'editStatus',
      type: FieldType.SELECT,
      label: 'Edit Status',
      options: [
        { value: EditStatus.EDIT_IN_PROGRESS, label: 'Edit in progress', position: 0 },
        { value: EditStatus.FIRST_CUT_READY, label: 'First cut ready', position: 1 },
        { value: EditStatus.FIRST_CUT_SENT, label: 'First cut sent', position: 2 },
        { value: EditStatus.REVISING, label: 'Revising', position: 3 },
        { value: EditStatus.FINAL, label: 'Final', position: 4 },
      ],
    },
    {
      name: 'revisionRound',
      type: FieldType.SELECT,
      label: 'Revision Round',
      options: Object.values(RevisionRound).map((v, i) => ({
        value: v,
        label: v,
        position: i,
      })),
      defaultValue: `'${RevisionRound.R0}'`,
    },

    // Assignment & Department
    {
      name: 'assignedTo',
      type: FieldType.RELATION,
      label: 'Assigned To',
      relation: {
        targetObject: 'workspaceMember',
        type: 'MANY_TO_ONE',
      },
    },
    {
      name: 'department',
      type: FieldType.SELECT,
      label: 'Department',
      options: [
        { value: Department.CREATIVE, label: 'Creative', position: 0, color: 'purple' },
        { value: Department.EDITOR, label: 'Editor', position: 1, color: 'blue' },
        { value: Department.PRODUCTION, label: 'Production', position: 2, color: 'green' },
      ],
    },

    // Client-facing fields (visible to brand POC)
    {
      name: 'clientStatus',
      type: FieldType.SELECT,
      label: 'Client Status',
      options: [
        { value: 'BEING_CRAFTED', label: '🎬 Being crafted', position: 0 },
        { value: 'ALMOST_READY', label: '🎬 Almost ready', position: 1 },
        { value: 'AWAITING_FEEDBACK', label: '📋 Awaiting your feedback', position: 2 },
        { value: 'REFINING', label: '✏️ Refining', position: 3 },
        { value: 'APPROVED', label: '✅ Approved', position: 4 },
        { value: 'DELIVERED', label: '📦 Delivered', position: 5 },
        { value: 'COMPLETE', label: '🎉 Complete', position: 6 },
      ],
    },
    {
      name: 'targetDelivery',
      type: FieldType.DATE,
      label: 'Target Delivery',
    },

    // Internal fields (hidden from brand POC)
    {
      name: 'internalNotes',
      type: FieldType.TEXT,
      label: 'Internal Notes',
    },
    {
      name: 'priority',
      type: FieldType.SELECT,
      label: 'Priority',
      options: Object.values(Priority).map((v, i) => ({
        value: v,
        label: v,
        position: i,
      })),
    },
    {
      name: 'deadline',
      type: FieldType.DATE,
      label: 'Deadline',
    },
    {
      name: 'lastUpdated',
      type: FieldType.DATE_TIME,
      label: 'Last Updated',
    },
    {
      name: 'overallStatus',
      type: FieldType.FORMULA,
      label: 'Overall Status',
      formula: `IF(deadline < TODAY() AND currentStage != '${ProjectStage.DELIVERED}' AND currentStage != '${ProjectStage.CLOSED}', '⚠️ OVERDUE', '✅ On Track')`,
    },
  ],
});
