<template>
  <div>
    <!-- <slot name="activator" v-bind="{ open, close }">
      <ThemeButton
        icon="fas fa-question-circle"
        color="info"
        flat
        @click="open"
      >
        Help{{ (helpStore.currentHelpPage > 0) ? ' (active)' : '' }}
      </ThemeButton>
    </slot> -->
    <q-dialog
        v-model="isModalOpen"
        v-bind="qProps"
        style="margin: 0;"
        transition-show="fade"
        transition-hide="fade"
        :allow-focus-outside="true"
        :persistent="true"
        position="right"
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
          <h4 v-if="title" class="modal-title">{{ title }}</h4>
        </slot>
        <div class="modal-content q-mb-lg">
          <slot name="content" v-bind="{ open, close, toggle }">
            <HelpWizard />
          </slot>
        </div>
        <div class="q-space" />
        <div class="modal-actions row items-center full-width no-wrap">
          <ThemeButton
            color="secondary"
            flat
            @click="helpStore.resetWizard"
          >
            Start over
          </ThemeButton>
          <div class="q-space" />
          <div
            v-if="currentStep"
            class="row"
          >
            <ThemeButton
              v-if="helpStore.currentStepOnPage === 0"
              :disable="helpStore.currentHelpPage === 0"
              label="Previous Page"
              color="secondary"
              class="q-mr-sm"
              @click="helpStore.prevPage"
            />
            <ThemeButton
              v-else
              :disable="!Number.isInteger(currentStep.prev) || isAwaitingAction"
              :flat="!Number.isInteger(currentStep.prev)"
              label="Previous Step"
              color="secondary"
              @click="helpStore.prevStep"
            />
            <div class="q-space" />
            <ThemeButton
              v-if="Number.isInteger(currentStep.nextPage)"
              :disable="isAwaitingAction"
              label="Next Page"
              color="primary"
              class="q-ml-sm"
              @click="helpStore.nextPage"
            />
            <ThemeButton
              v-else
              :disable="!Number.isInteger(currentStep.next) || isAwaitingAction"
              :flat="!Number.isInteger(currentStep.next)"
              label="Next Step"
              color="primary"
              class="q-ml-sm"
              @click="helpStore.nextStep"
            />
          </div>
          <div class="q-space" />
          <slot name="close" v-bind="{ open, close, toggle }">
            <ThemeButton
              label="Close"
              color="negative"
              flat
              @click="close"
            />
          </slot>
          <slot name="actions" v-bind="{ open, close, toggle }"></slot>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { QDialogProps } from 'quasar';
import { defineProps, computed } from 'vue';
import useHelpStore, { HelpStore } from './pinia/helpStore';
import HelpWizard from './HelpWizard.vue';
import { useRouter } from 'vue-router';
import ThemeButton from './components/generic/buttons/ThemeButton.vue';
import { useQueues } from './composables/useQueues';
import useQueueStore from './pinia/queueStore';

const router = useRouter();
const helpStore: HelpStore = useHelpStore({ router })();

const currentStep = computed(() => helpStore.getCurrentStepData);

const isAwaitingAction = computed(() => (
  currentStep.value &&
  helpStore.getIsAwaitingAction(helpStore.currentHelpPage, currentStep.value.id)
));

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

defineProps<SimpleModalProps>();

const isModalOpen = computed({
  get()
  {
    return helpStore.isModalOpen;
  },
  set(value: boolean)
  {
    helpStore.toggleModal(value);
  }
});

function close() {
  isModalOpen.value = false;
}

function open() {
  isModalOpen.value = true;
}

function toggle() {
  isModalOpen.value = !isModalOpen.value;
}

const queueStore = useQueueStore();
const queueKey = 'help_wizard_first_run';
const queueAction = (opts: { start?: boolean; }) =>
{
  if(opts.start && !isModalOpen.value)
  {
    open();
  }

  queueStore.destroyQueue(queueKey);
};
useQueues<{ start?: boolean; }>({ queueKey, queueAction });
</script>

<style>
</style>
