import {
  GenericRootState,
  GenericStoreActions,
  GenericStoreGetters,
  useGenericItemStore
} from './genericItemStore';
import { Store } from 'pinia';
import { PiniaStoreName } from './utils';
import debounce from 'lodash/debounce';
import { fields, Archetype, sharedTypes } from 'zencraft-core';
import { ArchetypeStore } from './archetypeStore';
import { deriveStoreForItemType } from 'src/logic/utils/stores';

export type FieldRootState = GenericRootState<fields.FieldData> & {
  definitionFieldsMap: Record<
    Archetype.ArchetypeItem['id'],
    Array<fields.FieldData['id']>
  >;
  itemTypeFieldsMap: Partial<Record<string, Array<fields.FieldData['id']>>>;
  [key: string]: any;
};

export type FieldStoreGetters = GenericStoreGetters<fields.FieldData, fields.Field> & {
  getFieldsForDefinition: (state: FieldRootState) => (defId: string) => Array<fields.FieldData>;
  getFieldsForItemType: (state: FieldRootState) => (itemType: string) => Array<fields.FieldData>;
};

export type FieldStoreActions = GenericStoreActions<fields.FieldData, fields.Field> & {
  getHandler: (id: fields.FieldData['id'], syncHandlerDataWithStore?: boolean) => fields.Field;
  setDefinitionFieldsMap: () => void;
};

export type FieldStore = Store<
  string,
  FieldRootState,
  FieldStoreGetters,
  FieldStoreActions
>;

export function useFieldStore(storeOpts: Record<string, unknown>): () => FieldStore
{
  // @ts-expect-error No need for perfect equality with Pinia store types
  return useGenericItemStore<
    fields.FieldData,
    fields.Field,
    FieldRootState,
    FieldStoreGetters,
    FieldStoreActions
  >({
    itemType: sharedTypes.KnownItemType.Field,
    storeName: String(PiniaStoreName.fieldStore),
    rootState: {
      definitionFieldsMap: {},
      itemTypeFieldsMap: {},
    },
    getters: {
      getFieldsForDefinition: (state: FieldRootState) => (defId: string) =>
      {
        return (state.definitionFieldsMap[defId] || [])
          .map((fieldId) => state.items[fieldId]);
      },
      getFieldsForItemType: (state: FieldRootState) => (itemType: string) =>
      {
        return (state.itemTypeFieldsMap[itemType] || [])
          .map((fieldId) => state.items[fieldId]);
      },
    },
    actions: {
      getIsValidItemType(itemData: any)
      {
        return itemData?.typeId === sharedTypes.KnownItemType.Field;
      },
      getHandler(
        id: fields.FieldData['id'],
        itemType: string,
        syncHandlerDataWithStore?: boolean
      ): fields.Field
      {
        if(this.itemHandlers[id] instanceof fields.Field)
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
          (opts: fields.FieldHandlerOpts) => (new fields.Field(opts)),
          syncHandlerDataWithStore ?? true
        );

        this.itemHandlers[id] = handler;

        return this.itemHandlers[id];
      },
      setDefinitionFieldsMap(): void
      {
        // figure out which fields belong to which definitions
        // create a map of DefinitionId to FieldIds
        const archetypeStore = deriveStoreForItemType(
          sharedTypes.KnownItemType.Archetype
        ) as ArchetypeStore;

        const allArchetypes = archetypeStore.allItems;

        for(const def of allArchetypes)
        {
          if(def?.id && !this.definitionFieldsMap[def.id])
          {
            this.definitionFieldsMap[def.id] = [...def.attachedFields || []];
          }

          if(def?.itemType && !this.itemTypeFieldsMap[def.itemType])
          {
            this.itemTypeFieldsMap[def.itemType] = [...def.attachedFields || []];
          }
        }
      },
    }
  });
}
