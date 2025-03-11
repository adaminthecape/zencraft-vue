<template>
  <div :class="customClasses">
    <div>Editing {{ existingItemId ? '' : ' new ' }}{{ itemType }}</div>
    <div class="text-caption">{{ existingItemId || itemId }}</div>
    <q-separator class="q-my-sm" />
    <FormFields
      v-model="formData"
      :initial-values="{ ...formData, typeId: itemType, id: itemId }"
      :form-fields="formFieldsToUse"
      :form-classes="formClasses"
      :q-props="qProps"
      :store-opts="useStoreHandler ? {
        storeToUse: (store as any),
        itemIdToUse: itemId,
        itemTypeToUse: itemType,
        useHandler: !!store,
        syncHandler: !!store
      } : undefined"
    />
    <div class="row items-center justify-center">
      <div class="q-space" />
      <slot name="form-actions" v-bind="{ formData }" />
      <!--<ThemeButton
        :label="$t('generic.buttons.cancel')"
        class="q-mr-sm"
        color="negative"
        outline
      />-->
      <ThemeButton
        :label="$t('generic.buttons.reset')"
        class="q-mr-sm"
        color="secondary"
        outline
        @click="resetState"
      />
      <ThemeButton
        :label="$t('generic.buttons.save')"
        color="positive"
        @click="() => saveForm()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ContextReference, CssClassProp, UUID } from 'src/types/generic';
import { Block, Blueprint, sharedTypes, utils } from 'zencraft-core';
import { computed, onMounted, ref, watch } from 'vue';
import FormFields from 'src/components/form/FormFields.vue';
import cloneDeep from 'lodash/cloneDeep';
import { fields } from 'zencraft-core';
import { QInputProps, QSelectProps } from 'quasar';
import { deriveStoreForItemType, StoreTypes } from 'src/logic/utils/stores';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import { useQueues } from 'src/composables/useQueues';

export type EditNewOrExistingItemProps = {
  itemType: string;
  initialData?: Record<string, unknown>;
  existingItemId?: string;
  formClasses?: CssClassProp;
  customClasses?: CssClassProp;
  qProps?: Partial<QInputProps & QSelectProps>;
  useStoreHandler?: boolean;
  forceIsNew?: boolean;
  contextReference?: ContextReference;
};

const props = defineProps<EditNewOrExistingItemProps>();

const emit = defineEmits<{
  (e: 'saved', value: Record<string, unknown>): void;
  (e: 'requestClose'): void;
}>();

const fieldsForDefinition = ref<fields.FieldData[] | undefined>();
const fieldIdsForDefinition = computed(() => (
  Array.isArray(fieldsForDefinition.value) ?
    fieldsForDefinition.value.map((f) => f.id) :
    undefined
));

const { updateQueueKey } = useQueues<{
  data?: Record<string, unknown>;
  actions: {
    amend?: boolean;
    save?: boolean;
    close?: boolean;
  };
}>({
  queueKey: `amend_item_form_${props.existingItemId}`,
  queueAction: (async (opts) =>
  {
    if(opts?.actions.amend)
    {
      if(utils.genericUtils.isPopulatedObject(opts.data))
      {
        formData.value = { ...opts.data };
        formDataHandler.value?.setData(formData.value);
      }
    }

    if(opts?.actions.save)
    {
      await saveForm();
    }

    if(opts?.actions.close)
    {
      emit('requestClose');
    }
  })
});
watch(
  () => props.existingItemId,
  (newId) => updateQueueKey(`amend_item_form_${newId}`)
);

onMounted(async () =>
{
  if(props.itemType === sharedTypes.KnownItemType.Block)
  {
    // a Block needs a definition - load its fields and assign them to `config`
    if(props.existingItemId)
    {
      const blockStore = deriveStoreForItemType(sharedTypes.KnownItemType.Block);

      await blockStore.loadItem({
        id: props.existingItemId,
        itemType: props.itemType,
      });

      const definitionId = (blockStore.getItem(
        props.existingItemId,
        sharedTypes.KnownItemType.Block
      ) as Block.BlockItem)?.blueprintId;

      if(definitionId)
      {
        const blueprintStore = deriveStoreForItemType(sharedTypes.KnownItemType.Blueprint);

        await blueprintStore.loadItem({
          id: definitionId,
          itemType: sharedTypes.KnownItemType.Blueprint,
        });

        // now we should be able to get its fields
        const def = blueprintStore.getItem(
          definitionId,
          sharedTypes.KnownItemType.Blueprint
        ) as Blueprint.BlueprintItem | undefined;

        if(def?.attachedFields?.length)
        {
          fieldsForDefinition.value = (
            await Blueprint.BlueprintHandler.loadFields({
              db: await blueprintStore.getDb(),
              fieldIds: def.attachedFields,
            })
          );
        }
      }
    }
  }
});

const itemTypeRef = computed(() => (props.itemType));
const { fieldsForItemType: itemFields } = useFieldsForItemType({ itemTypeRef });

const formData = ref({ ...(props.initialData || {}) });
const formDataHandler = ref();
const store = ref<StoreTypes>();
const itemId = ref<string>(props.existingItemId || utils.uuid.generateUuid());
const formFieldsToUse = computed<fields.FieldData[]>(() =>
{
  // check for definition fields
  if(Array.isArray(fieldIdsForDefinition.value))
  {
    const fieldsToUse = [...(itemFields.value || [])];

    const idx = fieldsToUse.findIndex((f) => f.key === 'config');

    if(idx > -1)
    {
      fieldsToUse[idx].children = [...fieldIdsForDefinition.value] as UUID[];
    }
  }

  return [...(itemFields.value || [])];
});

const isNew = computed(() => (
  props.forceIsNew ?? !props.existingItemId
));

/**
 * Pre-fills the data in the form, with existing data or a stub for a new item
 */
async function generateNewOrExistingItemForm()
{
  const derivedStore = deriveStoreForItemType(props.itemType);

  if(!derivedStore)
  {
    return;
  }

  store.value = derivedStore;

  let derivedHandler;

  let itemIdToUse = props.existingItemId || itemId.value;

  if(!itemIdToUse)
  {
    itemIdToUse = utils.uuid.generateUuid();
  }
  else
  {
    await derivedStore.loadItem({
      id: itemIdToUse,
      itemType: props.itemType,
    });
  }

  // now we have a store, let's get a handler
  if(itemIdToUse)
  {
    derivedHandler = derivedStore.getHandler(itemIdToUse, props.itemType);

    if(itemIdToUse && derivedHandler && !isNew.value)
    {
      await derivedHandler.load();
    }
  }

  if(derivedHandler)
  {
    if(props.initialData)
    {
      derivedHandler.setData(props.initialData);
    }

    formData.value = derivedHandler.getData();

    formDataHandler.value = derivedHandler;
  }
}

/**
 * Saves the current data in the form, and emits the changes
 */
async function saveForm()
{
  if(!utils.tools.isPopulatedObject(formData.value))
  {
    console.log('No data to save');

    return;
  }

  if(!store.value)
  {
    console.warn('saveForm() has no store');

    return;
  }

  if(!formDataHandler.value)
  {
    formDataHandler.value = store.value.getHandler(
      itemId.value,
      props.itemType
    );
  }

  if(!formDataHandler.value)
  {
    console.log('Handler not available');

    return;
  }

  formDataHandler.value.setData(formData.value);

  await store.value.saveItem({
    id: itemId.value,
    itemType: itemTypeRef.value,
    data: formDataHandler.value.getData(),
    isNew: props.forceIsNew ?? !props.existingItemId
  });

  emit('saved', {
    id: formDataHandler.value.id,
    ...formDataHandler.value.getData()
  });
}

/**
 * This state drives the Reset button functionality
 */
const initialState = ref<Record<string, unknown>>({});
function saveState()
{
  initialState.value = cloneDeep(formData.value);
}
function resetState()
{
  formData.value = cloneDeep(initialState.value);
}

onMounted(() =>
{
    generateNewOrExistingItemForm().then(saveState);
});

// Handle definitions (e.g. Blueprint) and show their fields
// Ensure their fields are saved as `config` (reserved property)
</script>

<style scoped lang="postcss">
</style>
