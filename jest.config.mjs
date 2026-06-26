/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",

	setupFiles: ["<rootDir>/tests/jest.setup.cjs"],
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
		"^uuid$": "<rootDir>/tests/mocks/uuid.cjs",
		"^react-markdown$": "<rootDir>/tests/mocks/reactMarkdown.cjs",
		"\\.module\\.css$": "<rootDir>/tests/mocks/cssModule.cjs",
		"\\.css$": "<rootDir>/tests/mocks/cssModule.cjs",
		"^@AppBuilderLib/(.*)$": "<rootDir>/src/shared/$1",
		"^@AppBuilderShared/(.*)$": "<rootDir>/src/shared/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
	},

	testPathIgnorePatterns: ["/node_modules/", "/tests/specs/"],
};
