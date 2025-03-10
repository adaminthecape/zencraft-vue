<template>
  <q-popup-proxy
    v-bind="props"
  >
    <slot />
  </q-popup-proxy>
</template>

<script setup lang="ts">
// taken from QPopupProxyProps; Vue needs inline types for defineProps macro
const props = defineProps<{
  /**
   * Configure a target element to trigger component toggle; 'true' means it enables the parent DOM element, 'false' means it disables attaching events to any DOM elements; By using a String (CSS selector) or a DOM element it attaches the events to the specified DOM element (if it exists)
   * Default value: true
   */
  target?: boolean | string | Element | undefined;
  /**
   * Skips attaching events to the target DOM element (that trigger the element to get shown)
   */
  noParentEvent?: boolean | undefined;
  /**
   * Allows the component to behave like a context menu, which opens with a right mouse click (or long tap on mobile)
   */
  contextMenu?: boolean | undefined;
  modelValue?: boolean;
  /**
   * Breakpoint (in pixels) of window width/height (whichever is smaller) from where a Menu will get to be used instead of a Dialog
   * Default value: 450
   */
  breakpoint?: number | string | undefined;
  "onUpdate:modelValue"?: (value: unknown) => void;
  onBeforeShow?: (evt: Event) => void;
  onShow?: (evt: Event) => void;
  onBeforeHide?: (evt: Event) => void;
  onHide?: (evt: Event) => void;
}>();
</script>
