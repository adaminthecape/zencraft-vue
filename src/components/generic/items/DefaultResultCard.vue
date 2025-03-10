<template>
  <!-- Show all properties of a TourItem -->
  <q-card v-if="itemData" flat bordered class="standout-2 q-ma-sm" v-bind="qProps">
    <q-card-section>
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-subtitle2">{{ itemType }}</div>
          <div
            v-if="fieldsToShow.mainField"
            class="text-h6"
          >{{ (itemData as any)[`${fieldsToShow.mainField.key}`] }}</div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="flex-col">
        <div
          v-for="subField in fieldsToShow.subFields"
          :key="`result-card-${itemType}-${itemId}-${subField.id}`"
          class="row items-center text-subtitle2"
        >
          <ThemeIcon v-if="subField.icon" :name="subField.icon" color="secondary" />
          <span v-else color="secondary">{{ subField.label || subField.key }}</span>
          <span>:&nbsp;</span>
          <span>{{ (itemData as any)[`${subField.key}`] }}</span>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions>
      <EditNewOrExistingItemModal
        :item-type="itemType"
        :existing-item-id="itemId"
      >
        <template #activator="{open}">
          <ThemeButton
            :label="$t('generic.buttons.open')"
            color="accent"
            flat
            @click="open"
          />
        </template>
      </EditNewOrExistingItemModal>
      <div class="q-space" />
      <div class="col-auto">
        <ThemeButton color="grey-7" round flat icon="more_vert">
          <q-menu cover auto-close>
            <q-list>
              <q-item clickable>
                <q-item-section>{{ $t('social.actions.share') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </ThemeButton>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import { computed, ref } from 'vue';
import { fields, item } from 'zencraft-core';
import EditNewOrExistingItemModal from './EditNewOrExistingItemModal.vue';
import { QCardProps } from 'quasar';
import useFieldsForItemType from 'src/composables/useFieldsForItemType';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const props = defineProps<{
  itemType: string;
  itemId: string;
  qProps?: QCardProps;
}>();

const itemHandler = ref<item.ItemHandler | undefined>();

const itemData = computed(() => itemHandler.value?.getData());

const itemTypeRef = computed(() => (props.itemType));
const { fieldsForItemType: itemFields } = useFieldsForItemType({ itemTypeRef });

// figure out which fields to show
const fieldsToShow = computed<{
  mainField: fields.FieldData | undefined,
  descriptionField: fields.FieldData | undefined,
  subFields: fields.FieldData[]
}>(() =>
{
  if(!(Array.isArray(itemFields.value) && itemFields.value.length))
  {
    return [];
  }

  return itemFields.value.reduce((agg, field) =>
  {
    if(field.isDefaultSortField || field.isPrimarySearchField)
    {
      agg.mainField = field;
    }
    else if(field.isSearchable && field.fieldType === fields.FieldType.textarea)
    {
      agg.descriptionField = field;
    }
    else if(field.isSearchable)
    {
      agg.subFields.push(field);
    }

    return agg;
  }, {
    mainField: undefined,
    descriptionField: undefined,
    subFields: []
  } as any);
});
</script>
