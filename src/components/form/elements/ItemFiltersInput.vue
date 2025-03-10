<template>
  <div class="q-my-sm">
    <ItemSearchFilters
      v-if="(selectedItemType || field.itemType)"
      :key="`item-search-filters-input-${selectedItemType}`"
      :item-type="(selectedItemType || field.itemType)"
      :initial-value="(modelProxy as any)"
      :title="(field.label || field.key || undefined)"
      @change="updateValue"
    >
      <template #itemTypeSelector>
        <q-select
          v-model="selectedItemType"
          :options="allItemTypes"
          label="Item Type"
          filled
          dense
        />
        <q-separator class="q-my-sm" />
      </template>
    </ItemSearchFilters>
    <slot name="append" />
  </div>
</template>

<script setup lang="ts">
import ItemSearchFilters from 'src/components/generic/search/ItemSearchFilters.vue';
import { QInputProps, QSelectProps } from 'quasar';
import useFormElement from 'src/composables/useFormElement';
import { computed, ref } from 'vue';
import { dbFilters, fields, sharedTypes } from 'zencraft-core';
import { GenericItemStore } from 'src/pinia/genericItemStore';
import { ItemHandlerType } from 'src/logic/utils/items';
import { useCustomItemStore } from 'src/pinia/customItemStore';

type ModelType = dbFilters.DbFilters | null | undefined;

const props = defineProps<{
  itemId?: string;
  itemType?: string;
  store?: GenericItemStore;
  itemHandler?: ItemHandlerType | undefined;
  field: fields.Field | fields.FieldData;
  initialValue?: ModelType;
  type?: QInputProps['type'];
  includeDefinitionFields?: boolean;
  qProps?: QSelectProps;
}>();
const emit = defineEmits<{ (e: 'changed', value: ModelType): void; }>();

const input = ref();
const isErrored = computed(() => (input as any)?.value?.hasError);

const {
  modelProxy,
  updateValue,
} = useFormElement<ModelType>({
  props,
  emit
});

const selectedItemType = ref<string>();

const customItemStore = useCustomItemStore({})();

const allItemTypes = computed(() => ([
  ...Object.values(sharedTypes.KnownItemType),
  ...Object.keys(customItemStore.definitionFieldsMap)
]));
</script>

<style lang="postcss" scoped>
</style>
