import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, Module as m } from 'zencraft-core';

export type ModuleRootState = GenericRootState<m.ModuleItem> & {
  defaultSelectedModule: string | undefined;
  selectedModule: string | undefined;
};

export type ModuleStoreGetters = GenericStoreGetters<m.ModuleItem, m.ModuleHandler> & {
  getDefaultSelectedModule?: (state: ModuleRootState) => string | undefined;
  getSelectedModule?: (state: ModuleRootState) => string | undefined;
};

export type ModuleStoreActions = GenericStoreActions<m.ModuleItem, m.ModuleHandler> & {
  getHandler: (id: m.ModuleItem['id'], syncHandlerDataWithStore?: boolean) => m.ModuleHandler,
  setSelectedModule: (moduleId: m.ModuleItem['id']) => void,
};

export type ModuleStore = Store<
  string,
  ModuleRootState,
  ModuleStoreGetters,
  ModuleStoreActions
>;

export function useModuleStore(storeOpts: Record<string, unknown>): () => ModuleStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    m.ModuleItem,
    m.ModuleHandler,
    ModuleRootState,
    ModuleStoreGetters,
    ModuleStoreActions
  >({
    itemType: sharedTypes.KnownItemType.Module,
    storeName: String(PiniaStoreName.moduleStore),
    rootState: {
      defaultSelectedModule: undefined,
      selectedModule: undefined
    },
    getters: {
      getDefaultSelectedModule: (state: ModuleRootState) => state.defaultSelectedModule,
      getSelectedModule: (state: ModuleRootState) => state.selectedModule,
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.Module;
      },
      getHandler(
        id: m.ModuleItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): m.ModuleHandler
      {
        if(this.itemHandlers[id] instanceof m.ModuleHandler)
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
          (opts: m.ModuleItemOpts) => (new m.ModuleHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
      setSelectedModule(moduleId: m.ModuleItem['id'])
      {
        this.selectedModule = moduleId;
      }
    }
  });
}
