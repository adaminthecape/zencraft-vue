import { BlockContextStore } from "src/pinia/blockContextStore";

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
    editItem: (opts: {
      id: string;
      typeId: string;
      initialData?: Record<string, unknown>;
      contextReference?: {
        pageId?: string;
        blockId?: string;
        parentId?: string;
      };
      options?: {
        isNew?: boolean;
        persistent?: boolean;
      };
    }) => void;
  };
};
