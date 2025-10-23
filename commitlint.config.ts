import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			["added", "changed", "deprecated", "removed", "fixed", "security"],
		],
		"scope-enum": [2, "always", ["web", "desktop"]],
		"scope-case": [2, "always", "lowercase"],
		"type-case": [2, "always", "lowercase"],
		"subject-case": [2, "always", "sentence-case"],
		"header-max-length": [2, "always", 100],
	},
};

export default config;
