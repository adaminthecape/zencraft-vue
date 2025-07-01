<template>
  <div class="row items-center justify-center">
    <!-- Update existing if allowed (always allowed?) -->
    <SimpleModal
      :custom-styles="{
        minWidth: '600px'
      }"
    >
      <template #title>
        <div class="q-mb-sm">
          <h5 class="q-mb-xs">
            {{ $t('items.editingItem', { title: editingTitle || row.id }) }}
          </h5>
          <span class="text-caption">{{ row.typeId }}</span>
        </div>
      </template>
      <template #activator="{open}">
        <ThemeButton
          icon="edit"
          dense
          flat
          @click="open"
        />
      </template>
      <template #content>
        <EditNewOrExistingItem
          :existing-item-id="row.id"
          :item-type="row.typeId"
        />
      </template>
    </SimpleModal>
    <!-- NO delete option from here -->
    <!-- Remove from list if allowed -->
    <q-btn
      icon="delete"
      color="negative"
      size="sm"
      dense
      flat
    >
      <q-popup-proxy>
        <q-card>
          <ListItem>
            <ThemeButton
              :label="$t('forms.repeaters.confirmRemove')"
              icon="delete"
              color="negative"
              @click="confirmRemoveFromList"
            />
          </ListItem>
        </q-card>
      </q-popup-proxy>
    </q-btn>
    <!-- Search for a replacement -->
  </div>
</template>

<script setup lang="ts">
import SimpleModal from 'src/components/ui/SimpleModal.vue';
import EditNewOrExistingItem from 'src/components/generic/items/EditNewOrExistingItem.vue';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const props = defineProps<{
  row: Record<string, unknown>;
  editingTitle?: string;
}>();

const emit = defineEmits<{
  (e: 'removeFromList', value: string): void;
}>();

function confirmRemoveFromList()
{
	emit('removeFromList', props.row.id);
}
</script>
