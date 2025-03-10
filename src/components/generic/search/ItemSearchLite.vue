<template>
	<div class="item-search-container-lite">
		<div class="item-search-opts-activator-lite">
      <slot name="filters" v-bind="{ filters, search }">
      </slot>
		</div>
		<slot name="header" v-bind="{ filters, search }">
      <div v-if="title" class="text-h6 q-pa-sm">{{ title }}</div>
    </slot>
		<slot name="results" v-bind="{ filters, results, isSearching }">
      <q-list v-if="isSearching">
        <ListItem
          v-for="r in [...Array(paginationHandler.pagination.pageSize).keys()]"
          :key="`search-result-skeleton-${r}`"
          clickable
        >
          <template #label>
            <q-skeleton type="text" />
          </template>
          <template #caption>
            <q-skeleton type="text" />
          </template>
        </ListItem>
      </q-list>
      <q-list v-else>
        <ListItem
          v-for="(result, r) in results"
          :key="`search-result-${result.id}-${r}`"
          clickable
          :active="activeResultId === result.id"
          active-class="active-result"
          @click="() => onResultClicked({
            itemId: result.id,
            itemType: result.typeId,
            value: result,
          })"
        >
          <template #left v-if="result.typeId && itemTypeIcons[result.typeId]">
            <ThemeIcon :name="itemTypeIcons[result.typeId]" />
          </template>
          <template #label v-if="fieldKeysToShow.title">
            <span>{{ result[fieldKeysToShow.title] }}</span>
          </template>
          <template #caption v-if="fieldKeysToShow.caption">
            <span>{{ result[fieldKeysToShow.caption] }}</span>
          </template>
        </ListItem>
      </q-list>
    </slot>
    <div class="row items-center justify-center full-width">
      <slot name="pagination" v-bind="{ paginationHandler, computedPage }">
        <q-pagination
          v-model="computedPage"
          :max="paginationHandler.totalPages"
          input
        />
      </slot>
    </div>
	</div>
</template>

<script setup lang="ts">
import { dbFilters, dbPagination } from 'adam-firebase-tools';
import { ref, computed, onMounted, watch } from 'vue';
import { ItemResultClick } from 'src/components/generic/search/ItemSearchResultTable.vue';
import { StoreTypes } from 'src/logic/utils/stores';
import { itemTypeIcons } from 'src/models/BlockTypes';
import useItemSearch from 'src/composables/useItemSearch';
import ListItem from 'src/components/ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

export type ItemSearchProps = {
  itemType: string;
  title?: string;
  store?: StoreTypes;
  initialFilters?: dbFilters.DbFilters;
  initialPagination?: dbPagination.DbPaginationOpts;
  fieldKeys?: {
    title?: string;
    caption?: string;
    icon?: string;
  };
};

const props = defineProps<ItemSearchProps>();

const {
  // itemStore,
  isSearching,
  // filterHandler,
  filters,
  paginationHandler,
  computedPage,
  search,
  results,
  updateFilters,
} = useItemSearch({
  itemType: props.itemType,
  initialFilters: props.initialFilters,
  initialPagination: props.initialPagination,
});

watch(() => props.initialFilters, (n, o) =>
{
  if(n && (JSON.stringify(n) !== JSON.stringify(o || [])))
  {
    updateFilters(n);
  }
});

const fieldKeysToShow = computed(() =>
{
  return {
    title: props.fieldKeys?.title || 'title',
    caption: props.fieldKeys?.caption || 'id',
  };
});

onMounted(() =>
{
  isSearching.value = true;
  setTimeout(search, 150);
});

const activeResultId = ref();

const emit = defineEmits<{
  (e: 'resultClicked', value: ItemResultClick): void
}>();

function onResultClicked(e: ItemResultClick)
{
  console.log('result clicked', e);
  activeResultId.value = e?.itemId;
  emit('resultClicked', e);
}
</script>

<style lang="postcss" scoped>
.item-search-container-lite {
	background-color: var(--q-neutral10);
	border-radius: 6px;
	position: relative;
	min-height: 10rem;
}

.item-search-opts-activator-lite {
	position: absolute;
	top: 8px;
	right: 8px;
}

.body--light .active-result {
  /* border: 0.5px solid var(--q-primary); */
  /* border-left: 4px solid var(--q-primary); */
  background: rgba(250,250,250, 0.5);
  box-shadow: 0 4px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}

.body--dark .active-result {
  /* border: 0.5px solid var(--q-primary); */
  /* border-left: 4px solid var(--q-primary); */
  background: rgba(100,100,100, 0.25);
  box-shadow: 0 4px 3px rgba(250, 250, 250, 0.1);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}
</style>
