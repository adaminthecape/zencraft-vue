<template>
  <ThemeButton
    v-if="isEditing"
    color="secondary"
    outline
    @click="emit('toggle', false)"
  >
    {{ $t('generic.buttons.isEditing') }}
  </ThemeButton>
  <ThemeButton
    v-else
    icon="fas fa-pencil"
    color="secondary"
    flat
    @click="emit('toggle', true)"
  >
    {{ $t('generic.buttons.edit') }}
  </ThemeButton>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

const { t: $t } = useI18n();

const props = defineProps<{
  isEditing: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', value: boolean): void;
}>();
</script>

<style lang="postcss">
</style>
