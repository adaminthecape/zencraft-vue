<template>
  <q-btn-group
    class="no-wrap"
    style="vertical-align: middle;"
  >
    <ThemeButton
      v-for="page in pagesForHub"
      :key="`page-btn-${page.id}`"
      unelevated
      square
      style="border-radius: 0px;"
      :color="(currentPage?.id === page.id) ? 'primary' : undefined"
      @click="() => onPageSelected(page.id)"
    >
      <span>{{ page.title }}</span>
      <ThemeButton
        icon="edit"
        color="positive"
        size="xs"
        class="q-ml-sm"
        round
        @click.stop.prevent="(() =>
        {
          editItem({ id: page.id, typeId: sharedTypes.KnownItemType.Page });
        })"
      />
    </ThemeButton>
    <div class="q-space" />
    <HelpPopover i18n-key="addPageButton">
      <ThemeButton
        v-if="adminStore.isEditMode"
        icon="add"
        color="accent"
        square
        style="border-radius: 0px;"
        @click="(e) => helpStore.runIfNotOverlayMode(addPageToHub)(e)"
      />
    </HelpPopover>
  </q-btn-group>
</template>

<script setup lang="ts">
import { Hub, sharedTypes, utils } from 'zencraft-core';
import { computed, inject, onMounted } from 'vue';
import useHubPageNavigation from 'src/composables/useHubPageNavigation';
import { AppHelpers, UUID } from 'src/types/generic';
import useAdminStore from 'src/pinia/adminStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import useHelpStore, { HelpStore } from 'src/pinia/helpStore';
import HelpPopover from 'src/HelpPopover.vue';

const props = defineProps<{
  hubId: Hub.HubItem['id'];
}>();

const adminStore = useAdminStore();

const {
	hubStore,
	pageStore,
	currentHub,
	currentPage,
	navigateToLayout,
} = useHubPageNavigation();

const pagesForHub = computed(() => (pageStore.allItems.filter((page) => (
	currentHub.value?.pageIds?.includes(page?.id as UUID)
))));

function onPageSelected(pageId: string): void
{
	pageStore.setSelectedPage(pageId);
	navigateToLayout({
		params: {
			hubId: `${currentHub.value?.id}`,
			pageId: pageId,
		}
	});
}

const { editItem } = (inject('helpers') as AppHelpers['helpers']) || {};

async function addPageToHub()
{
	if(!currentHub.value || !currentPage.value?.id)
	{
		throw new Error(`No hub found for page ${currentPage.value?.id}`);
	}

	// create the Page first
	const newPageId = utils.uuid.generateUuid();

	await pageStore.saveItem({
		id: newPageId,
		itemType: sharedTypes.KnownItemType.Page,
		data: {},
		isNew: true,
	});

	// attach the Page to its parent Hub
	await hubStore.saveItem({
		id: currentHub.value.id,
		itemType: sharedTypes.KnownItemType.Hub,
		data: {
			pageIds: [
				...(currentHub.value.pageIds || []),
				newPageId
			]
		},
	});

	// open the editing panel for the Page
	editItem({
		id: newPageId,
		typeId: sharedTypes.KnownItemType.Page,
	});
}

onMounted(async () =>
{
	await pageStore?.searchItems({
		itemType: sharedTypes.KnownItemType.Page
	});

	setTimeout(() =>
	{
		if(!currentPage.value && pagesForHub.value.length)
		{
			const selectedHub = hubStore.getItem(
				props.hubId,
				sharedTypes.KnownItemType.Hub
			);

			if(!selectedHub)
			{
				console.log(`No data for hub ${props.hubId}`);

				return;
			}

			if(selectedHub.defaultPageId)
			{
				pageStore.setSelectedPage(selectedHub.defaultPageId);
			}
		}
	}, 500);
});

const helpStore = useHelpStore({})() as HelpStore;
</script>
