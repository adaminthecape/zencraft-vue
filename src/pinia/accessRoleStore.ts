import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { sharedTypes, AccessRole as a } from 'adam-firebase-tools';

export type AccessRoleRootState = GenericRootState<a.AccessRoleItem> & {
  [key: string]: any;
};

export type AccessRoleStoreGetters = GenericStoreGetters<a.AccessRoleItem, a.AccessRoleHandler> & {
  test?: (id: string) => Promise<any>;
};

export type AccessRoleStoreActions = GenericStoreActions<a.AccessRoleItem, a.AccessRoleHandler> & {
  getHandler: (id: a.AccessRoleItem['id'], syncHandlerDataWithStore?: boolean) => a.AccessRoleHandler;
};

export type AccessRoleStore = Store<
  string,
  AccessRoleRootState,
  AccessRoleStoreGetters,
  AccessRoleStoreActions
>;

export function useAccessRoleStore(storeOpts: Record<string, unknown>): () => AccessRoleStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    a.AccessRoleItem,
    a.AccessRoleHandler,
    AccessRoleRootState,
    AccessRoleStoreGetters,
    AccessRoleStoreActions
  >({
    itemType: sharedTypes.KnownItemType.AccessRole,
    storeName: String(PiniaStoreName.accessRoleStore),
    rootState: {},
    getters: {},
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.AccessRole;
      },
      getHandler(
        id: a.AccessRoleItem['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): a.AccessRoleHandler
      {
        if(this.itemHandlers[id] instanceof a.AccessRoleHandler)
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
          (opts: a.AccessRoleItemOpts) => (new a.AccessRoleHandler(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      }
    }
  });
}
