import
{
	GenericRootState,
	GenericStoreActions,
	GenericStoreGetters,
	useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, Page as p } from 'zencraft-core';

export type PageRootState = GenericRootState<p.PageItem> & {
	defaultSelectedPage: string | undefined;
	selectedPage: string | undefined;
};

export type PageStoreGetters = GenericStoreGetters<p.PageItem, p.PageHandler> & {
	getDefaultSelectedPage?: (state: PageRootState) => string | undefined;
	getSelectedPage?: (state: PageRootState) => string | undefined;
};

export type PageStoreActions = GenericStoreActions<p.PageItem, p.PageHandler> & {
	getHandler: (id: p.PageItem['id'], syncHandlerDataWithStore?: boolean) => p.PageHandler,
	setSelectedPage: (pageId: p.PageItem['id']) => void,
};

export type PageStore = Store<
	string,
	PageRootState,
	PageStoreGetters,
	PageStoreActions
>;

export function usePageStore(storeOpts: Record<string, unknown>): () => PageStore
{
	// @ts-expect-error No need for perfect equality with Pinia store types
	return useGenericItemStore<
		p.PageItem,
		p.PageHandler,
		PageRootState,
		PageStoreGetters,
		PageStoreActions
	>({
		itemType: sharedTypes.KnownItemType.Page,
		storeName: String(PiniaStoreName.pageStore),
		rootState: {
			defaultSelectedPage: undefined,
			selectedPage: undefined
		},
		getters: {
			getDefaultSelectedPage: (state: PageRootState) => state.defaultSelectedPage,
			getSelectedPage: (state: PageRootState) => state.selectedPage,
		},
		actions: {
			getIsValidItemType(itemData: any)
			{
				return itemData?.typeId === sharedTypes.KnownItemType.Page;
			},
			getHandler(
				id: p.PageItem['id'],
				itemType: string,
				syncHandlerDataWithStore?: boolean
			): p.PageHandler
			{
				if(this.itemHandlers[id] instanceof p.PageHandler)
				{
					/** NOTE: See base method */
					if(syncHandlerDataWithStore)
					{
						this.itemHandlers[id].setOnDirtyField(debounce((
							itemId: any,
							itemType: string,
							name: string,
							value: any
						) =>
						{
							this.updateOnHandlerChange(itemId, itemType, name, value);
						}, 250));
					}

					return this.itemHandlers[id];
				}

				const handler = this.getCustomHandler(
					id,
					itemType,
					(opts: p.PageItemOpts) => (new p.PageHandler(opts)),
					syncHandlerDataWithStore ?? true
				);

				this.itemHandlers[id] = handler;

				return this.itemHandlers[id];
			},
			setSelectedPage(pageId: p.PageItem['id'])
			{
				this.selectedPage = pageId;
			}
		}
	});
}
