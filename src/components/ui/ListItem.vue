<template>
  <q-item v-bind="props">
    <q-item-section
      v-if="slots.avatar"
      avatar
    >
      <slot name="avatar" />
    </q-item-section>
    <q-item-section
      v-if="slots.left"
      side
    >
      <slot name="left" />
    </q-item-section>
    <q-item-section>
      <slot />
      <q-item-label v-if="slots.label">
        <slot name="label" />
      </q-item-label>
      <q-item-label
        v-if="slots.caption"
        caption
      >
        <span><slot name="caption" /></span>
      </q-item-label>
    </q-item-section>
    <q-item-section
      v-if="slots.right"
      side
    >
      <slot name="right" />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { QItemProps } from 'quasar';
import { useSlots } from 'vue';

const slots = useSlots();

const props = withDefaults(defineProps<QItemProps>(), {
	clickable: true,
});
</script>
