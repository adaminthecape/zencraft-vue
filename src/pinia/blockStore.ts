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
import { sharedTypes, Block as b } from 'zencraft-core';

export type BlockRootState = GenericRootState<b.BlockItem> & {
	[key: string]: any;
};

export type BlockStoreGetters = GenericStoreGetters<b.BlockItem, b.BlockHandler> & {
	test?: (id: string) => Promise<any>;
};

export type BlockStoreActions = GenericStoreActions<b.BlockItem, b.BlockHandler> & {
	getHandler: (id: b.BlockItem['id'], syncHandlerDataWithStore?: boolean) => b.BlockHandler;
};

export type BlockStore = Store<
	string,
	BlockRootState,
	BlockStoreGetters,
	BlockStoreActions
>;

export function useBlockStore(storeOpts: Record<string, unknown>): () => BlockStore
{
	// @ts-expect-error No need for perfect equality with Pinia store types
	return useGenericItemStore<
		b.BlockItem,
		b.BlockHandler,
		BlockRootState,
		BlockStoreGetters,
		BlockStoreActions
	>({
		itemType: sharedTypes.KnownItemType.Block,
		storeName: String(PiniaStoreName.blockStore),
		rootState: {},
		getters: {},
		actions: {
			getIsValidItemType(itemData: any)
			{
				return itemData?.typeId === sharedTypes.KnownItemType.Block;
			},
			getHandler(
				id: b.BlockItem['id'],
				itemType: string,
				syncHandlerDataWithStore?: boolean
			): b.BlockHandler
			{
				if(this.itemHandlers[id] instanceof b.BlockHandler)
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
					(opts: b.BlockItemOpts) => (new b.BlockHandler(opts)),
					syncHandlerDataWithStore ?? true
				);

				this.itemHandlers[id] = handler;

				return this.itemHandlers[id];
			}
		}
	});
}
