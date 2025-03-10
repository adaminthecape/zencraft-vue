import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, Hub as m } from 'zencraft-core';

export type HubRootState = GenericRootState<m.HubItem> & {
  defaultSelectedHub: string | undefined;
  selectedHub: string | undefined;
};

export type HubStoreGetters = GenericStoreGetters<m.HubItem, m.HubHandler> & {
  getDefaultSelectedHub?: (state: HubRootState) => string | undefined;
  getSelectedHub?: (state: HubRootState) => string | undefined;
};

export type HubStoreActions = GenericStoreActions<m.HubItem, m.HubHandler> & {
  getHandler: (id: m.HubItem['id'], syncHandlerDataWithStore?: boolean) => m.HubHandler,
  setSelectedHub: (hubId: m.HubItem['id']) => void,
};

export type HubStore = Store<
  string,
  HubRootState,
  HubStoreGetters,
  HubStoreActions
>;

export function useHubStore(storeOpts: Record<string, unknown>): () => HubStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    m.HubItem,
    m.HubHandler,
    HubRootState,
    HubStoreGetters,
    HubStoreActions
  >({
    itemType: sharedTypes.KnownItemType.Hub,
    storeName: String(PiniaStoreName.hubStore),
    rootState: {
      defaultSelectedHub: undefined,
      selectedHub: undefined
    },
    getters: {
      getDefaultSelectedHub: (state: HubRootState) => state.defaultSelectedHub,
      getSelectedHub: (state: HubRootState) => state.selectedHub,
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.Hub;
      },
      getHandler(
        id: m.HubItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): m.HubHandler
      {
        if(this.itemHandlers[id] instanceof m.HubHandler)
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
          (opts: m.HubItemOpts) => (new m.HubHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
      setSelectedHub(hubId: m.HubItem['id'])
      {
        this.selectedHub = hubId;
      }
    }
  });
}
