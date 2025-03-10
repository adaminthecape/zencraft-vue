<template>
  <q-select
    ref="input"
    v-bind="qProps"
    v-model="modelProxy"
    :options="field.options || []"
    :label="field.label || field.key || field.id"
    :type="type"
    :rules="fieldRules"
    :hide-bottom-space="!isErrored"
    :multiple="multiSelect ?? undefined"
    standout
    dense
    :use-input="undefined"
    :new-value-mode="undefined"
    emit-value
  >
    <template #append>
      <slot name="append" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ItemHandlerType } from 'src/logic/utils/items';
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import { fields } from 'adam-firebase-tools';
import { QInputProps, QSelectProps } from 'quasar';
import useFormElement from 'src/composables/useFormElement';
import { computed, ref } from 'vue';

type ModelType = string | string[] | null | undefined;
type PropType = {
  itemId?: string;
  itemType?: string;
  store?: GenericItemStore;
  itemHandler?: ItemHandlerType;
  field: fields.Field | fields.FieldData;
  initialValue?: ModelType;
  type?: QInputProps['type'];
  includeDefinitionFields?: boolean;
  qProps?: QSelectProps;
};

const props = defineProps<PropType>();
const emit = defineEmits<{ (e: 'changed', value: ModelType): void; }>();

const input = ref();
const isErrored = computed(() => (input as any)?.value?.hasError);

const {
  modelProxy,
  fieldRules,
  updateValue,
} = useFormElement<ModelType>({
  props,
  emit
});

const multiSelect = computed(() => (
  (
    typeof props.field?.multiSelect === 'string' &&
    props.field?.multiSelect === 'true'
  ) ?
    true :
    props.field?.multiSelect
));
</script>

<style lang="postcss" scoped>
</style>
