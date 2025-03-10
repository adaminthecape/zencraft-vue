<template>
	<ThemeButton
		v-bind="props"
		color="secondary"
		@click="saveItem"
	>{{ $t('generic.buttons.save') }}</ThemeButton>
</template>

<script setup lang="ts">
import { GenericItemStore } from 'src/pinia/genericFirebaseStore';
import { item } from 'adam-firebase-tools';
import { QBtnProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

const { t: $t } = useI18n();

const props = defineProps<QBtnProps & {
	itemId: item.Item['id'];
	itemType: string;
  isNew?: boolean;
  store: GenericItemStore;
}>();

const handler = props.store?.getHandler(props.itemId, props.itemType);

async function saveItem(): Promise<void>
{
	if(props.isNew)
	{
		await handler.update({
			data: handler.getData(),
			doNotSetData: true
		});

		return;
	}

	// sync existing changes with these, if any (until Item supports partials)
	const proxyHandler = props.store.getHandler(props.itemId, props.itemType);

	try
	{
		await proxyHandler.load();
	}
	catch(e)
	{
    console.log(`Failed to load existing data for item ${props.itemId}`);

    return;
	}

	// merge new data into it
	proxyHandler.setData(handler.getData());

	await props.store.saveItem({
    id: props.itemId as any,
    itemType: props.itemType,
		data: handler.getData(),
		isNew: true
	});
}
</script>

<style lang="postcss" scoped>
</style>
