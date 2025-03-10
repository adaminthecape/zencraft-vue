import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, ItemDefinition as m } from 'adam-firebase-tools';

export type ItemDefinitionRootState = GenericRootState<m.ItemDefinitionItem>;

export type ItemDefinitionStoreGetters = GenericStoreGetters<m.ItemDefinitionItem, m.ItemDefinitionHandler>;

export type ItemDefinitionStoreActions = GenericStoreActions<m.ItemDefinitionItem, m.ItemDefinitionHandler> & {
  getHandler: (id: m.ItemDefinitionItem['id'], syncHandlerDataWithStore?: boolean) => m.ItemDefinitionHandler,
};

export type ItemDefinitionStore = Store<
  string,
  ItemDefinitionRootState,
  ItemDefinitionStoreGetters,
  ItemDefinitionStoreActions
>;

export function useItemDefinitionStore(storeOpts: Record<string, unknown>): () => ItemDefinitionStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    m.ItemDefinitionItem,
    m.ItemDefinitionHandler,
    ItemDefinitionRootState,
    ItemDefinitionStoreGetters,
    ItemDefinitionStoreActions
  >({
    itemType: sharedTypes.KnownItemType.ItemDefinition,
    storeName: String(PiniaStoreName.itemDefinitionStore),
    rootState: {
    },
    getters: {
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.ItemDefinition;
      },
      getHandler(
        id: m.ItemDefinitionItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): m.ItemDefinitionHandler
      {
        if(this.itemHandlers[id] instanceof m.ItemDefinitionHandler)
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
          (opts: m.ItemDefinitionItemOpts) => (new m.ItemDefinitionHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
    }
  });
}
