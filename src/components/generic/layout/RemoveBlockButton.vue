<template>
  <q-btn
    v-if="blockId && parentId"
    icon="delete"
    color="negative"
    size="sm"
    outline
    dense
  >
    <q-popup-proxy>
      <q-card>
        <ListItem>
          <ThemeButton
            :label="$t('forms.repeaters.confirmRemove')"
            icon="delete"
            color="negative"
            @click="() => onBlockRemoved(blockId)"
          />
        </ListItem>
      </q-card>
    </q-popup-proxy>
    <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { sharedTypes, dbFilters, Block, BlockDefinition } from 'adam-firebase-tools';
import { PageStore } from 'src/pinia/pageStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const props = defineProps<{
  blockId: Block.BlockItem['id'];
  parentId: Block.BlockItem['id'] | BlockDefinition.BlockDefinitionItem['id'];
  position?: {
    id: Block.BlockItem['id'];
    col?: number;
    row?: number;
  };
  tooltip?: string;
}>();

const emit = defineEmits<{
  (e: 'removed', value: { id: Block.BlockItem['id'] }): void;
}>();

async function onBlockRemoved(id: Block.BlockItem['id']): Promise<void>
{
  // find the block in its parent's block list
  const blockStore = deriveStoreForItemType(sharedTypes.KnownItemType.Block);

  const filters = [
    {
      key: 'itemId',
      operator: dbFilters.DbFilterOperator.isEqual,
      value: props.parentId
    }
  ];

  // is the parent a block?
  const foundBlock = (await blockStore.searchItems({
    filters,
    itemType: sharedTypes.KnownItemType.Block,
  }))?.results?.[0];

  if(foundBlock)
  {
    const parentBlock = (await blockStore.loadItem({
      id: props.parentId,
      itemType: sharedTypes.KnownItemType.Block
    }) as Block.BlockItem | undefined);

    if(!parentBlock)
    {
      throw new Error(`Failed to get handler for page ${props.parentId}`);
    }

    parentBlock.childBlocks = (parentBlock.childBlocks || [])?.filter((b) =>
    {
      if(props.position)
      {
        return !(
          (props.position.id === b.id) &&
          ((!props.position.col && !b.col) || (props.position.col == b.col)) &&
          ((!props.position.row && !b.row) || (props.position.row == b.row))
        );
      }

      return b.id !== id;
    });

    await blockStore.saveItem({
      id: props.parentId,
      itemType: sharedTypes.KnownItemType.Block,
      data: {
        childBlocks: parentBlock.childBlocks
      }
    });
  }
  else
  {
    const pageStore = deriveStoreForItemType(sharedTypes.KnownItemType.Page) as PageStore;

    const foundPage = (await pageStore.searchItems({
      filters,
      itemType: sharedTypes.KnownItemType.Page,
    }))?.results?.[0];

    if(foundPage)
    {
      const parentPage = await pageStore.loadItem({
        id: props.parentId,
        itemType: sharedTypes.KnownItemType.Page,
      });

      if(!parentPage)
      {
        throw new Error(`Failed to get handler for page ${props.parentId}`);
      }

      parentPage.blockIds = [...(parentPage.blockIds || [])].filter((id) => (
        id !== props.blockId
      ));

      await pageStore.saveItem({
        id: props.parentId,
        itemType: sharedTypes.KnownItemType.Page,
        data: {
          blockIds: parentPage.blockIds
        }
      });
    }
  }

  emit('removed', { id });
}
</script>
