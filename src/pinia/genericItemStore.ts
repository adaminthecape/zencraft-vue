import {
  _GettersTree,
  defineStore,
  Store
} from 'pinia';
import
  {
  utils,
  item as ITEM,
  dbFilters,
  dbPagination,
  genericDb,
  sharedTypes,
  item,
} from 'zencraft-core';
import debounce from 'lodash/debounce';
import { ApiHandler, ApiHandlerDbInterface } from 'src/models/api/ApiInterface';
import useAdminStore from './adminStore';
import { Notify } from 'quasar';
import { IndexedDbInterface } from 'src/models/api/IndexedDbInterface';
import { checkDataSource } from 'src/models/api/DataSource';

export type DatabaseHandlerType = (
  genericDb.GenericDatabase |
  ApiHandlerDbInterface |
  IndexedDbInterface
);

export type GenericRootState<
  IItemType extends ITEM.Item = ITEM.Item,
  IItemHandlerType extends ITEM.ItemHandler<IItemType> = ITEM.ItemHandler<IItemType>
> = {
  cloudLoading: boolean;
  lastCloudUpdate: number;
  lastCloudDispatch: number;
  items: Record<IItemType['id'], IItemType>;
  dbHandler: DatabaseHandlerType | undefined;
  itemHandlers: Record<IItemType['id'], IItemHandlerType>;
};

export type GenericStoreGetters<
  IItemType extends ITEM.Item = ITEM.Item,
  IItemHandlerType extends ITEM.ItemHandler<IItemType> = ITEM.ItemHandler<IItemType>
> = {
  allItems: (state: GenericRootState) => IItemType[];
  allItemIds: (state: GenericRootState) => IItemType['id'][];
  getItem: (state: GenericRootState) => (id: IItemType['id'], itemType: string) => (IItemType | undefined);
  getLastUpdate: (state: GenericRootState) => number;
  getLastDispatch: (state: GenericRootState) => number;
};

export type GenericStoreActions<
  IItemType extends ITEM.Item = ITEM.Item,
  IItemHandlerType extends ITEM.ItemHandler<IItemType> = ITEM.ItemHandler<IItemType>
  > = {
  getIsValidItemType(itemData: Record<string, unknown>): boolean;
  setData(opts: {
    itemId: string;
    itemType: string;
    data: Record<string, unknown>;
  }): void;
  getDb(): Promise<genericDb.GenericDatabase>;
  getHandler(id: IItemType['id'], itemType: string, syncHandlerDataWithStore?: boolean): IItemHandlerType;
  updateOnHandlerChange(
    itemId: IItemType['id'],
    itemType: string,
    name: string,
    value: unknown
  ): void;
  getCustomHandler(
    id: IItemType['id'],
    itemType: string,
    customHandlerFn?: (opts: Record<string, unknown>) => IItemHandlerType,
    syncHandlerDataWithStore?: boolean
  ): IItemHandlerType;
  watchCloudDb(): Promise<void>;
  loadMultiple(opts: {
    ids: IItemType['id'][];
    itemType: string;
    force?: boolean;
  }): Promise<dbPagination.PaginatedItemResponse<IItemType>>;
  loadItem(opts: {
    id: IItemType['id'];
    itemType: string;
    force?: boolean;
  }): Promise<IItemType | undefined>;
  saveItem(opts: {
    id: IItemType['id'];
    itemType: string;
    data: Record<string, unknown>;
    isNew?: boolean;
  }): Promise<void>;
  loadAllItems(itemType: string): Promise<void>;
  searchItems<IItemType>(opts: {
    itemType: string;
    filters?: dbFilters.DbFilters;
    pagination?: dbPagination.DbPaginationOpts;
  }): Promise<dbPagination.PaginatedItemResponse<IItemType>>;
  removeItem(opts: {
    itemId: IItemType['id'];
    itemType: string;
  }): Promise<void>;
  setResultsFromFirebase(cloudTasks: Record<string, unknown>): void;
  SET_ITEMS(items: Record<string, IItemType>): void;
  SET_ITEM(id: IItemType['id'], itemType: string, item: IItemType): void;
  SET_ITEM_PROPERTY(id: IItemType['id'], itemType: string, prop: string, data: unknown): void;
  SET_CLOUD_LOADING(val: boolean): void;
  SET_LAST_CLOUD_UPDATE(): void;
  SET_LAST_CLOUD_DISPATCH(): void;
  test?: (id: string) => Promise<unknown>;
};

export type GenericItemStore = Store<
  string,
  GenericRootState,
  GenericStoreGetters,
  GenericStoreActions
>;

export enum DataSource
{
  'firestore' = 'firestore',
  'sql' = 'sql',
  'itemSql' = 'itemSql'
}

export function useGenericItemStore<
  IItemType extends ITEM.Item = ITEM.Item,
  IItemHandlerType extends ITEM.ItemHandler<IItemType> = ITEM.ItemHandler<IItemType>,
  S extends GenericRootState<IItemType> = GenericRootState<IItemType>,
  G extends GenericStoreGetters<IItemType> = GenericStoreGetters<IItemType>,
  A extends GenericStoreActions<IItemType> = GenericStoreActions<IItemType>
>(storeOpts: {
  itemType: string;
  storeName: string;
  dbName?: string;
  tableName?: string;
  dbSource?: DataSource;
  getters?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  rootState?: Record<string, unknown>;
})
{
  return defineStore(storeOpts.storeName, {
    state: () => ({
      items: {},
      cloudLoading: false,
      lastCloudUpdate: 0,
      lastCloudDispatch: 0,
      dbHandler: undefined,
      dbSource: DataSource.itemSql,
      itemHandlers: {},
      ...storeOpts.rootState
    } as GenericRootState),
    getters: {
      allItems: (state): IItemType[] => Object.values(state.items) as IItemType[],
      allItemIds: (state): IItemType['id'][] => Object.keys(state.items),
      getItem: (state) => (
        id: IItemType['id'],
        itemType?: string
      ): IItemType | undefined => state.items[id] as IItemType,
      getLastUpdate: (state): number => state.lastCloudUpdate,
      getLastDispatch: (state): number => state.lastCloudDispatch,
      ...storeOpts.getters
    },
    actions: {
      getIsValidItemType(itemData: Record<string, unknown>)
      {
        return !!itemData;
      },
      async copyToOtherDatabase(itemType: string)
      {
        const sqlHandler = new ApiHandlerDbInterface({
          apiHandler: new ApiHandler({
            jwtFn: () => (localStorage.getItem('jwt') || '') as string
          })
        });

        const adminStore = useAdminStore();
        const firestore = adminStore.dbHandler;

        const filters: dbFilters.DbFilters = [
          {
            key: 'typeId',
            operator: dbFilters.DbFilterOperator.isEqual,
            value: itemType,
          }
        ];

        const someData = await sqlHandler.selectMultiple({
          itemType,
          filters,
        });

        if(!firestore)
        {
          console.warn('Firebase not available');

          return;
        }

        console.log('to insert:', someData.results);

        for await(const result of someData.results)
        {
          if(!utils.tools.isPopulatedObject(result))
          {
            return;
          }

          console.log('insert:', result.typeId, result.id);

          await firestore.insert({
            tableName: itemType,
            itemId: result.id,
            itemType: result.typeId,
            data: result as Record<string, unknown>,
          });
        }
      },
      getDb(): DatabaseHandlerType
      {
        // return an API interface, not a direct db interface

        if(this.dbHandler)
        {
          return this.dbHandler as DatabaseHandlerType;
        }

        const dataSource = checkDataSource();

        if(dataSource.isApi)
        {
          // TODO: Make this a singleton or shared instance
          this.dbHandler = new ApiHandlerDbInterface({
            apiHandler: new ApiHandler({
              jwtFn: () => (localStorage.getItem('jwt') || ''),
              onResultFn: (opts) =>
              {
                if(!(
                  opts.url?.startsWith('items/updateItem') ||
                  opts.url?.startsWith('items/removeItem') ||
                  opts.url?.startsWith('items/addItem')
                ))
                {
                  return;
                }

                console.log('store onResultFn:', opts);

                const { itemId, itemType, itemData } = (opts.data || {}) as {
                  itemId?: string;
                  itemType?: string;
                  itemData?: Record<string, unknown>;
                };

                const itemLabel = (
                  itemData?.title ||
                  itemData?.name ||
                  itemData?.label ||
                  itemId?.split('-')[0]
                )

                const itemName = `${itemType || 'item'} "${itemLabel}"`;

                const success = opts.status === 200;
                const notAllowed = opts.status === 403;
                const notFound = opts.status === 404;
                const error = opts.error || undefined;

                let color, icon;

                if(notAllowed)
                {
                  color = 'warning';
                  icon = 'fas fa-exclamation-triangle';
                }
                else if(notFound || error)
                {
                  color = 'negative';
                  icon = 'fas fa-exclamation-circle';
                }
                else if(success)
                {
                  color = 'positive';
                  icon = 'fas fa-check-circle';
                }

                let action = '';

                if(opts.url.startsWith('items/searchItems'))
                {
                  action = 'Search ';
                }
                else if(opts.url.startsWith('items/updateItem'))
                {
                  action = 'Updated ';
                }
                else if(opts.url.startsWith('items/removeItem'))
                {
                  action = 'Removed ';
                }
                else if(opts.url.startsWith('items/addItem'))
                {
                  action = 'Added ';
                }

                Notify.create({
                  message: `${!success ? 'FAILED: ' : ''}${action}${itemName}${(
                    opts.status && (opts.status !== 200) ? ` (${opts.status})` : ''
                  )}`,
                  color,
                  icon,
                });
              }
            })
          });
        }
        else if(dataSource.isFirebase)
        {
          const adminStore = useAdminStore();

          return adminStore.dbHandler as DatabaseHandlerType;
        }
        else if(dataSource.isIndexedDb)
        {
          this.dbHandler = new IndexedDbInterface({});
        }

        return this.dbHandler as DatabaseHandlerType;
      },
      /**
       * To be overridden by descendants!
       *
       * This will be executed whenever an attached handler's data changes. You
       * can either have it do nothing, or let it sync the data with the store,
       * or do whatever custom logic you need to do with any given prop.
       *
       * In this way, you can simply use `getHandler()` to import a handler for
       * any given item into your component(s), and mutate its data directly via
       * its getters/setters, while keeping all changes in sync with the store.
       */
      updateOnHandlerChange(
        itemId: IItemType['id'],
        itemType: string,
        name: string,
        value: unknown
      ): void
      {
        this.SET_ITEM_PROPERTY(itemId, itemType, name, value);
      },
      getHandler(
        id: IItemType['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      )
      {
        if(this.itemHandlers[id] instanceof ITEM.ItemHandler)
        {
          /**
           * NOTE: Because of this, if _any_ component requests that the handler
           * for this id sync with the store, ALL handlers for that id will sync
           * with the store. This is because only one handler instance is used
           * at a time. You can use `getCustomHandler` separately to bypass the
           * handler cache.
           */
          if(syncHandlerDataWithStore)
          {
            this.itemHandlers[id].setOnDirtyField(debounce((
              itemId: string,
              itemType: string,
              name: string,
              value: unknown
            ) =>
            {
              this.updateOnHandlerChange(itemId, itemType, name, value);
            }, 250));
          }

          return this.itemHandlers[id];
        }

        const handler = this.getCustomHandler(
          id,
          itemType || storeOpts.itemType,
          undefined,
          syncHandlerDataWithStore
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
      /**
       * Generic function to get a handler for an Item.
       *
       * This is intended for use ONLY with custom Item extensions, in a store,
       * which extends `genericItemStore`. The purpose is to ensure that you
       * get a handler that matches your custom Item interface.
       *
       * To use this, simply override `getHandler()` in your store:
       *
       * `getHandler(id: IItemType['id'])
       * {
       *    return this.getCustomHandler(
       *      id,
       *      (opts: MyCustomItemOpts) => new MyCustomItemHandler(opts)
       *    );
       * }`
       *
       * @param id
       * @param customHandlerFn
       * @returns
       */
      getCustomHandler(
        id: IItemType['id'],
        itemType: string,
        customHandlerFn?: (opts: Record<string, unknown>) => IItemHandlerType,
        syncHandlerDataWithStore?: boolean
      ): IItemHandlerType
      {
        if(!id)
        {
          throw new Error(`Cannot get handler with no id (${id})`);
        }

        const table = this.getDb();

        const opts = {
          id,
          db: table,
          // attach the handler to the store to sync updates
        };

        const handler = (
          customHandlerFn &&
          typeof customHandlerFn === 'function'
        ) ?
          customHandlerFn(opts) :
          new ITEM.ItemHandler<IItemType>(opts);

        if(syncHandlerDataWithStore)
        {
          handler.setOnDirtyField(debounce((
            itemId: IItemType['id'],
            itemType: string,
            name: string,
            value: unknown
          ) =>
          {
            this.updateOnHandlerChange(itemId, itemType, name, value);
          }, 250));
        }

        const currentData = this.getItem(id, itemType);

        if(currentData)
        {
          handler.setData(currentData);
        }

        return handler as IItemHandlerType;
      },
      /**
       * Not currently implemented via Firebase Firestore
       * @deprecated
       */
      async watchCloudDb()
      {
        if(this.getLastUpdate)
        {
          return;
        }

        this.SET_CLOUD_LOADING(true);

        const db = this.getDb();

        if(!db)
        {
          throw new Error(`(watchCloudDb) Database not available in store ${storeOpts.storeName}`);
        }

        // init connection with cloud db & update store on change
        // await db.watch((results: unknown) => this.setResultsFromFirebase({
        //   [storeOpts.tableName]: results
        // }));
      },
      setData(opts: {
        itemId: string;
        itemType: string;
        data: Record<string, unknown>;
      })
      {
        const { itemId, itemType, data } = opts;

        const handler = this.getHandler(itemId, itemType || storeOpts.itemType);

        if(!handler)
        {
          console.warn('setData failed:', { itemId, itemType, data, handler });

          return;
        }

        handler.setData(data);
      },
      async loadItem(opts: {
        id: IItemType['id'] | string;
        itemType: string;
        force?: boolean;
      }): Promise<IItemType | undefined>
      {
        const itemType = opts.itemType || storeOpts.itemType;

        if(this.getItem(opts.id, itemType) && !opts.force)
        {
          return this.getItem(opts.id, itemType) as IItemType;
        }

        const handler = this.getHandler(opts.id, itemType);

        try
        {
          const loadedData = await handler.load();

          if(!loadedData)
          {
            delete this.itemHandlers[opts.id];

            console.log(`Item ${opts.id} (${itemType}) does not exist`);

            return undefined;
          }

          // if(loadedData?.typeId !== storeOpts.itemType)
          // {
          //   delete this.itemHandlers[opts.id];

          //   throw new Error(`Item ${opts.id} (${
          //     storeOpts.itemType
          //   }) is actually a ${loadedData?.typeId}`);
          // }

          const item = handler.getData() as IItemType;

          this.SET_ITEM(opts.id, opts.itemType, item);

          return this.getItem(opts.id, itemType);
        }
        catch(e)
        {
          console.log(`Failed to load item ${opts.id}`);
          console.error(e);

          Notify.create({
            message: `Failed to load item ${opts.id}`
          });

          return undefined;
        }
      },
      async loadMultiple(opts: {
        ids: string[];
        itemType: string;
        force?: boolean;
      }): Promise<dbPagination.PaginatedItemResponse<IItemType> | undefined>
      {
        const itemType = opts.itemType || storeOpts.itemType;

        if(!Array.isArray(opts?.ids))
        {
          console.log(`Cannot load multiple with no ids ${opts?.ids}`);

          return undefined;
        }

        // ignore loading existing items
        const idsToFind = opts.force ?
          opts.ids :
          opts.ids.filter((id) => (!this.getItem(id, itemType)));

        if(!idsToFind.length)
        {
          return {
            results: [],
            pagination: {},
            hasMore: false,
            totalItems: 0
          };
        }

        const filters: dbFilters.DbFilters = [
          {
            key: 'itemId',
            operator: dbFilters.DbFilterOperator.in,
            value: idsToFind
          }
        ];

        return this.searchItems({
          itemType: opts.itemType || storeOpts.itemType,
          filters,
          pagination: {
            page: 1,
            pageSize: 100 // default limit
          }
        });
      },
      async loadAllItems(itemType: string): Promise<void>
      {
        // load each page until done
        const ph = new dbPagination.PaginationHandler({});

        const dataSource = checkDataSource();

        if(dataSource.isIndexedDb)
        {
          ph.setPageSize(200);
        }
        else
        {
          ph.setPageSize(50);
        }

        const db = this.getDb();

        await this.forEachPage({
          db,
          ph,
          itemType: itemType || storeOpts.itemType,
          filters: [this.getItemTypeFilter()],
          withResult: async (
            // res: dbPagination.PaginatedItemResponse<unknown>
          ) =>
          {
            // console.log(`Loaded page ${(
            //   res.pagination.page ?? 0
            // )} of ${(
            //   Math.ceil((res.totalItems ?? 0) / (res.pagination.pageSize ?? 1))
            // )}`);
          }
        });
      },
      async saveItem(opts: {
        id: IItemType['id'];
        itemType: string;
        data?: IItemType;
        isNew?: boolean;
      })
      {
        const itemType = opts.itemType || storeOpts.itemType;
        const handler = this.getHandler(opts.id, itemType);

        if(!opts.isNew)
        {
          // check that the item exists first
          const loadedData = await this.loadItem({ id: opts.id, itemType });

          if(loadedData?.typeId && (loadedData?.typeId !== itemType))
          {
            console.log(`Cannot save item ${
              opts.id
            } (${
              itemType
            }) due to wrong type (${
              loadedData?.typeId
            })`);

            delete this.itemHandlers[opts.id];

            return;
          }
        }

        if(opts.data)
        {
          handler.setData(opts.data);
        }

        if(opts.isNew && !handler.createdAt)
        {
          handler.createdAt = Math.floor(Date.now() / 1000);
        }

        handler.updatedAt = Math.floor(Date.now() / 1000);

        this.SET_ITEM(handler.id, handler.typeId, handler.getData() as IItemType);

        await handler.update({ data: handler.getData() });
      },
      async removeItem(opts: {
        itemId: IItemType['id'];
        itemType: string;
      }): Promise<void>
      {
        try
        {
          const itemType = opts.itemType || storeOpts.itemType;
          const handler = this.getHandler(opts.itemId, itemType);

          console.log('removeItem:', itemType, opts.itemId);

          await handler.destroy();
        }
        catch(e)
        {
          console.error(e);
        }
      },
      getItemTypeFilter(itemType?: string): dbFilters.DbFilter
      {
        return {
          key: 'typeId',
          operator: dbFilters.DbFilterOperator.isEqual,
          value: itemType || storeOpts.itemType
        };
      },
      async forEachPage(opts: {
        db: genericDb.GenericDatabase;
        ph: dbPagination.PaginationHandler;
        itemType: string;
        filters?: dbFilters.DbFilters;
        withResult: (result: dbPagination.PaginatedItemResponse<unknown>) => Promise<void>
      })
      {
        const res = await this.searchItems({
          itemType: opts.itemType,
          filters: opts.filters,
          pagination: opts.ph.pagination
        });

        await opts.withResult(res);

        opts.ph.setTotal(res.totalItems);

        if(res.hasMore && !opts.ph.isDone)
        {
          opts.ph.incrementPage();

          await this.forEachPage(opts);
        }
      },
      async searchItems<IItemTypeToFind>(opts: {
        itemType: string;
        filters?: dbFilters.DbFilters;
        pagination?: dbPagination.DbPaginationOpts;
      }): Promise<dbPagination.PaginatedItemResponse<IItemTypeToFind>>
      {
        const db: DatabaseHandlerType = this.getDb();
        const filters: dbFilters.DbFilters = [...(opts.filters || [])];
        const itemType = opts.itemType || storeOpts.itemType;

        if(
          itemType !== sharedTypes.KnownItemType.Item &&
          !filters.some((f) => ('key' in f && f.key === 'typeId'))
        )
        {
          filters.push(this.getItemTypeFilter(itemType));
        }

        let queryResult;

        try
        {
          queryResult = await db.selectMultiple({
            // tableName: storeOpts.tableName || 'item',
            itemType,
            filters,
            pagination: opts.pagination
          });
        }
        catch(e)
        {
          console.warn('Search ERROR:', e);
        }

        if(!(
          utils.tools.isPopulatedObject(queryResult) &&
          Array.isArray(queryResult.results)
        ))
        {
          console.warn('Search failed', {
            tableName: storeOpts.tableName,
            filters: opts.filters,
            pagination: opts.pagination,
            result: queryResult
          });

          return {
            results: [],
            hasMore: false,
            totalItems: 0,
            pagination: opts.pagination || {}
          };
        }

        const resultsMap = queryResult.results.reduce((
          agg: Record<string, unknown>,
          itemData: unknown
        ) =>
        {
          if(!itemData || !utils.tools.isPopulatedObject(itemData))
          {
            return agg;
          }

          const id = itemData.itemId || itemData.id;

          if(id)
          {
            if(!itemData.id)
            {
              itemData.id = id;
            }

            agg[id as string] = itemData;
          }

          return agg;
        }, {});

        // set results in store, if not already
        this.SET_ITEMS(resultsMap as Record<string, IItemType>);

        return queryResult as dbPagination.PaginatedItemResponse<IItemTypeToFind>;
      },
      /**
       * TODO: This is no longer firebase-specific, update wording
       * @param cloudTasks
       * @returns
       */
      setResultsFromFirebase(cloudTasks: Record<string, unknown>)
      {
        if(!(utils.tools.isPopulatedObject(cloudTasks)))
        {
          console.warn(`Empty results from firebase (${storeOpts.storeName})`);

          return;
        }

        console.log('firebase:', storeOpts.storeName, cloudTasks);

        this.SET_CLOUD_LOADING(true);

        if(
          storeOpts.tableName &&
          storeOpts.tableName in cloudTasks &&
          cloudTasks[storeOpts.tableName]
        )
        {
          // @ts-expect-error Validated above
          this.SET_ITEMS((cloudTasks)[storeOpts.tableName]);
        }

        this.SET_LAST_CLOUD_UPDATE();

        setTimeout(() =>
        {
          this.SET_CLOUD_LOADING(false);
        }, 200);

        // localStorageIntervalQueueAdd(LocalStorageName.appRefreshQueue, 1);
      },
      SET_ITEMS(items: Record<string, IItemType>)
      {
        Object.entries(items || {}).forEach(([itemId, item]) =>
        {
          this.SET_ITEM(
            item?.id || itemId,
            item?.typeId || storeOpts.itemType,
            item
          );
        });
      },
      SET_ITEM(
        id: IItemType['id'],
        itemType: string,
        item: IItemType
      )
      {
        if(!this.getIsValidItemType(item))
        {
          console.log('Invalid item:', storeOpts.storeName, item);
          return;
        }

        this.items[id] = item;
      },
      SET_ITEM_PROPERTY(
        id: IItemType['id'],
        itemType: string,
        prop: string,
        data: unknown
      )
      {
        if(utils.tools.isPopulatedObject(this.items[id]) && (prop in this.items[id]))
        {
          // @ts-expect-error Validated above
          this.items[id][prop] = data;
        }
      },
      SET_CLOUD_LOADING(val: boolean)
      {
        this.cloudLoading = val;
      },
      SET_LAST_CLOUD_UPDATE()
      {
        this.lastCloudUpdate = Date.now();
      },
      SET_LAST_CLOUD_DISPATCH()
      {
        this.lastCloudDispatch = Date.now();
      },
      async test(id: string)
      {
        const handler = this.getHandler(id, storeOpts.itemType);

        await handler.load();

        console.log('test:', { handler }, handler.getData());
      },
      ...storeOpts.actions
    },
  });
}
