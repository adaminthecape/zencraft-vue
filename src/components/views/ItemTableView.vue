<template>
  <ItemSearch
    v-if="itemTypeRef"
    :item-type="(itemTypeRef)"
    :key="`item-table-${itemTypeRef}-${storeName}`"
    :store="(storeToUse as any)"
    :custom-table-fields="fieldsForItemType"
  >
    <template #header>
      <div class="q-mb-sm q-ml-md row items-center">
        <EditNewOrExistingItemModal
          :item-type="(itemTypeRef)"
        />
        <h4 class="q-ml-sm row items-center">
          <ThemeIcon
            :name="itemTypeIcons[itemTypeRef] ?? 'edit'"
            class="q-mr-sm"
            color="primary"
          />
          <span>{{ itemTypeRef }}s</span>
        </h4>
      </div>
    </template>
  </ItemSearch>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import ItemSearch from '../generic/search/ItemSearch.vue';
import { computed, onBeforeMount } from 'vue';
import { deriveStoreForItemType, StoreTypes } from 'src/logic/utils/stores';
import EditNewOrExistingItemModal from '../generic/items/EditNewOrExistingItemModal.vue';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import { itemTypeIcons } from 'src/models/BlockTypes';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const route = useRoute();

const storeName = computed(() => storeToUse.value?.$id);

const itemTypeRef = computed<string | undefined>(() => (
  route.params.itemType ? `${route.params.itemType}` : undefined
));
const { fieldsForItemType } = useFieldsForItemType({ itemTypeRef });

const storeToUse = computed<StoreTypes>(() => (
  deriveStoreForItemType(itemTypeRef.value)
));

onBeforeMount(async () =>
{
  if(storeToUse.value)
  {
    const definitionStore = useCustomItemStore({})();

    await definitionStore.loadDefinitions();
  }
});
</script>
