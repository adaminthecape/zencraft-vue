export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type Nullable<T> = (T | null | undefined);
export type CssClassProp = (string | string[] | Record<string, boolean>);

export type AppHelpers = {
  $handlebars: {
    compile: (template: string) => (data: Record<string, unknown>) => string;
  };
  $ctxStore: {
    store: any;
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
      options?: {
        isNew?: boolean;
      };
    }) => void;
  };
};
