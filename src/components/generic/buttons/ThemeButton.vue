<template>
  <q-btn
    :class="{ 'q-px-sm': (label || slots.default) }"
    :size="size"
    :type="type"
    :to="to"
    :replace="replace"
    :href="href"
    :target="target"
    :label="undefined"
    :icon="undefined"
    :iconRight="iconRight"
    :outline="outline"
    :flat="flat"
    :unelevated="unelevated"
    :rounded="rounded"
    :push="push"
    :square="square"
    :glossy="glossy"
    :fab="fab"
    :fabMini="fabMini"
    :padding="padding"
    :color="color"
    :textColor="textColor"
    :noCaps="noCaps"
    :noWrap="noWrap"
    :dense="dense"
    :ripple="ripple"
    :tabindex="tabindex"
    :align="align"
    :stack="stack"
    :stretch="stretch"
    :loading="loading"
    :disable="disable"
    :round="round"
    :percentage="percentage"
    :darkPercentage="darkPercentage"
    @click="onClick"
  >
    <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
    <ThemeIcon
      v-if="icon"
      :name="icon"
      :size="sizeMinusTwo"
      :class="{ [`q-pa-${sizeMinusTwo}`]: true, [`q-pr-${sizeMinusOne}`]: (label || slots.default) }"
    />
    <div
      v-if="label"
      :class="{ 'q-pr-sm': (slots.default) }"
    >{{ label }}</div>
    <div v-if="slots.default" class=""><slot /></div>
  </q-btn>
</template>

<script setup lang="ts">
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { NamedColor } from 'quasar';
import { computed, useSlots } from 'vue';
import { RouteLocation } from 'vue-router';

const slots = useSlots();

const props = withDefaults(defineProps<{
  tooltip?: string | undefined;
  size?: string | undefined;
  type?: string | undefined;
  to?: string | RouteLocation | undefined;
  replace?: boolean | undefined;
  href?: string | undefined;
  target?: string | undefined;
  label?: string | number | undefined;
  icon?: string | undefined;
  iconRight?: string | undefined;
  outline?: boolean | undefined;
  flat?: boolean | undefined;
  unelevated?: boolean | undefined;
  rounded?: boolean | undefined;
  push?: boolean | undefined;
  square?: boolean | undefined;
  glossy?: boolean | undefined;
  fab?: boolean | undefined;
  fabMini?: boolean | undefined;
  padding?: string | undefined;
  color?: NamedColor | undefined;
  textColor?: NamedColor | undefined;
  noCaps?: boolean | undefined;
  noWrap?: boolean | undefined;
  dense?: boolean | undefined;
  ripple?: boolean | undefined;
  tabindex?: number | string | undefined;
  align?: "left" | "right" | "center" | "around" | "between" | "evenly" | undefined;
  stack?: boolean | undefined;
  stretch?: boolean | undefined;
  loading?: boolean | null | undefined;
  disable?: boolean | undefined;
  round?: boolean | undefined;
  percentage?: number | undefined;
  darkPercentage?: boolean | undefined;
  onClick?: (
    evt: Event,
    go?: (opts?: {
      to?: string | RouteLocation;
      replace?: boolean;
      returnRouterError?: boolean;
    }) => Promise<unknown>,
  ) => void;
}>(), {
  noCaps: true,
  noWrap: true,
  dense: true,
  size: 'md',
});

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];

function getLowerSize(currentSize: string, offset: number): string
{
  return sizes[Math.max(sizes.findIndex((s) => s === currentSize), 0) + offset];
}

const sizeMinusOne = computed(() => (getLowerSize(props.size, -1)));
const sizeMinusTwo = computed(() => (getLowerSize(props.size, -2)));
</script>
