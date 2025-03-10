<template>
	<div class="row no-wrap items-center justify-center full-width">
		<!-- Dropdown for field key -->
		<SelectInput
			v-model="filter.key"
			:options="dropdownOptsForKey"
			emit-value
			dense
		/>
		<!-- Dropdown for operator -->
		<SelectInput
			v-model="filter.operator"
			:options="dropdownOptsForOperator"
			emit-value
			class="q-ml-xs"
			dense
		/>
		<!-- Input for field value -->
		<q-input
			v-model="filter.value"
			class="q-ml-xs"
			style="flex-grow: 1"
      standout
			dense
		/>
		<slot
			name="cta"
			v-bind="{ filter }"
		>
			<ThemeButton
				icon="add"
				class="q-ml-xs"
				@click="() => emit('change', filter)"
			/>
		</slot>
	</div>
</template>

<script setup lang="ts">
import SelectInput from 'src/components/ui/SelectInput.vue';
import { dbFilters } from 'adam-firebase-tools';
import { ref, onMounted, computed } from 'vue';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

export type FilterKeyOpt = {
  label: string;
  value: string;
  allowedOperators: Array<dbFilters.DbFilterOperator>;
  fieldOptions?: string[];
};

const props = defineProps<{
  initialValue?: dbFilters.DbFilter;
  keyOpts: Array<FilterKeyOpt>
}>();

const emit = defineEmits<{
	(e: 'change', value: dbFilters.DbFilter): void
}>();

const dropdownOptsForKey = ref<FilterKeyOpt[]>(props.keyOpts || []);

const filter = ref<dbFilters.DbFilter>({
	key: 'id',
	operator: dbFilters.DbFilterOperator.isEqual,
	value: ''
});

const dropdownOptsForOperator = computed(() =>
{
	if(dbFilters.isGroupFilter(filter.value))
	{
		// no support for groups yet
		return;
	}

	if(!filter.value?.key)
	{
		return Object.values(dbFilters.DbFilterOperator);
	}

	const { allowedOperators } = dropdownOptsForKey.value.find((opt) =>
	{
		if(dbFilters.isGroupFilter(filter.value))
		{
			// no support for groups yet
			return false;
		}

		return (opt.value === filter.value?.key);
	}) || {};

	if(!Array.isArray(allowedOperators))
	{
		return Object.values(dbFilters.DbFilterOperator);
	}

	return allowedOperators;
});

onMounted(() =>
{
	if(props.initialValue)
	{
		filter.value = props.initialValue;
	}
});
</script>

<style lang="postcss">
</style>
