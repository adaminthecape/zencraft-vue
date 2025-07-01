<template>
  <q-scroll-area
    v-if="page"
    ref="container"
    class="help-wizard-container"
  >
    <!-- <pre>{{ {
      page: helpStore.currentHelpPage,
      pageData: helpStore.getCurrentPageData,
      step: helpStore.currentStepOnPage,
      stepData: helpStore.getCurrentStepData,
    } }}</pre> -->
    <div class="help-wizard-page-info bg-gradient-primary-accent text-bold">
      <div class="q-pa-md q-ma-md">
        <div class="text-h6">
          {{ page.title }}
        </div>
        <p class="pre">
          {{ page.text }}
        </p>
      </div>
    </div>
    <div
      v-for="(step, s) in stepsToShow"
      :key="`help-step-${step.title}-${step.id}`"
    >
      <div
        v-if="step.title"
        class="text-h6 row items-center"
      >
        <span>{{ step.title }}</span>
        <div class="q-space" />
        <q-badge size="md">
          {{ s + 1 }}
        </q-badge>
      </div>
      <p style="white-space: pre-wrap;">
        {{ step.text }}
      </p>
      <div class="row items-center justify-center no-wrap">
        <ThemeButton
          v-if="step.userTriggersAction"
          :disable="!helpStore.canCurrentActionTrigger()"
          :label="step.actionCta || 'Click me'"
          color="accent"
          @click="helpStore.runCurrentStepAction"
        />
      </div>
      <Transition
        name="fade"
        appear
      >
        <div
          v-show="helpStore.getIsAwaitingAction(page.id, step.id)"
          class="row items-center justify-center no-wrap standout-2 q-ma-md"
        >
          <q-spinner-dots size="lg" />
        </div>
      </Transition>
    </div>
  </q-scroll-area>
  <UpsertDefaultData hide-activator />
</template>

<script setup lang="ts">
import { ComponentInstance, computed, onMounted, ref, watch } from 'vue';
import useHelpStore, { HelpStore } from './pinia/helpStore';
import { useRouter } from 'vue-router';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import UpsertDefaultData from './components/admin/UpsertDefaultData.vue';

const router = useRouter();

const helpStore = useHelpStore({ router })() as HelpStore;

onMounted(helpStore.restoreState);

const page = computed(() => helpStore.getCurrentPageData);

const stepsToShow = computed(() => (
	page.value?.steps.slice(0, helpStore.currentStepOnPage + 1) || []
));

const container = ref<ComponentInstance<Element>>();
const stepText = computed(() => helpStore.getCurrentStepData?.text);

function scrollToBottom()
{
	container.value?.setScrollPosition?.(
		'vertical',
		(container.value?.$el?.scrollHeight ?? 10000) + 100,
		500
	);
}

watch(stepText, scrollToBottom);
</script>

<style lang="css" scoped>
.help-wizard-container {
  height: 80vh;
  min-height: 80vh;
  min-width: 400px;
  max-width: 400px;
}

.help-wizard-page-info {
  border-radius: 6px;
  margin-bottom: 1rem;
}
</style>
