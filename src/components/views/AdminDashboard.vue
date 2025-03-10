<template>
  <SimpleLayout headerBackgroundColor="var(--q-dark)" :page-offset="50">
    <template #header-title>
      <div>Admin Dashboard</div>
    </template>
    <template #header-left>
      <ThemeButton
        icon="menu"
        flat
        round
        @click="isDrawerOpen = !isDrawerOpen"
      ></ThemeButton>
      </template>
    <template #body>
      <q-drawer
        v-model="isDrawerOpen"
        :width="240"
        :breakpoint="500"
        bordered
        :class="Dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
      >
        <q-scroll-area class="fit">
          <AdminNav />
        </q-scroll-area>
      </q-drawer>
    </template>
    <template #header-right>
      <ThemeButton
        class="q-mr-sm"
        icon="fas fa-question"
        color="info"
        :to="{ path: '/admin/users' }"
        @click="() => helpStore.toggleModal(true)"
      />
      <ThemeButton
        class="q-mr-sm"
        color="accent"
        :to="{ path: '/' }"
        icon="fas fa-home"
        label="Home Page"
      />
      <AvatarControls />
    </template>
    <template #page-header>
    </template>
    <template #page-content>
      <div
        class="q-pa-sm"
        :style="{ maxWidth: '100vw' }"
      >
        <RouterView />
      </div>
    </template>
  </SimpleLayout>
</template>

<script setup lang="ts">
import SimpleLayout from 'src/components/ui/SimpleLayout.vue';
import { Dark } from 'quasar';
import { onMounted, ref } from 'vue';
import AdminNav from '../nav/AdminNav.vue';
import { RouterView, useRouter } from 'vue-router';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import { sharedTypes } from 'adam-firebase-tools';
import useHelpStore, { HelpStore } from 'src/pinia/helpStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import AvatarControls from '../nav/AvatarControls.vue';

const router = useRouter();
const helpStore = useHelpStore({ router })() as HelpStore;

const isDrawerOpen = ref(true);

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
});

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
