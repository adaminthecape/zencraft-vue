<template>
  <SimpleLayout headerBackgroundColor="var(--q-dark)">
    <template #header-title>
      <div>{{ $t('layouts.userFacingLayout.title') }}</div>
    </template>
    <template #header-right>
      <ThemeButton
        :color="adminStore.getIsEditMode ? 'negative' : 'accent'"
        :label="adminStore.getIsEditMode ? 'Stop Editing' : 'Edit'"
        :flat="!adminStore.getIsEditMode"
        class="q-mr-sm"
        icon="fas fa-pencil"
        @click="() => adminStore.setEditMode(!adminStore.getIsEditMode)"
      />
      <!-- <SimpleModal min-width="800px">
        <template #activator="{open}">
          <ThemeButton
            class="q-mr-sm"
            color="accent"
            icon="add"
            flat
            @click="open"
          ><q-tooltip>Add a block type</q-tooltip></ThemeButton>
        </template>
        <template #content>
          <CreateBlock />
        </template>
      </SimpleModal> -->
      <ThemeButton
        class="q-mr-sm"
        icon="fas fa-question"
        :color="helpStore.isOverlayActive ? 'accent' : 'info'"
        label="Help Overlay"
        @click="helpStore.toggleOverlayMode"
      />
      <ThemeButton
        class="q-mr-sm"
        icon="fas fa-question"
        color="info"
        label="Help"
        @click="() => helpStore.toggleModal(true)"
      />
      <ThemeButton
        class="q-mr-sm"
        color="accent"
        icon="fas fa-user"
        label="Admin Dashboard"
        :to="{ path: '/admin/users' }"
      />
      <AvatarControls />
    </template>
    <template #below-header>
      <div style="background: var(--q-secondary)">
        <DisplayModules />
      </div>
    </template>
    <template #page-content>
      <div v-if="!areDependenciesLoaded" class="row items-center justify-center">
        <div class="flex-col items-center justify-center" style="height: 90vh">
          <q-spinner :size="100" />
        </div>
      </div>
      <div
        v-if="currentPage && areDependenciesLoaded"
        :style="{ maxWidth: '100vw' }"
      >
        <div v-if="Array.isArray(blockIdsOnPage)">
          <DisplayBlock
            v-for="(blockId, b) in blockIdsOnPage"
            :key="`block-instance-${blockId}-${b}-${Math.random()}`"
            :block-id="blockId"
            :parent-id="currentPage.id"
          />
        </div>
        <div v-if="isEditMode">
          <div class="full-width">
            <div class="row items-center justify-center borad-6 q-pa-sm">
              <AddBlockButton @selected="onBlockDefSelected" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </SimpleLayout>
</template>

<script setup lang="ts">
import SimpleLayout from 'src/components/ui/SimpleLayout.vue';
import { ref, computed, inject, onMounted } from 'vue';
import DisplayModules from '../generic/layout/DisplayModules.vue';
import useModulePageNavigation from 'src/composables/useModulePageNavigation';
import DisplayBlock from '../generic/layout/DisplayBlock.vue';
import useAddBlock from 'src/composables/useAddBlock';
import AddBlockButton from '../generic/layout/AddBlockButton.vue';
import useAdminStore from 'src/pinia/adminStore';
import { useCustomItemStore } from 'src/pinia/customItemStore';
// import CreateBlock from '../admin/CreateBlock.vue';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { sharedTypes } from 'adam-firebase-tools';
import useHelpStore, { HelpStore } from 'src/pinia/helpStore';
import { useRouter } from 'vue-router';
import AvatarControls from '../nav/AvatarControls.vue';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import { AppHelpers } from 'src/types/generic';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const router = useRouter();
const helpStore = useHelpStore({ router })() as HelpStore;

const areDependenciesLoaded = ref(false);

const fieldStore = deriveStoreForItemType(sharedTypes.KnownItemType.Field);
const itemDefinitionStore = deriveStoreForItemType(sharedTypes.KnownItemType.ItemDefinition);
const customItemStore = useCustomItemStore({})();

onMounted(async () =>
{
  await itemDefinitionStore.loadAllItems(sharedTypes.KnownItemType.ItemDefinition);
  await fieldStore.loadAllItems(sharedTypes.KnownItemType.Field);

  if('setDefinitionFieldsMap' in fieldStore)
  {
    fieldStore.setDefinitionFieldsMap?.();
  }

  await customItemStore.loadDefinitions();

  areDependenciesLoaded.value = true;
});

const {
  currentPage,
} = useModulePageNavigation();

const adminStore = useAdminStore();

const currentPageId = computed(() => currentPage.value?.id);

const { editItem } = (inject('helpers') as AppHelpers['helpers']) || {};

const { isEditMode, onBlockDefSelected } = useAddBlock({
  parentId: currentPageId,
  editItem
});

// const themes = [
//   {
//     "primary": "rgb(178, 76, 60)",
//     "positive": "rgb(226, 27, 135)",
//     "secondary": "rgb(246, 203, 18)",
//     "accent": "rgb(244, 96, 21)",
//     "negative": "rgb(52, 33, 23)",
//     "info": "#5614f1",
//     "dark": "#111111",
//     "warning": "#f114e5"
//   },
//   {
//     "primary": "rgb(178, 76, 60)",
//     "positive": "rgb(226, 27, 135)",
//     "secondary": "rgb(246, 203, 18)",
//     "accent": "rgb(244, 96, 21)",
//     "negative": "rgb(52, 33, 23)",
//     "info": "#5614f1",
//     "dark": "#111111",
//     "warning": "#f114e5"
//   },
// ];

const blockIdsOnPage = computed(() => (
  currentPage.value ? currentPage.value.blockIds : undefined
));
</script>

<style scoped>
.q-carousel {
  height: 100%;
}
</style>

<style>
.form-fields {
  max-width: 700px;
  margin: 0 auto;
}
</style>
