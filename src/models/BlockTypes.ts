import { fields } from 'zencraft-core';

export enum BlockType
{
  testBlock = 'testBlock',
  headlessItemSearch = 'headlessItemSearch',
  paletteTester = 'paletteTester',
  itemAvatar = 'itemAvatar',
  tourCard = 'tourCard',
  contextProvider = 'contextProvider',
  contextSelector = 'contextSelector',
  itemInput = 'itemInput',
  itemFieldValue = 'itemFieldValue',
  contextVoid = 'contextVoid',
  tableColumns = 'tableColumns',
  fieldValueContextProvider = 'fieldValueContextProvider',
  itemListValue = 'itemListValue',
  formFields = 'formFields',
  fieldInput = 'fieldInput',
  clickableList = 'clickableList',
  htmlContent = 'htmlContent',
  newItemContext = 'newItemContext',
  createNewItemAvatar = 'createNewItemAvatar',
}

export enum BlockCategory
{
  admin = 'admin',
  layout = 'layout',
  search = 'search',
  input = 'input',
  items = 'items',
}

export type BlockTypeConfigOpts = {
  /** Path to the component to render */
  componentPath?: string;
  /** Fields which control options for blocks using this definition */
  fields: fields.FieldData[];
  /** Whether this Block can have child Blocks */
  hasChildren?: boolean;
  /** By default, only these BlockTypes will be allowed as direct children */
  defaultAllowedChildren?: BlockType[];
  /** If set, the AddBlockButton will be hidden when the maximum is reached */
  maximumAllowedChildren?: number;
  /** Hide the AddBlockButton (so the Block can override it) */
  hideAddBlockButton?: boolean;
  /** Any categories this block might belong to (for filtering) */
  categories?: BlockCategory[];
};

export const blockTypeConfig: Record<BlockType, BlockTypeConfigOpts> = {
  testBlock: {
    fields: [],
    categories: [BlockCategory.admin],
  },
  headlessItemSearch: {
    fields: [],
    hasChildren: true,
    categories: [BlockCategory.search],
    hideAddBlockButton: true,
  },
  paletteTester: {
    fields: [],
    categories: [BlockCategory.admin],
  },
  itemAvatar: {
    fields: [],
    categories: [BlockCategory.items],
  },
  tourCard: {
    fields: [],
    categories: [BlockCategory.items],
  },
  contextProvider: {
    fields: [],
    hasChildren: true,
    categories: [BlockCategory.layout, BlockCategory.items],
  },
  contextSelector: {
    fields: [],
    hasChildren: true,
    categories: [BlockCategory.layout, BlockCategory.items],
    hideAddBlockButton: true,
  },
  itemInput: {
    fields: [],
    categories: [BlockCategory.input, BlockCategory.items],
  },
  itemFieldValue: {
    fields: [],
    categories: [BlockCategory.layout, BlockCategory.items],
  },
  contextVoid: {
    fields: [],
    categories: [BlockCategory.layout, BlockCategory.items],
    hasChildren: true,
  },
  tableColumns: {
    fields: [],
    categories: [BlockCategory.layout],
    hasChildren: true,
    hideAddBlockButton: true,
  },
  fieldValueContextProvider: {
    fields: [],
    categories: [BlockCategory.layout, BlockCategory.items],
    hasChildren: true,
  },
  itemListValue: {
    fields: [],
    categories: [BlockCategory.layout, BlockCategory.items],
    hasChildren: true,
    hideAddBlockButton: true,
  },
  formFields: {
    fields: [],
    categories: [BlockCategory.input, BlockCategory.items],
    hideAddBlockButton: true,
  },
  fieldInput: {
    defaultAllowedChildren: [],
    fields: [],
    hasChildren: false,
    categories: [
      BlockCategory.input
    ],
    hideAddBlockButton: true
  },
  clickableList: {
    fields: [],
    hasChildren: true,
    categories: [
      BlockCategory.layout,
      BlockCategory.input
    ],
    hideAddBlockButton: true,
  },
  htmlContent: {
    fields: [],
    hasChildren: false,
    categories: [
      BlockCategory.layout,
      BlockCategory.items
    ],
    hideAddBlockButton: true,
  },
  newItemContext: {
    fields: [],
    hasChildren: false,
    categories: [
      BlockCategory.input,
      BlockCategory.items
    ],
    hideAddBlockButton: true
  },
  createNewItemAvatar: {
    fields: [],
    hasChildren: false,
    categories: [
      BlockCategory.input,
      BlockCategory.items
    ],
    hideAddBlockButton: true
  },
};

export const itemTypeIcons: Record<string, string | undefined> = {
  Block: 'build',
  Booking: 'hotel',
  Field: 'handyman',
  Hotel: 'house',
  Item: 'category',
  Archetype: 'apartment',
  Module: 'view_module',
  Page: 'description',
  Person: 'person',
  Reminder: 'timer',
  Room: 'bed',
  Ticket: 'task',
  Todo: 'task_alt',
  Tour: 'route',
  Blueprint: 'apartment',
  AccessRole: 'key',
};

export const itemTypePrimaryFieldKeys: Record<string, string[]> = {
  Block: ['title', 'id'],
  Booking: ['internalId', 'id'],
  Field: ['label', 'key', 'id'],
  Hotel: ['title', 'id'],
  Item: ['id'],
  Archetype: ['id'],
  Module: ['title', 'id'],
  Page: ['title', 'id'],
  Person: ['firstName', 'id'],
  Reminder: ['id'],
  Room: ['id'],
  Ticket: ['title', 'id'],
  Todo: ['id'],
  Tour: ['title', 'id'],
  Blueprint: ['blockType', 'id'],
  AccessRole: ['title', 'id'],
};
