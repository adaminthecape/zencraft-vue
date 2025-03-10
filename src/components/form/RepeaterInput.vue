<template>
  <div>
    <div v-if="field.maximumItems == 1">
      <div class="q-pa-sm q-pl-md q-mb-xs standout-1 borad-6">
        <span class="text-bold q-my-sm">{{ field.label || field.key || field.id }}</span>
      </div>
      <div class="standout-0 q-pa-sm q-ml-sm">
        <FormFields
          v-if="Array.isArray(childFields) && (repeaterValues[0] as any)"
          v-model="(repeaterValues[0] as any)"
          :initial-values="repeaterValues[0]"
          :form-fields="(childFields as fields.FieldData[])"
          :q-props="qProps"
          @update:model-value="onItemChanged"
        />
      </div>
    </div>
    <q-expansion-item
      v-else
      icon="description"
      :label="field.label || undefined"
      :caption="modelProxy?.length ? `${modelProxy.length}` : undefined"
      :header-class="['borad-6', 'standout-1', 'q-mb-xs']"
      :content-inset-level="0.2"
      default-opened
      dense
    >
      <div
        v-if="!repeaterValues.length"
        class="standout-1 row items-center justify-center borad-6 text-bold q-pa-sm"
      >{{ $t('forms.repeaters.noItems') }}</div>
      <template #header>
        <span class="text-bold q-my-sm">{{ field.label || field.key || field.id }}</span>
        <div class="q-space" />
        <ThemeButton
          icon="add"
          flat
          @click.stop.prevent="addItem"
        />
      </template>
      <div
        v-for="(repeaterItem, i) in repeaterValuesComputed"
        :key="`repeater-item-${i}-${keyUpdateMap[`index-${i}`]}`"
        class="q-pa-sm q-mb-sm borad-6 standout-1"
      >
        <div v-if="field.maximumItems != 1" class="row items-center">
          <!-- Restore entry -->
          <ThemeButton
            v-if="repeaterItem === null"
            icon="undo"
            color="negative"
            flat
            @click="() => restoreItem(i)"
          />
          <!-- Delete entry -->
          <q-btn
            v-else
            icon="delete"
            color="negative"
            size="sm"
            dense
            flat
          >
            <q-popup-proxy>
              <q-card>
                <ListItem>
                  <ThemeButton
                    :label="$t('forms.repeaters.confirmRemove')"
                    icon="delete"
                    color="negative"
                    @click="() => removeItem(i)"
                  />
                </ListItem>
              </q-card>
            </q-popup-proxy>
          </q-btn>
          <q-separator vertical />
          <div class="text-bold q-ml-sm">{{ $t('forms.repeaters.itemTitle', { index: i + 1 }) }}</div>
        </div>
        <FormFields
          v-if="Array.isArray(childFields) && repeaterItem"
          v-model="(repeaterValues[i] as any)"
          :initial-values="repeaterValues[i]"
          :form-fields="(childFields as fields.FieldData[])"
          :q-props="qProps"
          @update:model-value="onItemChanged"
        />
      </div>
      <div
        v-if="maxItemsToShow < repeaterValues.length"
        class="full-width row items-center justify-center"
      >
        <ThemeButton
          :label="$t('forms.repeaters.showMore', { count: itemsToShowStep })"
          outline
          @click="incrementItemsToShow"
        />
      </div>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { QInputProps } from 'quasar';
import useFormElement from 'src/composables/useFormElement';
import { computed, onMounted, ref } from 'vue';
import { dbFilters, fields, sharedTypes } from 'zencraft-core';
import FormFields from './FormFields.vue';
import { GenericItemStore } from 'src/pinia/genericItemStore';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from '../ui/ListItem.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

type ModelType = Record<string, unknown>[] | null | undefined;

const props = defineProps<{
  itemId?: string;
  itemType?: string;
  store?: GenericItemStore;
  itemHandler?: any;
  field: fields.Field | fields.FieldData;
  initialValue?: ModelType;
  type?: QInputProps['type'];
  includeDefinitionFields?: boolean;
  qProps?: QInputProps;
}>();

const emit = defineEmits<{
  (e: 'changed', value: ModelType): void;
}>();

const input = ref();
const isErrored = computed(() => input.value?.hasError);

const {
  modelProxy,
  updateValue,
} = useFormElement<unknown>({
  props,
  emit
});

const fieldStore = deriveStoreForItemType(sharedTypes.KnownItemType.Field);

const childFields = computed(() =>
{
  // use the store to get the fields based on their IDs
  if(!(Array.isArray(props.field?.children) && props.field.children.length))
  {
    return [];
  }

  return props.field.children.map((id: string) => fieldStore.getItem(
    id,
    sharedTypes.KnownItemType.Field
  ));
});

onMounted(async () =>
{
  if(props.initialValue)
  {
      repeaterValues.value = [...Object.values(props.initialValue)];
  }

  if(Array.isArray(props.field?.children) && props.field.children.length)
  {
    // populate the store with the needed fields
    await fieldStore.searchItems({
      itemType: sharedTypes.KnownItemType.Field,
      filters: [
        {
          key: 'itemId',
          operator: dbFilters.DbFilterOperator.in,
          value: props.field.children
        }
      ]
    });
  }
});

const itemsToShowStep = ref(10);
const maxItemsToShow = ref(itemsToShowStep.value);
function incrementItemsToShow()
{
  maxItemsToShow.value += itemsToShowStep.value;
}

onMounted(() =>
{
  if(props.field?.maximumItems == 1)
  {
    // ensure there is an item in the array
    if(!repeaterValues.value?.[0])
    {
      repeaterValues.value = [{}];
    }
  }
});

const repeaterValues = ref<Record<string, unknown>[]>([]);
const repeaterValuesComputed = computed(() =>
{
  if(!repeaterValues.value?.length || !maxItemsToShow.value)
  {
    return repeaterValues.value;
  }

  if(maxItemsToShow.value < repeaterValues.value?.length)
  {
    return repeaterValues.value.slice(0, maxItemsToShow.value);
  }

  return repeaterValues.value;
});

function onItemChanged()
{
  emit('changed', repeaterValues.value);
}

function addItem()
{
  if(
    (props.field.maximumItems == 1) &&
    repeaterValues.value.length === 1
  )
  {
    return;
  }

  repeaterValues.value.push({});
}

const deletedItemsCache = ref<Record<`index-${number}`, unknown>>({});

function removeItem(index: number)
{
  if((typeof index === 'number') && !(index < 0))
  {
    // archive the item (in case of reversal) and nullify it

    deletedItemsCache.value[`index-${index}`] = { ...(repeaterValues.value[index] || {}) };

    (repeaterValues.value as any)[index] = null;

    updateValue(repeaterValues.value);
    updateRowKey(index);
  }
}

function restoreItem(index: number)
{
  if(
    (typeof index === 'number') &&
    !(index < 0) &&
    (deletedItemsCache.value[`index-${index}`])
  )
  {
    (repeaterValues.value as any)[index] = {
      ...(deletedItemsCache.value[`index-${index}`] || {})
    };

    delete deletedItemsCache.value[`index-${index}`];

    updateValue(repeaterValues.value);
    updateRowKey(index);
  }
}

// TODO: delete this or make it work properly
function updateRowKey(index: number)
{
  if((typeof index === 'number') && !(index < 0))
  {
    if(!keyUpdateMap.value[`index-${index}`])
    {
      keyUpdateMap.value[`index-${index}`] = 1;
    }
    else
    {
      keyUpdateMap.value[`index-${index}`] += 1;
    }
  }
}

const keyUpdateMap = ref<Record<`index-${number}`, number>>({});
</script>

<style lang="css" scoped>
.border-left {
  border-left:6px solid var(--q-accent);
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
}
</style>
