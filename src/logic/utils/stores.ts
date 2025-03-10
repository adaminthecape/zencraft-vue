import { sharedTypes } from 'adam-firebase-tools';
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import { ModuleStore, useModuleStore } from 'src/pinia/moduleStore';
import { PageStore, usePageStore } from 'src/pinia/pageStore';
import { BlockStore, useBlockStore } from 'src/pinia/blockStore';
import { ItemDefinitionStore, useItemDefinitionStore } from 'src/pinia/itemDefinitionStore';
import { BlockDefinitionStore, useBlockDefinitionStore } from 'src/pinia/blockDefinitionStore';
import { AccessRoleStore, useAccessRoleStore } from 'src/pinia/accessRoleStore';
import { CustomItemStore, useCustomItemStore } from 'src/pinia/customItemStore';
import { FieldStore, useFieldStore } from 'src/pinia/fieldStore';

export type StoreTypes = (
  GenericItemStore |
  FieldStore |
  PageStore |
  ModuleStore |
  BlockStore |
  ItemDefinitionStore |
  BlockDefinitionStore |
  AccessRoleStore |
  CustomItemStore
);

export function deriveStoreForItemType(
  itemType: string | undefined,
  opts?: Record<string, unknown>
): StoreTypes
{
  if(!opts)
  {
    opts = {};
  }

  switch(itemType)
  {
    case sharedTypes.KnownItemType.Module:
      return useModuleStore(opts)();
    case sharedTypes.KnownItemType.Page:
      return usePageStore(opts)();
    case sharedTypes.KnownItemType.Field:
      return useFieldStore(opts)();
    case sharedTypes.KnownItemType.Block:
      return useBlockStore(opts)();
    case sharedTypes.KnownItemType.ItemDefinition:
      return useItemDefinitionStore(opts)();
    case sharedTypes.KnownItemType.BlockDefinition:
      return useBlockDefinitionStore(opts)();
    case sharedTypes.KnownItemType.AccessRole:
      return useAccessRoleStore(opts)();
    case sharedTypes.KnownItemType.CustomItem:
    case sharedTypes.KnownItemType.Item:
    default:
      return useCustomItemStore(opts)();
  }
}

export function mapItemIdsToItems(opts: {
  itemType: string | undefined;
  itemIds: string[];
  store: StoreTypes;
}): Record<string, unknown>
{
  if(
    !Array.isArray(opts.itemIds) ||
    !opts.store ||
    !(opts.itemType && (typeof opts.itemType === 'string'))
  )
  {
    console.log(
      opts,
      !Array.isArray(opts.itemIds),
      !opts.store,
      !(opts.itemType && (typeof opts.itemType === 'string'))
    );
    return {};
  }

  return opts.itemIds.reduce((agg, id) =>
  {
    if(opts.itemType && opts.store?.getItem(id, opts.itemType))
    {
      agg[id] = opts.store.getItem(id, opts.itemType);
    }
    else
    {
      agg[id] = { id };
    }

    return agg;
  }, {} as Record<string, unknown>);
}
