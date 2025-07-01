<template>
  <div
    v-if="itemData && shouldShowBlockPreviewModal"
    :style="styles"
    class="z-top q-pa-md"
    :q-props="{
      persistent: itemData?.options?.persistent ?? true,
      square: false,
      noShake: true,
      noEscDismiss: false,
      allowFocusOutside: true,
      fullHeight: true,
      position: 'right'
    }"
  >
    <div class="row items-center q-mb-sm">
      Block Preview
    </div>
    <div v-if="itemData.contextReference?.blockId">
      <DisplayBlock
        :block-id="itemData.contextReference.blockId"
        :page-id="itemData.contextReference.pageId"
        :parent-id="`${itemData.contextReference.parentId}`"
        :force-no-edit-mode="true"
      />
    </div>
    <div v-else />
  </div>
</template>

<script setup lang="ts">
import { Dark, useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { ItemToEdit } from 'src/types/generic';
import DisplayBlock from '../layout/DisplayBlock.vue';
import useBlockPreviewModal from 'src/composables/useBlockPreviewModal';

const {
	shouldShowBlockPreviewModal,
} = useBlockPreviewModal();

const $q = useQuasar();

const props = defineProps<{
  itemData: ItemToEdit | undefined;
}>();

const emit = defineEmits<{
  (e: 'requestClose'): void;
}>();

const minWidth = computed(() => `calc(100vw - ${Math.min($q.screen.width, 600)}px - 100px)`);
const styles = computed(() => ({
	minWidth: minWidth.value,
	margin: '40px',
	background: Dark.isActive ? '#11111180' : '#dddddd80',
	position: 'absolute',
	top: '0px',
	right: '40px',
	height: 'calc(100vh - 80px)',
	borderRadius: '6px',
	backdropFilter: 'blur(10px)',
	boxShadow: Dark.isActive ? '0 0 10px 0 rgba(0, 0, 0)' : '0 0 10px 0 rgba(255, 255, 255, 0.2)',
}));
</script>
