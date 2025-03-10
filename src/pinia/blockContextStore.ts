import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { defineStore } from 'pinia';
import { utils } from 'adam-firebase-tools';
import { Nullable } from 'src/types/generic';

type ItemContextOpts = {
  itemId: string;
  itemType: string;
};

type RootState = {
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

const useBlockContextStore = (opts: {
  storeId: string;
  containerId: string;
}) => defineStore(opts.storeId, {
  state: () =>
    ({
      containerId: opts.containerId,
      currentPageId: undefined,
      handlebars: undefined,
      page: {},
      context: {
        itemIdsByType: {},
        itemDataByType: {},
      }
    } as RootState),
  getters: {
    getContext: (state) => (state.context),
    getCurrentPageContext: (state) => (
      !state.currentPageId ?
        undefined :
        {
          itemData: state.page[state.currentPageId]?.itemDataByType,
          itemIds: state.page[state.currentPageId]?.itemIdsByType,
        }
    ),
    getPageContext: (state) => (pageId: string) => (state.page[pageId]),
    getSelectedItemOnPage: (state) => (pageId: string | undefined, itemType: string) => (
      state.page?.[pageId || '']?.itemDataByType?.[itemType]
    ),
    getBlockContext: (state) => (pageId: string, blockId: string) => (
      !blockId ? state.page[pageId] : state.page[pageId]?.block?.[blockId]
    ),
    getItemData: (state) => (state.context.itemDataByType),
    getSelectedItem: (state) => (type: string) => ({
      itemId: state.context.itemIdsByType[type],
      itemType: type,
      itemData: state.context.itemDataByType[type],
    }),
    getSelectedItemData: (state) => (type: string) => (state.context.itemDataByType[type]),
    getDataByPath: (state) => (opts: {
      itemType: string;
      itemId?: string;
      dotPath: string;
    }) => (utils.genericUtils.dotPick(
      state.context.itemDataByType[opts.itemType] || {},
      opts.dotPath
    )),
  },
  actions: {
    setPageId(pageId: Nullable<string>): void
    {
      if(!pageId)
      {
        this.currentPageId = undefined;

        return;
      }

      if(!this.page[pageId])
      {
        this.page[pageId] = {};
      }

      this.currentPageId = pageId;
    },
    setHandlebars(hb: unknown): void
    {
      this.handlebars = hb;
    },
    handlebarsCompile(template: string, data: Record<string, unknown>): string
    {
      if(!this.handlebars)
      {
        return template;
      }

      return this.handlebars.compile(template)(data);
    },
    compile(template: string)
    {
      if(!this.currentPageId)
      {
        return template;
      }

      return this.handlebarsCompile(
        template,
        this.page[this.currentPageId]?.itemDataByType || {}
      );
    },
    setPageContextData(opts: {
      pageId: string;
      blockId: string;
      data: Record<string, unknown>;
    })
    {
      const { pageId, blockId, data } = opts;

      if(!this.page[pageId])
      {
        this.page[pageId] = { block: {} };
      }

      if(!this.page[pageId].block)
      {
        this.page[pageId].block = {};
      }

      if(!this.page[pageId].block[blockId])
      {
        this.page[pageId].block[blockId] = {};
      }

      this.page[pageId].block[blockId] = {
        ...this.page[pageId].block[blockId],
        ...data
      };
    },
    async ensureItemInStore(opts: ItemContextOpts)
    {
      const { itemId, itemType } = opts;

      if(!utils.uuid.isUuid(itemId) || !itemType)
      {
        return;
      }

      const store = deriveStoreForItemType(itemType);

      if(!store)
      {
        console.warn(`Store not found for item type ${itemType}`);

        return;
      }

      const item = await store.loadItem({ id: itemId, itemType });

      if(!item)
      {
        console.log(`${itemType} ${itemId} not found in store`);

        return;
      }

      // this.setItemData({ ...opts, data: item });

      return store.getItem(itemId, itemType);
    },
    selectItem(opts: ItemContextOpts): void
    {
      this.context.itemIdsByType[opts.itemType] = opts.itemId;
      this.ensureItemInStore(opts);
    },
    selectItemOnPage(opts: ItemContextOpts & {
      pageId: string | undefined;
    }): void
    {
      const { pageId, itemId, itemType } = opts;

      if(!pageId)
      {
        return;
      }

      if(!this.page[pageId])
      {
        this.page[pageId] = {};
      }

      if(!this.page[pageId].itemIdsByType)
      {
        this.page[pageId].itemIdsByType = {};
      }

      if(!this.page[pageId].itemDataByType)
      {
        this.page[pageId].itemDataByType = {};
      }

      this.page[pageId].itemIdsByType[itemType] = itemId;

      this.ensureItemInStore(opts).then((item) =>
      {
        (this.page[pageId].itemDataByType as Record<string, unknown>)[itemType] = item;
      });
    },
    setItemData(opts: ItemContextOpts & {
      data: Record<string, unknown>;
    }): void
    {
      this.context.itemDataByType[opts.itemType] = opts.data;
    },
  },
});

export default useBlockContextStore;
