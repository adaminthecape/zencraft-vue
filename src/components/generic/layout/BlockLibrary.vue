<template>
  <div class="standout-1 q-pa-sm q-ma-sm borad-6">
    <div class="standout-1 q-pa-sm borad-6 q-mb-sm row items-center full-width">
      <q-input
        v-model="searchTerm"
        v-bind="themeStore.getDefaultQuasarProps"
        :label="$t('blocks.library.title')"
        class="full-width"
        :debounce="500"
        autofocus
        @update:model-value="searchDefinitions"
      >
        <template #append>
          <ThemeIcon
            name="search"
          />
        </template>
      </q-input>
      <div class="q-space" />
    </div>
    <div
      class="block-library-container standout-1 q-pa-sm borad-6 row wrap"
      :style="{
        gridTemplateColumns: `repeat(auto-fit, minmax(calc(${
          ($q.screen.width / numColumnsToShow)
        }px - 100px), 1fr))`
      }"
    >
      <div
        v-for="blockDef in searchResults"
        :key="`block-library-item-${blockDef.id}`"
        class="cursor-pointer standout-2 q-pa-sm q-ma-sm block-definition-card borad-6"
      >
        <div
          class="text-bold lato-bold q-mb-sm"
          style="font-size: 1.1em"
        >{{ $t(`blocks.types.${blockDef.blockType}.title`) }}</div>
        <div
          class="text-caption block-definition-card-description"
        >{{ $t(`blocks.types.${blockDef.blockType}.description`) }}</div>
        <div class="q-space" />
        <div class="row items-center full-width">
          <div class="q-space" />
          <ThemeButton
            color="positive"
            class="q-mr-xs"
            outline
          >{{ $t('blocks.library.moreInfo') }}</ThemeButton>
          <ThemeButton
            color="positive"
            @click="() => selectDefinition(blockDef.id)"
          >{{ $t('blocks.library.selectBlock') }}</ThemeButton>
        </div>
      </div>
    </div>
    <div class="full-width row items-center q-mt-sm">
      <q-pagination
        v-model="computedPage"
        :max="paginationHandler.totalPages"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import useThemeStore from 'src/pinia/themeStore';
import { dbFilters, dbPagination, Blueprint, sharedTypes } from 'zencraft-core';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const { t: $t } = useI18n();
const $q = useQuasar();

const themeStore = useThemeStore();

const selectedBlueprintId = ref<string | undefined>();

const blueprintStore = deriveStoreForItemType(sharedTypes.KnownItemType.Blueprint);

const emit = defineEmits<{
  (name: 'selectedId', e: string): void;
}>();

function selectDefinition(id: string)
{
  selectedBlueprintId.value = id;
  emit('selectedId', id);
}

const numColumnsToShow = computed(() => (
  Math.floor($q.screen.width / 350)
));

const searchTerm = ref('');
const searchResults = ref<Blueprint.BlueprintItem[]>([]);
const paginationHandler = ref(new dbPagination.PaginationHandler({}));
const pagination = computed(() => paginationHandler.value.pagination);
const searchFilters = computed<dbFilters.DbFilters | undefined>(() => (
  searchTerm.value ?
    [
      {
        group: dbFilters.DbFilterGroupType.or,
        children: [
          {
            key: 'title',
            operator: dbFilters.DbFilterOperator.fuzzyEqual,
            value: searchTerm.value,
          },
          {
            key: 'name',
            operator: dbFilters.DbFilterOperator.fuzzyEqual,
            value: searchTerm.value,
          },
          {
            key: 'blockType',
            operator: dbFilters.DbFilterOperator.fuzzyEqual,
            value: searchTerm.value,
          },
        ]
      }
    ] :
    undefined
));

async function searchDefinitions()
{
  const {
    results,
    totalItems,
    hasMore,
  } = await blueprintStore.searchItems({
    itemType: sharedTypes.KnownItemType.Blueprint,
    filters: searchFilters.value,
    pagination: pagination.value,
  });

  paginationHandler.value.setTotal(totalItems);

  if(Array.isArray(results))
  {
    searchResults.value = results as Blueprint.BlueprintItem[];
  }
}

onMounted(searchDefinitions);

const computedPage = computed<number>({
  get()
  {
    return paginationHandler.value.pagination.page ?? 1;
  },
  set(newVal: number)
  {
    paginationHandler.value.setPage(newVal);
    searchDefinitions();
  }
});

</script>

<style lang="postcss" scoped>
.block-library-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  grid-auto-rows: 200px;
  grid-gap: 5px;
}

.block-definition-card {
  display: flex;
  flex-direction: column;
}

.block-definition-card-description {
  min-height: 3rem;
  max-height: 3rem;
}
</style>
