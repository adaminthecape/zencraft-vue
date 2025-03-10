import { ModuleStore } from 'src/pinia/moduleStore';
import { PageStore } from 'src/pinia/pageStore';
import { Module, Page, sharedTypes, utils } from 'adam-firebase-tools';
import { computed, ComputedRef, onMounted } from 'vue';
import { RouteLocation, useRoute, useRouter } from 'vue-router';
import { deriveStoreForItemType } from 'src/logic/utils/stores';

export type LayoutParams = {
  moduleId: Module.ModuleItem['id'];
  pageId: Page.PageItem['id'];
};

export default function useModulePageNavigation(): ({
	moduleStore: ModuleStore;
  pageStore: PageStore;
  currentPage: ComputedRef<Page.PageItem | undefined>;
  currentModule: ComputedRef<Module.ModuleItem | undefined>;
  navigateToLayout: (opts: Partial<RouteLocation>) => Promise<void>;
  navigateToDefaultLayout: () => Promise<void>;
  getLastVisitedLayout: () => Partial<RouteLocation> | undefined;
  setLastVisitedLayout: (opts: Partial<RouteLocation>) => void;
})
{
	const moduleStore = deriveStoreForItemType(sharedTypes.KnownItemType.Module) as ModuleStore;
  const pageStore = deriveStoreForItemType(sharedTypes.KnownItemType.Page) as PageStore;

  const route = useRoute();

  // get the current page/module
  const currentModuleId = computed(() => (route.params?.moduleId));
  const currentPageId = computed(() => (route.params?.pageId));
  const currentModule = computed(() => (
    typeof currentModuleId.value === 'string' ?
      moduleStore.getItem(
        currentModuleId.value,
        sharedTypes.KnownItemType.Module
      ) :
      undefined
  ));
  const currentPage = computed(() => (
    typeof currentPageId.value === 'string' ?
      pageStore.getItem(
        currentPageId.value,
        sharedTypes.KnownItemType.Page
      ) :
      undefined
  ));

  const router = useRouter();

  // allow changing the route sanely
  async function navigateToLayout(opts: Partial<RouteLocation>): Promise<void>
  {
    // TODO: convert module/page IDs to slugs

    if(!opts.params?.moduleId)
    {
      console.warn(`Module id is required, got ${opts.params?.moduleId}`);

      return;
    }

    let pageId = opts.params?.pageId as string | undefined;

    if(!pageId && currentModule.value?.defaultPageId)
    {
      pageId = pageStore.getItem(
        currentModule.value.defaultPageId,
        sharedTypes.KnownItemType.Page
      )?.id;
    }

    if(!pageId)
    {
      console.warn(`Page id is required, got ${pageId}`);

      return;
    }

    const newRoute = {
      name: 'viewLayout',
      params: {
        moduleId: opts.params?.moduleId,
        pageId: pageId,
      }
    };

    if(utils.uuid.isUuid(opts.params?.moduleId))
    {
      moduleStore.setSelectedModule(opts.params.moduleId);
    }

    if(pageId)
    {
      pageStore.setSelectedPage(pageId);
    }

    setLastVisitedLayout({
      name: newRoute.name,
      params: newRoute.params,
    });

    try
    {
      router.push(newRoute);
    }
    catch(e)
    {
      console.error(e);
    }
  }

  function getLastVisitedLayout(): Partial<RouteLocation> | undefined
  {
    const value = localStorage.getItem('last_visited_layout');

    try
    {
      if(typeof value === 'string')
      {
        return JSON.parse(value);
      }
    }
    catch(e: unknown)
    {
      console.log('Failed to get last visited layout:', e);
      return undefined;
    }
  }

  function setLastVisitedLayout(opts: Partial<RouteLocation>): void
  {
    localStorage.setItem('last_visited_layout', JSON.stringify(opts));
  }

  async function navigateToDefaultLayout()
  {
    // check for default module & its default page
    const defaultModuleId = moduleStore.allItemIds?.[0];

    if(!defaultModuleId)
    {
      return;
    }

    moduleStore.setSelectedModule(defaultModuleId);

    const defaultPageId = moduleStore.getItem(
      defaultModuleId,
      sharedTypes.KnownItemType.Module
    )?.defaultPageId;

    if(!defaultPageId)
    {
      return;
    }

    pageStore.setSelectedPage(defaultPageId);

    return navigateToLayout({
      params: {
        moduleId: defaultModuleId,
        pageId: defaultPageId,
      }
    });
  }

  onMounted(async () =>
  {
    if(!moduleStore.allItemIds?.length)
    {
      await moduleStore.loadAllItems(sharedTypes.KnownItemType.Module);
    }

    if(typeof currentModuleId.value === 'string')
    {
      await moduleStore.loadItem({
        id: currentModuleId.value,
        itemType: sharedTypes.KnownItemType.Module
      });

      if(currentModule.value?.pageIds?.length)
      {
        await pageStore.loadMultiple({
          ids: utils.genericUtils.uniq(currentModule.value.pageIds),
          itemType: sharedTypes.KnownItemType.Page,
        });
      }
    }

    if(typeof currentPageId.value === 'string')
    {
      await pageStore.loadItem({
        id: currentPageId.value,
        itemType: sharedTypes.KnownItemType.Page
      });
    }
  });

  return {
    pageStore,
    moduleStore,
    currentPage,
    currentModule,
    navigateToLayout,
    navigateToDefaultLayout,
    getLastVisitedLayout,
    setLastVisitedLayout,
	};
}
