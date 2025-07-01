<template>
  <q-toggle
    ref="input"
    v-bind="qProps"
    v-model="modelProxy"
    :label="field.label || field.key || field.id"
    :rules="fieldRules"
    :hide-bottom-space="!isErrored"
    :toggle-indeterminate="false"
    toggle-order="ft"
    standout
    dense
  />
</template>

<script setup lang="ts">
import { ItemHandlerType } from 'src/logic/utils/items';
import { GenericItemStore } from 'src/pinia/genericItemStore';
import { fields } from 'zencraft-core';
import { QInputProps, QSelectProps } from 'quasar';
import useFormElement from 'src/composables/useFormElement';
import { computed, ref } from 'vue';

type ModelType = string | number | FileList | null | undefined; // QInput

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

const emit = defineEmits<{
  (e: 'changed', value: ModelType): void;
}>();

const input = ref();
const isErrored = computed(() => input?.value?.hasError);

const {
	modelProxy,
	fieldRules,
} = useFormElement<ModelType>({
	props,
	emit
});
</script>

<style lang="postcss" scoped>
</style>
