import { deriveStoreForItemType, StoreTypes } from 'src/logic/utils/stores';
import { CustomItemStore, useCustomItemStore } from 'src/pinia/customItemStore';
import { genericDb, dbFilters, dbPagination, utils } from 'zencraft-core';
import * as Handlebars from 'handlebars';
import useQueueStore from 'src/pinia/queueStore';

let queueStore: { addToQueue: (key: string, newItem: unknown) => boolean; };

function addToQueue(key: string, newItem: unknown): boolean
{
	if(!queueStore)
	{
		queueStore = useQueueStore();
	}

	return queueStore.addToQueue(key, newItem);
}

function editItem(opts: { itemType: string, itemId: string; }): void
{
	addToQueue('edit_items', {
		id: opts.itemId,
		typeId: opts.itemType,
		initialData: {
			...opts,
			itemId: undefined,
			itemType: undefined,
		}
	});
}

const hb = Handlebars.create();

type HelperContext = {
	name: string;
	data?: {
		root?: Record<string, unknown>;
	};
	hash?: Record<string, unknown>;
	loc: {
		start: { line: number; column: number; };
		end: { line: number; column: number; };
	};
	lookupProperty?: unknown;
};

/** Record of ItemType to item IDs that should be loaded */
const itemsToLoad: Record<string, Record<string, boolean>> = {};

function requestItemLoad(
	itemId: string,
	itemType: string,
)
{
	if(!itemsToLoad[itemType])
	{
		itemsToLoad[itemType] = {};
	}

	const isLoaded = itemsToLoad[itemType][itemId];

	if(isLoaded === true)
	{
		// we already loaded it
		return;
	}
	else if(isLoaded === false)
	{
		// we have already requested to load it
		return;
	}
	else
	{
		// we need to request it
		itemsToLoad[itemType][itemId] = false;
	}
}

let customItemStore: CustomItemStore;

function getCustomItemStore()
{
	customItemStore = useCustomItemStore({})();
}

async function loadRequestedItems()
{
	if(!customItemStore)
	{
		getCustomItemStore();
	}

	for(const itemType of Object.keys(itemsToLoad))
	{
		const idsNotYetLoaded = Object.keys(
			itemsToLoad[itemType]
		).reduce((agg: string[], itemId) =>
		{
			if(!itemsToLoad[itemType][itemId])
			{
				agg.push(itemId);
				itemsToLoad[itemType][itemId] = true;
			}

			return agg;
		}, []);

		if(idsNotYetLoaded.length)
		{
			await customItemStore.loadMultiple({
				itemType,
				ids: idsNotYetLoaded
			});
		}
	}
}

setTimeout(() =>
{
	setInterval(loadRequestedItems, 250);
}, 5000);

hb.registerHelper('date', (timestamp) =>
{
	const num = parseInt(`${timestamp}`, 10);

	if(`${num}` == `${timestamp}`)
	{
		return new Date(num * 1000).toISOString().split('T')[0].replace(/-/g, '/');
	}

	return timestamp;
});

hb.registerHelper('store', (
	itemType: string,
	itemId: string,
	prop?: string,
	// ctx: HelperContext
) =>
{
	if(!(itemType && itemId))
	{
		return undefined;
	}

	if(itemType && (typeof itemType === 'string'))
	{
		if(!customItemStore)
		{
			getCustomItemStore();
		}

		if(customItemStore)
		{
			requestItemLoad(itemId, itemType);

			if(prop)
			{
				return (customItemStore.getItem(itemId, itemType) as Record<string, unknown>)?.[prop];
			}

			return customItemStore.getItem(itemId, itemType);
		}
	}

	return undefined;
});

class StoreSearchAdapter extends genericDb.GenericDatabase
{
	public store: StoreTypes;

	constructor(opts: genericDb.GenericDatabaseOpts & {
		store: StoreTypes;
	})
	{
		super(opts);
		this.store = opts.store;
	}

	public getAllItems(itemType: string)
	{
		if(!this.store)
		{
			return [];
		}
		else if('getItemsByType' in this.store)
		{
			const items = this.store.getItemsByType(itemType);

			if(items && !Array.isArray(items))
			{
				return Object.values(items);
			}

			return items;
		}
		else if(
			utils.tools.isPopulatedObject(this.store.allItems) &&
			!Array.isArray(this.store.allItems) &&
			Array.isArray(Object.values(this.store.allItems))
		)
		{
			return Object.values(this.store.allItems);
		}
		else if(Array.isArray(this.store.allItems))
		{
			return this.store.allItems;
		}

		return [];
	}

	public selectMultiple<T = Record<string, unknown>>(opts: {
		itemType: string;
		itemIds?: string[] | undefined;
		filters?: dbFilters.DbFilters;
		pagination?: dbPagination.DbPaginationOpts;
	}): dbPagination.PaginatedItemResponse<T>
	{
		const response: dbPagination.PaginatedItemResponse<T> = {
			results: [],
			pagination: {},
			totalItems: 0,
			hasMore: false,
		};

		if(Array.isArray(opts.itemIds) && opts.itemIds.length)
		{
			const idsAvailable = (this.store?.allItemIds || []).filter(
				(id) => opts.itemIds?.includes(id)
			);

			response.results = idsAvailable.map(
				(id) => this.store?.getItem(id, opts.itemType)
			) as T[];

			response.totalItems = response.results?.length || 0;

			return response;
		}

		response.results = (
			this.getAllItems(opts.itemType)
		)?.filter((item: Record<string, unknown>) =>
		{
			if(opts.filters)
			{
				return opts.filters.every((filter) =>
				{
					if(!dbFilters.isSingleFilter(filter))
					{
						return true;
					}

					const { key, operator, value } = filter;

					if(operator === dbFilters.DbFilterOperator.isEqual)
					{
						return (item[key] == value);
					}
					else if(operator === dbFilters.DbFilterOperator.isNotEqual)
					{
						return (item[key] != value);
					}
					else if([
						dbFilters.DbFilterOperator.in,
						dbFilters.DbFilterOperator.arrayContains,
						dbFilters.DbFilterOperator.arrayContainsAny,
					].includes(operator))
					{
						return (
							((typeof item[key] === 'string') || Array.isArray(item[key])) &&
							item[key].includes(`${value}`)
						);
					}
					else if(operator === dbFilters.DbFilterOperator.notIn)
					{
						return !(
							((typeof item[key] === 'string') || Array.isArray(item[key])) &&
							item[key].includes(`${value}`)
						);
					}
					else if(operator === dbFilters.DbFilterOperator.fuzzyEqual)
					{
						return (
							(typeof item[key] === 'string') &&
							item[key].toLowerCase().includes(`${value}`.toLowerCase())
						);
					}

					return false;
				});
			}

			return false;
		}) as T[];

		response.totalItems = response.results?.length || 0;

		return response;
	}
}

function argsToFilters(args: unknown[]): dbFilters.DbFilters
{
	const filters = [];

	for(let i = 0; i < args.length; i += 3)
	{
		if(typeof args[i] === 'string')
		{
			filters.push({
				key: args[i],
				operator: args[i + 1],
				value: args[i + 2],
			} as dbFilters.DbFilter);
		}
	}

	return filters;
}

function stepArgs(args: unknown[], stepLength = 2): Record<string, unknown>
{
	const results: Record<string, unknown> = {};

	for(let i = 0; i < args.length; i += stepLength)
	{
		if(typeof args[i] !== 'string')
		{
			break;
		}

		results[args[i] as string] = args[i + 1];
	}

	return results;
}

hb.registerHelper('storeSearch', (
	itemType: string,
	...args: unknown[]
) =>
{
	const filters = argsToFilters(args);

	if(!(itemType))
	{
		return undefined;
	}

	const store = deriveStoreForItemType(itemType);

	if(store)
	{
		const searchAdapter = new StoreSearchAdapter({ store });

		return (searchAdapter.selectMultiple({
			itemType,
			filters
		}))?.results;
	}
});

hb.registerHelper('equal', (a, b) => a == b);
hb.registerHelper('or', (...args) => args.some((arg) => arg));

hb.registerHelper('storeSearchOne', (
	itemType: string,
	...args: unknown[]
) =>
{
	const filters = argsToFilters(args);

	if(!(itemType))
	{
		return undefined;
	}

	const store = deriveStoreForItemType(itemType);

	if(store)
	{
		const searchAdapter = new StoreSearchAdapter({ store });

		return (searchAdapter.selectMultiple({
			itemType,
			filters
		}))?.results?.[0];
	}
});

hb.registerHelper('component', () =>
{
	// handled elsewhere
});

hb.registerHelper('sum', (
	...args: unknown[]
) =>
{
	let result = 0;

	for(const arg of args)
	{
		if(typeof arg === 'number')
		{
			result += arg;
		}
	}

	return result;
});

hb.registerHelper('prop', (
	item: unknown,
	prop: string,
) =>
{
	if((typeof prop === 'string') && !utils.tools.isPopulatedObject(item))
	{
		return undefined;
	}

	return (item as Record<string, unknown>)[prop];
});

hb.registerHelper('arr', function (...args)
{
	return Array.prototype.slice.call(args, 0, -1);
});

hb.registerHelper('equalsAny', function (comp, ...args)
{
	return (args.slice(0, -1)).some((arg) => arg === comp);
});

hb.registerHelper('notEqualsAny', function (comp, ...args)
{
	return !(args.slice(0, -1)).some((arg) => arg === comp);
});

hb.registerHelper('truthy', (comp) => !!comp);
hb.registerHelper('falsy', (comp) => !comp);

hb.registerHelper('first', function (...args)
{
	return (args.slice(0, -1)).find((arg) =>
	{
		console.log('first:', arg);
		return arg && (arg !== 'false');
	});
});

hb.registerHelper('json', function (data: unknown, indent = 4)
{
	if(!(
		utils.tools.isPopulatedObject(data) ||
		Array.isArray(data)
	))
	{
		return '';
	}

	return JSON.stringify(data, undefined, indent);
});

function generateDateArray(
	startDate: string | number,
	endDate: string | number,
	step = 1
): Array<{
	date: string;
	unix: number;
}>
{
	let stepToUse = 1;

	if(typeof step === 'number')
	{
		stepToUse = step;
	}

	if(utils.genericUtils.toNumber(startDate) == startDate)
	{
		startDate = parseInt(`${startDate}`, 10) * 1000;
	}

	if(utils.genericUtils.toNumber(endDate) == endDate)
	{
		endDate = parseInt(`${endDate}`, 10) * 1000;
	}

	const startTime = new Date(startDate).getTime();
	const endTime = new Date(endDate).getTime();
	const dates: Array<{ date: string; unix: number; }> = [];
	let d = startTime;

	do
	{
		const inc = (stepToUse * 24 * 60 * 60 * 1000);
		dates.push({
			date: (new Date(d)).toISOString().split('T')[0],
			unix: d / 1000,
		});
		d += inc;
	}
	while(d <= endTime);

	return dates;
}

hb.registerHelper('dateArray', function (
	startDate: string | number,
	endDate: string | number,
	step: number = 1,
)
{
	return generateDateArray(startDate, endDate, step);
});

hb.registerHelper('shortenId', (id: string) => (id?.split('-')[0] ?? ''));

const btnClasses = 'q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable';
const btnSpanClasses = 'q-btn__content text-center col items-center q-anchor--skip justify-center row';
const btnIconClasses = 'q-icon notranslate material-icons';
const btnActions: Record<string, (...args: unknown[]) => void> = {
	editItem: editItem as (...args: unknown[]) => void
};

function getBtnClasses(opts: {
	dark?: boolean;
	dense?: boolean;
	round?: boolean;
	color?: string;
	size?: string;
}): string
{
	let classes = '';

	if(opts.dense || (typeof opts.dense === 'undefined')) classes += ' q-btn--dense';
	if(opts.round) classes += ' q-btn--round';
	if(opts.color) classes += ` bg-${opts.color}`;
	if(opts.dark) classes += ` text-white`;
	if(opts.size) classes += ` q--size`;

	return `${btnClasses} ${classes}`;
}

hb.registerHelper('button', function (
	...args: unknown[]
)
{
	const opts = stepArgs(args);

	const id = `btn-${Math.random().toString(36).substr(2, 9)}`;

	setTimeout(() =>
	{
		const button = document.getElementById(id);
		if(button)
		{
			button.addEventListener('click', () =>
			{
				if(!Array.isArray(opts.action)) return;

				const [action, ...actionArgs] = opts.action;

				if(!(action && typeof action === 'string')) return;

				const handler = btnActions[action];

				if(typeof handler !== 'function') return;

				const parsedActionArgs = stepArgs(actionArgs);

				console.log({ action, actionArgs, parsedActionArgs });

				handler(parsedActionArgs);
			});
		}
	}, 0);

	const tpl = `<button
	id="${(id)}"
	class="${(getBtnClasses(opts))}"
	type="button"
	style="font-size: ${{
		sm: '12px',
		md: '14px',
		lg: '16px',
		xl: '18px',
	}[opts.size ? `${opts.size}` : 'sm']};"
  >
    <span class="q-focus-helper"></span>
    <span class="${(btnSpanClasses)}">
      ${opts.icon ? `<i class="${(btnIconClasses)
			} ${opts.label ? 'on-left' : ''
			}" aria-hidden="true" role="img">${(opts.icon)}</i>` : ''}
      ${opts.label ? `<span class="block">${(opts.label)}</span>` : ''}
    </span>
  </button>`;

	return new Handlebars.SafeString(tpl);
});

hb.registerHelper('icon', function (
	...args: unknown[]
)
{
	const opts = stepArgs(args);

	const tpl = `<i
	class="q-icon text-positive notranslate material-icons"
	aria-hidden="true"
	role="presentation"
	${Object.keys(opts).map((o) =>
	{
		if(o === 'color')
		{
			return;
		}

		return o ? `${o}="${opts[o]}"` : '';
	}).join('\n')}
	style="font-size: ${{
		xs: '16px',
		sm: '24px',
		md: '32px',
		lg: '40px',
		xl: '48px',
	}[opts.size ? `${opts.size}` : 'sm']};"
	>${opts.name}</i>`;

	console.log('icon tpl:', tpl, opts);

	return new Handlebars.SafeString(tpl);
});

export default hb;
