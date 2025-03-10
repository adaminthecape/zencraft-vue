<template>
  <q-icon v-bind="props" />
</template>

<script setup lang="ts">
import { QIconProps } from 'quasar';

const props = defineProps<QIconProps>();
</script>
