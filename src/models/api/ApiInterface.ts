import { Nullable } from 'src/types/generic';
import { dbFilters, dbPagination, genericDb, utils } from 'zencraft-core';
import axios, { AxiosError } from 'axios';

// TODO: move to .env
export const apiUrl = 'http://localhost:4000';

export type ApiResponse<T = unknown> = {
  get: {
    data: T | undefined;
    error?: string;
    success?: boolean;
    status?: number;
  };
  post: {
    data: T | undefined;
    error?: string;
    success?: boolean;
    status?: number;
  };
};

export const getUrl = (endpoint: string) =>
	`${apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

type CustomOptions = {
	jwt?: string;
	jwtFn?: () => string;
	debug?: boolean;
};

async function apiRequest(
	method: 'get' | 'post',
	url: string,
	params?: Record<string, unknown>,
	opts?: CustomOptions
): Promise<ApiResponse['get'] | ApiResponse['post']>
{
	const urlToUse = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;

	const debug = (...msgs: unknown[]) =>
	{
		if(opts?.debug)
		{
			console.log('(api.ts)', ...msgs);
		}
	};

	try
  {
    let token;

    if(typeof opts?.jwtFn === 'function')
    {
      token = opts.jwtFn();
    }
    else
    {
      token = opts?.jwt;
    }

		if(!token && !urlToUse.startsWith(`${apiUrl}/login/`))
		{
			console.warn(`Token not available! (${method} - ${url})`);
			return { data: undefined, status: 403 };
		}

		const config = {
			headers: { Authorization: `Bearer ${token}` },
		};

		debug('fetching...', urlToUse, config);

		let data;

		try
		{
			if(method === 'get')
			{
				data = await axios.get(urlToUse, config);
				// data = await fetch(urlToUse, config);
      }
      else if(method === 'post')
			{
				data = await axios.post(urlToUse, params, {
					...config,
					params,
				});
			}
    }
    catch(e: unknown)
		{
      console.warn(e);

			return {
				data: undefined,
				error: (e instanceof Error) ? e.message : undefined,
				status: (e as AxiosError).response?.status || 500,
			};
		}

		debug('done fetching', urlToUse, data?.status, data);

		if(data?.status === 403)
		{
			console.error('Not authorized!');
		}

		return { data: data?.data, status: data?.status };
  }
  catch(e: unknown)
	{
		// TODO: add error handling
		console.warn('Axios ERROR:', e);

    if(e instanceof AxiosError)
    {
      if(e.response?.status === 403)
      {
        console.error('Not authorized! ' + e.message);

        return { data: undefined, error: e.message, status: 403 };
      }
    }

    return {
      data: undefined,
      error: (e instanceof Error) ? e.message : undefined,
      status: 500
    };
	}
}

export async function get(
  url: string,
  opts?: CustomOptions,
  params?: Record<string, unknown>
): Promise<ApiResponse['get']>
{
	return apiRequest('get', url, params, opts);
}

export async function post(
	url: string,
	params?: Record<string, unknown>,
  opts?: CustomOptions
): Promise<ApiResponse['post']>
{
	return apiRequest('post', url, params, opts);
}

export function getCurrentSecond(): number
{
	return parseInt(`${Date.now()}`.slice(0, 10), 10);
}

export type ApiHandlerOpts = {
  isDebugMode?: boolean;
  jwt?: string;
  jwtFn?: () => Nullable<string>;
  onResultFn?: (opts: {
    method: 'get' | 'post';
    url: string;
    status?: number;
    error?: string;
    data?: unknown;
  }) => void;
};

export class ApiHandler
{
  protected isDebugMode: boolean | undefined;
  protected jwt: string | undefined;
  protected jwtFn: ApiHandlerOpts['jwtFn'] | undefined;
  protected onResultFn: ApiHandlerOpts['onResultFn'] | undefined;

  constructor(opts: ApiHandlerOpts)
  {
    this.isDebugMode = opts.isDebugMode;
    this.jwt = opts.jwt;

    if(typeof opts.jwtFn === 'function')
    {
      this.jwtFn = opts.jwtFn;
    }

    if(typeof opts.onResultFn === 'function')
    {
      this.onResultFn = opts.onResultFn;
    }
  }

  public setToken(data: {
    token?: string;
  })
  {
    if(data.token)
    {
      this.jwt = data.token;
    }
  }

  protected mergeBaseOpts(opts: Record<string, unknown> | undefined)
  {
    if(!opts)
    {
      opts = {};
    }

    if(this.jwtFn)
    {
      opts.jwt = this.jwtFn();
    }

    if(!opts.jwt)
    {
      opts.jwt = this.jwt;
    }

    return opts;
  }

  public handleResult(options: {
    method: 'get' | 'post';
    url: string;
    opts?: CustomOptions;
    params?: Record<string, unknown>;
    result: unknown;
  })
  {
    const { method, url, opts, params, result } = options;

    if(utils.genericUtils.isPopulatedObject(result))
    {
      if(result.status != 200)
      {
        console.log('NON-200 STATUS:', { url, opts, params, result });
      }

      let data = result.data;
      let status = result.status;
      let error = result.error;

      if(
        utils.genericUtils.isPopulatedObject(result.data) &&
        utils.genericUtils.isPopulatedObject(result.data.data)
      )
      {
        data = result.data.data;

        if(data.status)
        {
          status = data.status;
        }

        if(data.error)
        {
          error = data.error;
        }
      }

      if(typeof this.onResultFn === 'function')
      {
        this.onResultFn({ method, url, data, status, error });
      }
    }
  }

  public async GET(
    url: string,
    opts?: CustomOptions,
    params?: Record<string, unknown>
  ): Promise<ApiResponse['get']>
  {
    opts = this.mergeBaseOpts(opts);

    try
    {
      const result = await get(url, opts, params);

      if(!(
        utils.genericUtils.isPopulatedObject(result) &&
        'status' in result
      ))
      {
        console.warn('No status in "get" result', url, result);
        return {
          success: false,
          data: result,
          error: 'Invalid response',
        };
      }

      this.handleResult({ method: 'get', url, opts, params, result });

      if(
        'data' in result &&
        utils.genericUtils.isPopulatedObject(result.data) &&
        'success' in result.data &&
        'data' in result.data
      )
      {
        return {
          success: true,
          data: result.data.data,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    }
    catch(e)
    {
      console.error('GET: ERROR:', e);

      return {
        success: false,
        error: (e instanceof Error) ? e.message : undefined,
        data: undefined,
      };
    }
  }

  public async POST(
    url: string,
    params?: Record<string, unknown>,
    opts?: CustomOptions
  ): Promise<ApiResponse['post']>
  {
    opts = this.mergeBaseOpts(opts);

    try
    {
      const result = await post(url, params, opts);

      if(!(
        utils.genericUtils.isPopulatedObject(result) &&
        'status' in result
      ))
      {
        console.warn('No status in "post" result', url, result);
        return {
          success: false,
          data: result,
          error: 'Invalid response',
        };
      }

      this.handleResult({ method: 'post', url, opts, params, result });

      if(
        'data' in result &&
        utils.genericUtils.isPopulatedObject(result.data) &&
        'success' in result.data &&
        'data' in result.data
      )
      {
        return {
          success: true,
          data: result.data.data,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    }
    catch(e)
    {
      console.error('POST: ERROR:', e);

      return {
        success: false,
        error: (e instanceof Error) ? e.message : undefined,
        data: undefined,
      };
    }
  }
}

export type ApiHandlerDbInterfaceOpts = genericDb.GenericDatabaseOpts & {
  apiHandler: ApiHandler;
};

export class ApiHandlerDbInterface extends genericDb.GenericDatabase
{
  protected apiHandler: ApiHandler;

  constructor(opts: ApiHandlerDbInterfaceOpts)
  {
    super(opts);

    this.apiHandler = opts.apiHandler;
  }

  public async update<T>(opts: {
    itemType: string;
    itemId: string;
    typeId?: string;
    path?: string | undefined;
    data: T;
    setUpdated?: boolean;
  }): Promise<void>
  {
    const {
      itemType,
      itemId,
      typeId,
      path,
      data,
      setUpdated
    } = opts;

    await this.apiHandler.POST(
      'items/updateItem',
      {
        itemType,
        itemId,
        typeId,
        path,
        data,
        setUpdated
      }
    );
  }

  public async updateMultiple<T>(opts: {
    itemType: string;
    items: Record<string, T>;
    typeId?: string;
  }): Promise<void>
  {
    const {
      itemType,
      typeId,
      items,
    } = opts;

    if(!Array.isArray(items))
    {
      throw new Error('Invalid items');
    }

    for (const itemId of Object.keys(items))
    {
      await this.update({
        itemType,
        typeId,
        itemId,
        data: items[itemId]
      });
    }
  }

  public async insert<T>(opts: {
    itemType: string;
    itemId: string;
    typeId?: string;
    path?: string | undefined;
    data: T;
    setUpdated?: boolean;
  }): Promise<void>
  {
    const {
      itemType,
      itemId,
      typeId,
      path,
      data,
      setUpdated
    } = opts;

    await this.apiHandler.POST(
      'items/addItem',
      {
        itemType,
        itemId,
        typeId,
        path,
        data,
        setUpdated
      }
    );
  }

  public async insertMultiple<T>(opts: {
    itemType: string;
    items: Record<string, T>;
    typeId?: string;
  }): Promise<void>
  {
    const {
      itemType,
      typeId,
      items,
    } = opts;

    if(!Array.isArray(items))
    {
      throw new Error('Invalid items');
    }

    for(const itemId of Object.keys(items))
    {
      await this.insert({
        itemType,
        typeId,
        itemId,
        data: items[itemId]
      });
    }
  }

  public async select<T>(opts: {
    itemType: string;
    itemId?: string | undefined;
    filters?: dbFilters.DbFilters;
  }): Promise<T | undefined>
  {
    const { itemType, itemId, filters } = opts;

    if(itemId && !utils.uuid.isUuid(itemId))
    {
      return undefined;
    }

    const { data } = await this.apiHandler.GET(
      `items/${itemType}/${itemId}`,
      undefined,
      {
        itemType,
        filters
      }
    );

    if(data)
    {
      return data as T;
    }

    return undefined;
  }

  public async selectMultiple<T>(opts: {
    itemType: string;
    itemIds?: string[] | undefined;
    filters?: dbFilters.DbFilters;
    pagination?: dbPagination.DbPaginationOpts;
  }): Promise<dbPagination.PaginatedItemResponse<T>>
  {
    const { itemType, itemIds, filters, pagination } = opts;

    const res = await this.apiHandler.POST(
      'items/searchItems',
      {
        itemType,
        itemIds,
        filters: { ...filters },
        pagination: { ...pagination }
      }
    );


    const { data } = res;

    if(
      utils.genericUtils.isPopulatedObject(data) &&
      Array.isArray(data.results)
    )
    {
      return data as dbPagination.PaginatedItemResponse<T>;
    }

    console.log('selectMultiple(): invalid data:', res);

    return {
      results: [],
      hasMore: false,
      totalItems: 0,
      pagination: {}
    } as dbPagination.PaginatedItemResponse<T>;
  }

  public async remove(opts: {
    itemType: string;
    itemId: string;
  }): Promise<void>
  {
    const { itemId, itemType } = opts;

    if(!utils.uuid.isUuid(itemId))
    {
      throw new Error('Invalid itemId');
    }

    await this.apiHandler.POST(
      `items/removeItem/${itemType}/${itemId}`
    );
  }
}
