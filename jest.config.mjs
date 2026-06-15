export default {
	preset: "ts-jest",
	testEnvironment: "node",

	testMatch: ["**/*.(test|spec).(ts|tsx)"],

	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

	moduleNameMapper: {
		"^@AppBuilderLib/(.*)$": "<rootDir>/src/shared/$1",
		"^@AppBuilderShared/(.*)$": "<rootDir>/src/shared/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
	},
};
