import { ObjectValueValidatorDefinition, ValidationStack, createValidationStack, validate, validateArray, validateBoolean, validateNumber, validateObject, validateString } from "./jsonvalidator";

describe("validateString", () =>
{
	let stack: ValidationStack;

	beforeEach(() =>
	{
		stack = createValidationStack();
	});

	test("validateString", () =>
	{
		expect(validateString("string", {type: "string"}, stack)).toEqual({valid: true});
	});

	test("validateString undefined", () =>
	{
		expect(validateString(undefined, {type: "string"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateString null", () =>
	{
		expect(validateString(null, {type: "string"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateString undefined allowUndefined", () =>
	{
		expect(validateString(undefined, {type: "string", allowUndefined: true}, stack)).toEqual({valid: true});
	});

	test("validateString empty", () =>
	{
		expect(validateString("", {type: "string"}, stack)).toEqual({valid: true});
	});

	test("validateString empty requireNotEmpty", () =>
	{
		expect(validateString("", {type: "string", requireNotEmpty: true}, stack)).toEqual({valid: false, message: "Invalid value: Value is empty"});
	});

	test("validateString notempty requireNotEmpty", () =>
	{
		expect(validateString("x", {type: "string", requireNotEmpty: true}, stack)).toEqual({valid: true});
	});

});

describe("validateNumber", () =>
{
	let stack: ValidationStack;

	beforeEach(() =>
	{
		stack = createValidationStack();
	});

	test("validateNumber", () =>
	{
		expect(validateNumber(1.23, {type: "number"}, stack)).toEqual({valid: true});
	});

	test("validateNumber undefined", () =>
	{
		expect(validateNumber(undefined, {type: "number"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateNumber null", () =>
	{
		expect(validateNumber(null, {type: "number"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateNumber undefined allowUndefined", () =>
	{
		expect(validateNumber(undefined, {type: "number", allowUndefined: true}, stack)).toEqual({valid: true});
	});

	test("validateNumber valid", () =>
	{
		expect(validateNumber(1.23, {type: "number"}, stack)).toEqual({valid: true});
	});

	test("validateNumber valid min max", () =>
	{
		expect(validateNumber(1.23, {type: "number", min: 1, max: 2}, stack)).toEqual({valid: true});
	});

	test("validateNumber invalid min max", () =>
	{
		expect(validateNumber(3, {type: "number", min: 1, max: 2}, stack)).toEqual({valid: false, message: "Invalid value: Value is greater than 2"});
	});

	test("validateNumber invalid min max", () =>
	{
		expect(validateNumber(0, {type: "number", min: 1, max: 2}, stack)).toEqual({valid: false, message: "Invalid value: Value is less than 1"});
	});
});

describe("validateBoolean", () =>
{
	let stack: ValidationStack;

	beforeEach(() =>
	{
		stack = createValidationStack();
	});

	test("validateBoolean", () =>
	{
		expect(validateBoolean(true, {type: "boolean"}, stack)).toEqual({valid: true});
	});

	test("validateBoolean", () =>
	{
		expect(validateBoolean(false, {type: "boolean"}, stack)).toEqual({valid: true});
	});

	test("validateBoolean undefined", () =>
	{
		expect(validateBoolean(undefined, {type: "boolean"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateBoolean null", () =>
	{
		expect(validateBoolean(null, {type: "boolean"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateBoolean undefined allowUndefined", () =>
	{
		expect(validateBoolean(undefined, {type: "boolean", allowUndefined: true}, stack)).toEqual({valid: true});
	});
});

describe("validateArray", () =>
{
	let stack: ValidationStack;

	beforeEach(() =>
	{
		stack = createValidationStack();
	});

	test("validateArray", () =>
	{
		expect(validateArray([], {type: "array"}, stack)).toEqual({valid: true});
	});

	test("validateArray undefined", () =>
	{
		expect(validateArray(undefined, {type: "array"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateArray null", () =>
	{
		expect(validateArray(null, {type: "array"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateArray undefined allowUndefined", () =>
	{
		expect(validateArray(undefined, {type: "array", allowUndefined: true}, stack)).toEqual({valid: true});
	});

	test("validateArray min max", () =>
	{
		expect(validateArray([0], {type: "array", min: 1}, stack)).toEqual({valid: true});
	});

	test("validateArray invalid min max", () =>
	{
		expect(validateArray([], {type: "array", min: 1}, stack)).toEqual({valid: false, message: "Invalid value: Array length is less than 1"});
	});

	test("validateArray invalid min max", () =>
	{
		expect(validateArray([0,1], {type: "array", max: 1}, stack)).toEqual({valid: false, message: "Invalid value: Array length is greater than 1"});
	});

	test("validateArray valid valueType", () =>
	{
		expect(validateArray([0,1], {type: "array", valueType: {type: "number"}}, stack)).toEqual({valid: true});
	});

	test("validateArray invalid valueType", () =>
	{
		expect(validateArray([0,"x"], {type: "array", valueType: {type: "number"}}, stack)).toEqual({valid: false, message: "Invalid value for key \"1\": Value is not a number"});
	});
});

describe("validateObject", () =>
{
	let stack: ValidationStack;

	beforeEach(() =>
	{
		stack = createValidationStack();
	});

	test("validateObject", () =>
	{
		expect(validateObject({}, {type: "object"}, stack)).toEqual({valid: true});
	});

	test("validateObject undefined", () =>
	{
		expect(validateObject(undefined, {type: "object"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateObject null", () =>
	{
		expect(validateObject(null, {type: "object"}, stack)).toEqual({valid: false, message: "Invalid value: Value is not defined"});
	});

	test("validateObject undefined allowUndefined", () =>
	{
		expect(validateObject(undefined, {type: "object", allowUndefined: true}, stack)).toEqual({valid: true});
	});

	test("validateObject invalid allowExtra", () =>
	{
		expect(validateObject({extra: 1}, {type: "object"}, stack)).toEqual({valid: false, message: "Invalid value: Extra keys: extra"});
	});

	test("validateObject valid allowExtra", () =>
	{
		expect(validateObject({extra: 1}, {type: "object", allowExtra: true}, stack)).toEqual({valid: true});
	});

});

describe("schema validators", () =>
{
	
	test("validateObjectWithSchema", () =>
	{
		const schema: ObjectValueValidatorDefinition = {
			type: "object",
			properties: {
				number: {type: "number"},
				boolean: {type: "boolean"},
				string: {type: "string"},
				object: {type: "object"},
				array: {type: "array"}
			}
		};

		const value = {
			number: 3.14,
			boolean: true,
			string: "string",
			object: {},
			array: []
		};

		expect(validate(value, schema)).toEqual({valid: true});
	});

	test("validateObjectWithSchema", () =>
	{
		const schema: ObjectValueValidatorDefinition = {
			type: "object",
			properties: {
				number: {type: "number"},
				boolean: {type: "boolean"},
				string: {type: "string"},
				object: {type: "object", properties: {number: {type: "number"}}},
				array: {type: "array"}
			}
		};

		const value = {
			number: 3.14,
			boolean: true,
			string: "string",
			object: {},
			array: []
		};

		expect(validate(value, schema)).toEqual({valid: false, message: "Invalid value for key \"object.number\": Value is not defined"});
	});

	test("validateObjectWithSchema", () =>
	{
		const schema: ObjectValueValidatorDefinition = {
			type: "object",
			properties: {
				number: {type: "number"},
				boolean: {type: "boolean"},
				string: {type: "string"},
				object: {type: "object", properties: {number: {type: "number"}}},
				array: {type: "array", valueType: {type: "number", min: 1}}
			}
		};

		const value = {
			number: 3.14,
			boolean: true,
			string: "string",
			object: {number: 3.14},
			array: [1,0.1]
		};

		expect(validate(value, schema)).toEqual({valid: false, message: "Invalid value for key \"array.1\": Value is less than 1"});
	});

});
