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
import { CustomItem as c, fields, Archetype, sharedTypes } from 'zencraft-core';
import { FieldStore } from './fieldStore';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { ArchetypeStore } from './archetypeStore';

export type CustomItemRootState = GenericRootState<c.CustomItem> & {
	itemTypeToArchetypeMap: Record<string, Archetype.ArchetypeItem>;
	/** Map of item IDs to their type ID for easy lookup by ID alone */
	itemIdToItemTypeMap: Record<string, string>;
	itemsByType: Record<string, c.CustomItem[]>;
	definitionFieldsMap: Record<string, fields.FieldData[]>;
};

export type CustomItemStoreGetters = GenericStoreGetters<c.CustomItem, c.CustomHandler> & {
	getFieldsForDefinition: (state: CustomItemRootState) => (defId: string) => Array<fields.FieldData>;
	getFieldIdsForItemType: (state: CustomItemRootState) => (itemType: string) => Array<fields.FieldData['id']>;
	getFieldsForItemType: (state: CustomItemRootState) => (itemType: string) => Array<fields.FieldData>;
	getDefinitionNames: (state: CustomItemRootState) => Array<string>;
	getItemsByType: (state: CustomItemRootState) => (itemType: string) => Array<Record<string, unknown>>;
};

export type CustomItemStoreActions = GenericStoreActions<c.CustomItem, c.CustomHandler> & {
	getHandler: (id: c.CustomItem['id'], syncHandlerDataWithStore?: boolean) => c.CustomHandler;
	loadDefinitions: () => Promise<void>;
};

export type CustomItemStore = Store<
	string,
	CustomItemRootState,
	CustomItemStoreGetters,
	CustomItemStoreActions
>;

export function useCustomItemStore(storeOpts: Record<string, unknown>): () => CustomItemStore
{
	// @ts-expect-error No need for perfect equality with Pinia store types
	return useGenericItemStore<
		c.CustomItem,
		c.CustomHandler,
		CustomItemRootState,
		CustomItemStoreGetters,
		CustomItemStoreActions
	>({
		itemType: sharedTypes.KnownItemType.CustomItem,
		storeName: String(PiniaStoreName.customItemStore),
		rootState: {
			itemTypeToArchetypeMap: {},
			definitionFieldsMap: {},
			itemIdToItemTypeMap: {},
			itemsByType: {},
		},
		getters: {
			allItems: (state: CustomItemRootState): c.CustomItem[] => (
				Object.values(state.itemsByType).flat()
			),
			allItemIds: (state: CustomItemRootState): string[] => (
				Object.keys(state.itemIdToItemTypeMap)
			),
			getItem: (state: CustomItemRootState) => (
				id: c.CustomItem['id']
			): c.CustomItem | undefined =>
			{
				const typeId = state.itemIdToItemTypeMap[id];

				if(!typeId) return undefined;

				return (state.itemsByType[typeId] as any)?.[id] as c.CustomItem | undefined;
			},
			getFieldIdsForItemType: (state: CustomItemRootState) => (itemType: string) =>
			{
				const definition = state.itemTypeToArchetypeMap[itemType];

				if(!definition)
				{
					return [];
				}

				return definition.attachedFields || [];
			},
			getFieldsForItemType: (state: CustomItemRootState) => (
				itemType: string
			) => (
				state.definitionFieldsMap[itemType]
			),
			getItemsByType: (state: CustomItemRootState) => (itemType: string) =>
			{
				return state.itemsByType[itemType];
			},
			getDefinitionNames: (state: CustomItemRootState) => (
				Object.keys(state.itemTypeToArchetypeMap)
			),
		},
		actions: {
			getIsValidItemType(itemData: Record<string, unknown>): boolean
			{
				return !!itemData?.typeId;
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
				id: c.CustomItem['id'],
				itemType: string,
				customHandlerFn?: (opts: Record<string, unknown>) => c.CustomHandler,
				syncHandlerDataWithStore?: boolean
			): c.CustomHandler | undefined
			{
				if(!id)
				{
					throw new Error(`Cannot get handler with no id (${id})`);
				}

				const table = this.getDb();

				// get the definition for this custom item type
				const definition = this.itemTypeToArchetypeMap[itemType];

				if(!definition)
				{
					console.warn(`Definition not found for ${itemType}`);

					return undefined;
				}

				const opts: c.CustomItemOpts = {
					id,
					db: table,
					fieldDataArray: this.definitionFieldsMap[itemType],
					definition,
					// attach the handler to the store to sync updates
				};

				const handler = customHandlerFn?.(opts) || new c.CustomHandler(opts);

				if(syncHandlerDataWithStore)
				{
					handler.setOnDirtyField(debounce((
						itemId: c.CustomItem['id'],
						itemType: string,
						name: string,
						value: unknown
					) =>
					{
						this.updateOnHandlerChange(itemId, itemType, name, value);
					}, 250));
				}

				const currentData = this.getItem(id);

				if(currentData)
				{
					handler.setData(currentData);
				}

				return handler as c.CustomHandler;
			},
			getHandler(
				id: c.CustomItem['id'],
				itemType: string,
				syncHandlerDataWithStore?: boolean
			): c.CustomHandler
			{
				if(this.itemHandlers[id] instanceof c.CustomHandler)
				{
					/** NOTE: See base method */
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
					itemType,
					(opts: c.CustomItemOpts) => (new c.CustomHandler(opts)),
					syncHandlerDataWithStore ?? true
				);

				this.itemHandlers[id] = handler;

				return this.itemHandlers[id];
			},
			async loadDefinitions()
			{
				const db = this.getDb();

				const archetypeStore = deriveStoreForItemType(
					sharedTypes.KnownItemType.Archetype,
					{ db }
				) as ArchetypeStore;

				await archetypeStore.loadAllItems(sharedTypes.KnownItemType.Archetype);

				archetypeStore.allItems.forEach((def) =>
				{
					if(def?.itemType)
					{
						this.itemTypeToArchetypeMap[def.itemType] = def;
					}
				});

				await this.loadDefinitionFields();
			},
			async loadDefinitionFields()
			{
				const db = this.getDb();

				const fieldStore = deriveStoreForItemType(
					sharedTypes.KnownItemType.Field,
					{ db }
				) as FieldStore;

				await fieldStore.loadAllItems(sharedTypes.KnownItemType.Field);

				Object.keys(this.itemTypeToArchetypeMap).forEach((typeId) =>
				{
					const fieldIds = this.itemTypeToArchetypeMap[typeId]?.attachedFields;

					this.definitionFieldsMap[typeId] = (fieldIds || []).map((id: string) =>
					{
						return fieldStore.getItem(id, sharedTypes.KnownItemType.Field);
					});
				});
			},
			SET_ITEM(id: string, itemType: string, item: c.CustomItem): void
			{
				if(!this.getIsValidItemType(item))
				{
					console.log('Invalid item:', storeOpts.storeName, item);

					return;
				}

				if(!this.itemsByType[itemType])
				{
					this.itemsByType[itemType] = {};
				}

				this.itemsByType[itemType][id] = item;
				this.itemIdToItemTypeMap[id] = item.typeId || itemType;
			},
			SET_ITEM_PROPERTY(id: string, itemType: string, prop: string, data: any)
			{
				const item = this.itemsByType[itemType]?.[id];

				if((typeof prop !== 'string') || !item)
				{
					return;
				}

				this.itemsByType[item.typeId][id][prop] = data;
			},
		}
	});
}
