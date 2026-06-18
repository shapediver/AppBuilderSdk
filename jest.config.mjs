/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",

	testMatch: ["**/*.(test|spec).(ts|tsx)"],

	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.jest.json",
			},
		],
	},

	moduleNameMapper: {
		"^@AppBuilderLib/(.*)$": "<rootDir>/src/shared/$1",
		"^@AppBuilderShared/(.*)$": "<rootDir>/src/shared/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
	},
};
