import { BlueprintStore } from 'src/pinia/blueprintStore';
import { BlockStore } from 'src/pinia/blockStore';
import { Block, Blueprint, sharedTypes, utils } from 'zencraft-core';
import { computed, ComputedRef, defineAsyncComponent, onMounted, watch } from 'vue';
import { BlockType, blockTypeConfig, BlockTypeConfigOpts } from 'src/models/BlockTypes';
import useAdminStore from 'src/pinia/adminStore';
import { PageStore } from 'src/pinia/pageStore';
import useBlockContextStore from 'src/pinia/blockContextStore';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { Store } from 'pinia';

export type PublicComponentProps = {
  parentId: string;
  blockId: string;
  itemId?: string;
  itemType?: string;
  parentData?: Record<string, unknown>;
};

export type ItemResultClick = {
  fieldKey?: string | undefined;
  column?: string | undefined;
  itemId: string | undefined;
  itemType: string | undefined;
  value?: unknown;
};

export type PublicComponentEmits = {
  (e: 'itemSelected', value: ItemResultClick): void;
};

export type PublicComponentReferenceMap = Record<
  BlockType,
  ReturnType<typeof defineAsyncComponent>
>;

export default function usePublicComponent<
  IPropsType = PublicComponentProps,
  IEmitsType = PublicComponentEmits
>(opts: {
  props: (IPropsType & PublicComponentProps);
  emit?: (IEmitsType & PublicComponentEmits);
}): {
  isEditMode: ComputedRef<boolean>;
  components: PublicComponentReferenceMap;
  componentToUse: ComputedRef<ReturnType<typeof defineAsyncComponent> | undefined>;
  block: ComputedRef<Block.BlockItem | undefined>;
  blockConfig: ComputedRef<Record<string, unknown>>;
  blueprint: ComputedRef<Blueprint.BlueprintItem | undefined>;
  blockStore: BlockStore;
  blueprintStore: BlueprintStore;
  blockConfigForType: ComputedRef<BlockTypeConfigOpts | undefined>;
  onItemSelected: (e: ItemResultClick) => void;
  mergedContext: ComputedRef<Record<string, unknown>>;
  itemIdToUse: ComputedRef<string | undefined>;
  itemTypeToUse: ComputedRef<string | undefined>;
  contextStore: Store;
}
{
  const adminStore = useAdminStore();
  const isEditMode = computed(() => adminStore.isEditMode);

  const blockStore = deriveStoreForItemType(
    sharedTypes.KnownItemType.Block
  ) as BlockStore;
  const blueprintStore = deriveStoreForItemType(
    sharedTypes.KnownItemType.Blueprint
  ) as BlueprintStore;
  const pageStore = deriveStoreForItemType(
    sharedTypes.KnownItemType.Page
  ) as PageStore;

  const currentPageId = computed(() => pageStore.selectedPage);

  const contextStore = useBlockContextStore()();

  const block = computed(() => (
    (typeof opts.props.blockId === 'string') ?
      blockStore.getItem(
        opts.props.blockId,
        sharedTypes.KnownItemType.Block
      ) :
      undefined
  ));
  const blueprint = computed(() => (
    (typeof block.value?.blueprintId === 'string') ?
      blueprintStore.getItem(
        block.value.blueprintId,
        sharedTypes.KnownItemType.Blueprint
      ) :
      undefined
  ));
  const blockConfigForType = computed(() => (
    blueprint.value?.blockType ?
      blockTypeConfig[blueprint.value.blockType as BlockType] :
      undefined
  ));
  const blockConfig = computed(() => (block.value?.config || {}));

  const components: PublicComponentReferenceMap = {
    testBlock: defineAsyncComponent(() => import('src/components/public/search/HeadlessSearchContainer.vue')),
    headlessItemSearch: defineAsyncComponent(() => import('src/components/public/search/HeadlessSearchContainer.vue')),
    // paletteTester: defineAsyncComponent(() => import('src/components/public/admin/TestPalettes.vue')),
    itemAvatar: defineAsyncComponent(() => import('src/components/public/admin/ItemAvatarBlock.vue')),
    tourCard: defineAsyncComponent(() => import('src/components/public/search/TourCard.vue')),
    contextProvider: defineAsyncComponent(() => import('src/components/public/ContextProvider.vue')),
    contextSelector: defineAsyncComponent(() => import('src/components/public/ContextSelector.vue')),
    itemInput: defineAsyncComponent(() => import('src/components/public/ItemInputBlock.vue')),
    itemFieldValue: defineAsyncComponent(() => import('src/components/public/DisplayItemFieldValue.vue')),
    contextVoid: defineAsyncComponent(() => import('src/components/public/ContextVoid.vue')),
    tableColumns: defineAsyncComponent(() => import('src/components/public/TableColumns.vue')),
    fieldValueContextProvider: defineAsyncComponent(() => import('src/components/public/FieldValueContextProvider.vue')),
    itemListValue: defineAsyncComponent(() => import('src/components/public/DisplayListValue.vue')),
    formFields: defineAsyncComponent(() => import('src/components/public/FormFieldsBlock.vue')),
    fieldInput: defineAsyncComponent(() => import('src/components/public/FieldInputBlock.vue')),
    clickableList: defineAsyncComponent(() => import('src/components/public/ClickableList.vue')),
    htmlContent: defineAsyncComponent(() => import('src/components/public/HtmlContent.vue')),
    newItemContext: defineAsyncComponent(() => import('src/components/public/NewItemContext.vue')),
    createNewItemAvatar: defineAsyncComponent(() => import('src/components/public/CreateNewItemAvatar.vue')),
  };
  const componentToUse = computed(() => (
    blueprint.value?.blockType ?
      components[blueprint.value.blockType as BlockType] :
      undefined
  ));

  const mergedContext = computed(() =>
  {
    // return {
    //   ...(blockConfig.value || {}),
    //   ...(opts.props || {}),
    //   ...(contextStore?.getBlockContext(
    //     `${currentPageId.value}`,
    //     opts.props.blockId
    //   ) || {}),
    // };

    let result: Record<string, unknown> = {};

    // check blockConfig first for any hardcoded options
    if(utils.tools.isPopulatedObject(blockConfig?.value))
    {
      Object.keys(blockConfig.value).forEach((key) =>
      {
        result[key] = blockConfig?.value[key];
      });
    }

    // check props for any options passed from parent component
    if(utils.tools.isPopulatedObject(opts.props))
    {
      Object.keys(opts.props).forEach((key) =>
      {
        if(key in opts.props)
        {
          result[key] = (opts.props as Record<string, unknown>)[key];
        }
      });
    }

    // (blockId, parentId) (itemId, itemType should not be used)
    if(utils.tools.isPopulatedObject(opts.props))
    {
      result.blockId = opts.props?.blockId;
      result.parentId = opts.props?.parentId;
      result.itemId = opts.props?.itemId;
      result.itemType = opts.props?.itemType;
    }

    if(!result.itemId)
    {
      if(blockConfig.value?.targetItemId)
      {
        result.itemId = blockConfig.value?.targetItemId;
      }
    }

    if(!result.itemType && blockConfig.value?.targetItemType)
    {
      result.itemType = blockConfig.value?.targetItemType;
    }

    // check contextStore for any parent data
    if(contextStore && currentPageId.value && opts.props?.blockId)
    {
      const foundContext = contextStore?.getBlockContext(
        currentPageId.value,
        opts.props.blockId
      );

      if(utils.tools.isPopulatedObject(foundContext))
      {
        result = {
          ...result,
          ...(foundContext as Record<string, unknown>)
        };
      }
    }

    if(utils.tools.isPopulatedObject(result.itemId) && result.id)
    {
      result.itemId = result.itemId.id;
    }

    // guess at context last

    return result;
  });

  async function loadBlockData(newId: string)
  {
    if(utils.uuid.isUuid(newId))
    {
      await blockStore.loadItem({
        id: newId,
        itemType: sharedTypes.KnownItemType.Block,
      });

      if(block.value?.childBlocks?.length)
      {
        const ids = block.value.childBlocks
          .map((pos) => pos.id)
          .filter((id) => id);

        if(ids.length)
        {
          await blockStore.loadMultiple({
            ids,
            itemType: sharedTypes.KnownItemType.Block,
          });
        }
      }
    }
  }


  async function loadBlueprintData(newId: unknown)
  {
    if(utils.uuid.isUuid(newId))
    {
      await blueprintStore.loadItem({
        id: newId as string,
        itemType: sharedTypes.KnownItemType.Blueprint,
      });
    }
  }

  watch(() => opts.props.blockId, loadBlockData);
  watch(() => block.value?.blueprintId, loadBlueprintData);

  onMounted(async () =>
  {
    if(opts.props.blockId)
    {
      await loadBlockData(opts.props.blockId);
    }

    if(block.value?.blueprintId)
    {
      await loadBlueprintData(block.value.blueprintId);
    }
  });

  function onItemSelected(e: ItemResultClick)
  {
    if(opts.emit)
    {
      opts.emit('itemSelected', e);
    }
  }

  const itemIdToUse = computed(() =>
  {
    if(!mergedContext.value?.itemId)
    {
      return undefined;
    }

    if(
      utils.tools.isPopulatedObject(mergedContext.value?.itemId) &&
      mergedContext.value?.itemId.id
    )
    {
      return mergedContext.value?.itemId.id;
    }

    return mergedContext.value?.itemId;
  });
  const itemTypeToUse = computed(() => ([
    mergedContext.value?.itemType,
    opts.props?.itemType
  ].find((x) => typeof x === 'string')));

  return {
    isEditMode,
    components,
    componentToUse,
    block,
    blockConfig,
    blueprint,
    blockStore,
    blueprintStore,
    blockConfigForType,
    onItemSelected,
    mergedContext,
    itemIdToUse,
    itemTypeToUse,
    contextStore,
	};
}
