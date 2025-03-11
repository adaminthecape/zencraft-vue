<template>
  <SimpleModal
    v-bind="modalProps"
    :custom-styles="styles"
    :q-props="{
      persistent: modalProps?.persistent ?? false,
      square: true,
      noShake: true,
      noEscDismiss: false,
      allowFocusOutside: true,
      fullHeight: true,
      position: 'left'
    }"
  >
    <template #title>
      <div class="row items-center justify-end">
        <slot name="top-right" />
        <ThemeButton
          :icon="isTransparent ? 'visibility' : 'visibility_off'"
          color="accent"
          style="margin-bottom: -1rem"
          flat
          @click="isTransparent = !isTransparent"
        />
      </div>
    </template>
    <template #activator="{ open }">
      <slot name="activator" v-bind="{ open }">
        <ThemeButton
          :icon="icon || (existingItemId ? 'edit' : 'add')"
          :color="iconColor || (existingItemId ? 'accent' : 'positive')"
          flat
          @click="open"
        />
      </slot>
    </template>
    <template #content="{close}">
      <EditNewOrExistingItem
        v-bind="props"
        @saved="($event) => emit('saved', $event)"
        @request-close="emit('requestClose')"
      >
        <template #form-actions>
          <ThemeButton
            class="q-mr-sm"
            color="negative"
            label="Close"
            outline
            @click="close"
          />
        </template>
      </EditNewOrExistingItem>
    </template>
  </SimpleModal>
</template>

<script setup lang="ts">
import SimpleModal, { SimpleModalProps } from 'src/components/ui/SimpleModal.vue';
import EditNewOrExistingItem from 'src/components/generic/items/EditNewOrExistingItem.vue';
import { QInputProps, QSelectProps, useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { CssClassProp } from 'src/types/generic';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import { ContextReference } from '@/pinia/blockContextStore';

const $q = useQuasar();

const props = defineProps<{
  itemType: string;
  initialData?: Record<string, unknown>;
  existingItemId?: string;
  formClasses?: CssClassProp;
  customClasses?: CssClassProp;
  qProps?: Partial<QInputProps & QSelectProps>;
  useStoreHandler?: boolean;
  forceIsNew?: boolean;
} & {
  icon?: string;
  iconColor?: string;
  modalProps?: SimpleModalProps;
  contextReference?: ContextReference;
}>();

const emit = defineEmits<{
  (e: 'saved', value: Record<string, unknown>): void;
  (e: 'requestClose'): void;
}>();

const isTransparent = ref(false);
const minWidth = computed(() => `${Math.min($q.screen.width, 600)}px`);
const styles = computed(() => ({
  minWidth: minWidth.value,
  background: isTransparent.value ? '#ffffff10' : undefined
}));
</script>
