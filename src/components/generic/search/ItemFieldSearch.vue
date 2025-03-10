<template>
  <div>
    <ItemSearch
      ref="searchContainer"
      :item-type="itemType"
      :store="(store as any)"
      :keep-results-while-searching="keepResultsWhileSearching"
      :hardcoded-filters="hardcodedFilters"
      :custom-table-fields="searchField ? [
        // defaultItemFields.id,
        ...(searchableFields || [])
      ] : undefined"
    >
      <template #filters>
        <div></div>
      </template>
      <template #tableDefaultActions="{ row }">
        <!-- ACTIONS: -->
        <!-- Pick item -->
        <ThemeButton
          icon="check_circle"
          color="positive"
          flat
          @click="() => selectItem(row)"
        ><q-tooltip>Select item</q-tooltip></ThemeButton>
        <!-- View item details -->
        <EditNewOrExistingItemModal
          v-if="row.id"
          :item-type="row.typeId"
          :existing-item-id="row.id"
          :q-props="{
            readonly: true,
            disable: true,
          }"
        />
      </template>
      <template #header="{ updateFilters }">
        <q-card class="q-mb-sm standout-1" flat>
          <ListItem>
            <!-- Filters to be filled out by user -->
            <div v-if="searchField" class="row items-center full-width">
              <ThemeButton
                :icon="showAllFields ? 'visibility_off' : 'visibility'"
                class="q-mb-sm q-mr-sm"
                flat
                @click="showAllFields = !showAllFields"
              ><q-tooltip>{{showAllFields ? 'Hide' : 'Show'}} extra fields</q-tooltip></ThemeButton>
              <FormFields
                v-model="filterFormData"
                :form-fields="[searchField]"
                style="flex-grow: 10"
                @update:model-value="($event) => updateFilters(convertFormFieldsToFilters($event))"
              />
              <div class="q-space" />
              <q-select
                v-model="restrictByItemType"
                v-bind="themeStore.getDefaultQuasarProps"
                :options="allItemTypes"
              />
            </div>
            <!-- TODO: Properly implement user-friendly search filters -->
            <ItemSearchFilters
              v-else
              :title="''"
              :item-type="itemType"
              :initial-value="initialFilters"
              @change="updateFilters"
            />
          </ListItem>
        </q-card>
      </template>
    </ItemSearch>
  </div>
</template>

<script setup lang="ts">
import { dbFilters, sharedTypes } from 'adam-firebase-tools';
import { ref, computed, watch } from 'vue';
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import ItemSearch from './ItemSearch.vue';
import ItemSearchFilters from './ItemSearchFilters.vue';
import FormFields from 'src/components/form/FormFields.vue';
import EditNewOrExistingItemModal from '../items/EditNewOrExistingItemModal.vue';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import useThemeStore from 'src/pinia/themeStore';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';

const themeStore = useThemeStore();

const customItemStore = useCustomItemStore({})();

const allItemTypes = computed(() => ([
  ...Object.values(sharedTypes.KnownItemType),
  ...Object.keys(customItemStore.definitionFieldsMap)
]));

const props = defineProps<{
  store: GenericItemStore;
  itemType: string;
	initialFilters?: dbFilters.DbFilters;
	disallowChangingFilters?: boolean;
	keepResultsWhileSearching?: boolean;
}>();

const itemTypeRef = computed(() => (props.itemType));
const { fieldsForItemType } = useFieldsForItemType({ itemTypeRef });

const showAllFields = ref(false);

const searchableFields = computed(() => (
  showAllFields.value ?
    fieldsForItemType.value :
    fieldsForItemType.value?.filter((f) => (f.isSearchable))
));

const searchField = computed(() =>
{
  if(!Array.isArray(fieldsForItemType.value))
  {
    return undefined;
  }

  const primarySearchField = fieldsForItemType.value.find((f) => (
    f.isPrimarySearchField
  ));

  if(primarySearchField)
  {
    return primarySearchField;
  }

  const otherSearchFields = fieldsForItemType.value.filter((f) => (
    f.isSearchable
  ));

  if(otherSearchFields.length)
  {
    return otherSearchFields[0];
  }

  return fieldsForItemType.value[0];
});

const filterFormData = ref({});

const itemTypeFilter = ref({
  key: 'typeId',
  operator: dbFilters.DbFilterOperator.isEqual,
  value: props.itemType
});

const restrictByItemType = ref<string | undefined>();

const restrictByItemTypeFilter = computed(() =>
{
  if(props.itemType && restrictByItemType.value)
  {
    switch(props.itemType)
    {
      case sharedTypes.KnownItemType.Field:
        const fieldIds = customItemStore.getFieldIdsForItemType(
          restrictByItemType.value
        );

        if(!(Array.isArray(fieldIds) && fieldIds.length))
        {
          return undefined;
        }

        return {
          key: 'itemId',
          operator: dbFilters.DbFilterOperator.in,
          value: fieldIds
        };
      default:
        return undefined;
    }
  }

  return undefined;
});

const primaryFilterValue = computed(() => (
  (
    searchField.value?.key &&
    (filterFormData.value as any)?.[searchField.value.key]
  ) ? (filterFormData.value as any)?.[searchField.value.key] : undefined
));

const primaryFilter = computed(() => (
  !primaryFilterValue.value ? undefined : {
    key: searchField.value?.key,
    operator: dbFilters.DbFilterOperator.fuzzyEqual,
    value: primaryFilterValue.value
  }
));

const hardcodedFilters = ref();

function setCombinedFilters()
{
  hardcodedFilters.value = [
    itemTypeFilter.value,
    restrictByItemTypeFilter.value,
    primaryFilter.value,
  ].filter((f) => f);
}

watch(restrictByItemType, setCombinedFilters);
// watch(primaryFilterValue, setCombinedFilters);

const emit = defineEmits<{
  (e: 'selectedItem', value: Record<string, unknown>): void;
}>();

function selectItem(itemData: Record<string, unknown>): void
{
  emit('selectedItem', itemData);
}

const customOperators = ref<Record<string, string>>({});

function convertFormFieldsToFilters(formData: Record<string, unknown>)
{
  const result: dbFilters.DbFilters = [];

  Object.entries(formData).forEach(([key, value]) =>
  {
    if(value)
    {
      const operator = (
        (customOperators as Record<string, unknown>)[key] ||
        dbFilters.DbFilterOperator.fuzzyEqual
      );

      result.push({ key, operator, value });
    }
  });

  return result;
}
</script>

<style lang="postcss" scoped>
</style>
