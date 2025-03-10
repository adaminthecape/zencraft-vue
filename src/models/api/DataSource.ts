export enum AppDataSource
{
  api = 'api',
  indexedDb = 'indexedDb',
  firebase = 'firebase',
};

export const dataSourceLocalStorageKey = 'data_source';

export type DataSourceCheckResult = {
  source: AppDataSource | undefined;
  isApi: boolean;
  isIndexedDb: boolean;
  isFirebase: boolean;
};

export function checkDataSource(): DataSourceCheckResult
{
  const result: DataSourceCheckResult = {
    source: undefined,
    isApi: false,
    isIndexedDb: false,
    isFirebase: false,
  };

  const storedSource = localStorage.getItem(dataSourceLocalStorageKey);

  if(!(
    storedSource &&
    Object.keys(AppDataSource).includes(storedSource)
  ))
  {
    // default to indexedDb
    localStorage.setItem(dataSourceLocalStorageKey, AppDataSource.indexedDb);
    result.source = AppDataSource.indexedDb;
    result.isIndexedDb = true;

    return result;
  }

  result.source = storedSource as AppDataSource;

  if(storedSource === AppDataSource.api)
  {
    result.isApi = true;
  }
  else if(storedSource === AppDataSource.indexedDb)
  {
    result.isIndexedDb = true;
  }
  else if(storedSource === AppDataSource.firebase)
  {
    result.isFirebase = true;
  }

  return result;
}

type DataSourceCallback = () => void | Promise<void>;
type AllDataSourceCallbacks = Partial<Record<AppDataSource, DataSourceCallback>>;
type WithDataSourceResult = {
  dataSource?: AppDataSource;
  results?: Partial<{ [key in AppDataSource]: unknown; }>;
};

export async function withDataSource(
  callbacks: AllDataSourceCallbacks
): Promise<WithDataSourceResult>
{
  const dataSource = checkDataSource();

  if(!dataSource.source)
  {
    return {};
  }

  const res: WithDataSourceResult = {
    dataSource: dataSource.source,
    results: {},
  };

  if(!res.results) res.results = {};

  if(dataSource.isApi && callbacks[AppDataSource.api])
  {
    res.results[AppDataSource.api] = await callbacks[AppDataSource.api]();
  }
  else if(dataSource.isIndexedDb && callbacks[AppDataSource.indexedDb])
  {
    res.results[AppDataSource.indexedDb] = await callbacks[AppDataSource.indexedDb]();
  }
  else if(dataSource.isFirebase && callbacks[AppDataSource.firebase])
  {
    res.results[AppDataSource.firebase] = await callbacks[AppDataSource.firebase]();
  }

  return res;
}
