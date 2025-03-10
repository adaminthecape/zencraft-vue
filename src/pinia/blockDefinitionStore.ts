import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, BlockDefinition as m } from 'adam-firebase-tools';

export type BlockDefinitionRootState = GenericRootState<m.BlockDefinitionItem>;

export type BlockDefinitionStoreGetters = GenericStoreGetters<m.BlockDefinitionItem, m.BlockDefinitionHandler> & {
  getTitle: (state: BlockDefinitionRootState) => (id: string | undefined) => string | undefined;
};

export type BlockDefinitionStoreActions = GenericStoreActions<m.BlockDefinitionItem, m.BlockDefinitionHandler> & {
  getHandler: (id: m.BlockDefinitionItem['id'], syncHandlerDataWithStore?: boolean) => m.BlockDefinitionHandler,
};

export type BlockDefinitionStore = Store<
  string,
  BlockDefinitionRootState,
  BlockDefinitionStoreGetters,
  BlockDefinitionStoreActions
>;

export function useBlockDefinitionStore(storeOpts: Record<string, unknown>): () => BlockDefinitionStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    m.BlockDefinitionItem,
    m.BlockDefinitionHandler,
    BlockDefinitionRootState,
    BlockDefinitionStoreGetters,
    BlockDefinitionStoreActions
  >({
    itemType: sharedTypes.KnownItemType.BlockDefinition,
    storeName: String(PiniaStoreName.blockDefinitionStore),
    rootState: {
    },
    getters: {
      getTitle: (state: BlockDefinitionRootState) => (id: string | undefined) =>
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
        return itemData?.typeId === sharedTypes.KnownItemType.BlockDefinition;
      },
      getHandler(
        id: m.BlockDefinitionItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): m.BlockDefinitionHandler
      {
        if(this.itemHandlers[id] instanceof m.BlockDefinitionHandler)
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
          (opts: m.BlockDefinitionItemOpts) => (new m.BlockDefinitionHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
    }
  });
}
