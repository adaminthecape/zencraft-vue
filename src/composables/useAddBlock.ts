import { BlockStore } from 'src/pinia/blockStore';
import { PageStore } from 'src/pinia/pageStore';
import useAdminStore from 'src/pinia/adminStore';
import { Block, item, sharedTypes, utils } from 'zencraft-core';
import { computed, ComputedRef, Ref, ref } from 'vue';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { AppHelpers } from 'src/types/generic';

export default function useAddBlock(options: {
  parentId: ComputedRef<string | undefined>;
  editItem: AppHelpers['helpers']['editItem'];
}): ({
  isEditMode: ComputedRef<boolean>;
  itemIdToEdit: Ref<string | undefined>;
  onBlockDefSelected: (opts: {
    id: string;
    col?: number;
    row?: number;
  }) => Promise<void>;
})
{
  const adminStore = useAdminStore();
  const blockStore = deriveStoreForItemType(sharedTypes.KnownItemType.Block) as BlockStore;

  const isEditMode = computed(() => adminStore.isEditMode);

  const itemIdToEdit = ref<string | undefined>();

  async function onBlockDefSelected(opts: {
    id: string;
    col?: number;
    row?: number;
  }): Promise<void>
  {
    const { id: blockDefinitionId, row, col } = opts;

    if(!blockDefinitionId || !options.parentId.value)
    {
      throw new Error(`No definition or parent ID ${blockDefinitionId}, ${options.parentId.value}`);
    }

    const newBlockId = utils.uuid.generateUuid();

    // create a new Block
    const newBlockData: Partial<Omit<Block.BlockItem, keyof item.Item>> = {
      blockDefinitionId,
      // config: blockDefinition.defaultConfig // TODO: implement defaultConfig
    };

    // save the new Block immediately (can be deleted or orphaned later)
    await blockStore.saveItem({
      id: newBlockId,
      itemType: sharedTypes.KnownItemType.Block,
      data: newBlockData,
      isNew: true
    });

    const parentBlock = blockStore.getItem(
      options.parentId.value,
      sharedTypes.KnownItemType.Block
    );

    // attach the Block to the current Block (or Page)
    if(!parentBlock)
    {
      let pageStoreTemp: PageStore | undefined = deriveStoreForItemType(
        sharedTypes.KnownItemType.Page
      ) as PageStore;

      const parentPage = pageStoreTemp.getItem(
        options.parentId.value,
        sharedTypes.KnownItemType.Page
      );

      if(parentPage?.id && (parentPage?.typeId === sharedTypes.KnownItemType.Page))
      {
        await pageStoreTemp.saveItem({
          id: parentPage.id,
          itemType: sharedTypes.KnownItemType.Page,
          data: {
            blockIds: [...(parentPage.blockIds || []), newBlockId]
          }
        });
      }

      pageStoreTemp = undefined;

      if(!parentPage)
      {
        console.warn(`No parent found for new block ${newBlockId}`);
      }
    }
    else
    {
      const newChildBlocks = Block.BlockHandler.addChildBlock({
        existingChildBlocks: parentBlock.childBlocks,
        id: newBlockId,
        row,
        col,
      });

      console.log({ newChildBlocks });

      await blockStore.saveItem({
        id: parentBlock.id,
        itemType: sharedTypes.KnownItemType.Block,
        data: {
          childBlocks: newChildBlocks
        }
      });
    }

    itemIdToEdit.value = newBlockId;

    // the block is displayed immediately, but we must open an editing form
    options.editItem({
      id: newBlockId,
      typeId: sharedTypes.KnownItemType.Block,
    });
  }

  return {
    isEditMode,
    itemIdToEdit,
    onBlockDefSelected
	};
}
