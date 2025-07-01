<template>
  <div class="item-search-container">
    <div class="item-search-opts-activator">
      <slot
        name="filters"
        v-bind="{ filters, updateFilters, search }"
      >
        <q-btn-dropdown
          v-if="!disallowChangingFilters"
          outline
          dense
          dropdown-icon="fas fa-cog"
          color="accent"
        >
          <template
            v-if="isSearching"
            #label
          >
            <q-spinner />
          </template>
          <SimpleModal>
            <template #activator="{ open }">
              <ListItem
                clickable
                @click="open"
              >
                <div class="row items-center">
                  <ThemeIcon
                    name="fas fa-arrow-down-wide-short"
                    class="q-mr-sm"
                  />
                  <span>$t('forms.itemFilters.configure')</span>
                </div>
              </ListItem>
            </template>
            <template #content>
              <ItemSearchFilters
                :item-type="itemType"
                :initial-value="filters"
                @change="updateFilters"
              />
            </template>
          </SimpleModal>
          <ListItem
            clickable
            @click="search"
          >
            <div class="row items-center">
              <ThemeIcon
                name="fas fa-magnifying-glass-arrow-right"
                class="q-mr-sm"
              />
              <span>Run search</span>
            </div>
          </ListItem>
        </q-btn-dropdown>
      </slot>
    </div>
    <slot
      name="header"
      v-bind="{ filters, updateFilters, search }"
    >
      <h4 class="q-mb-sm q-pa-md">
&nbsp;
      </h4>
    </slot>
    <slot
      name="results"
      v-bind="{ filters, results, isSearching, updateFilters }"
    >
      <ItemSearchResultTable
        :store="(store as any)"
        :results="results"
        :custom-fields="customTableFields"
        :quasar-pagination="qPagination"
        @update:filters="updateFilters"
        @update:pagination:quasar="updatePaginationForSearch"
        @result-clicked="onResultClicked"
      >
        <template #body-cell-createdAt="ctx">
          {{ ctx.row }}
        </template>
        <template #actions="{ row }">
          <slot
            name="tableActions"
            v-bind="{ row }"
          />
        </template>
        <template #defaultActions="{ row }">
          <slot
            name="tableDefaultActions"
            v-bind="{ row }"
          />
        </template>
      </ItemSearchResultTable>
    </slot>
    <div
      v-if="useCustomPagination"
      class="row items-center justify-center full-width"
    >
      <slot
        name="pagination"
        v-bind="{ updatePaginationForSearch, qPagination }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { dbFilters, dbPagination, fields } from 'zencraft-core';
import { computed, onMounted, watch } from 'vue';
import SimpleModal from 'src/components/ui/SimpleModal.vue';
import ItemSearchFilters from 'src/components/generic/search/ItemSearchFilters.vue';
import ItemSearchResultTable, { ItemResultClick } from 'src/components/generic/search/ItemSearchResultTable.vue';
import { QTableProps } from 'quasar';
import { StoreTypes } from 'src/logic/utils/stores';
import useItemSearch from 'src/composables/useItemSearch';
import ListItem from 'src/components/ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

export type ItemSearchProps = {
  itemType: string;
  store?: StoreTypes;
  initialFilters?: dbFilters.DbFilters;
  hardcodedFilters?: dbFilters.DbFilters;
  initialPagination?: dbPagination.DbPaginationOpts;
  disallowChangingFilters?: boolean;
  keepResultsWhileSearching?: boolean;
  useCustomPagination?: boolean;
  customTableFields?: fields.FieldData[];
};

const props = defineProps<ItemSearchProps>();

const {
	isSearching,
	filterHandler,
	filters,
	paginationHandler,
	search,
	results,
	updateFilters,
} = useItemSearch({
	itemType: props.itemType,
	initialFilters: props.initialFilters,
	initialPagination: props.initialPagination,
});

const qPagination = computed(() => paginationHandler.value.getQuasarPagination());

function updatePaginationForSearch(newPagination: QTableProps['pagination']): void
{
	if(!newPagination) return;

	if(Number.isInteger(newPagination.page))
	{
		paginationHandler.value.setPage(newPagination.page as number);
	}

	if(Number.isInteger(newPagination.rowsPerPage))
	{
		paginationHandler.value.setPageSize(newPagination.rowsPerPage as number);
	}

	if(newPagination.sortBy)
	{
		paginationHandler.value.setSort(newPagination.sortBy);
	}

	search();
}

// const store = ref<StoreTypes>(props.store);

// onMounted(async () =>
// {
//   if(props.itemType && !props.store)
//   {
//     store.value = deriveStoreForItemType(props.itemType);
//   }
// });

function deriveFilters(newFilters?: dbFilters.DbFilters)
{
	let filterHashes: string[] = [];

	const filtersToUse = [
		...(newFilters || []),
		...(props.hardcodedFilters || []),
		...(Object.values(props.initialFilters || [])),
	].reduce((
		agg: dbFilters.DbFilters,
		filter: any
	) =>
	{
		if(dbFilters.isGroupFilter(filter))
		{
			agg.push(filter);

			return agg;
		}
		else if(dbFilters.isSingleFilter(filter))
		{
			const hash = `${filter.key}_${filter.operator}`;

			if(!filterHashes.includes(hash))
			{
				filterHashes.push(hash);

				agg.push(filter);
			}
		}

		return agg;
	}, []);

	filterHashes = [];

	return filtersToUse;
}

onMounted(() =>
{
	if(props.initialFilters)
	{
		search();
	}
});

function mergeUpdatedFilters(n: dbFilters.DbFilters | undefined)
{
	if(Array.isArray(n))
	{
		updateFilters(
			filterHandler.value.mergeFilters([filters.value, n])
				.filter((f) => dbFilters.isGroupFilter(f) || f.value)
		);
	}
}

watch(() => props.initialFilters, mergeUpdatedFilters);
watch(() => props.hardcodedFilters, mergeUpdatedFilters);

const emit = defineEmits<{
  (e: 'resultClicked', value: ItemResultClick): void
}>();

function onResultClicked(e: ItemResultClick)
{
	emit('resultClicked', e);
}
</script>

<style lang="postcss" scoped>
.item-search-container {
	background-color: var(--q-neutral10);
	border-radius: 6px;
	position: relative;
	min-height: 10rem;
}

.item-search-opts-activator {
	position: absolute;
	top: 8px;
	right: 8px;
}
</style>
