# Adding a Block

## Back end
First ensure it has a unique name defined in `BlockTypes`.

Next, add config in `blockTypeConfig`.

You may need to upsert the field to add the new block type to its options (see field "blockType" in `BlockDefinition.blockDefinitionItemFields`).

## Front end
Ensure there is an i18n translation in `i18n/en/index.js` and for any other relevant language.

Add an import for the component for that block type in the `usePublicComponent` composable.

## New Items
You should create and save a new `BlockDefinition` with the new `BlockType`.

Once you have created a `BlockDefinition`, you should see a new entry in the Block Library.

You should create and save a new `Block` with the new `BlockDefinition` for testing purposes.

# Adding a FieldType
First, add it to the `FieldType` enum in `Field.ts`.

Add an entry for `getInputComponent()` in `FormFields.vue`.

Add allowed operators for any relevant filters in `ItemSearchFilters.vue`.

Add handling for the field type in `ItemSearchResultTable.vue`.

Add a validator in `FieldValidator.ts` (`fieldTypeValidators` requires it).

Add an entry in the `FieldValidation` type if a new validator is needed.

