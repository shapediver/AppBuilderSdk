/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	preset: "ts-jest",
	testEnvironment: "node",

	testMatch: ["**/*.(test|spec).(ts|tsx)"],
	testPathIgnorePatterns: [
		"<rootDir>/tests/specs/",
		"<rootDir>/src/shared/features/appbuilder/config/__tests__/themeRegistryDocParity.test.ts",
	],

	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.jest.json",
			},
		],
		// ESM-only dependencies (see transformIgnorePatterns) are transpiled to CommonJS.
		"^.+\\.js$": [
			"ts-jest",
			{
				tsconfig: {allowJs: true, module: "commonjs"},
				transpilation: true,
			},
		],
	},
	// TanStack Table 9 and match-sorter-utils 9 are ESM-only.
	transformIgnorePatterns: [
		"/node_modules/(?!\\.pnpm/@tanstack\\+|@tanstack/)",
	],

	moduleNameMapper: {
		"^@AppBuilderLib/(.*)$": "<rootDir>/src/shared/$1",
		"^@AppBuilderShared/(.*)$": "<rootDir>/src/shared/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
		"^@modelstorage$": "<rootDir>/modelstorage.ts",
		"^uuid$": "<rootDir>/tests/jest/uuid.cjs",
		"^react-markdown$": "<rootDir>/tests/jest/reactMarkdown.cjs",
		"^react-markdown/lib$": "<rootDir>/tests/jest/reactMarkdownLib.cjs",
		"^remark-directive$": "<rootDir>/tests/jest/noopPlugin.cjs",
		"^remark-gfm$": "<rootDir>/tests/jest/noopPlugin.cjs",
		"^unist-util-visit$": "<rootDir>/tests/jest/unistUtilVisit.cjs",
		"\\.(css|less|sass|scss)$": "<rootDir>/tests/jest/styleMock.cjs",
	},
};
