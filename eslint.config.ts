import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest";

const config: Linter.Config[] = [
	eslintConfigPrettier as Linter.Config,
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"no-case-declarations": "off",
		},
	},
	{
		files: ["**/*.test.ts", "test/**/*.ts"],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: {
				...jestPlugin.environments.globals.globals,
			},
		},
		rules: {
			...jestPlugin.configs.recommended.rules,
			// Disable strict TypeScript rules for test files
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-explicit-any": "off",
			// This should be removed when we switch CLI implementations
			"jest/expect-expect": "off",
		},
	},
	{
		ignores: [
			"**/*.js",
			"**/*.mjs",
			"dist/**",
			"node_modules/**",
			"eslint.config.ts",
		],
	},
];

export default config;
