/**
 * Result of validation
 */
export interface ValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * Common properties for all value validators
 */
export interface ValueValidatorDefinition {
    type: string | "string" | "number" | "boolean" | "object" | "array",
    allowUndefined?: boolean
}

/**
 * Check if value is a value validator definition
 * @param value 
 * @returns 
 */
export function isValueValidatorDefinition(value: any): value is ValueValidatorDefinition {
	if ("type" in value)
		return true;

	return false;
}

/**
 * String value validator definition
 */
export interface StringValueValidatorDefinition extends ValueValidatorDefinition {
    type: "string"
    /** Set to true to require the string to not be empty */
    requireNotEmpty?: boolean
}

/**
 * Check if value is a string value validator definition
 * @param value 
 * @returns 
 */
export function isStringValueValidatorDefinition(value: any): value is StringValueValidatorDefinition {
    
	return isValueValidatorDefinition(value) && value.type === "string";
}

/**
 * Number value validator definition
 */
export interface NumberValueValidatorDefinition extends ValueValidatorDefinition {
    type: "number",
    min?: number,
    max?: number
}

/**
 * Check if value is a number value validator definition
 * @param value 
 * @returns 
 */
export function isNumberValueValidatorDefinition(value: any): value is NumberValueValidatorDefinition {
    
	return isValueValidatorDefinition(value) && value.type === "number";
}

/**
 * Boolean value validator definition
 */
export interface BooleanValueValidatorDefinition extends ValueValidatorDefinition {
    type: "boolean"
}

/**
 * Check if value is a boolean value validator definition
 * @param value 
 * @returns 
 */
export function isBooleanValueValidatorDefinition(value: any): value is BooleanValueValidatorDefinition {
    
	return isValueValidatorDefinition(value) && value.type === "boolean";
}

/**
 * Object value validator definition
 */
export interface ObjectValueValidatorDefinition extends ValueValidatorDefinition {
    type: "object"
    allowExtra?: boolean,
    properties?: { [key: string]: ValueValidatorDefinitionType }
}

/**
 * Check if value is an object value validator definition
 * @param value 
 * @returns 
 */
export function isObjectValueValidatorDefinition(value: any): value is ObjectValueValidatorDefinition {
    
	return isValueValidatorDefinition(value) && value.type === "object";
}

/**
 * Array value validator definition
 */
export interface ArrayValueValidatorDefinition extends ValueValidatorDefinition {
    type: "array"
    min?: number,
    max?: number
    valueType?: ValueValidatorDefinitionType
}

export type ValueValidatorDefinitionType = 
    StringValueValidatorDefinition | 
    NumberValueValidatorDefinition | 
    BooleanValueValidatorDefinition | 
    ObjectValueValidatorDefinition | 
    ArrayValueValidatorDefinition;

/**
 * Check if value is an array value validator definition
 * @param value 
 * @returns 
 */
export function isArrayValueValidatorDefinition(value: any): value is ArrayValueValidatorDefinition {
    
	return isValueValidatorDefinition(value) && value.type === "array";
}

export interface ValidationStack {
    pushKey: (key: string) => void;
    popKey: () => void;
    result: (result: boolean, message?: string) => ValidationResult;
}

export const createValidationStack = (): ValidationStack => {
	const stack: string[] = [];
	const createMessage = (message: string | undefined) : string => {
		const msg = stack.length > 0 ? `Invalid value for key "${stack.join(".")}"` : "Invalid value";
		
		return message ? `${msg}: ${message}` : msg;
	};
	
	return {
		pushKey: (key: string) => stack.push(key),
		popKey: () => stack.pop(),
		result: (valid: boolean, message?: string) => {
			const result : ValidationResult = {
				valid,
				message: valid ? undefined : createMessage(message)
			};
            
			return result;
		}
	};
};

/** validate string */
export const validateString = (value: any, definition: StringValueValidatorDefinition, stack: ValidationStack) => {
	if (value === undefined || value === null) {
		if (definition.allowUndefined)
			return stack.result(true);
		else
			return stack.result(false, "Value is not defined");
	}
    
	if (typeof value !== "string")
		return stack.result(false, "Value is not a string");

	if (definition.requireNotEmpty && value.length === 0)
		return stack.result(false, "Value is empty");

	return stack.result(true);
};

/** validate boolean */
export const validateBoolean = (value: any, definition: BooleanValueValidatorDefinition, stack: ValidationStack) => {
	if (value === undefined || value === null) {
		if (definition.allowUndefined)
			return stack.result(true);
		else
			return stack.result(false, "Value is not defined");
	}
    
	if (typeof value !== "boolean")
		return stack.result(false, "Value is not a boolean");

	return stack.result(true);
};

/** validate number */
export const validateNumber = (value: any, definition: NumberValueValidatorDefinition, stack: ValidationStack) => {
	if (value === undefined || value === null) {
		if (definition.allowUndefined)
			return stack.result(true);
		else
			return stack.result(false, "Value is not defined");
	}
    
	if (typeof value !== "number")
		return stack.result(false, "Value is not a number");

	if (definition.min !== undefined && value < definition.min)
		return stack.result(false, `Value is less than ${definition.min}`);

	if (definition.max !== undefined && value > definition.max)
		return stack.result(false, `Value is greater than ${definition.max}`);
    
	return stack.result(true);
};

/** validate array */
export const validateArray = (value: any, definition: ArrayValueValidatorDefinition, stack: ValidationStack) => {
	if (!value) {
		if (definition.allowUndefined)
			return stack.result(true);
		else
			return stack.result(false, "Value is not defined");
	}
    
	if (!Array.isArray(value))
		return stack.result(false, "Value is not an array");

	if (definition.min !== undefined && value.length < definition.min)
		return stack.result(false, `Array length is less than ${definition.min}`);

	if (definition.max !== undefined && value.length > definition.max)
		return stack.result(false, `Array length is greater than ${definition.max}`);

	if (definition.valueType) {
		for (let i = 0; i < value.length; i++) {
			stack.pushKey(i.toString());
			const result = validate(value[i], definition.valueType, stack);
			stack.popKey();
            
			if (!result.valid)
				return result;
		}
	}

	return stack.result(true);
};

/** validate object */
export const validateObject = (value: any, definition: ObjectValueValidatorDefinition, stack: ValidationStack) => {
	if (!value) {
		if (definition.allowUndefined)
			return stack.result(true);
		else
			return stack.result(false, "Value is not defined");
	}

	if (typeof value !== "object")
		return stack.result(false, "Value is not an object");

	if (definition.properties) {
		for (const key in definition.properties) {
			stack.pushKey(key);
			const result = validate(value[key], definition.properties[key], stack);
			stack.popKey();
            
			if (!result.valid)
				return result;
		}
	}

	if (!definition.allowExtra) {
		const extraKeys = Object.keys(value).filter(key => !(key in (definition.properties ?? {})));
		if (extraKeys.length > 0)
			return stack.result(false, `Extra keys: ${extraKeys.join(", ")}`);
	}

	return stack.result(true);
};

/** validate object with schema */
export const validate = (value: any, definition: ValueValidatorDefinition, stack?: ValidationStack) : ValidationResult => {
	stack = stack ?? createValidationStack();
	
	if (isStringValueValidatorDefinition(definition)) {
		return validateString(value, definition, stack);
	}
	else if (isNumberValueValidatorDefinition(definition)) {
		return validateNumber(value, definition, stack);
	}
	else if (isBooleanValueValidatorDefinition(definition)) {
		return validateBoolean(value, definition, stack);
	}
	else if (isArrayValueValidatorDefinition(definition)) {
		return validateArray(value, definition, stack);
	}
	else if (isObjectValueValidatorDefinition(definition)) {
		return validateObject(value, definition, stack);
	}

	return { valid: false, message: "Invalid value definition"};
};
