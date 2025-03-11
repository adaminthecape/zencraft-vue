import { dbFilters, dbPagination, genericDb, sharedTypes, utils } from 'zencraft-core';
import { getCurrentSecond } from './ApiInterface';
import { defaultData } from 'src/defaultData/allDefaultData';
// import { initBackend } from 'absurd-sql/dist/indexeddb-main-thread';

// function initAbsurdSqlWorker()
// {
//   console.log('Initializing AbsurdSQL worker');
//   const worker = new Worker(new URL('./index.worker.js', import.meta.url));
//   // This is only required because Safari doesn't support nested
//   // workers. This installs a handler that will proxy creating web
//   // workers through the main thread
//   initBackend(worker);
// }

type AnyItem = Record<string, unknown>;

export enum ItemTables
{
  logins = 'logins',
  sessions = 'sessions',
  permissionsMap = 'permissionsMap',
  itemsPublished = 'itemsPublished',
  itemsArchived = 'itemsArchived',
}

interface ItemsPublished
{
  revisionId?: number;
  itemId: string;
  typeId: string;
  /** Stored as stringified JSON */
  jsonData: string | Record<string, unknown>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

interface ItemsArchived
{
  revisionId?: number;
  itemId: string;
  typeId: string;
  /** Stored as stringified JSON */
  jsonData: string | Record<string, unknown>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

function fromDbData(dbData: ItemsPublished): AnyItem | undefined
{
  if(!utils.genericUtils.isPopulatedObject(dbData))
  {
    return undefined;
  }

  try
  {
    if(typeof dbData.jsonData === 'string')
    {
      const json = JSON.parse(dbData.jsonData);

      return utils.genericUtils.removeUndefined({
        ...dbData,
        ...json,
        jsonData: undefined
      }) as AnyItem;
    }
    else if(utils.genericUtils.isPopulatedObject(dbData.jsonData))
    {
      return utils.genericUtils.removeUndefined({
        ...dbData,
        ...dbData.jsonData,
        jsonData: undefined
      }) as AnyItem;
    }

    return dbData as AnyItem;
  }
  catch(e)
  {
    console.warn(e);

    return undefined;
  }
}

function toDbData(itemData: AnyItem): ItemsPublished | undefined
{
  if(!utils.genericUtils.isPopulatedObject(itemData))
  {
    return undefined;
  }

  try
  {
    return {
      id: getIdOrItemId(itemData) as string,
      itemId: getIdOrItemId(itemData) as string,
      typeId: itemData.typeId as string,
      jsonData: JSON.stringify(utils.genericUtils.removeUndefined({
        ...itemData,
        itemId: undefined,
        typeId: undefined,
        jsonData: undefined,
        createdBy: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      })),
      createdBy: itemData.createdBy as string,
      createdAt: itemData.createdAt as number,
      updatedAt: itemData.updatedAt as number,
    };
  }
  catch(e)
  {
    console.warn(e);

    return undefined;
  }
}

interface Logins
{
  id?: number;
  userId: string;
  username: string;
  password: string;
  createdAt: number;
  status: number;
};

interface PermissionsMap
{
  id?: number;
  userId: string;
  permissionType: string;
  scope: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  approvedBy: string;
  status: number;
};

interface Sessions
{
  id?: number;
  sessionId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  ipAddress: string;
};

type Table<T, K extends keyof T> = {
  toArray: () => Promise<T[]>;
  get: (opts: AnyItem) => Promise<T | undefined>;
  filter: (filterFn: (item: AnyItem) => boolean) => Promise<T[] | undefined>;
  put: (obj: T) => Promise<void>;
  add: (obj: T) => Promise<void>;
  delete: (obj: { itemId: string; }) => Promise<void>;
};

type EntityTable<T, K extends keyof T> = Table<T, K>;

async function transaction(
  type: 'rw',
  table: unknown,
  callback: () => Promise<void>
)
{
  await callback();
}

type DexieDb = ({
  transaction: typeof transaction;
  logins: EntityTable<Logins, 'id'>;
  sessions: EntityTable<Sessions, 'id'>;
  permissionsMap: EntityTable<PermissionsMap, 'id'>;
  itemsPublished: EntityTable<ItemsPublished, 'revisionId'>;
  itemsArchived: EntityTable<ItemsArchived, 'revisionId'>;
});

function getIdOrItemId(item: unknown): string | undefined
{
  if(!utils.genericUtils.isPopulatedObject(item))
  {
    return undefined;
  }

  return [item.id, item.itemId].find(utils.uuid.isUuid) as string | undefined;
}

class LocalStorageDB implements Table<AnyItem, 'revisionId'>
{
  public name: string;
  public tableName: string;
  public collection: AnyItem[] = [];

  constructor(opts: {
    name: string;
    tableName: string;
  })
  {
    this.name = opts.name;
    this.tableName = opts.tableName;
  }

  public async toArray(): Promise<AnyItem[]>
  {
    // not using 'collection' for now as localstorage option is transient
    return this.getAllItems();
    // if(Array.isArray(this.collection))
    // {
    //   return this.collection as AnyItem[];
    // }

    // if(utils.genericUtils.isPopulatedObject(this.collection))
    // {
    //   return Object.values(this.collection) as AnyItem[];
    // }

    // return [] as AnyItem[];
  }

  public getTable()
  {
    return `db_${this.name}_${this.tableName}`;
  }

  public async getAllItems()
  {
    const items = localStorage.getItem(this.getTable());

    if(!items)
    {
      return [];
    }

    return JSON.parse(items);
  }

  public async saveAllItems(items: AnyItem[])
  {
    localStorage.setItem(this.getTable(), JSON.stringify(items));

    await new Promise((r) => setTimeout(r, 100));
  }

  public async get(opts: AnyItem): Promise<AnyItem | undefined>
  {
    try
    {
      const allItems = JSON.parse(localStorage.getItem(this.getTable()) || '[]');

      const found = allItems.find((x) => getIdOrItemId(x) === getIdOrItemId(opts));

      // console.log('found:', found);

      return found;
    }
    catch(e)
    {
      console.warn(e);

      return undefined;
    }
  }

  public async filter(
    filterFn: (item: AnyItem) => boolean
  ): Promise<AnyItem[] | undefined>
  {
    const allItems = await this.getAllItems();

    const res = allItems.filter(filterFn);

    // console.log('filtered:', res);

    return res;
  }

  public async add(newItem: AnyItem): Promise<void>
  {
    await this.put(newItem);
  }

  public async put(itemData: AnyItem): Promise<void>
  {
    const allItems = await this.getAllItems();

    const idx = allItems.findIndex((x: AnyItem) => getIdOrItemId(x) === getIdOrItemId(itemData));

    if(idx > -1)
    {
      allItems[idx] = { ...allItems[idx], ...itemData };
    }
    else
    {
      allItems.push(itemData);
    }

    await this.saveAllItems(allItems);
  }

  public async delete(opts: { itemId: string; }): Promise<void>
  {
    const allItems = await this.getAllItems();

    const existing = allItems.findIndex((x: AnyItem) => getIdOrItemId(x) === getIdOrItemId(opts));

    if(existing > -1)
    {
      allItems.splice(existing, 1);
    }

    await this.saveAllItems(allItems);
  }
}

function getNewDb(version = 4): DexieDb
{
  // const idb = (new Dexie('ItemDatabase') as DexieDb);

  // Schema declaration:
  // idb.version(version).stores({
  //   itemsPublished: '++revisionId, itemId, typeId, jsonData, createdBy, createdAt, updatedAt',
  //   itemsArchived: '++revisionId, itemId, typeId, jsonData, createdBy, createdAt, updatedAt',
  //   logins: '++id, userId, username, password, createdAt, status',
  //   permissionsMap: '++id, userId, permissionType, scope, createdAt, updatedAt, createdBy, approvedBy, status',
  //   sessions: '++id, sessionId, userId, createdAt, updatedAt, ipAddress',
  // });

  return {
    transaction,
    logins: new LocalStorageDB({ name: 'ItemDatabase', tableName: 'logins' }),
    sessions: new LocalStorageDB({ name: 'ItemDatabase', tableName: 'sessions' }),
    permissionsMap: new LocalStorageDB({ name: 'ItemDatabase', tableName: 'permissionsMap' }),
    itemsPublished: new LocalStorageDB({ name: 'ItemDatabase', tableName: 'itemsPublished' }),
  };
}

class IndexedDbInterface extends genericDb.GenericDatabase
{
  protected dex: DexieDb;

  constructor(opts: genericDb.GenericDatabaseOpts & { dex?: DexieDb; })
  {
    super(opts);

    this.dex = opts.dex || getNewDb();
  }

  public async getLogins(): Promise<Logins[]>
  {
    return this.dex.logins.toArray();
  }

  public async getSessions(): Promise<Sessions[]>
  {
    return this.dex.sessions.toArray();
  }

  public async getPermissions(): Promise<PermissionsMap[]>
  {
    return this.dex.permissionsMap.toArray();
  }

  public async getItemsPublished(): Promise<ItemsPublished[]>
  {
    return this.dex.itemsPublished.toArray();
  }

  public mergeItemData(
    existingData: unknown,
    newData: unknown
  ): Record<string, unknown>
  {
    const existingIsObj = utils.genericUtils.isPopulatedObject(existingData);
    const newIsObj = utils.genericUtils.isPopulatedObject(existingData);

    if(!existingIsObj)
    {
      if(!newIsObj)
      {
        return {};
      }

      return newData as Record<string, unknown>;
    }

    if(!newIsObj)
    {
      if(existingIsObj)
      {
        return existingData as Record<string, unknown>;
      }
    }

    if(newIsObj && existingIsObj)
    {
      const allKeys = [
        ...Object.keys(existingData),
        ...Object.keys((newData as Record<string, unknown>))
      ];

      return allKeys.reduce((agg, key) =>
      {
        if((newData as Record<string, unknown>)[key] === null)
        {
          (agg as Record<string, unknown>)[key] = null;
        }
        else if((newData as Record<string, unknown>)[key])
        {
          (agg as Record<string, unknown>)[key] = (newData as Record<string, unknown>)[key];
        }
        else
        {
          (agg as Record<string, unknown>)[key] = existingData[key];
        }

        return agg;
      }, {});
    }

    return {};
  }

  public async update<T = Record<string, unknown>>(opts: {
    itemId: string;
    itemType: string;
    path?: string | undefined;
    data: T;
    setUpdated?: boolean;
  })
  {
    if(!(
      opts.itemId &&
      opts.itemType &&
      utils.genericUtils.isPopulatedObject(opts.data)
    ))
    {
      return;
    }

    await this.dex.transaction('rw', this.dex.itemsPublished, async () =>
    {
      this.dex.itemsPublished.get({
        itemId: opts.itemId,
        // typeId: opts.itemType,
      }).then((existing) =>
      {
        if(existing)
        {
          const mergedData = this.mergeItemData(existing, opts.data);

          this.dex.itemsPublished.put(mergedData);
        }
        else
        {
          // insert it
          this.dex.itemsPublished.add({
            itemId: opts.itemId,
            typeId: opts.itemType,
            jsonData: JSON.stringify(opts.data),
            ...opts.data,
            createdBy: 'unknown',
            createdAt: getCurrentSecond(),
            updatedAt: getCurrentSecond(),
          });
        }
      });
    });
  }

  public async updateMultiple<T = Record<string, unknown>>(opts: {
    items: Record<string, T>;
    itemType: string;
  })
  {
    const updates: T[] = [];

    Object.entries(opts.items).forEach(([itemId, entry]) =>
    {
      updates.push({
        ...entry,
        id: itemId,
      });
    });

    for(const entry of updates)
    {
      const itemId = getIdOrItemId(entry);

      if(itemId)
      {
        await this.update({
          itemId,
          itemType: opts.itemType,
          data: entry,
        });

        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  public async insert<T = Record<string, unknown>>(opts: {
    itemId: string;
    itemType: string;
    data: T;
  }): Promise<void>
  {
    if(!opts.data)
    {
      console.warn('No data to insert');

      return;
    }

    await this.dex.transaction('rw', this.dex.itemsPublished, async () =>
    {
      this.dex.itemsPublished.get({
        itemId: opts.itemId
      }).then((existing) =>
      {
        if(!existing)
        {
          const data = (opts.data as AnyItem);

          if(data)
          {
            this.dex.itemsPublished.add(data);
          }
        }
      });
    });
  }

  public async insertMultiple<T = Record<string, unknown>>(opts: {
    itemType: string;
    items: Record<string, T>;
  }): Promise<void>
  {
    const updates: T[] = [];

    Object.entries(opts.items).forEach(([itemId, entry]) =>
    {
      updates.push({
        ...entry,
        id: itemId,
      });
    });

    for(const entry of updates)
    {
      const itemId = getIdOrItemId(entry);

      if(itemId)
      {
        await this.insert({
          itemId,
          itemType: opts.itemType,
          data: entry,
        });

        await new Promise((r) => setTimeout(r, 25));
      }
    }
  }

  /** @deprecated */
  public async select1r<T = Record<string, unknown>>(opts: {
    itemId: string;
    itemType: string;
  }): Promise<T | undefined>
  {
    return this.select(opts);
  }

  public async select<T = Record<string, unknown>>(opts: {
    itemId: string;
    itemType: string;
    filters?: dbFilters.DbFilters;
  }): Promise<T | undefined>
  {
    const result = await this.dex.itemsPublished.get({
      itemId: opts.itemId,
      // typeId: opts.itemType,
    });

    return fromDbData(result) as T | undefined;
  }

  public async selectMultiple<T = Record<string, unknown>>(opts: {
    itemType: string;
    itemIds?: string[] | undefined;
    filters?: dbFilters.DbFilters;
    pagination?: dbPagination.DbPaginationOpts;
  }): Promise<dbPagination.PaginatedItemResponse<T>>
  {
    const { itemType, itemIds, filters, pagination } = opts;

    const filterHandler = new dbFilters.DbFilterHandler({ filters });

    filterHandler.updateFilter({
      key: 'typeId',
      operator: dbFilters.DbFilterOperator.isEqual,
      value: itemType,
    });

    const traverseFilters = dbFilters.DbFilterHandler.traverseFilters;

    if(Array.isArray(itemIds))
    {
      filterHandler.updateFilter({
        key: 'itemId',
        operator: dbFilters.DbFilterOperator.in,
        value: itemIds,
      });
    }

    // console.log('filters:', filterHandler.filters);

    const filtered = await this.dex.itemsPublished.filter((
      obj: AnyItem
    ) => traverseFilters(filterHandler.filters, obj));

    const ph = new dbPagination.PaginationHandler({
      initialValue: pagination,
    });

    ph.setTotal((filtered || []).length);

    if(pagination)
    {
      const { page, pageSize } = ph.pagination;

      if(typeof page === 'number' && typeof pageSize === 'number')
      {
        const results = (filtered || [])
          .slice((page - 1) * pageSize, page * pageSize) as Array<T>;

        return {
          results,
          hasMore: results.length > (page * pageSize),
          totalItems: ph.pagination.totalRows ?? 0,
          pagination: {
            page: ph.pagination.page,
            pageSize: ph.pagination.pageSize,
            totalRows: ph.pagination.totalRows,
            sortBy: ph.pagination.sortBy,
            sortOrder: ph.pagination.sortOrder,
          }
        };
      }
    }

    return {
      results: (filtered || []) as Array<T>,
      hasMore: false,
      totalItems: ph.pagination.totalRows ?? 0,
      pagination: {
        page: ph.pagination.page,
        pageSize: ph.pagination.pageSize,
        totalRows: ph.pagination.totalRows,
        sortBy: ph.pagination.sortBy,
        sortOrder: ph.pagination.sortOrder,
      }
    };
  }

  public async remove(opts: {
    itemId: string;
    itemType: string;
  }): Promise<void>
  {
    if(!(opts.itemType && utils.uuid.isUuid(opts.itemId)))
    {
      return;
    }

    await this.dex.transaction('rw', this.dex.itemsPublished, async () =>
    {
      this.dex.itemsPublished.get({
        itemId: opts.itemId,
        // typeId: opts.itemType,
      }).then((existing) =>
      {
        if(existing)
        {
          // this.dex.itemsPublished.where('itemId').equals(opts.itemId).delete();
          this.dex.itemsPublished.delete({ itemId: opts.itemId });
        }
      });
    });
  }

  public async removeMultiple(opts: {
    itemIds: Array<string>;
    itemType: string;
  }): Promise<void>
  {
    if(!(opts.itemType && Array.isArray(opts.itemIds)))
    {
      return;
    }

    for await (const itemId of opts.itemIds)
    {
      await this.remove({ itemId, itemType: opts.itemType });

      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

async function importDefaultItems(
  itemType: string
): Promise<Array<Record<string, unknown>> | undefined>
{
  return defaultData[itemType];

  // try
  // {
  //   const filePath = `../../defaultData/${itemType}.json`;
  //   const data = (await import(filePath))?.default;

  //   return data;
  // }
  // catch(e)
  // {
  //   console.warn(e);

  //   return undefined;
  // }
}

async function insertDefaultItems(
  itemType: string,
  onItemInserted?: (opts: {
    itemId: string;
    itemType: string;
    data: Record<string, unknown>;
  }) => void,
  onItemInsertFailed?: (opts: {
    itemId: string;
    itemType: string;
    data: Record<string, unknown>;
  }) => void
)
{
  const items = await importDefaultItems(itemType);

  if(!Array.isArray(items))
  {
    console.warn(`No default items found for ${itemType}`);

    return;
  }

  const idb = new IndexedDbInterface({});

  if(['login', 'session', 'permission'].includes(itemType))
  {
    return;
  }

  for await(const entry of items)
  {
    const itemId = getIdOrItemId(entry);

    if(utils.uuid.isUuid(itemId))
    {
      await idb.insert({ itemId: itemId as string, itemType, data: entry });

      if(typeof onItemInserted === 'function')
      {
        onItemInserted({ itemId: itemId as string, itemType, data: entry });
      }
    }
    else if(typeof onItemInsertFailed === 'function')
    {
      onItemInsertFailed({ itemId: itemId as string, itemType, data: entry });
    }

    await new Promise((r) => setTimeout(r, 15));
  }
}

async function insertAllDefaultItems(
  liveProgressObj: Record<string, {
    itemType: string,
    isDone: boolean;
    status: string;
    error: string | undefined;
  }> & {
    _allDone?: boolean;
  },
  onItemInserted?: (opts: {
    itemId: string;
    itemType: string;
    data: Record<string, unknown>;
  }) => void,
  onItemInsertFailed?: (opts: {
    itemId: string;
    itemType: string;
    data: Record<string, unknown>;
  }) => void
): Promise<void>
{
  const itemTypes = Object.values(sharedTypes.KnownItemType)
    .filter((type) => !['Item', 'CustomItem'].includes(type));

  for await(const itemType of itemTypes)
  {
    liveProgressObj[itemType] = {
      itemType,
      isDone: false,
      status: 'Processing',
      error: undefined,
    };

    try
    {
      await insertDefaultItems(itemType, onItemInserted, onItemInsertFailed);
    }
    catch(e)
    {
      liveProgressObj[itemType].status = 'Errored';
      liveProgressObj[itemType].error = `Error: ${(e as Error).message}`;
    }

    liveProgressObj[itemType].status = 'Done';
    liveProgressObj[itemType].isDone = true;
  }

  liveProgressObj._allDone = true;
}

export type { ItemsPublished, ItemsArchived, Logins, PermissionsMap, Sessions };
export { IndexedDbInterface, insertAllDefaultItems };
