<template>
	<div class="item-filters-container">
		<!-- Card for existing rules -->
		<div class="rule-card q-pa-sm">
			<div v-if="!filters?.length" class="flex flex-col justify-center items-center q-my-md">
				<div class="text-bold q-ma-sm">$t('forms.itemFilters.rules.noRules')</div>
			</div>
			<div v-else>
				<div class="text-bold q-mb-sm">{{ title || $t('forms.itemFilters.rules.title') }}</div>
        <slot name="itemTypeSelector" />
				<div
					v-for="(filterOrGroup, f) in filters"
					:key="`filterOrGroup-${f}`"
					class="q-my-sm"
				>
					<div
						v-if="dbFilters.isGroupFilter(filterOrGroup)"
						class="rule-card q-pa-sm q-my-sm"
					>
						<div class="row items-center">
							<div class="text-bold q-mr-sm">{{ $t('forms.itemFilters.rules.group') }}</div>
							<SelectInput
								v-model="filterOrGroup.group"
								:options="[
									{ label: 'All', value: 'and' },
									{ label: 'Any', value: 'or' }
								]"
								emit-value
								dense
                @update:model="emit('change', filters)"
							/>
						</div>
						<div
							v-if="!filterOrGroup.children.length"
							class="flex flex-col justify-center items-center q-my-sm text-bold q-mb-md"
						>{{ $t('forms.itemFilters.rules.noGroupRules') }}</div>
						<div
							v-for="(childFilterOrGroup, k) in filterOrGroup.children"
							:key="`childFilterOrGroup-${k}`"
							class="q-my-sm"
						>
							<div v-if="dbFilters.isGroupFilter(childFilterOrGroup)">
								Child groups not supported yet
							</div>
							<div v-else>
								<ItemSearchFilterRule
									:initial-value="childFilterOrGroup"
									:key-opts="keyOpts"
                  @change="updateFilterInGroup(f, k, $event)"
								>
									<template #cta>
										<ThemeButton
											icon="fas fa-minus"
											class="q-ml-xs"
											color="negative"
											@click="removeFilterFromGroup(f, k)"
										/>
									</template>
								</ItemSearchFilterRule>
							</div>
						</div>
						<div class="row items-center justify-center">
							<ThemeButton
                :label="$t('forms.itemFilters.rules.addRule')"
								color="positive"
								class="q-mr-sm"
								@click="addFilterToGroup(f, {
									key: 'id',
									operator: dbFilters.DbFilterOperator.isEqual,
									value: ''
								})"
							/>
							<ThemeButton
								icon="fas fa-minus"
								class="q-ml-xs"
                color="negative"
								@click="removeFilter(f)"
							/>
						</div>
					</div>
					<div v-else>
						<ItemSearchFilterRule
              :initial-value="filterOrGroup"
              :key-opts="keyOpts"
            >
							<template #cta>
								<ThemeButton
									icon="fas fa-minus"
									class="q-ml-xs"
                  color="negative"
									@click="removeFilter(f)"
								/>
							</template>
						</ItemSearchFilterRule>
					</div>
				</div>
			</div>
			<div class="row items-center justify-center q-my-sm">
				<ThemeButton
          :label="$t('forms.itemFilters.rules.addRule')"
					color="positive"
					class="q-mr-sm"
					@click="addFilter({
						key: 'id',
						operator: dbFilters.DbFilterOperator.isEqual,
						value: ''
					})"
				/>
				<ThemeButton
          :label="$t('forms.itemFilters.rules.addGroup')"
					color="secondary"
					@click="addGroup({
						group: dbFilters.DbFilterGroupType.and,
						children: []
					})"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { dbFilters, fields } from 'zencraft-core';
import { ref, onMounted, computed, watch } from 'vue';
import SelectInput from 'src/components/ui/SelectInput.vue';
import ItemSearchFilterRule, { FilterKeyOpt } from 'src/components/generic/search/ItemSearchFilterRule.vue';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';

const props = defineProps<{
  itemType: string;
  title?: string;
  initialValue?: dbFilters.DbFilters;
}>();

const filters = ref<dbFilters.DbFilters>(props.initialValue || []);

watch(() => props.initialValue, (n, o) =>
{
  if(Array.isArray(props.initialValue))
  {
    filters.value = props.initialValue;
  }
});

const emit = defineEmits<{
	(e: 'change', value: dbFilters.DbFilters): void
}>();

function addFilter(filter: dbFilters.DbFilter): void
{
	if(dbFilters.isGroupFilter(filter))
	{
		// no support for groups yet
		return;
	}

  console.log('filters:', typeof filters.value, filters.value);
	filters.value.push(filter);
	emit('change', filters.value);
}

function addGroup(filter: dbFilters.DbFilterGroup): void
{
	if(!dbFilters.isGroupFilter(filter))
	{
		console.log('not a group:', filter);
		return;
	}

	filters.value.push(filter);
	emit('change', filters.value);
}

function addFilterToGroup(groupIndex: number, filter: dbFilters.DbFilter): void
{
	if(!dbFilters.isGroupFilter(filters.value[groupIndex]))
	{
		return;
	}

	filters.value[groupIndex].children.push(filter);
	emit('change', filters.value);
}

function updateFilter(index: number, filter: dbFilters.DbFilter): void
{
	if(dbFilters.isGroupFilter(filter))
	{
		// no support for groups yet
		return;
	}

	filters.value[index] = filter;
	emit('change', filters.value);
}

function updateFilterInGroup(
	groupIndex: number,
	index: number,
	filter: dbFilters.DbFilter
): void
{
	if(!dbFilters.isGroupFilter(filters.value[groupIndex]))
	{
  console.log('updateFilterInGroup:', 'is not group', groupIndex, filters.value[groupIndex]);
		return;
  }

  console.log('updateFilterInGroup:', filter);

	filters.value[groupIndex].children[index] = filter;
	emit('change', filters.value);
}

function removeFilter(index: number): void
{
	filters.value.splice(index, 1);
	emit('change', filters.value);
}

function removeFilterFromGroup(
	groupIndex: number,
	index: number
): void
{
	if(dbFilters.isGroupFilter(filters.value[groupIndex]))
	{
		filters.value[groupIndex].children.splice(index, 1);
		emit('change', filters.value);
	}
}

const keyOptsBasic = ref([
  {
    label: 'ID',
    value: 'itemId',
    allowedOperators: [
      dbFilters.DbFilterOperator.isEqual,
      dbFilters.DbFilterOperator.isNotEqual,
      dbFilters.DbFilterOperator.in,
      dbFilters.DbFilterOperator.notIn,
      dbFilters.DbFilterOperator.fuzzyEqual
    ]
  },
]);

const stringOperators = [
  dbFilters.DbFilterOperator.isEqual,
  dbFilters.DbFilterOperator.isNotEqual,
  dbFilters.DbFilterOperator.in,
  dbFilters.DbFilterOperator.notIn,
  dbFilters.DbFilterOperator.fuzzyEqual
];

const numberOperators = [
  dbFilters.DbFilterOperator.isEqual,
  dbFilters.DbFilterOperator.isNotEqual,
  dbFilters.DbFilterOperator.greaterThan,
  dbFilters.DbFilterOperator.greaterThanOrEqualTo,
  dbFilters.DbFilterOperator.lessThan,
  dbFilters.DbFilterOperator.lessThanOrEqualTo
];

const arrayOperators = [
  dbFilters.DbFilterOperator.arrayContains,
  dbFilters.DbFilterOperator.arrayContainsAny,
  dbFilters.DbFilterOperator.fuzzyEqual,
];

const allowedOperatorsByFieldType: (
  Record<fields.FieldType, dbFilters.DbFilterOperator[]>
) = {
  [fields.FieldType.checkbox]: arrayOperators,
  [fields.FieldType.dropdown]: [...arrayOperators, ...stringOperators],
  [fields.FieldType.toggle]: [...arrayOperators, ...stringOperators],
  [fields.FieldType.item]: stringOperators,
  [fields.FieldType.itemArray]: arrayOperators,
  [fields.FieldType.itemFilters]: [],
  [fields.FieldType.number]: numberOperators,
  [fields.FieldType.radio]: [...stringOperators, ...numberOperators],
  [fields.FieldType.readonly]: [],
  [fields.FieldType.repeater]: [],
  [fields.FieldType.text]: stringOperators,
  [fields.FieldType.textarea]: stringOperators,
  [fields.FieldType.timestamp]: numberOperators,
  [fields.FieldType.uuid]: stringOperators,
  [fields.FieldType.uuidArray]: arrayOperators,
  [fields.FieldType.fieldType]: stringOperators,
  [fields.FieldType.itemFieldKey]: stringOperators,
};

const selectedItemType = ref<string | undefined>();
const itemTypeRef = computed(() => (selectedItemType.value || props.itemType));
const { fieldsForItemType } = useFieldsForItemType({ itemTypeRef });

const keyOpts = computed(() =>
{
  if(Array.isArray(fieldsForItemType.value) && fieldsForItemType.value.length)
  {
    return fieldsForItemType.value.reduce((
      agg: FilterKeyOpt[],
      field: fields.FieldData
    ) =>
    {
      if(field?.key && field.fieldType)
      {
        if([
          fields.FieldType.readonly,
          fields.FieldType.repeater,
        ].includes(field.fieldType))
        {
          return agg;
        }

        agg.push({
          value: field.key,
          label: field.label || field.key || field.id,
          allowedOperators: allowedOperatorsByFieldType[field.fieldType],
        });
      }

      return agg;
    }, [...keyOptsBasic.value]);
  }

  return keyOptsBasic.value;
});

onMounted(() =>
{
	if(Array.isArray(props.initialValue))
	{
		filters.value = [...props.initialValue];
	}
});

</script>

<style lang="postcss">
.item-filters-container {
  display: block;
}

.rule-card {
	background-color: var(--q-neutral60);
	border-radius: 6px;
}
body.body--dark * .rule-card {
	background-color: var(--q-neutral10);
}
</style>
