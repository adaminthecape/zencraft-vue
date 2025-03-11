<template>
  <q-table
    ref="table"
    :columns="columns"
    :rows="resultRows"
    :row-key="(r) => (`table-row-${r.id}`)"
    dense
    flat
    class="standout-1 bg-standard"
    :pagination="qPagination"
    @update:pagination="updatePagination"
    @request="requestData"
  >
    <template #loading>
      <q-spinner :size="40" />
    </template>
    <template #top><slot name="top" v-bind="{ columns, resultRows }" /></template>
    <template #top-left><slot name="top-left" v-bind="{ columns, resultRows }" /></template>
    <template #top-right><slot name="top-right" v-bind="{ columns, resultRows }" /></template>
    <template
      v-for="headerCellName in columnNames"
      :key="`template-header-${headerCellName}`"
      #[`header-cell-${headerCellName}`]="ctx"
    >
      <slot :name="`custom-header-cell-${headerCellName}`" v-bind="ctx">
        <q-th class="text-left text-bold" auto-width>
          <span>{{ (
            fieldsByName[headerCellName]?.label ||
            ctx.col.label ||
            ctx.col.name
          ) }}</span>
          <span>
            <q-btn
              v-if="fieldsByName[headerCellName]?.isSearchable"
              icon="search"
              :color="filterValues[headerCellName] ? 'accent' : undefined"
              :flat="!filterValues[headerCellName]"
              size="sm"
              dense
              round
            >
              <q-popup-proxy>
                <q-card>
                  <ListItem>
                    <q-input
                      v-model="filterValues[headerCellName]"
                      :placeholder="fieldsByName[headerCellName]?.label || headerCellName"
                      outlined
                      dense
                      @update:model-value="(newVal) => updateFilterByKey(
                        fieldsByName[headerCellName]?.key,
                        newVal
                      )"
                    />
                  </ListItem>
                </q-card>
              </q-popup-proxy>
            </q-btn>
          </span>
        </q-th>
      </slot>
    </template>
    <template
      v-for="bodyCellName in columnNames"
      :key="`template-body-${bodyCellName}`"
      #[`body-cell-${bodyCellName}`]="ctx"
    >
      <slot :name="`custom-body-cell-${bodyCellName}`" v-bind="ctx">
        <q-td
          class="item-search-table-result-cell"
          auto-width
          @click="() => onResultClicked({
            column: bodyCellName,
            fieldKey: fieldsByName[bodyCellName]?.key,
            value: ctx.value,
            itemId: ctx.row.id,
          })"
        >
          <template v-if="!fieldsByName[bodyCellName]?.key">
            <!-- Disallow editing non-prescribed fields -->
            {{ ctx.value }}
          </template>
          <template
            v-else-if="fieldsByName[bodyCellName].fieldType === fields.FieldType.timestamp"
          >
          <span
            v-if="(typeof ctx.value === 'number' || parseInt(`${ctx.value}`, 10) === ctx.value)"
          >{{ convertTimestampToDateTime(parseInt(`${ctx.value}`, 10))?.date }}</span>
          <span
            v-else-if="ctx.value && !Number.isNaN(new Date(ctx.value).valueOf())"
          >{{ new Date(ctx.value).toISOString().split('T')[0] }}</span>
          </template>
          <template
            v-else-if="fieldsByName[bodyCellName].fieldType === fields.FieldType.itemArray"
          >
            <span
              v-if="ctx.value?.length"
            >{{ ctx.value.length }} {{ fieldsByName[bodyCellName].itemType || 'Item' }}(s)</span>
          </template>
          <template
            v-else-if="fieldsByName[bodyCellName].fieldType === fields.FieldType.item"
          >
            <ItemAvatar
              v-if="utils.uuid.isUuid(ctx.value)"
              :item-type="fieldsByName[bodyCellName].itemType || 'Item'"
              :item-id="ctx.value"
            />
          </template>
          <template
            v-else-if="fieldsByName[bodyCellName].fieldType === fields.FieldType.repeater"
          >
            <span
              v-if="ctx.value?.length"
            >{{ ctx.value.length }} Item(s)</span>
          </template>
          <template v-else-if="utils.uuid.isUuid(ctx.value)">
            <span>{{ ctx.value.split('-')[0] }}</span>
            <q-tooltip>{{ ctx.value }}</q-tooltip>
          </template>
          <template v-else>{{ ctx.value }}</template>
        </q-td>
      </slot>
    </template>
    <template #header-cell-actions><q-th>{{ $t('tables.actions.title') }}</q-th></template>
    <template #body-cell-actions="{ row }">
      <q-td auto-width>
        <div class="row items-center justify-center no-wrap">
          <slot name="actions" v-bind="{ row }">
          </slot>
          <slot name="defaultActions" v-bind="{ row }">
            <EditNewOrExistingItemModal
              :existing-item-id="row.id"
              :item-type="row.typeId"
            >
              <template #activator="{open}">
                <ThemeButton
                  icon="edit"
                  color="accent"
                  size="sm"
                  flat
                  @click="open"
                />
              </template>
            </EditNewOrExistingItemModal>
            <ItemDeleteButton
              :store="(store as any)"
              :item-id="row.id"
              :item-type="row.typeId"
              dense
              size="sm"
            />
          </slot>
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ItemDeleteButton from 'src/components/generic/items/ItemDeleteButton.vue';
import { getTableColumns } from 'src/logic/utils/items';
import { dbFilters, dbPagination, fields, utils } from 'zencraft-core';
import { GenericItemStore } from 'src/pinia/genericItemStore';
import { convertTimestampToDateTime } from 'src/logic/utils/dates';
import EditNewOrExistingItemModal from '../items/EditNewOrExistingItemModal.vue';
import { QTableProps } from 'quasar';
import ItemAvatar from './ItemAvatar.vue';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ListItem from 'src/components/ui/ListItem.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const filterValues = ref<Record<string, unknown>>({});
const filterOperators = ref<Record<string, dbFilters.DbFilterOperator>>({});
const filters = ref<dbFilters.DbFilters>([]);

function updateFilterByKey(key: unknown, newVal: unknown)
{
  if(typeof key === 'string')
  {
    filterValues.value[key] = newVal;

    const newFilters: dbFilters.DbFilters = [];

    for(const [k, v] of Object.entries(filterValues.value))
    {
      if(v)
      {
        newFilters.push({
          key: k,
          operator: filterOperators.value[k] || '~',
          value: v
        });
      }
    }

    filters.value = newFilters;

    emit('update:filters', newFilters);
  }
}

const modelTitle = defineModel<string>();

const props = defineProps<{
  store: GenericItemStore;
  itemType?: string;
  customFields?: fields.FieldData[];
  results: Record<string, unknown>;
  quasarPagination?: QTableProps['pagination'];
  showDefaultItemFields?: boolean;
}>();

const table = ref();

const resultRows = computed(() => (
  utils.genericUtils.isPopulatedObject(props.results) ? Object.values(props.results) : []
));

const computedResults = computed(() => props.results);

const columnNames = computed<string[]>(() =>
{
  if(!Array.isArray(columns.value))
  {
    return [];
  }

  return columns.value.reduce((agg, col) =>
  {
    // Quasar refers to the `name` when constructing the template name
    if(typeof col.name === 'string' && col.name)
    {
      // show actions column separately
      if(col.name === 'actions')
      {
        return agg;
      }

      agg.push(col.name);
    }

    return agg;
  }, [] as string[]);
});

const fieldsByName = computed<Record<string, fields.FieldData>>(() => (
  !Array.isArray(activeFields.value) ?
    {} :
    columnNames.value.reduce((agg, name) =>
    {
      const field: (
        fields.FieldData | undefined
      ) = activeFields.value?.find((f) => f.key === name);

      (agg as any)[name] = field || {};

      return agg;
    }, {} as Record<string, ReturnType<typeof getTableColumns>>[number])
));

const itemTypeComputed = computed(() => (
  props.itemType ? props.itemType : (
    resultRows.value?.length ?
      Object.keys(resultRows.value[0] || {})[0]?.typeId :
      undefined
  )
));

const { fieldsForItemType } = itemTypeComputed.value ?
  useFieldsForItemType({ itemTypeRef: itemTypeComputed }) :
  {};

const activeFields = computed(() =>
{
  return (Array.isArray(props.customFields)) ?
    props.customFields :
    fieldsForItemType?.value
});

const columns = computed<ReturnType<typeof getTableColumns>>(() =>
{
  let cols = getTableColumns({
    results: computedResults.value,
    exclude: ['createdAt', 'createdBy', 'updatedAt'],
    knownFields: props.customFields
  });

  if(
    !props.showDefaultItemFields &&
    Array.isArray(props.customFields) &&
    props.customFields.length
  )
  {
    // filter fields from cols if not in custom fields
    cols = cols.reduce((agg: any[], col) =>
    {
      if(col.name === 'actions')
      {
        agg.push(col);

        return agg;
      }

      if(props.customFields?.some((field) =>
      {
        const matched = field.key === col.name;

        if(matched)
        {
          return true;
        }

        return false;
      }))
      {
        agg.push(col);
      }

      return agg;
    }, []);
  }

  return cols;
});

// Pagination:

function requestData(e: {
  filter?: any;
  pagination?: QTableProps['pagination'];
  getCellValue?: (col: any, row: any) => any
})
{
  if(utils.genericUtils.isPopulatedObject(e?.pagination))
  {
      updatePagination(e.pagination);
  }
}

export type ItemResultClick = {
  fieldKey?: string | undefined;
  column?: string | undefined;
  itemId: string | undefined;
  itemType: string | undefined;
  value?: unknown;
};

const emit = defineEmits<{
  (e: 'update:pagination:internal', value: dbPagination.DbPaginationOpts): void;
  (e: 'update:pagination:quasar', value: QTableProps['pagination']): void;
  (e: 'update:filters', value: dbFilters.DbFilters): void;
  (e: 'resultClicked', value: ItemResultClick): void;
}>();

const qPagination = ref<QTableProps['pagination']>({
  page: 1,
  rowsPerPage: 10
});

function updateFilters(newVal: dbFilters.DbFilters)
{
  emit('update:filters', newVal);
}

function updatePagination(newVal: QTableProps['pagination'])
{
  qPagination.value = newVal;

  emit('update:pagination:quasar', newVal);
}

watch(() => props.quasarPagination, (n, o) =>
{
  qPagination.value = n;
});

function onResultClicked(e: ItemResultClick)
{
  emit('resultClicked', e);
}
</script>

<style lang="postcss" scoped>
.item-search-container {
	background-color: var(--q-neutral10);
	border-radius: 6px;
	position: relative;
	min-height: 10rem;
}

.item-search-opts-activator {
	position: absolute;
	top: 8px;
	right: 8px;
}

.item-search-table-result-cell {
  max-width: 10rem;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
