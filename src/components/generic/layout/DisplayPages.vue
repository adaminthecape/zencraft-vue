<template>
  <q-btn-group class="no-wrap" style="vertical-align: middle;">
      <ThemeButton
        v-for="page in pagesForModule"
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
          @click="(e) => helpStore.runIfNotOverlayMode(addPageToModule)(e)"
        />
      </HelpPopover>
    </q-btn-group>
</template>

<script setup lang="ts">
import { Module, sharedTypes, utils } from 'adam-firebase-tools';
import { computed, inject, onMounted } from 'vue';
import useModulePageNavigation from 'src/composables/useModulePageNavigation';
import { AppHelpers, UUID } from 'src/types/generic';
import useAdminStore from 'src/pinia/adminStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import useHelpStore, { HelpStore } from 'src/pinia/helpStore';
import HelpPopover from 'src/HelpPopover.vue';

const props = defineProps<{
  moduleId: Module.ModuleItem['id'];
}>();

const adminStore = useAdminStore();

const {
  moduleStore,
  pageStore,
  currentModule,
  currentPage,
  navigateToLayout,
} = useModulePageNavigation();

const pagesForModule = computed(() => (pageStore.allItems.filter((page) => (
  currentModule.value?.pageIds?.includes(page?.id as UUID)
))));

function onPageSelected(pageId: string): void
{
  pageStore.setSelectedPage(pageId);
  navigateToLayout({
    params: {
      moduleId: `${currentModule.value?.id}`,
      pageId: pageId,
    }
  });
}

const { editItem } = (inject('helpers') as AppHelpers['helpers']) || {};

async function addPageToModule()
{
  if(!currentModule.value || !currentPage.value?.id)
  {
    throw new Error(`No module found for page ${currentPage.value?.id}`);
  }

  // create the Page first
  const newPageId = utils.uuid.generateUuid();

  await pageStore.saveItem({
    id: newPageId,
    itemType: sharedTypes.KnownItemType.Page,
    data: {},
    isNew: true,
  });

  // attach the Page to its parent Module
  await moduleStore.saveItem({
    id: currentModule.value.id,
    itemType: sharedTypes.KnownItemType.Module,
    data: {
      pageIds: [
        ...(currentModule.value.pageIds || []),
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
    if(!currentPage.value && pagesForModule.value.length)
    {
      const selectedModule = moduleStore.getItem(
        props.moduleId,
        sharedTypes.KnownItemType.Module
      );

      if(!selectedModule)
      {
        console.log(`No data for module ${props.moduleId}`);

        return;
      }

      if(selectedModule.defaultPageId)
      {
        pageStore.setSelectedPage(selectedModule.defaultPageId);
      }
    }
  }, 500);
});

const helpStore = useHelpStore({})() as HelpStore;
</script>
