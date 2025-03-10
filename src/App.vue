<template>
  <RouterView id="app-view-root" />
  <EditNewOrExistingItemModal
    v-if="itemToEdit"
    :item-type="itemToEdit.typeId"
    :existing-item-id="itemToEdit.id"
    :initial-data="itemToEdit.initialData"
    :modal-props="editItemModalProps"
    :force-is-new="itemToEdit.options?.isNew"
    :context-reference="itemToEdit.contextReference"
    @request-close="clearEditingItem"
  >
    <template #activator><span></span></template>
  </EditNewOrExistingItemModal>
  <HelpWizardModal />
</template>

<script setup lang="ts">
import useThemeStore from 'src/pinia/themeStore';
import { ref, onMounted, provide, computed, watch } from 'vue';
import { Dark, useQuasar } from 'quasar';
import { ApiHandler } from './models/api/ApiInterface';
import { RouterView, useRoute, useRouter } from 'vue-router';
import EditNewOrExistingItemModal from './components/generic/items/EditNewOrExistingItemModal.vue';
import useAdminStore from 'src/pinia/adminStore';
import handlebars from './boot/handlebars';
import useBlockContextStore, { ContextReference } from './pinia/blockContextStore';
import { utils } from 'zencraft-core';
import HelpWizardModal from './HelpWizardModal.vue';
// import { useCustomItemStore } from './pinia/customItemStore';
import { checkDataSource } from './models/api/DataSource';
import { getIsJwtExpired, getLocalFirebaseCreds, updateLocalJwt } from './models/api/utils';
import { useQueues } from './composables/useQueues';
import { IndexedDbInterface } from './models/api/IndexedDbInterface';
import useQueueStore from './pinia/queueStore';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// Login handling
async function redirectToLoginIfNeeded()
{
  const dataSource = checkDataSource();

  let isLoggedOut = false;

  if(dataSource.isApi)
  {
    isLoggedOut = await getIsJwtExpired();
  }
  else if(dataSource.isFirebase)
  {
    isLoggedOut = !getLocalFirebaseCreds();
  }
  else if(dataSource.isIndexedDb)
  {
    // assume user is logged in at all times on indexedDb
    isLoggedOut = false;
  }

  if(isLoggedOut)
  {
    $q.notify('You have been logged out, please log in again');
    router.push({ name: 'login' });
  }
}
onMounted(redirectToLoginIfNeeded);
const adminStore = useAdminStore();
async function login(user: string, pass: string): Promise<boolean>
{
  const dataSource = checkDataSource();

  if(dataSource.isIndexedDb)
  {
    // assume user is logged in at all times on indexedDb
    return true;
  }
  else if(dataSource.isApi)
  {
    const ah = new ApiHandler({});

    updateLocalJwt('');

    const res = await ah.GET(`/login/${user}/${pass}`);
    const jwt = (res?.data as Record<string, unknown>)?.token;

    if(typeof jwt === 'string')
    {
      updateLocalJwt(jwt);

      return true;
    }
  }
  else if(dataSource.isFirebase)
  {
    await adminStore.firebaseLogin(user, pass);

    return true;
  }

  return false;
}

// Editing Items via the dedicated panel
type ItemToEdit = {
  id: string;
  typeId: string;
  initialData?: Record<string, unknown>;
  contextReference?: ContextReference;
  options?: {
    isNew?: boolean;
    persistent?: boolean;
  };
};
const itemToEdit = ref<ItemToEdit | undefined>(undefined);
function clearEditingItem()
{
  itemToEdit.value = undefined;
}
function editItem(opts: ItemToEdit | undefined): void
{
  itemToEdit.value = opts;
}
const editItemModalProps = ref<Record<string, unknown>>({
  openOnMount: true,
  onClose: clearEditingItem,
});
const queueStore = useQueueStore();
useQueues<ItemToEdit>({
  queueKey: 'edit_items',
  queueAction: (item) =>
  {
    if(
      utils.genericUtils.isPopulatedObject(item) &&
      ('id' in item && 'typeId' in item)
    )
    {
      if(item.options)
      {
        if(item.options.persistent)
        {
          editItemModalProps.value.persistent = true;
        }
        else if(editItemModalProps.value.persistent)
        {
          editItemModalProps.value.persistent = false;
        }
      }

      editItem({
        id: item.id,
        typeId: item.typeId,
        initialData: item.initialData,
        contextReference: item.contextReference,
        options: { isNew: item.options?.isNew }
      });
    }
    else
    {
      clearEditingItem();
    }
  }
});

// Context store
const ctx = useBlockContextStore()();
const ctxItemData = computed(() => (
  typeof route.params.pageId === 'string' ?
    ctx.page?.[route.params.pageId]?.itemDataByType :
    {}
));
const ctxItemIdsOnPage = computed(() => (
  typeof route.params.pageId === 'string' ?
    ctx.page?.[route.params.pageId]?.itemIdsByType :
    {}
));
onMounted(() => ctx.setHandlebars(handlebars));
watch(() => route.params.pageId, () =>
{
  if(!route.params.pageId)
  {
    ctx.setPageId(route.params.pageId);
  }
  else if(typeof route.params.pageId === 'string')
  {
    ctx.setPageId(route.params.pageId);
  }
});

// Provides
provide('$ctxStore', {
  store: ctx,
  itemData: ctxItemData,
  itemIdsOnPage: ctxItemIdsOnPage,
  compile: (html: string) => handlebars.compile(html)(ctxItemData.value),
});
provide('helpers', { login, editItem });
provide('$handlebars', handlebars);

function setTheme()
{
  const themes = useThemeStore();
  // set dark mode to the user's preference
  const theme = themes.getActiveTheme;
  Dark.set((theme === 'dark'));
}
onMounted(setTheme);

async function openHelpWizardIfDbEmpty()
{
  const dataSource = checkDataSource();

  if(dataSource.isIndexedDb)
  {
    // open the help modal if the local db is empty
    const idb = new IndexedDbInterface({});
    idb.getItemsPublished().then((items) =>
    {
      if(!(Array.isArray(items) && items.length))
      {
        $q.notify({
          message: 'Welcome to my app! The help wizard will now open to guide you.',
          timeout: 10000,
        });

        queueStore.addToQueue('help_wizard_first_run', { start: true });
      }
      else
      {
        queueStore.addToQueue('help_wizard_first_run', { start: false });
      }
    });
  }
}
onMounted(openHelpWizardIfDbEmpty);
</script>

<style lang="css">
@import url('https://fonts.googleapis.com/css?family=Roboto+Condensed');
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');

#q-app {
  font-family: "Roboto", sans-serif;
  font-weight: 400;
  font-style: normal;
  letter-spacing: 0.6px;
}

.lato-thin {
  font-family: "Lato", sans-serif;
  font-weight: 100;
  font-style: normal;
}

.lato-light {
  font-family: "Lato", sans-serif;
  font-weight: 300;
  font-style: normal;
}

.lato-regular {
  font-family: "Lato", sans-serif;
  font-weight: 400;
  font-style: normal;
}

.lato-bold {
  font-family: "Lato", sans-serif;
  font-weight: 700;
  font-style: normal;
}

.lato-black {
  font-family: "Lato", sans-serif;
  font-weight: 900;
  font-style: normal;
}

.lato-thin-italic {
  font-family: "Lato", sans-serif;
  font-weight: 100;
  font-style: italic;
}

.lato-light-italic {
  font-family: "Lato", sans-serif;
  font-weight: 300;
  font-style: italic;
}

.lato-regular-italic {
  font-family: "Lato", sans-serif;
  font-weight: 400;
  font-style: italic;
}

.lato-bold-italic {
  font-family: "Lato", sans-serif;
  font-weight: 700;
  font-style: italic;
}

.lato-black-italic {
  font-family: "Lato", sans-serif;
  font-weight: 900;
  font-style: italic;
}
.story-hint {
  display: inline;
}

.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltip-text {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;

  /* Position the tooltip */
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
}

.bordered {
  border: 1px solid #bbb;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  line-height: 1em;
}

h1 {
  font-size: 2em;
}

h2 {
  font-size: 1.8em;
}

h3 {
  font-size: 1.6em;
}

h4 {
  font-size: 1.4em;
}

h5 {
  font-size: 1.2em;
}

h6 {
  font-size: 1em;
}

body,
body *,
.styleScroll,
.styleScroll * {
  /* firefox support - limited customizability compared to chrome */
  scrollbar-color: #a0a0a5 #f4f4f4;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    /* background-color: transparent; */
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    /* background-color: transparent; */
    background-color: rgba(250, 250, 250, 0.4);
  }

  /* stylelint-disable a11y/no-display-none  */
  &::-webkit-scrollbar-button {
    display: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #98989d;
    /* border: 4px solid #f4f4f4; */
    width: 4px;
    border-radius: 10px;
  }

  &:hover::-webkit-scrollbar,
  &:focus::-webkit-scrollbar {
    width: 6px;
  }

  /* &:hover::-webkit-scrollbar-track {
      background-color: rgba(250, 250, 250, 0.4);
    } */

  &:hover::-webkit-scrollbar-track,
  &:focus::-webkit-scrollbar-track {
    background-color: rgba(250, 250, 250, 0.6);
  }

  &:hover::-webkit-scrollbar-thumb,
  &:focus::-webkit-scrollbar-thumb {
    background-color: #75757a;
    /* border: 5px solid #fff; */
    width: 6px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
  opacity: 1;
  max-height: revert;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}

.elevation-1 {
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.2), 0 1px 10px 0 rgba(0, 0, 0, 0.19);
}
.elevation-2 {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2), 0 2px 10px 0 rgba(0, 0, 0, 0.19);
}

.body--light .standout-0 {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--light .standout-1 {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--light .standout-2 {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--light .standout-2 { background-color: #00000020; }
.body--light .standout-3 { background-color: #00000030; }
.body--light .standout-4 { background-color: #00000040; }


.body--dark .standout-0 {
  background: rgba(25, 45, 65, 0.02);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--dark .standout-1 {
  background: rgba(25, 45, 65, 0.07);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--dark .standout-2 {
  background: rgba(25, 45, 65, 0.1);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--dark .standout-3 {
  background: rgba(25, 45, 65, 0.15);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.body--dark .standout-4 { background-color: #70809040; }

.body--light .bg-standard { background-color: #ffffff99; }
.body--dark .bg-standard { background-color: #70809010; }

.body--light .text-muted { color: #00000080; }
.body--dark .text-muted { color: #ffffff80; }

.rounded {
  border-radius: 6px !important;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.borad {
  border-radius: 4px;
}

.borad-6 {
  border-radius: 6px;
}

.text-shadow-1 {
  text-shadow: 1px 1px #000;
}

body.body--light {
  background: #d3d3d3 !important;
}

body.body--dark {
  background: #171614 !important;
}

.bg-gradient-primary-accent {
  background: linear-gradient(to top right, var(--q-primary), var(--q-accent));
}
.bg-gradient-accent-primary {
  background: linear-gradient(to top right, var(--q-accent), var(--q-primary));
}
.bg-gradient-primary-secondary {
  background: linear-gradient(to top right, var(--q-primary), var(--q-secondary));
}
.bg-gradient-secondary-primary {
  background: linear-gradient(to top right, var(--q-secondary), var(--q-primary));
}

.q-dialog__backdrop {
  background: rgba(0, 0, 0, 0.1) !important;
}

.full-height {
  min-height: 92vh;
  max-height: 92vh;
  max-width: 50%;
  overflow-y: scroll;
}

pre {
  white-space: pre-wrap;
}

#selectionMenu {
  display: none;
  position: absolute;
  left: -10000px;
  top: -10000px;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--q-neutral80);
  overflow-y: scroll;
  max-height: 20em;
}
</style>
