import { BlockStore } from 'src/pinia/blockStore';
import { PageStore } from 'src/pinia/pageStore';
import useAdminStore from 'src/pinia/adminStore';
import { Block, item, sharedTypes, utils } from 'zencraft-core';
import { computed, ComputedRef, Ref, ref } from 'vue';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { AppHelpers } from 'src/types/generic';
import useBlockContextStore, { BlockContextStore } from 'src/pinia/blockContextStore';

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
  const pageStore = deriveStoreForItemType(sharedTypes.KnownItemType.Block) as PageStore;
  const ctxStore = useBlockContextStore()() as BlockContextStore;

  const isEditMode = computed(() => adminStore.isEditMode);
  const itemIdToEdit = ref<string | undefined>();

  async function onBlockDefSelected(opts: {
    id: string;
    col?: number;
    row?: number;
  }): Promise<void>
  {
    const { id: blueprintId, row, col } = opts;

    if(!blueprintId || !options.parentId.value)
    {
      throw new Error(`No definition or parent ID ${blueprintId}, ${options.parentId.value}`);
    }

    const newBlockId = utils.uuid.generateUuid();
    let parentPage;

    // create a new Block
    const newBlockData: Partial<Omit<Block.BlockItem, keyof item.Item>> = {
      blueprintId,
      // config: blueprint.defaultConfig // TODO: implement defaultConfig
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
      parentPage = pageStore.getItem(
        options.parentId.value,
        sharedTypes.KnownItemType.Page
      );

      if(parentPage?.id && (parentPage?.typeId === sharedTypes.KnownItemType.Page))
      {
        await pageStore.saveItem({
          id: parentPage.id,
          itemType: sharedTypes.KnownItemType.Page,
          data: {
            blockIds: [...(parentPage.blockIds || []), newBlockId]
          }
        });
      }

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

      await blockStore.saveItem({
        id: parentBlock.id,
        itemType: sharedTypes.KnownItemType.Block,
        data: {
          childBlocks: newChildBlocks
        }
      });
    }

    itemIdToEdit.value = newBlockId;

    const parentId = parentBlock?.id || parentPage?.id;

    // the block is displayed immediately, but we must open an editing form
    options.editItem({
      id: newBlockId,
      typeId: sharedTypes.KnownItemType.Block,
      contextReference: ctxStore.generateContextReference({
        parentId,
        blockId: newBlockId,
        pageId: parentPage?.id,
      }),
    });
  }

  return {
    isEditMode,
    itemIdToEdit,
    onBlockDefSelected
	};
}
