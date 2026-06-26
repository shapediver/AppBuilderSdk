/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",

	setupFiles: ["<rootDir>/tests/jest.setup.ts"],
	setupFilesAfterEnv: ["@testing-library/jest-dom"],

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
		"^uuid$": "<rootDir>/tests/mocks/uuid.ts",
		"^react-markdown$": "<rootDir>/tests/mocks/reactMarkdown.tsx",
		"\\.module\\.css$": "<rootDir>/tests/mocks/cssModule.ts",
		"\\.css$": "<rootDir>/tests/mocks/cssModule.ts",
		"^@AppBuilderLib/(.*)$": "<rootDir>/src/shared/$1",
		"^@AppBuilderShared/(.*)$": "<rootDir>/src/shared/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
	},

	testPathIgnorePatterns: ["/node_modules/", "/tests/specs/"],
};
