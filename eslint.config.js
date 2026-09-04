import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import prettierPlugin from "eslint-plugin-prettier";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
			"**/*.local.ts",
		],
	},
	{
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
			react: {version: "19.2.4"},
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
	{
		files: ["src/**/*.{ts,tsx}"],
		ignores: ["src/shared/shared/lib/zod.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "zod",
							message:
								"Import Zod from @AppBuilderLib/shared/lib/zod so jitless is configured before schemas are created.",
						},
						{
							name: "zod/v4",
							message:
								"Import Zod helpers from @AppBuilderLib/shared/lib/zod so jitless is configured before schemas are created.",
						},
					],
				},
			],
		},
	},
	{
		files: ["src/**/*.{test,spec}.{ts,tsx}"],
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
		files: ["**/*.cjs"],
		languageOptions: {
			sourceType: "commonjs",
			globals: globals.node,
		},
		rules: {
			"@typescript-eslint/no-require-imports": "off",
			"react/prop-types": "off",
		},
	},
	{
		files: ["**/*.mjs"],
		languageOptions: {
			sourceType: "module",
			globals: globals.node,
		},
	},
);
