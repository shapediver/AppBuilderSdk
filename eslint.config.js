import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({baseDirectory: __dirname});

/** @param {unknown} value */
function normalizeEcmaVersion(value) {
	if (value === "latest") {
		return "latest";
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : "latest";
}

export default tseslint.config(
	{
		ignores: [
			"**/node_modules/**",
			"**/build/**",
			"**/dist/**",
			"**/scripts/**",
			"**/.cursor/**",
			"**/.idea/**",
			"**/docs/**",
			"**/public/**",
			"**/.typedoc-temp/**",
			"**/.vite/**",
			"**/.vite-temp/**",
			"**/coverage/**",
			"eslint.config.js",
		],
		linterOptions: {
			reportUnusedDisableDirectives: "off",
		},
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"],
	prettierConfig,
	{
		plugins: {
			prettier: prettierPlugin,
		},
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.browser,
			parserOptions: {
				ecmaFeatures: {jsx: true},
			},
		},
		settings: {
			"import/resolver": {
				typescript: {alwaysTryTypes: true},
			},
			react: {version: "detect"},
		},
		rules: {
			"prettier/prettier": "error",
			"linebreak-style": ["error", "windows"],
			semi: ["error", "always"],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{
					// TypeDoc: empty interfaces alias z.infer / Mantine / other supertypes.
					allowInterfaces: "always",
				},
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"no-debugger": "off",
		},
	},
	...compat
		.extends("@feature-sliced")
		.filter((config) => !config.ignores)
		.map((config) => {
			const scoped = {
				...config,
				files: ["src/shared/**/*.{js,jsx,ts,tsx}"],
			};

			if (config.languageOptions) {
				scoped.languageOptions = {
					...config.languageOptions,

					ecmaVersion: normalizeEcmaVersion(
						config.languageOptions.ecmaVersion,
					),
				};
			}

			return scoped;
		}),
	{
		files: ["src/shared/**/*.{js,jsx,ts,tsx}"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"import/order": "off",
			"import/no-internal-modules": "off",
			"boundaries/element-types": "off",
		},
	},
	{
		files: [
			"src/**/*.{test,spec}.{ts,tsx}",
			"src/*.{test,spec}.{ts,tsx}",
		],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			parserOptions: {
				project: "./tsconfig.jest.json",
				tsconfigRootDir: __dirname,
			},
		},
	},
	{
		files: ["tests/jest.setup.ts", "tests/mocks/**/*.{ts,tsx}"],
		languageOptions: {
			globals: globals.node,
		},
	},
);
