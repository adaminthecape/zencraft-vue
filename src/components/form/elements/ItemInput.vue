<template>
  <!-- If an array, show an expansion item -->
  <div
    v-if="itemHandlerRef"
    class="q-mb-sm"
  >
    <component
      :is="field.fieldType === fields.FieldType.itemArray ? 'q-expansion-item' : 'div'"
      icon="description"
      :label="field.label || undefined"
      :caption="modelProxy?.length ? `${modelProxy.length}` : undefined"
      header-class="borad-6 standout-1 q-mb-xs"
      default-opened
      dense
    >
      <template #header>
        <div class="q-space" />
        <slot name="append" />
      </template>
      <ItemSearchResultTable
        :store="(storeToUse as any)"
        :results="(displayValues as any)"
        :item-type="field.itemType ?? undefined"
        :custom-fields="customTableFields"
        @result-clicked="onResultClicked"
      >
        <template #top>
          <div class="row items-center justify-center full-width">
            <span class="text-bold">{{ field.label || field.key }}</span>
            <div class="q-space" />
            <ThemeButton
              icon="clear"
              flat
              @click.stop.prevent="clearInput"
            >
              <q-tooltip>{{ $t('forms.itemInput.tooltips.clearSelection') }}</q-tooltip>
            </ThemeButton>
            <q-separator vertical class="q-mx-sm" />
            <SimpleModal full-width>
              <template #activator="{open}">
                <ThemeButton
                  icon="search"
                  flat
                  @click.stop.prevent="open"
                >
                  <q-tooltip>{{ ($t(
                    'forms.itemInput.tooltips.searchFields',
                    { itemType: field.itemType }
                  )) }}</q-tooltip>
                </ThemeButton>
              </template>
              <template #content>
                <ItemFieldSearch
                  :store="(storeToUse as any)"
                  :item-type="(field.itemType)"
                  @selected-item="onItemSelected"
                />
              </template>
            </SimpleModal>
            <q-separator vertical class="q-mx-sm" />
            <!-- Add new if allowed -->
            <EditNewOrExistingItemModal
              :item-type="(field.itemType ?? undefined)"
              icon-color="neutral"
              @saved="onItemSelected"
            />
          </div>
        </template>
        <template #defaultActions="{ row }">
          <ThemeButton
            icon="edit"
            flat
            @click="() => editItem({
              id: row.id,
              typeId: row.typeId || field.itemType
            })"
          />
          <q-btn
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
                    :label="$t('forms.itemInput.confirmRemove')"
                    icon="delete"
                    color="negative"
                    @click="() => onItemRemoved(row.id)"
                  />
                </ListItem>
              </q-card>
            </q-popup-proxy>
          </q-btn>
        </template>
      </ItemSearchResultTable>
    </component>
  </div>
  <!-- <div v-else class="standout-1 q-pa-sm borad-6 q-mb-sm">
    <span>No handler available ({{ field.key }} - {{ field.itemType }})</span>
  </div> -->
</template>

<script setup lang="ts">
import { QInputProps, QSelectProps } from 'quasar';
import useFormElement from 'src/composables/useFormElement';
import { computed, inject, onMounted, ref } from 'vue';
import ItemFieldSearch from 'src/components/generic/search/ItemFieldSearch.vue';
// import ItemSearch from 'src/components/generic/search/ItemSearch.vue';
import { fields, utils } from 'adam-firebase-tools';
import SimpleModal from 'src/components/ui/SimpleModal.vue';
import ItemSearchResultTable, { ItemResultClick } from '../../generic/search/ItemSearchResultTable.vue';
import EditNewOrExistingItemModal from 'src/components/generic/items/EditNewOrExistingItemModal.vue';
import { deriveStoreForItemType, mapItemIdsToItems, StoreTypes } from 'src/logic/utils/stores';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import { ItemHandlerType } from 'src/logic/utils/items';
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';
import { AppHelpers } from 'src/types/generic';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

type ModelType = string | string[] | null | undefined | FileList;

const { editItem } = (inject('helpers') as AppHelpers['helpers']) || {};

const props = defineProps<{
  itemId?: string;
  itemType?: string;
  store?: GenericItemStore;
  itemHandler?: ItemHandlerType;
  field: fields.Field | fields.FieldData;
  initialValue?: ModelType;
  type?: QInputProps['type'];
  includeDefinitionFields?: boolean;
  qProps?: QSelectProps;
}>();

const storeToUse = ref<StoreTypes>();
const initialDataToUse = ref<Record<string, unknown>>();
const itemHandlerRef = ref<ItemHandlerType | undefined>(props.itemHandler);

const itemTypeRef = computed(() => (props.field?.itemType as string | undefined));
const { fieldsForItemType: fieldsToUse } = useFieldsForItemType({ itemTypeRef });

const emit = defineEmits<{
  (e: 'changed', value: ModelType): void;
}>();

const input = ref();
const isErrored = computed(() => input.value?.hasError);

const { modelProxy } = useFormElement<ModelType>({ props, emit });

async function init()
{
  const itemType = props.field?.itemType || props.itemType;

  if(!itemType)
  {
    console.warn(`No item type for ${props.field?.key}`, props.field);

    return;
  }

  const derivedStore = deriveStoreForItemType(itemType);

  if(derivedStore && itemType)
  {
    storeToUse.value = derivedStore;

    const itemId = props.itemId || utils.uuid.generateUuid();

    const derivedHandler = derivedStore?.getHandler(itemId, itemType);

    if(props.itemId)
    {
      derivedHandler?.load().then(() =>
      {
        initialDataToUse.value = derivedHandler.getData();
        itemHandlerRef.value = derivedHandler;
      });
    }
    else
    {
      initialDataToUse.value = derivedHandler?.getData();
      itemHandlerRef.value = derivedHandler;
    }
  }
}

onMounted(init);

onMounted(() =>
{
  if(modelProxy.value && props.field?.itemType)
  {
    storeToUse.value?.loadMultiple({
      itemType: props.field?.itemType,
      ids: (
        Array.isArray(modelProxy.value) ? modelProxy.value : [modelProxy.value]
      ) as string[]
    });
  }
});

const displayValues = computed(() =>
{
  if(!modelProxy.value || !storeToUse.value)
  {
    return undefined;
  }

  return mapItemIdsToItems({
    itemType: props.field?.itemType || props.itemType,
    itemIds: (
      Array.isArray(modelProxy.value) ? modelProxy.value : [modelProxy.value]
    ) as string[],
    store: storeToUse.value
  });
});

const useAllFields = ref(false);
const customTableFields = computed(() => (
  useAllFields.value ?
    fieldsToUse.value :
    fieldsToUse.value?.filter((f) => (f.validation?.required || f.isPrimarySearchField))
));

function onItemSelected(e: unknown)
{
  const id = utils.tools.isPopulatedObject(e) ? e.id || e : e;

  if(!utils.uuid.isUuid(id))
  {
    return;
  }

  const shouldBeArray = (props.field.fieldType === fields.FieldType.itemArray);

  const valueToSave = shouldBeArray ? [id] : id;

  if(!modelProxy.value)
  {
    modelProxy.value = valueToSave as ModelType;

    return;
  }

  if(Array.isArray(modelProxy.value))
  {
    // TODO: Add allowDuplicates flag to control this
    if(typeof id === 'string' && !modelProxy.value.includes(id))
    {
      modelProxy.value.push(id);
    }
  }
  else if(!shouldBeArray)
  {
    modelProxy.value = valueToSave as ModelType;
  }
}

function onItemRemoved(e: unknown)
{
  const id = utils.tools.isPopulatedObject(e) ? e.id || e : e;

  if(!utils.uuid.isUuid(id))
  {
    return;
  }

  const shouldBeArray = (props.field.fieldType === fields.FieldType.itemArray);

  if(!shouldBeArray)
  {
    // if not array, and we are removing the only value, nullify the field
    modelProxy.value = null;

    return;
  }

  if(!Array.isArray(modelProxy.value))
  {
    modelProxy.value = [];

    return;
  }

  // TODO: handle removing a single item when duplicates are allowed
  modelProxy.value = modelProxy.value.filter((existingId) => (existingId !== id));
}

onMounted(async () =>
{
  if(modelProxy.value && props.itemType)
  {
    await storeToUse.value?.loadMultiple({
      itemType: props.itemType,
      ids: (
        Array.isArray(modelProxy.value) ? modelProxy.value : [modelProxy.value]
      ) as string[]
    });
  }
});

function onResultClicked($event: ItemResultClick)
{
  console.log('result-clicked:', $event);
  // emit('changed', $event.itemId);
}

function clearInput()
{
  modelProxy.value = null;
  emit('changed', null);
}
</script>

<style lang="postcss" scoped>
</style>
