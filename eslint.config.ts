import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import type { Linter } from "eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jestPlugin from "eslint-plugin-jest";
import { importX } from "eslint-plugin-import-x";

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
	},
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		rules: {
			"no-case-declarations": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["src/shared/**/*.ts", "src/web/**/*.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: [
								"fs",
								"fs/*",
								"path",
								"os",
								"child_process",
								"crypto",
								"stream",
								"util",
								"events",
								"buffer",
								"process",
								"node:*",
								"worker_threads",
								"module",
								"cluster",
								"dgram",
								"dns",
								"http",
								"https",
								"net",
								"readline",
								"repl",
								"tls",
								"tty",
								"url",
								"v8",
								"vm",
								"zlib",
							],
							message:
								"Node.js built-in modules must not be used in code that can run in web environments.",
						},
					],
				},
			],
			"no-restricted-globals": [
				"error",
				{
					name: "process",
					message:
						"'process' is a Node.js global and must not be used in code that can run in web environments.",
				},
				{
					name: "Buffer",
					message:
						"'Buffer' is a Node.js global and must not be used in code that can run in web environments.",
				},
				{
					name: "__dirname",
					message:
						"'__dirname' is a Node.js global and must not be used in code that can run in web environments.",
				},
				{
					name: "__filename",
					message:
						"'__filename' is a Node.js global and must not be used in code that can run in web environments.",
				},
				{
					name: "global",
					message:
						"'global' is a Node.js global and must not be used in code that can run in web environments. Use 'globalThis' instead for cross-platform compatibility.",
				},
				{
					name: "require",
					message:
						"'require' is a Node.js CommonJS function and must not be used in code that can run in web environments. Use ES6 imports instead.",
				},
				{
					name: "module",
					message:
						"'module' is a Node.js CommonJS object and must not be used in code that can run in web environments.",
				},
				{
					name: "exports",
					message:
						"'exports' is a Node.js CommonJS object and must not be used in code that can run in web environments. Use ES6 exports instead.",
				},
			],
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
