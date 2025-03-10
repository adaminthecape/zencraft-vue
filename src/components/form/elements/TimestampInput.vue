<template>
  <div>
    <q-input
      ref="dateInput"
      v-bind="qProps"
      v-model="dateProxy"
      :options="field.options || []"
      :label="field.label || field.key || field.id"
      type="date"
      :rules="fieldRules"
      :hide-bottom-space="!isErrored"
      class="q-mb-sm"
      standout
      dense
    >
      <template #append>
        <slot name="append" />
      </template>
    </q-input>
    <q-input
      v-if="showTime"
      v-bind="qProps"
      ref="timeInput"
      v-model="timeProxy"
      :options="field.options || []"
      :label="field.label || field.key || field.id"
      type="time"
      :rules="fieldRules"
      :hide-bottom-space="!isErrored"
      standout
      dense
    >
      <template #append>
        <slot name="append" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { getDateParts, getSecondsFromDateAndTime } from 'src/logic/utils/dates';
import useFormElement from 'src/composables/useFormElement';
import { computed, ref } from 'vue';
import { QInputProps, QSelectProps } from 'quasar';
import { ItemHandlerType } from 'src/logic/utils/items';
import { GenericItemStore } from 'src/pinia/genericItemStore';
import { fields } from 'zencraft-core';

type ModelType = any;

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
  showTime?: boolean;
}>();
const emit = defineEmits<{ (e: 'changed', value: ModelType): void; }>();

const input = ref();
const isErrored = computed(() => (input as any)?.value?.hasError);

const dateTime = computed(() =>
{
  if(!modelProxy.value)
  {
    return { date: undefined, time: undefined };
  }

  const { day, month, year, hour, minute } = getDateParts(modelProxy.value * 1000);

  return {
    // date: `${`${day}`.padStart(2, '0')} ${(date.ShortMonthNames as any)[month]} ${`${year}`.slice(2)}`,
    date: `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`,
    time: `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`
  };
});

function updateModelProxy(opts: {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
})
{
  let { year, month, day, hour, minute, second } = opts;

  if(dateProxy.value && !(year && month && day))
  {
    const dateParts = getDateParts(dateProxy.value);

    year = dateParts.year;
    month = dateParts.month;
    day = dateParts.day;
  }

  if(timeProxy.value?.includes(':') && !(hour && minute))
  {
    [hour, minute] = timeProxy.value.split(':').map((x) => parseInt(x, 10));
  }

  if(!hour) hour = 0;
  if(!minute) minute = 0;

  const v = getSecondsFromDateAndTime({ year, month, day, hour, minute, second });

  modelProxy.value = v;
}

const dateProxy = computed({
  get()
  {
    return dateTime.value.date;
  },
  set(val: string | null | undefined)
  {
    if(!val)
    {
      return;
    }

    const [year, month, day] = val.split('-').map((x) => parseInt(x, 10));

    updateModelProxy({ year, month, day });
  }
});

const timeProxy = computed({
  get()
  {
    return dateTime.value.time;
  },
  set(val: string | null | undefined)
  {
    if(!val)
    {
      return;
    }

    const [hour, minute] = val.split(':').map((x) => parseInt(x, 10));

    updateModelProxy({ hour, minute });
  }
});

const {
  modelProxy,
  fieldRules,
  updateValue,
} = useFormElement<ModelType>({
  props,
  emit
});
</script>

<style lang="postcss" scoped>
</style>
