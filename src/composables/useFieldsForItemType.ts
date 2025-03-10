import { computed, ComputedRef } from 'vue';
import { fields } from 'zencraft-core';
import { useCustomItemStore } from 'src/pinia/customItemStore';

// Refactored to this after CustomItem made generic; fields no longer hardcoded

export default function useFieldsForItemType(options: {
  itemTypeRef: ComputedRef<string | undefined>;
}): ({
  fieldsForItemType: ComputedRef<fields.FieldData[] | undefined>;
})
{
  const itemStore = useCustomItemStore({})();

  const fieldsForItemType = computed<fields.FieldData[] | undefined>(() => (
    typeof options.itemTypeRef.value === 'string' ?
      itemStore.getFieldsForItemType(options.itemTypeRef.value) :
      undefined
  ));

  return {
    fieldsForItemType,
	};
}

// import { FieldStore, useFieldStore } from 'src/pinia/fieldStore';
// import { getFieldsForItemType } from 'src/logic/utils/items';

// export default function useFieldsForItemType(options: {
//   itemTypeRef: ComputedRef<string | undefined>;
// }): ({
//   fieldStore: FieldStore;
//   fieldsForItemType: ComputedRef<fields.FieldData[] | undefined>;
// })
// {
//   const fieldStore = useFieldStore({})();

//   const hardcodedFields = computed(() => (
//     options.itemTypeRef.value ?
//       getFieldsForItemType(options.itemTypeRef.value) :
//       undefined
//   ));

//   Take care to not use all field IDs as some may be repeater children
//   const hardcodedFieldIds = computed<any>(() => (
//     Array.isArray(hardcodedFields.value) ?
//       utils.retrieveItemIds<fields.FieldData>(hardcodedFields.value, false) :
//       undefined
//   ));

//   const fieldsForItemType = computed<fields.FieldData[] | undefined>(() => (
//     Array.isArray(hardcodedFieldIds.value) ?
//       (
//         hardcodedFieldIds.value
//           .map((id) => fieldStore.getItem(id, sharedTypes.KnownItemType.Field))
//           .filter((field) => field)
//       ) as fields.FieldData[] :
//       undefined
//   ));

//   onMounted(async () =>
//   {
//     // load the item type - TODO: still using hardcoded fields here for now

//     if(hardcodedFieldIds.value?.length)
//     {
//       await fieldStore.loadMultiple({
//         ids: hardcodedFieldIds.value,
//         itemType: sharedTypes.KnownItemType.Field,
//         force: true,
//       });
//     }
//   });

//   watch(options.itemTypeRef, (n, o) =>
//   {
//     if(n)
//     {
//       nextTick(() =>
//       {
//         if(hardcodedFieldIds.value?.length)
//         {
//           fieldStore.loadMultiple({
//             ids: hardcodedFieldIds.value,
//             itemType: sharedTypes.KnownItemType.Field,
//             force: true,
//           });
//         }
//       });
//     }
//   });

//   return {
//     fieldStore,
//     fieldsForItemType,
// 	};
// }
