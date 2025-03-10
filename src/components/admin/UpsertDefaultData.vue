<template>
  <SimpleModal
    ref="modal"
    :open-on-mount="openOnMount"
  >
    <template v-if="!hideActivator" #activator="{open}">
      <ThemeButton
        :label="$t('generic.buttons.open')"
        @click="open"
      />
    </template>
    <template #content>
      <div class="q-mt-lg">
        <div class="text-h6">{{ $t('tutorial.insertDefaults.title') }}</div>
        <div class="text-caption">{{ $t('tutorial.insertDefaults.caption') }}</div>
      </div>
      <div class="row q-mt-md">
        <div class="q-space" />
        <ThemeButton
          color="primary"
          :disable="Object.keys(upsertResults).length > 0"
          :label="buttonLabel"
          @click="startUpserts"
        />
      </div>
      <div
        v-for="(result, key) in upsertResults"
        :key="`upsert-result-${key}`"
        class="q-mt-md"
      >
        <ListItem v-if="key !== '_allDone'" class="standout-1">
          <template #caption>
            <span>{{ result.status }}</span>
            <span
              v-if="totals[result.itemType]"
              class="text-positive"
            >&nbsp;&nbsp;{{ totals[result.itemType] }} inserted</span>
            <span
              v-if="totalFailures[result.itemType]"
              class="text-negative"
            >&nbsp;&nbsp;{{ totalFailures[result.itemType] }} failed</span>
          </template>
          <template #label>
            <div class="row items-center">
              <div>{{ key }}</div>
              <div class="q-space q-mx-xl" />
            </div>
          </template>
          <template #right>
            <ThemeIcon
              v-if="result.isDone"
              name="fas fa-check"
              color="positive"
            />
            <ThemeIcon
              v-if="result.error"
              name="fas fa-cross"
              color="negative"
            ><q-tooltip>{{ result.error }}</q-tooltip></ThemeIcon>
          </template>
        </ListItem>
      </div>
    </template>
    <template #close="{close}">
      <ThemeButton
        :color="upsertResults._allDone ? 'primary' : undefined"
        :label="$t('generic.buttons.close')"
        @click="close"
      />
    </template>
  </SimpleModal>
</template>

<script setup lang="ts">
import { insertAllDefaultItems } from 'src/models/api/IndexedDbInterface';
import { computed, ref } from 'vue';
import SimpleModal from '../ui/SimpleModal.vue';
import ThemeButton from '../generic/buttons/ThemeButton.vue';
import ListItem from '../ui/ListItem.vue';
import ThemeIcon from '../ui/ThemeIcon.vue';
import { useQueues } from 'src/composables/useQueues';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

defineProps<{
  openOnMount?: boolean;
  hideActivator?: boolean;
}>();

type UpsertResults = Record<string, {
  itemType: string;
  isDone: boolean;
  status: string;
  error: string | undefined;
}>;

const upsertResults = ref<UpsertResults>({});
const totals = ref<Record<string, number>>({});
const totalFailures = ref<Record<string, number>>({});

function onInserted(opts: {
  itemId: string;
  itemType: string;
  data: Record<string, unknown>;
}): void
{
  if(!totals.value[opts.itemType])
  {
    totals.value[opts.itemType] = 1;
  }
  else
  {
    totals.value[opts.itemType] += 1;
  }
}

function onInsertFailed(opts: {
  itemId: string;
  itemType: string;
  data: Record<string, unknown>;
}): void
{
  if(!totalFailures.value[opts.itemType])
  {
    totalFailures.value[opts.itemType] = 1;
  }
  else
  {
    totalFailures.value[opts.itemType] += 1;
  }
}

async function startUpserts()
{
  await insertAllDefaultItems(
    upsertResults.value,
    onInserted,
    onInsertFailed,
  );
}

const buttonLabel = computed(() =>
{
  if(upsertResults.value._allDone)
  {
    return 'All done!';
  }

  if(Object.keys(upsertResults.value).length > 0)
  {
    return 'In progress...';
  }

  return 'Start the process';
});

const modal = ref<typeof SimpleModal>();

function openModal()
{
  modal.value?.open?.();
}

function closeModal()
{
  modal.value?.close?.();
}

defineExpose({ openModal, closeModal, startUpserts });

useQueues<{ action: string; }>({
  queueKey: 'upsert_default_data',
  queueAction: (request) =>
  {
    if(request?.action === 'open')
    {
      openModal();
    }
    else if(request?.action === 'close')
    {
      closeModal();
    }
    else if(request?.action === 'start')
    {
      startUpserts();
    }
  },
});
</script>
