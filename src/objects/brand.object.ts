import { defineObject, FieldType } from 'twenty-sdk/define';

export const BRAND_UNIVERSAL_IDENTIFIER =
  'tbm-brand-0002-0000-0000-000000000002';

export default defineObject({
  universalIdentifier: BRAND_UNIVERSAL_IDENTIFIER,
  nameSingular: 'brand',
  namePlural: 'brands',
  labelSingular: 'Brand',
  labelPlural: 'Brands',
  description: 'Client brand partnering with The Bored Monkey',
  icon: 'IconBuildingStore',
  fields: [
    {
      name: 'name',
      type: FieldType.TEXT,
      label: 'Brand Name',
      description: 'The company or brand name',
    },
    {
      name: 'pocName',
      type: FieldType.TEXT,
      label: 'POC Name',
      description: 'Primary Point of Contact name',
    },
    {
      name: 'pocEmail',
      type: FieldType.EMAIL,
      label: 'POC Email',
      description: 'Primary Point of Contact email address',
    },
    {
      name: 'primaryColor',
      type: FieldType.TEXT,
      label: 'Primary Color',
      description: 'Brand primary HEX color code (e.g. #FF5733)',
    },
    {
      name: 'secondaryColor',
      type: FieldType.TEXT,
      label: 'Secondary Color',
      description: 'Brand secondary HEX color code',
    },
    {
      name: 'status',
      type: FieldType.SELECT,
      label: 'Status',
      options: [
        { value: 'ACTIVE', label: 'Active', position: 0, color: 'green' },
        { value: 'ARCHIVED', label: 'Archived', position: 1, color: 'gray' },
      ],
      defaultValue: `'ACTIVE'`,
    },
    {
      name: 'projects',
      type: FieldType.RELATION,
      label: 'Projects',
      relation: {
        targetObject: 'project',
        type: 'ONE_TO_MANY',
      },
    },
  ],
});
