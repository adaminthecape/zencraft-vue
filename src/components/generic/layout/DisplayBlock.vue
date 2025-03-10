<template>
  <div
    v-if="block"
    class="borad-6"
    :class="[
      ...containerClasses,
      { 'q-pa-xs': isEditMode, 'q-ma-xs': isEditMode },
      { 'highlight-block-on-hover': isHoveringAddBlock },
    ]"
    :style="block.customStyles"
  >
    <div
      v-if="isEditMode"
      class="block-edit-controls row items-center q-ma-xs"
    >
      <!-- Block Icon -->
      <ThemeIcon size="xs" name="description" class="q-mr-xs" />
      <!-- Block and Blueprint ID -->
      <div>
        <span class="text-caption text-muted">{{(
          block?.title || (
            blueprintStore.getTitle(block?.blueprintId ?? '')
          ) || block?.id?.split('-')[0] || 'Unknown'
        )}}</span>
      </div>
      <div class="q-space" />
      <!-- Echo context -->
      <ThemeButton
        color="secondary"
        icon="description"
        class="q-mr-xs"
        size="sm"
        flat
        @click="printContext"
      ><q-tooltip>{{ $t('admin.blocks.controls.printDebug') }}</q-tooltip></ThemeButton>
      <!-- Remove Block -->
      <RemoveBlockButton
        class="q-mr-xs"
        :block-id="blockId"
        :parent-id="parentId"
        :tooltip="$t('admin.blocks.controls.delete')"
        dense
        flat
      />
      <!-- Edit Block -->
      <ThemeButton
        color="accent"
        icon="edit"
        size="sm"
        flat
        @click="editBlock"
      ><q-tooltip>{{ $t('admin.blocks.controls.edit') }}</q-tooltip></ThemeButton>
    </div>
    <q-separator v-if="isEditMode" class="q-ma-xs" />
    <component
      v-if="componentToUse"
      :is="componentToUse"
      v-bind="{ itemId, itemType, parentData }"
      :block-id="blockId"
      :parent-id="parentId"
      @item-selected="onItemSelected"
    />
    <div
      v-if="(
        isEditMode &&
        blockConfigForType?.hasChildren &&
        !blockConfigForType?.hideAddBlockButton
      )"
      class="full-width"
    >
      <div class="row items-center justify-center borad-6 q-pa-sm">
        <AddBlockButton
          @mouseenter="isHoveringAddBlock = true"
          @mouseleave="isHoveringAddBlock = false"
          @selected="onBlockDefSelected"
        />
      </div>
    </div>
  </div>
  <div v-else class="flex-col items-center justify-center">
    <div class="row items-center justify-center full-width">
      <q-spinner :size="50" color="accent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import usePublicComponent, { ItemResultClick } from 'src/composables/usePublicComponent';
import AddBlockButton from './AddBlockButton.vue';
import { computed, inject, onMounted, ref } from 'vue';
import useAddBlock from 'src/composables/useAddBlock';
import RemoveBlockButton from './RemoveBlockButton.vue';
import { sharedTypes } from 'zencraft-core';
import { useI18n } from 'vue-i18n';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { AppHelpers } from 'src/types/generic';

const isHoveringAddBlock = ref(false);

const { t: $t } = useI18n();

const props = defineProps<{
  parentId: string;
  blockId: string;
  itemId?: string;
  itemType?: string;
  /** A block may accept e.g. `$parent.title` to retrieve that data value */
  parentData?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'itemSelected', value: ItemResultClick): void;
}>();

const {
  block,
  blueprint,
  blueprintStore,
  blockStore,
  blockConfigForType,
  componentToUse,
  onItemSelected,
  isEditMode,
  mergedContext,
} = usePublicComponent({ props, emit });

const computedParentId = computed(() => props.blockId);

const { editItem } = (inject('helpers') as AppHelpers['helpers']) || {};
const $ctx = inject('context') as AppHelpers['$ctxStore'];

const { onBlockDefSelected } = useAddBlock({
  parentId: computedParentId,
  editItem
});

const containerClasses = computed(() => ([
  ...(isEditMode.value ? [
    'block-container',
    'block-edit-container',
    'q-ma-xs',
    'flex-col',
    'standout-1',
  ] : [
    'block-container',
    'flex-col',
  ]),
  ...`${(block.value?.customClasses || [])}`.split(',')
]));

onMounted(async () =>
{
  if(props.blockId)
  {
    await blockStore.loadItem({
      id: props.blockId,
      itemType: sharedTypes.KnownItemType.Block,
    });
  }

  if(blueprint.value?.id)
  {
    await blueprintStore.loadItem({
      id: blueprint.value.id,
      itemType: sharedTypes.KnownItemType.Blueprint,
    });
  }

  if(Array.isArray(block.value?.childBlocks) && block.value.childBlocks.length)
  {
    await blockStore.loadMultiple({
      ids: block.value.childBlocks.map((b) => b.id),
      itemType: sharedTypes.KnownItemType.Block,
    });
  }
});

function printContext()
{
  const blockRef = `Block ${props.blockId} (${blueprint.value?.blockType})`;
  console.log(`${blockRef}: block`, { ...block.value });
  console.log(`${blockRef}: mergedContext`, { ...mergedContext.value });
}

function editBlock()
{
  if(!(block.value?.id && (typeof block.value.id === 'string')))
  {
    console.warn('Block not available');

    return;
  }

  editItem({
    id: block.value.id || '',
    typeId: sharedTypes.KnownItemType.Block,
    contextReference: $ctx.store.generateReference({ blockId: block.value.id }),
  });
}
</script>

<style lang="postcss" scoped>
.block-container {
  border: 0px solid #aaa;
}

.block-edit-container {
  border-radius: 4px;
}

.block-edit-controls {
  border-radius: 4px;
}

.highlight-block-on-hover {
  border: 1px dashed var(--q-primary);
  transition: border  0.5s ease-in-out;
}
</style>
