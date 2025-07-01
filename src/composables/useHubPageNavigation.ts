import { HubStore } from 'src/pinia/hubStore';
import { PageStore } from 'src/pinia/pageStore';
import { Hub, Page, sharedTypes, utils } from 'zencraft-core';
import { computed, ComputedRef, onMounted } from 'vue';
import { RouteLocation, useRoute, useRouter } from 'vue-router';
import { deriveStoreForItemType } from 'src/logic/utils/stores';

export type LayoutParams = {
  hubId: Hub.HubItem['id'];
  pageId: Page.PageItem['id'];
};

export default function useHubPageNavigation(): ({
	hubStore: HubStore;
  pageStore: PageStore;
  currentPage: ComputedRef<Page.PageItem | undefined>;
  currentHub: ComputedRef<Hub.HubItem | undefined>;
  navigateToLayout: (opts: Partial<RouteLocation>) => Promise<void>;
  navigateToDefaultLayout: () => Promise<void>;
  getLastVisitedLayout: () => Partial<RouteLocation> | undefined;
  setLastVisitedLayout: (opts: Partial<RouteLocation>) => void;
})
{
	const hubStore = deriveStoreForItemType(sharedTypes.KnownItemType.Hub) as HubStore;
	const pageStore = deriveStoreForItemType(sharedTypes.KnownItemType.Page) as PageStore;

	const route = useRoute();

	// get the current page/hub
	const currentHubId = computed(() => (route.params?.hubId));
	const currentPageId = computed(() => (route.params?.pageId));
	const currentHub = computed(() => (
		typeof currentHubId.value === 'string' ?
			hubStore.getItem(
				currentHubId.value,
				sharedTypes.KnownItemType.Hub
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
		// TODO: convert hub/page IDs to slugs

		if(!opts.params?.hubId)
		{
			console.warn(`Hub id is required, got ${opts.params?.hubId}`);

			return;
		}

		let pageId = opts.params?.pageId as string | undefined;

		if(!pageId && currentHub.value?.defaultPageId)
		{
			pageId = pageStore.getItem(
				currentHub.value.defaultPageId,
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
				hubId: opts.params?.hubId,
				pageId: pageId,
			}
		};

		if(utils.uuid.isUuid(opts.params?.hubId))
		{
			hubStore.setSelectedHub(opts.params.hubId);
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
		// check for default hub & its default page
		const defaultHubId = hubStore.allItemIds?.[0];

		if(!defaultHubId)
		{
			return;
		}

		hubStore.setSelectedHub(defaultHubId);

		const defaultPageId = hubStore.getItem(
			defaultHubId,
			sharedTypes.KnownItemType.Hub
		)?.defaultPageId;

		if(!defaultPageId)
		{
			return;
		}

		pageStore.setSelectedPage(defaultPageId);

		return navigateToLayout({
			params: {
				hubId: defaultHubId,
				pageId: defaultPageId,
			}
		});
	}

	onMounted(async () =>
	{
		if(!hubStore.allItemIds?.length)
		{
			await hubStore.loadAllItems(sharedTypes.KnownItemType.Hub);
		}

		if(typeof currentHubId.value === 'string')
		{
			await hubStore.loadItem({
				id: currentHubId.value,
				itemType: sharedTypes.KnownItemType.Hub
			});

			if(currentHub.value?.pageIds?.length)
			{
				await pageStore.loadMultiple({
					ids: utils.genericUtils.uniq(currentHub.value.pageIds),
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
		hubStore,
		currentPage,
		currentHub,
		navigateToLayout,
		navigateToDefaultLayout,
		getLastVisitedLayout,
		setLastVisitedLayout,
	};
}
