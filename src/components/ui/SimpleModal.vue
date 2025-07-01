<template>
  <div>
    <slot
      name="activator"
      v-bind="{ open, close }"
    />
    <q-dialog
      v-model="isModalOpen"
      v-bind="qProps"
      style="margin: 0;"
      transition-show="fade"
      transition-hide="fade"
      @hide="onClose"
      @before-hide="onBeforeClose"
    >
      <q-card
        class="flex-col"
        :class="!noPadding ? ['q-px-lg', 'q-pb-lg'] : undefined"
        :style="{
          ...(fullWidth ? { minWidth : '95vw' } : {}),
          ...(minWidth ? { minWidth } : {}),
          ...(vw ? { width : `${vw}vw` } : {}),
          ...customStyles
        }"
      >
        <slot name="title">
          <h4
            v-if="title"
            class="modal-title"
          >
            {{ title }}
          </h4>
        </slot>
        <div class="modal-content q-mb-lg">
          <slot
            name="content"
            v-bind="{ open, close, toggle }"
          />
        </div>
        <div class="q-space" />
        <div class="modal-actions row">
          <div class="q-space" />
          <slot
            name="close"
            v-bind="{ open, close, toggle }"
          >
            <ThemeButton
              v-if="showCloseButton"
              label="Close"
              color="negative"
              flat
              @click="close"
            />
          </slot>
          <slot
            name="actions"
            v-bind="{ open, close, toggle }"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { QDialogProps } from 'quasar';
import { ref, defineProps, defineExpose } from 'vue';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

export type SimpleModalProps = {
  title?: string;
  content?: string;
  fullWidth?: boolean;
  minWidth?: string;
  vw?: string;
  customStyles?: Record<string, unknown>;
  showCloseButton?: boolean;
  persistent?: boolean;
  noPadding?: boolean;
  openOnMount?: boolean;
  onClose?: () => void;
  onBeforeClose?: () => void;
  qProps?: QDialogProps;
};

const props = defineProps<SimpleModalProps>();

const isModalOpen = ref(props.openOnMount ?? false);

function close()
{
	isModalOpen.value = false;
}

function open()
{
	isModalOpen.value = true;
}

function toggle()
{
	isModalOpen.value = !isModalOpen.value;
}

defineExpose({ open, close, toggle });
</script>

<style>
</style>
