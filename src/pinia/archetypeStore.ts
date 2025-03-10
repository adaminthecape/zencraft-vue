import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, Archetype as a } from 'zencraft-core';

export type ArchetypeRootState = GenericRootState<a.ArchetypeItem>;

export type ArchetypeStoreGetters = GenericStoreGetters<a.ArchetypeItem, a.ArchetypeHandler>;

export type ArchetypeStoreActions = GenericStoreActions<a.ArchetypeItem, a.ArchetypeHandler> & {
  getHandler: (id: a.ArchetypeItem['id'], syncHandlerDataWithStore?: boolean) => a.ArchetypeHandler,
};

export type ArchetypeStore = Store<
  string,
  ArchetypeRootState,
  ArchetypeStoreGetters,
  ArchetypeStoreActions
>;

export function useArchetypeStore(storeOpts: Record<string, unknown>): () => ArchetypeStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    a.ArchetypeItem,
    a.ArchetypeHandler,
    ArchetypeRootState,
    ArchetypeStoreGetters,
    ArchetypeStoreActions
  >({
    itemType: sharedTypes.KnownItemType.Archetype,
    storeName: String(PiniaStoreName.archetypeStore),
    rootState: {
    },
    getters: {
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.Archetype;
      },
      getHandler(
        id: a.ArchetypeItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): a.ArchetypeHandler
      {
        if(this.itemHandlers[id] instanceof a.ArchetypeHandler)
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
          (opts: a.ArchetypeItemOpts) => (new a.ArchetypeHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
    }
  });
}
