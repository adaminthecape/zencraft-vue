<template>
  <SimpleModal
    full-width
    no-padding
  >
    <template #activator="{open}">
      <slot
        name="activator"
        v-bind="{open}"
      >
        <HelpPopover i18n-key="addBlockButton">
          <ThemeButton
            v-bind="qProps"
            :label="label"
            color="primary"
            icon="add"
            size="sm"
            @click="(e) => helpStore.runIfNotOverlayMode(open)(e)"
          />
        </HelpPopover>
      </slot>
    </template>
    <template #content="{close}">
      <BlockLibrary
        label=""
        @selected-id="(id) => onBlueprintSelected(id, close)"
      />
    </template>
  </SimpleModal>
</template>

<script setup lang="ts">
import { Blueprint } from 'zencraft-core';
import SimpleModal from 'src/components/ui/SimpleModal.vue';
import BlockLibrary from './BlockLibrary.vue';
import { QBtnProps } from 'quasar';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import useHelpStore, { HelpStore } from 'src/pinia/helpStore';
import HelpPopover from 'src/HelpPopover.vue';

defineProps<{
  parentId?: string;
  label?: string;
  qProps?: QBtnProps;
}>();

const emit = defineEmits<{
  (e: 'selected', value: { id: Blueprint.BlueprintItem['id'] }): void;
}>();

function onBlueprintSelected(id: string, closeModal: () => void): void
{
	emit('selected', { id });
	closeModal?.();
}

const helpStore = useHelpStore({})() as HelpStore;
</script>
