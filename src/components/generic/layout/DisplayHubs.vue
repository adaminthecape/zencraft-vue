<template>
  <div
    class="row items-center no-wrap full-width"
  >
    <q-btn
      :class="[$q.screen.gt.sm ? 'hub-dropdown-desktop' : 'hub-dropdown-mobile']"
      color="secondary"
      class="ellipsis"
      style="max-width: 200px"
      :label="selectedHub?.title || '. . .'"
      square
      unelevated
      auto-close
    >
      <q-menu auto-close>
        <q-list>
          <ListItem
            v-for="hub in allHubs"
            :key="`hub-item-${hub.id}`"
            v-close-popup
            clickable
            @click.stop.prevent="() => onItemClick(hub)"
          >
            <template #label><span>{{ hub?.title }}</span></template>
            <template #avatar>
              <q-avatar
                :icon="(hub as any)?.icon || 'folder'"
                color="primary"
                text-color="white"
              />
            </template>
            <template #right v-if="(hub as any)?.sideIcon">
              <ThemeIcon
                :name="(hub as any)?.sideIcon"
                color="amber"
              />
            </template>
          </ListItem>
        </q-list>
      </q-menu>
    </q-btn>
    <DisplayPages
      v-if="selectedHub?.id"
      :hub-id="selectedHub?.id"
      style="flex-grow: 100"
    />
  </div>
</template>

<script setup lang="ts">
import { Hub, sharedTypes, utils } from 'zencraft-core';
import { computed, onMounted } from 'vue';
import DisplayPages from './DisplayPages.vue';
import useHubPageNavigation from 'src/composables/useHubPageNavigation';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import ListItem from 'src/components/ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const customItemStore = useCustomItemStore({})();

onMounted(async () =>
{
  await customItemStore.searchItems({
    itemType: 'Hub'
  });
});

const $q = useQuasar();

const {
  hubStore,
  pageStore,
  currentHub,
  currentPage,
  navigateToLayout,
  navigateToDefaultLayout,
  getLastVisitedLayout,
} = useHubPageNavigation();

// const allHubs = computed(() => (hubStore.allItems));
const allHubs = computed(() => (customItemStore.getItemsByType(
  sharedTypes.KnownItemType.Hub
)));

const selectedHub = computed(() => (
  typeof hubStore.selectedHub === 'string' ?
    hubStore.getItem(
      hubStore.selectedHub,
      sharedTypes.KnownItemType.Hub
    ) :
    undefined
));

const route = useRoute();

onMounted(async () =>
{
  await hubStore?.searchItems({
    itemType: sharedTypes.KnownItemType.Hub
  });

  setTimeout(() =>
  {
    const hubValid = utils.uuid.isUuid(currentHub.value?.id);
    const pageValid = utils.uuid.isUuid(currentPage.value?.id);

    if(!hubValid && !pageValid)
    {
      const savedLocation = getLastVisitedLayout();

      if(savedLocation)
      {
        return navigateToLayout(savedLocation);
      }
    }

    if(hubValid)
    {
      hubStore.setSelectedHub(currentHub.value?.id as string);
    }

    if(pageValid)
    {
      pageStore.setSelectedPage(currentPage.value?.id as string);
    }
    else
    {
      navigateToDefaultLayout();
    }
  }, 200);
});

function onMainClick()
{
  if(selectedHub.value?.id && selectedHub.value.defaultPageId)
  {
    navigateToLayout({
      params: {
        hubId: selectedHub.value.id,
        pageId: selectedHub.value.defaultPageId
      }
    });
  }
}

function onItemClick(hub: Hub.HubItem)
{
  hubStore.setSelectedHub(hub.id);

  if(hub.defaultPageId)
  {
    pageStore.setSelectedPage(hub.defaultPageId);
  }

  onMainClick();
}
</script>

<style lang="css" scoped>
.hub-dropdown-desktop {
  min-width: 10rem;
}

.hub-dropdown-mobile {
  min-width: 4rem;
}
</style>
