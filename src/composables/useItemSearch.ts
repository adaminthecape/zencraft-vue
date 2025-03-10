import { CustomItemStore, useCustomItemStore } from 'src/pinia/customItemStore';
import { dbFilters, dbPagination, utils } from 'zencraft-core';
import { DebouncedFunc } from 'lodash';
import debounce from 'lodash/debounce';
import { computed, ComputedRef, Ref, ref } from 'vue';

export default function useItemSearch(opts: {
  keepBlankFilters?: boolean;
  itemType: string;
  initialFilters?: dbFilters.DbFilters;
  initialPagination?: dbPagination.DbPaginationOpts;
}): ({
  itemStore: CustomItemStore;
  isSearching: Ref<boolean>;
  filterHandler: Ref<dbFilters.DbFilterHandler>;
  filters: Ref<dbFilters.DbFilters>;
  updateFilters: (filtersToUpdate: dbFilters.DbFilters) => void;
  paginationHandler: Ref<dbPagination.PaginationHandler>;
  computedPage: ComputedRef<number>;
  resultsArray: Ref<Array<Record<string, unknown>>>;
  results: Ref<Record<string, Record<string, unknown>>>;
  search: DebouncedFunc<() => Promise<void>>;
})
{
  const itemStore = useCustomItemStore({})();
  const isSearching = ref<boolean>(false);
  const resultsArray = ref<Array<Record<string, unknown>>>([]);
  const results = ref<Record<string, Record<string, unknown>>>({});

  const filterHandler = ref<dbFilters.DbFilterHandler>(
    new dbFilters.DbFilterHandler({
      filters: opts.initialFilters
    })
  );

  const filters = computed(() => (filterHandler.value.filters));

  function updateFilters(filtersToUpdate: dbFilters.DbFilters)
  {
    if(filtersToUpdate)
    {
      if(!opts.keepBlankFilters)
      {
        filterHandler.value.updateFilters(
          filtersToUpdate.filter((filter) => (
            dbFilters.isGroupFilter(filter) ||
            filter.value
          ))
        );
      }
      else
      {
        filterHandler.value.updateFilters(filtersToUpdate);
      }

      search();
    }
  }

  const paginationHandler = ref<dbPagination.PaginationHandler>(
    new dbPagination.PaginationHandler({
      initialValue: opts.initialPagination
    })
  );

  const computedPage = computed<number>({
    get()
    {
      return paginationHandler.value.pagination.page ?? 1;
    },
    set(newVal: number)
    {
      paginationHandler.value.setPage(newVal);
      search();
    }
  });

  const search = debounce(async function searchDebounce()
  {
    isSearching.value = true;

    if(!itemStore)
    {
      console.warn('No store available');

      return;
    }

    // console.log('search', JSON.stringify(filterHandler.value.filters), opts.initialFilters);

    const searchResultsObj = await itemStore.searchItems({
      itemType: opts.itemType,
      filters: filterHandler.value.filters,
      pagination: paginationHandler.value.pagination
    });

    const searchResults = searchResultsObj?.results;

    if(!Array.isArray(searchResults))
    {
      isSearching.value = false;
      resultsArray.value = [];
      results.value = {};

      return;
    }

    paginationHandler.value.setTotal(searchResultsObj.totalItems);

    resultsArray.value = searchResults as Record<string, unknown>[];
    results.value = utils.genericUtils.reduceIntoAssociativeArray(resultsArray.value, 'id');

    isSearching.value = false;
  }, 150);

  return {
    itemStore,
    isSearching,
    filterHandler,
    filters,
    updateFilters,
    paginationHandler,
    computedPage,
    results,
    resultsArray,
    search,
  };
}
