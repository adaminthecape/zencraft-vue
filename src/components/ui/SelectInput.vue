<template>
  <q-select
    v-model="model"
    :label="label"
    :placeholder="placeholder"
    :emit-value="emitValue"
    standout
    dense
  />
</template>

<script setup lang="ts">
import { QSelectProps } from 'quasar';
import { defineModel } from 'vue';

const model = defineModel<string>('model');

const props = defineProps<QSelectProps & {
	label?: string;
	placeholder?: string;
	emitValue?: boolean;
}>();
</script>

<style lang="postcss" scoped>
</style>
