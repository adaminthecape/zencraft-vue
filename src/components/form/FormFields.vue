<template>
  <div v-if="!Array.isArray(formFields) || !formFields.length">
    <pre>No fields available! {{ formFields }}</pre>
  </div>
  <!-- Container div is necessary to avoid errors -->
  <div v-else>
    <div
      v-for="field in formFields"
      :key="`field-element-${formId}-${field?.id}`"
      :class="formClasses"
    >
      <component
        v-if="field && getInputComponent(field)"
        :initial-value="(formValues as any)?.[field.key as string]"
        :is="getInputComponent(field)"
        :field="(field as any)"
        class="q-mb-sm"
        :q-props="(qProps as any)"
        :store="storeOpts?.storeToUse"
        :item-id="storeOpts?.itemIdToUse"
        :item-type="storeOpts?.itemTypeToUse"
        @changed="($event: unknown) => inputChanged(field, $event)"
      >
        <template #append>
          <slot
            v-bind="{
              field,
              value: (formValues as any)?.[field.key as string]
            }"
            :name="`${field.key}-append`"
          />
        </template>
      </component>
      <div
        v-else-if="field && field.fieldType === fields.FieldType.repeater"
      >
        <RepeaterInput
          v-model="(formValues as any)[field.key as string]"
          :initial-value="(
            Array.isArray((formValues as any)?.[field.key as string]) ?
              (formValues as any)?.[field.key as string] :
              utils.tools.isPopulatedObject((formValues as any)?.[field.key as string]) ?
                [(formValues as any)?.[field.key as string]] :
                undefined
          )"
          :field="field"
          class="q-mb-sm"
          :q-props="(qProps as any)"
          @changed="($event: unknown) => inputChanged(field, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CssClassProp, UUID } from 'src/types/generic';
import { fields, utils } from 'zencraft-core';
import { QInputProps } from 'quasar';
import { defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { GenericItemStore } from 'src/pinia/genericItemStore';

const ItemTypeInput = defineAsyncComponent(() => import('src/components/form/elements/ItemTypeInput.vue'));
const DropdownInput = defineAsyncComponent(() => import('src/components/form/elements/DropdownInput.vue'));
const TextInput = defineAsyncComponent(() => import('src/components/form/elements/TextInput.vue'));
const UuidInput = defineAsyncComponent(() => import('src/components/form/elements/TextInput.vue'));
const NumberInput = defineAsyncComponent(() => import('src/components/form/elements/NumberInput.vue'));
const TimestampInput = defineAsyncComponent(() => import('src/components/form/elements/TimestampInput.vue'));
const MarkdownInput = defineAsyncComponent(() => import('src/components/form/elements/MarkdownInput.vue'));
const ItemInput = defineAsyncComponent(() => import('src/components/form/elements/ItemInput.vue'));
const ItemFiltersInput = defineAsyncComponent(() => import('src/components/form/elements/ItemFiltersInput.vue'));
const RepeaterInput = defineAsyncComponent(() => import('src/components/form/RepeaterInput.vue'));
const ToggleInput = defineAsyncComponent(() => import('src/components/form/elements/ToggleInput.vue'));
// TODO: fieldType
// TODO: itemFieldKey

// this allows different forms on the same page for the same item
const formId = ref<UUID>((utils.uuid.generateUuid() as UUID).split('-').shift() as UUID);

type FormValues = Record<string, unknown>;

const props = defineProps<{
  formFields: Array<fields.FieldData>;
  formClasses?: CssClassProp;
  initialValues?: FormValues;
  qProps?: Partial<QInputProps>;
  /**
   * Validate all fields in real-time using a handler for the given Item type.
   * With this enabled, any value that the handler rejects will not be used as
   * the field's value, so some inputs may seem unresponsive.
   */
  validateAsItemType?: string;
  storeOpts?: {
    useHandler?: boolean;
    syncHandler?: boolean;
    storeToUse?: GenericItemStore;
    itemIdToUse?: string;
    itemTypeToUse?: string;
  };
}>();

function getInputComponent(field: fields.Field | fields.FieldData)
{
  if(!field?.fieldType)
  {
    return undefined;
  }

  switch(field.fieldType)
  {
    case fields.FieldType.text:
      return TextInput;
    case fields.FieldType.textarea:
      return MarkdownInput;
    case fields.FieldType.number:
      return NumberInput;
    case fields.FieldType.dropdown:
      return DropdownInput;
    case fields.FieldType.timestamp:
      return TimestampInput;
    case fields.FieldType.item:
    case fields.FieldType.itemArray:
      return ItemInput;
    case fields.FieldType.itemFilters:
      return ItemFiltersInput;
    case fields.FieldType.toggle:
      return ToggleInput;
    // TODO: Implement other FieldType components
    case fields.FieldType.uuid:
      return TextInput;
    case fields.FieldType.itemType:
      return ItemTypeInput;
    case fields.FieldType.uuidArray:
    case fields.FieldType.checkbox:
    case fields.FieldType.radio:
    case fields.FieldType.readonly:
    default:
      return undefined;
  }
}

const formValues = ref<FormValues>({ ...props.initialValues });

const model = defineModel<FormValues>({
  required: true,
  default: {}
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: FormValues): void;
  (e: 'update:field', value: { key: string; value: any; }): void;
}>();

function inputChanged(field: fields.FieldData, e: unknown)
{
  if(field.key)
  {
    (formValues.value as any)[field.key] = e;
    emit('update:field', { key: field.key, value: e });
    emit('update:modelValue', formValues.value);
  }
}

// disabled as this seems to work only without the watcher?
watch(() => props.initialValues, (n, o) =>
{
  if(n)
  {
    formValues.value = {
      ...(formValues.value || {}),
      ...props.initialValues
    };
    // if(formDataHandler.value)
    // {
    //   formDataHandler.value.setData(n);
    // }
  }
});

const formDataHandler = ref();

onMounted(() =>
{
  if(props.storeOpts)
  {
    if(props.storeOpts.useHandler)
    {
      if(!props.storeOpts.storeToUse)
      {
        console.error('FormFields requires a store when using handlers!');

        return;
      }

      if(!props.storeOpts.itemIdToUse || !props.storeOpts.itemTypeToUse)
      {
        console.error('FormFields requires an item ID when using handlers!');

        return;
      }

      formDataHandler.value = props.storeOpts.storeToUse.getHandler(
        props.storeOpts.itemIdToUse,
        props.storeOpts.itemTypeToUse,
        props.storeOpts.syncHandler ?? true
      );

      if(formDataHandler.value)
      {
        formValues.value = {
          ...(formValues.value || {}),
          ...formDataHandler.value.getData()
        };
      }
    }
  }

  if(!formDataHandler.value)
  {
    // formDataHandler.value
  }
});
</script>
