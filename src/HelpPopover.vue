<template>
  <slot v-if="!helpStore.isOverlayActive" />
  <div
    v-else
    class="help-popover-container"
  >
    <slot />
    <q-popup-proxy>
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ helpText.title }}
          </div>
          <div class="q-mt-sm">
            {{ helpText.content }}
          </div>
        </q-card-section>
      </q-card>
    </q-popup-proxy>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import useHelpStore, { HelpStore } from './pinia/helpStore';
import { useRouter } from 'vue-router';
import i18n from './i18n';

const props = defineProps<{
  clickAction?: (e: unknown) => void;
  i18nKey: string;
}>();

const router = useRouter();

const helpStore = useHelpStore({ router })() as HelpStore;

// show a popup with help text when in help mode

const isPopoverOpen = ref(false);

function open()
{
	isPopoverOpen.value = true;
}

function close()
{
	isPopoverOpen.value = false;
}

const helpText = ref<Record<string, string>>(
	(
		i18n?.en?.tutorial?.popovers &&
    (typeof props.i18nKey === 'string') &&
    props.i18nKey in i18n.en.tutorial.popovers
	) ?
		i18n.en.tutorial.popovers[
      props.i18nKey as keyof typeof i18n.en.tutorial.popovers
		] || {} :
		{}
);
</script>

<style lang="css" scoped>
.help-popover-container {
  display: inline-block;
  box-shadow: 0 0 12px rgba(0, 255, 255, 1);
}
</style>
