export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type Nullable<T> = (T | null | undefined);

export type CssClassProp = (string | string[] | Record<string, boolean>);

/**
 * Unfortunate relic of a time when the app didn't have a central context store.
 */
export const contextStoreDefaultOpts = Object.freeze({
	containerId: 'all',
	storeId: 'ctx-store-all'
});

export type ItemContextOpts = {
  itemId: string;
  itemType: string;
};

export type ContextReference = {
  pageId: string;
  blockId: string;
  parentId?: string;
};

export type BlockContextStoreState = {
  containerId: string;
  currentPageId: string | undefined;
  /** Handlebars processor for context values */
  handlebars: unknown;
  page: {
    [pageId: string]: {
      block?: {
        [blockId: string]: Record<string, unknown>;
      };
      itemIdsByType?: Partial<Record<string, string>>;
      itemDataByType?: Partial<Record<string, Record<string, unknown>>>;
    };
  };
  context: {
    itemIdsByType: Partial<Record<string, string>>;
    itemDataByType: Partial<Record<string, Record<string, unknown>>>;
  };
};

export type BlockContextStore = {
  getContext: BlockContextStoreState['context'];
  getCurrentPageContext: {
    itemData: BlockContextStoreState['page'][string]['itemDataByType'];
    itemIds: BlockContextStoreState['page'][string]['itemIdsByType'];
  } | undefined;
  getPageContext: (pageId: string) => Record<string, unknown> | undefined;
  getSelectedItemOnPage: (
    pageId: string | undefined,
    itemType: string
  ) => Record<string, unknown> | undefined;
  getBlockContext: (pageId: string, blockId: string) => Record<string, unknown>;
  getItemData: Record<string, Record<string, unknown>>;
  getSelectedItem: (type: string) => {
    itemId: string | undefined;
    itemType: string;
    itemData: Record<string, unknown> | undefined;
  };
  getSelectedItemData: (type: string) => Record<string, unknown> | undefined;
  getDataByPath: (opts: {
    itemType: string;
    itemId?: string;
    dotPath: string;
  }) => Record<string, unknown> | undefined;
  generateReference: (opts?: Partial<ContextReference>) => Partial<ContextReference>;
  resolveReference: (reference: Partial<ContextReference>) => Record<string, unknown>;
  setPageId: (pageId: Nullable<string>) => void;
  setHandlebars: (hb: unknown) => void;
  handlebarsCompile: (template: string, data: Record<string, unknown>) => string;
  compile: (template: string) => string;
  setPageContextData: (opts: {
    pageId: string;
    blockId: string;
    data: Record<string, unknown>;
  }) => void;
  ensureItemInStore: (opts: ItemContextOpts) => Promise<Record<string, unknown> | undefined>;
  selectItem: (opts: ItemContextOpts) => void;
  selectItemOnPage: (opts: ItemContextOpts & {
    pageId: string | undefined;
  }) => void;
  setItemData: (opts: ItemContextOpts & {
    data: Record<string, unknown>;
  }) => void;
};

export type ItemToEdit = {
  id: string;
  typeId: string;
  initialData?: Record<string, unknown>;
  contextReference?: Partial<ContextReference>;
  options?: {
    isNew?: boolean;
    persistent?: boolean;
  };
};

export type AppHelpers = {
  $handlebars: {
    compile: (template: string) => (data: Record<string, unknown>) => string;
  };
  $ctxStore: {
    store: BlockContextStore;
    itemData: Record<string, Record<string, unknown>>;
    itemIdsOnPage: Record<string, string>;
    /** Using the page context, compile a Handlebars template */
    compile: (template: string) => string;
  };
  helpers: {
    login: (username: string, password: string) => Promise<boolean>;
    editItem: (opts: ItemToEdit) => void;
  };
};
