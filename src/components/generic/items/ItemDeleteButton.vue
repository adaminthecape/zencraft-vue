<template>
  <q-btn
    icon="delete"
    color="negative"
    size="sm"
    dense
    flat
    :style="{ padding: '4px 6px' }"
  >
    <q-popup-proxy>
      <q-card>
        <ListItem>
          <ThemeButton
            icon="fas fa-remove"
            color="negative"
            @click="deleteItem"
          >{{ $t('generic.buttons.delete') }}</ThemeButton>
        </ListItem>
      </q-card>
    </q-popup-proxy>
  </q-btn>
</template>

<script setup lang="ts">
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import { QBtnProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';

const { t: $t } = useI18n();

const props = defineProps<QBtnProps & {
  store: GenericItemStore;
  itemId: string;
  itemType: string;
}>();

async function deleteItem(): Promise<void>
{
  if(typeof props.store.removeItem !== 'function')
  {
    console.warn('Cannot delete item');
  }

	await props.store.removeItem({
    itemId: props.itemId,
    itemType: props.itemType,
	});
}
</script>

<style lang="postcss" scoped>
</style>
