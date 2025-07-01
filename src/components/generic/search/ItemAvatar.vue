<template>
  <EditNewOrExistingItemModal
    :item-type="itemType"
    :existing-item-id="itemId"
  >
    <template #activator="{open}">
      <q-chip
        class="row items-center no-wrap cursor-pointer standout-1"
        size="md"
        no-caps
        clickable
        @click="open"
      >
        <ThemeIcon
          :name="iconToUse"
          class="q-mr-xs"
          color="accent"
          size="xs"
          rounded
        />
        <span
          class="ellipsis"
          style="overflow: hidden"
        >{{ label }}</span>
      </q-chip>
    </template>
  </EditNewOrExistingItemModal>
</template>

<script setup lang="ts">
import { deriveStoreForItemType, StoreTypes } from 'src/logic/utils/stores';
import { computed, onMounted, ref, watch } from 'vue';
import EditNewOrExistingItemModal from '../items/EditNewOrExistingItemModal.vue';
import { itemTypeIcons, itemTypePrimaryFieldKeys } from 'src/models/BlockTypes';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const props = defineProps<{
  labelOverride?: string;
  itemType: string;
  itemId: string;
}>();

const storeToUse = ref<StoreTypes>();

async function updateStoreAndItem()
{
	if(props.itemType)
	{
		storeToUse.value = deriveStoreForItemType(props.itemType);
	}

	if(props.itemId)
	{
		await storeToUse.value?.loadItem({
			id: props.itemId,
			itemType: props.itemType,
		});
	}
}

onMounted(updateStoreAndItem);

watch(() => props.itemId, updateStoreAndItem);

// TODO: Make this get item type icons from the db
const iconToUse = computed(() => (
	props.itemType ? itemTypeIcons[props.itemType] ?? 'edit' : 'edit'
));

const itemData = computed(() => (
	props.itemId ?
		storeToUse.value?.getItem(props.itemId, props.itemType) :
		undefined
));

const label = computed(() =>
{
	if(typeof props.labelOverride === 'string')
	{
		return props.labelOverride;
	}

	if(!(itemTypePrimaryFieldKeys[props.itemType] && itemData.value))
	{
		return props.itemType;
	}

	const validKey = itemTypePrimaryFieldKeys[props.itemType]
		.find((key) => (key && (itemData.value as any)[key as string]));

	const value = (itemData.value as any)[`${validKey}`];

	if(validKey === 'id')
	{
		return value?.split('-')[0];
	}

	return value;
});
</script>
