const path = require("path");

/** @type {import('@jest/types/build/Config').DefaultOptions} */
module.exports = {
	roots: ["<rootDir>"],
	testMatch: ["<rootDir>/src/**/*.@(test).[tj]s"],
	testEnvironment: "jest-environment-jsdom",
	preset: "ts-jest/presets/js-with-ts",
	transform: {
		"^.+\\.(ts|js)?$": "ts-jest",
	},
	testPathIgnorePatterns: [
		path.join("<rootDir>", "dist"),
		path.join("<rootDir>", "node_modules"),
	],
	moduleNameMapper: {
		vscode: path.join("<rootDir>", "test", "vscode-mock.ts"),
	},
	setupFilesAfterEnv: [path.join("<rootDir>", "test", "jest.setup.ts")],
};
