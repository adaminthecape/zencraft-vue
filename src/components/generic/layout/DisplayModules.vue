<template>
  <div
    class="row items-center no-wrap full-width"
  >
    <q-btn
      :class="[$q.screen.gt.sm ? 'module-dropdown-desktop' : 'module-dropdown-mobile']"
      color="secondary"
      class="ellipsis"
      style="max-width: 200px"
      :label="selectedModule?.title || '. . .'"
      square
      unelevated
      auto-close
    >
      <q-menu auto-close>
        <q-list>
          <ListItem
            v-for="module in allModules"
            :key="`module-item-${module.id}`"
            v-close-popup
            clickable
            @click.stop.prevent="() => onItemClick(module)"
          >
            <template #label><span>{{ module?.title }}</span></template>
            <template #avatar>
              <q-avatar
                :icon="(module as any)?.icon || 'folder'"
                color="primary"
                text-color="white"
              />
            </template>
            <template #right v-if="(module as any)?.sideIcon">
              <ThemeIcon
                :name="(module as any)?.sideIcon"
                color="amber"
              />
            </template>
          </ListItem>
        </q-list>
      </q-menu>
    </q-btn>
    <DisplayPages
      v-if="selectedModule?.id"
      :module-id="selectedModule?.id"
      style="flex-grow: 100"
    />
  </div>
</template>

<script setup lang="ts">
import { Module, sharedTypes, utils } from 'zencraft-core';
import { computed, onMounted } from 'vue';
import DisplayPages from './DisplayPages.vue';
import useModulePageNavigation from 'src/composables/useModulePageNavigation';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import ListItem from 'src/components/ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const customItemStore = useCustomItemStore({})();

onMounted(async () =>
{
  await customItemStore.searchItems({
    itemType: 'Module'
  });
});

const $q = useQuasar();

const {
  moduleStore,
  pageStore,
  currentModule,
  currentPage,
  navigateToLayout,
  navigateToDefaultLayout,
  getLastVisitedLayout,
} = useModulePageNavigation();

// const allModules = computed(() => (moduleStore.allItems));
const allModules = computed(() => (customItemStore.getItemsByType(
  sharedTypes.KnownItemType.Module
)));

const selectedModule = computed(() => (
  typeof moduleStore.selectedModule === 'string' ?
    moduleStore.getItem(
      moduleStore.selectedModule,
      sharedTypes.KnownItemType.Module
    ) :
    undefined
));

const route = useRoute();

onMounted(async () =>
{
  await moduleStore?.searchItems({
    itemType: sharedTypes.KnownItemType.Module
  });

  setTimeout(() =>
  {
    const moduleValid = utils.uuid.isUuid(currentModule.value?.id);
    const pageValid = utils.uuid.isUuid(currentPage.value?.id);

    if(!moduleValid && !pageValid)
    {
      const savedLocation = getLastVisitedLayout();

      if(savedLocation)
      {
        return navigateToLayout(savedLocation);
      }
    }

    if(moduleValid)
    {
      moduleStore.setSelectedModule(currentModule.value?.id as string);
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
  if(selectedModule.value?.id && selectedModule.value.defaultPageId)
  {
    navigateToLayout({
      params: {
        moduleId: selectedModule.value.id,
        pageId: selectedModule.value.defaultPageId
      }
    });
  }
}

function onItemClick(module: Module.ModuleItem)
{
  moduleStore.setSelectedModule(module.id);

  if(module.defaultPageId)
  {
    pageStore.setSelectedPage(module.defaultPageId);
  }

  onMainClick();
}
</script>

<style lang="css" scoped>
.module-dropdown-desktop {
  min-width: 10rem;
}

.module-dropdown-mobile {
  min-width: 4rem;
}
</style>
