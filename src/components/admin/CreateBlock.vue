<template>
  <div>
    <!-- Define a name in BlockTypes -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Create a new name</span>
      </div>
      <q-input
        v-model="blockType"
        v-bind="qProps"
        placeholder="New Block Type"
        mask="SSSSSSSSSSSSSSSSSSSS"
      ></q-input>
      <div :class="codeClass" v-if="blockTypeError">
        <span class="text-negative text-bold">{{ blockTypeError }}</span>
      </div>
      <div :class="codeClass" v-else>
        <div class="row items-center">
          <ThemeButton
            class="q-mr-sm"
            icon="description"
            color="accent"
            flat
            @click="copyToClipboard(`${blockType} = '${blockType}',`)"
          />
          <code>src/models/BlockTypes.ts :: BlockType</code>
        </div>
        <pre>{{ `${blockType} = '${blockType}',` }}</pre>
      </div>
    </div>
    <!-- Add config in blockTypeConfig -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Add base config</span>
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-select
          v-model="blockTypeConfig.fields"
          v-bind="qProps"
          label="Fields"
          disable
        />
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-select
          v-model="blockTypeConfig.categories"
          v-bind="qProps"
          :options="Object.values(BlockCategory)"
          multiple
          label="Categories"
        />
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-select
          v-model="blockTypeConfig.defaultAllowedChildren"
          v-bind="qProps"
          :options="Object.values(BlockType)"
          multiple
          label="Default Allowed Child Blocks"
        />
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-toggle
          v-model="blockTypeConfig.hasChildren"
          v-bind="qProps"
          label="Has Child Blocks"
        />
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-toggle
          v-model="blockTypeConfig.hideAddBlockButton"
          v-bind="qProps"
          label="Hide 'Add Block' Button"
        />
      </div>
      <div :class="codeClass">
        <div class="row items-center">
          <ThemeButton
            class="q-mr-sm"
            icon="description"
            color="accent"
            flat
            @click="copyToClipboard(blockTypeConfigString)"
          />
          <code>src/models/BlockTypes.ts :: blockTypeConfig</code>
        </div>
        <pre>{{ blockTypeConfigString }}</pre>
      </div>
    </div>
    <!-- Upsert fields -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Update stored field data</span>
      </div>
      <div :class="codeClass">
        <div class="row items-center">
          <ThemeButton
            class="q-mr-sm"
            icon="refresh"
            color="accent"
            flat
            @click="addBlockTypeToFieldOptions"
          ><code class="q-ml-sm">Click to update `blockType` field(s)</code></ThemeButton>
        </div>
      </div>
    </div>
    <!-- Add i18n translation -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Add i18n values</span>
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-input
          v-model="i18nValues.title"
          v-bind="qProps"
          label="Title"
        />
      </div>
      <div class="q-ma-sm q-pa-sm standout-1 borad-6">
        <q-input
          v-model="i18nValues.description"
          v-bind="qProps"
          label="Description"
          type="textarea"
        />
      </div>
      <div :class="codeClass">
        <div class="row items-center">
          <ThemeButton
            class="q-mr-sm"
            icon="description"
            color="accent"
            flat
            @click="copyToClipboard(i18nValuesString)"
          />
          <code>src/i18n/en/index.js</code>
        </div>
        <pre>{{ i18nValuesString }}</pre>
      </div>
    </div>
    <!-- Add import in usePublicComponent -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Add component import</span>
      </div>
      <div :class="codeClass">
        <div class="row items-center">
          <ThemeButton
            class="q-mr-sm"
            icon="description"
            color="accent"
            flat
            @click="copyToClipboard(componentReference)"
          />
          <code>src/composables/usePublicComponent.ts</code>
        </div>
        <pre>{{ componentReference }}</pre>
      </div>
    </div>
    <!-- Create a new BlockDefinition -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Add a new Definition</span>
      </div>
      <div :class="codeClass">
        <EditNewOrExistingItemModal
          :item-type="sharedTypes.KnownItemType.BlockDefinition"
          :initial-data="initialDefinitionData"
        />
      </div>
    </div>
    <!-- View the entry in the Library -->
    <div class="q-mt-md">
      <div :class="labelClass">
        <span>Test your block</span>
      </div>
      <div :class="codeClass">
        <AddBlockButton />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { copyToClipboard } from 'quasar';
import { BlockCategory, BlockType, BlockTypeConfigOpts } from 'src/models/BlockTypes';
import { computed, ref } from 'vue';
import AddBlockButton from 'src/components/generic/layout/AddBlockButton.vue';
import EditNewOrExistingItemModal from 'src/components/generic/items/EditNewOrExistingItemModal.vue';
import { fields, sharedTypes } from 'zencraft-core';
import { deriveStoreForItemType } from 'src/logic/utils/stores';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

const qProps = {
  standout: true,
  dense: true,
  class: 'q-ma-sm'
};
const labelClass = 'text-h6 q-ma-md';
const codeClass = 'q-pa-sm standout-2 q-ma-sm borad-6';

const blockType = ref<string>('newBlockType');
const blockTypeError = computed(() =>
{
  if(blockType.value && (BlockType as any)[blockType.value])
  {
    return `Type ${blockType.value} already exists, choose another`;
  }

  return undefined;
});
const blockTypeConfig = ref<BlockTypeConfigOpts>({
  defaultAllowedChildren: undefined,
  maximumAllowedChildren: undefined,
  fields: [],
  hasChildren: true,
  categories: [],
  hideAddBlockButton: false,
});
const blockTypeConfigString = computed(() => (
  `${blockType.value}: ${JSON.stringify(
    {
      ...(blockTypeConfig.value || {}),
      categories: blockTypeConfig.value?.categories?.map((c) => (
        `BlockCategory.${c}`
      )),
      defaultAllowedChildren: (
        !blockTypeConfig.value?.defaultAllowedChildren ?
          undefined :
          blockTypeConfig.value.defaultAllowedChildren?.map((c) => (
            `BlockType.${c}`
          ))
      )
    },
    undefined,
    2
  )},`.replace(/\"/g, '')
));
const i18nValues = ref({
  title: '',
  description: '',
});
const i18nValuesString = computed(() => (
  `${blockType.value || ''}: ${JSON.stringify(i18nValues.value, undefined, 2)}`
    .replace('"title":', 'title:')
    .replace('"description":', 'description:')
));
const componentReference = computed(() => (
  `${blockType.value || ''}: defineAsyncComponent(() => ${(
    `import('src/components/public/${(
      (blockType.value || '').slice(0, 1).toUpperCase()
    )}${(
      (blockType.value || '').slice(1)
    )}.vue')`
  )}),`
));
const initialDefinitionData = computed(() => ({
  blockType: blockType.value
}));

async function addBlockTypeToFieldOptions()
{
  if(!blockType.value)
  {
    return;
  }

  const fieldStore = deriveStoreForItemType(sharedTypes.KnownItemType.Field);

  const blockTypeFields = (
    fieldStore.allItems as fields.FieldData[]
  ).filter((field) => (
    field?.key === 'blockType'
  ));

  for(const field of blockTypeFields)
  {
    if(Array.isArray(field.options))
    {
      const newOptions = [...field.options];

      if(!newOptions.includes(blockType.value))
      {
        newOptions.push(blockType.value);

        await fieldStore.saveItem({
          id: field.id,
          itemType: sharedTypes.KnownItemType.Field,
          data: {
            options: newOptions
          }
        });
      }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
