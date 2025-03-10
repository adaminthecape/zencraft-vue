import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, Blueprint as m } from 'zencraft-core';

export type BlueprintRootState = GenericRootState<m.BlueprintItem>;

export type BlueprintStoreGetters = GenericStoreGetters<m.BlueprintItem, m.BlueprintHandler> & {
  getTitle: (state: BlueprintRootState) => (id: string | undefined) => string | undefined;
};

export type BlueprintStoreActions = GenericStoreActions<m.BlueprintItem, m.BlueprintHandler> & {
  getHandler: (id: m.BlueprintItem['id'], syncHandlerDataWithStore?: boolean) => m.BlueprintHandler,
};

export type BlueprintStore = Store<
  string,
  BlueprintRootState,
  BlueprintStoreGetters,
  BlueprintStoreActions
>;

export function useBlueprintStore(storeOpts: Record<string, unknown>): () => BlueprintStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    m.BlueprintItem,
    m.BlueprintHandler,
    BlueprintRootState,
    BlueprintStoreGetters,
    BlueprintStoreActions
  >({
    itemType: sharedTypes.KnownItemType.Blueprint,
    storeName: String(PiniaStoreName.blueprintStore),
    rootState: {
    },
    getters: {
      getTitle: (state: BlueprintRootState) => (id: string | undefined) =>
      {
        if(id && state.items[id])
        {
          return state.items[id].name;
        }

        return undefined;
      }
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.Blueprint;
      },
      getHandler(
        id: m.BlueprintItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): m.BlueprintHandler
      {
        if(this.itemHandlers[id] instanceof m.BlueprintHandler)
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
          (opts: m.BlueprintItemOpts) => (new m.BlueprintHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
    }
  });
}
