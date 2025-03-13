import { GenericItemStore } from 'src/pinia/genericItemStore';
import { fields, item } from 'zencraft-core';
import { QInputProps, ValidationRule } from 'quasar';
import cloneDeep from 'lodash/cloneDeep';
import { onMounted, ref, watch, defineEmits, Ref, computed } from 'vue';
import { fieldValidation } from 'zencraft-core';

export type FormElementProps<
	ModelType,
	HandlerType extends item.ItemHandler = item.ItemHandler
> = {
	itemId?: string;
	itemType?: string;
	store?: GenericItemStore;
	itemHandler?: HandlerType | undefined;
	field: fields.Field | fields.FieldData;
	initialValue?: ModelType;
	type?: QInputProps['type'];
	includeDefinitionFields?: boolean;
};

export default function useFormElement<ModelType>(opts: {
	props: FormElementProps<ModelType>,
	emit: ReturnType<typeof defineEmits>;
}): ({
	generateInputRules: (
		field: fields.Field | fields.FieldData
	) => ValidationRule[] | undefined;
	updateValue: (newData: ModelType) => void;
	modelProxy: Ref<ModelType | undefined>;
	fieldRules: Ref<ValidationRule[] | undefined>;
})
{
	const { props, emit } = opts;

	const modelProxy = ref<ModelType>();

	// set model to initialValue on mount
	onMounted(() =>
	{
		if(props.initialValue)
		{
			updateValue(cloneDeep(props.initialValue));
		}
	});

	// update model if initialValue changes
	watch(() => props.initialValue, (n) =>
	{
		if(props.field?.key)
		{
			updateValue(n as ModelType);

			// kick Quasar to update the validation for the new value
			areFieldRulesDisabled.value = true;
			setTimeout(() =>
			{
				areFieldRulesDisabled.value = false;
			}, 10);
		}
	});

	// update field rules & call updateValue when model changes
	watch(() => modelProxy.value, (n) =>
	{
		if(props.field?.key)
		{
			emit('changed', n);

			// kick Quasar to update the validation for the new value
			areFieldRulesDisabled.value = true;
			setTimeout(() =>
			{
				areFieldRulesDisabled.value = false;
			}, 50);
		}
	});

	/**
	 * Rules in a format that Quasar QInput can use (`:rules="..."`)
	 */
	const validationRules: (Record<
		fieldValidation.KnownValidationRules,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(val: any) => true | string
	>) = {
		required: (val: string) =>
		{
			return fieldValidation.FieldValidator.validateRequired({
				val,
				field: props.field
			});
		},
		options: (val: string | string[]) =>
		{
			return fieldValidation.FieldValidator.validateOptions({
				val,
				field: props.field
			});
		},
		between: (val: string | number) =>
		{
			return fieldValidation.FieldValidator.validateBetween({
				val,
				field: props.field
			});
		},
		isBoolean: fieldValidation.FieldValidator.validateIsBoolean,
		isArray: fieldValidation.FieldValidator.validateIsArray,
		isNumber: fieldValidation.FieldValidator.validateIsNumber,
		isObject: fieldValidation.FieldValidator.validateIsObject,
		isString: fieldValidation.FieldValidator.validateIsString,
		isTimestamp: fieldValidation.FieldValidator.validateIsTimestamp,
		isUuid: fieldValidation.FieldValidator.validateIsUuid,
		isUuidArray: fieldValidation.FieldValidator.validateIsUuidArray,
		isItemFilterArray: fieldValidation.FieldValidator.validateIsItemFilterArray,
	};

	const fieldRulesToUse = ref<ValidationRule[] | undefined>();
	const areFieldRulesDisabled = ref(false);
	const fieldRules = computed(() => (
		areFieldRulesDisabled.value ? undefined : fieldRulesToUse.value
	));

	/**
	 * Map a field to its validators.
	 * @returns Array of Quasar-friendly rule functions
	 */
	function generateInputRules(): ValidationRule[] | undefined
	{
		return fieldValidation.FieldValidator.generateInputRuleNames(props.field)
			?.map((name) => validationRules[name]);
	}

	// generate input rules on mount
	onMounted(() =>
	{
		fieldRulesToUse.value = generateInputRules();
	});

	function updateValue(newData: ModelType)
	{
		if(!props.field?.key)
		{
			return;
		}

		let handler = props.itemHandler;

		if(!handler && props.store && props.itemId && props.itemType)
		{
			handler = props.store.getHandler(props.itemId, props.itemType);
		}

		if(handler instanceof item.ItemHandler)
		{
			// using setData() here instead of individual get/set
			// to accommodate Items with no hardcoded get/set
			// (handler as any)[props.field.key] = newData;
			handler.setData({ [props.field.key]: newData });

			const newValue = (
				handler.getData() as Record<string, unknown>
			)[props.field.key];

			modelProxy.value = newValue as ModelType;
		}
		else
		{
			// just update the value
			modelProxy.value = newData;
		}
	}

	const definitionFields = computed<fields.FieldData[] | undefined>(() =>
	{
		if(!props.includeDefinitionFields)
		{
			return undefined;
		}

		return undefined;
	});

	// set definition fields on mount
	onMounted(() =>
	{
		if(props.includeDefinitionFields)
		{
			if(definitionFields.value?.length)
			{
				// add the fields to all fields ?
			}
		}
	});

	return {
		generateInputRules,
		updateValue,
		modelProxy,
		fieldRules,
	};
}
