export const DEBUG = process.env.NODE_ENV !== "production";

export const EXTENSION_ID = "op-vscode";
export const QUALIFIED_EXTENSION_ID = `1Password.${EXTENSION_ID}`;
export const CONFIG_NAMESPACE = "1password";

const makeCommand = (command: string) => `${EXTENSION_ID}.${command}`;

export const COMMANDS = {
	OPEN_1PASSWORD: makeCommand("open1Password"),
	CHOOSE_ACCOUNT: makeCommand("chooseAccount"),
	CHOOSE_VAULT: makeCommand("chooseVault"),
	GET_VALUE_FROM_ITEM: makeCommand("getValueFromItem"),
	SAVE_VALUE_TO_ITEM: makeCommand("saveValueToItem"),
	INJECT_SECRETS: makeCommand("injectSecrets"),
	CREATE_PASSWORD: makeCommand("createPassword"),
	OPEN_LOGS: makeCommand("openLogs"),
};

// This is only internal in that it is not exposed to the
// user. Other commands can still call these commands.
export const INTERNAL_COMMANDS = {
	AUTHENTICATE: makeCommand("authenticate"),
};

export const STATE = {
	ACCOUNT_UUID: "accountUuid",
	ACCOUNT_URL: "accountUrl",
	VAULT_ID: "vaultId",
	DISABLE_CONFIG_REMINDER: "disableConfigReminder",
};

export const URLS = {
	CLI_INSTALL_DOCS: "https://developer.1password.com/docs/cli/get-started",
	CLI_UPGRADE_DOCS: "https://developer.1password.com/docs/cli/upgrade",
};

export const REGEXP = {
	SECRET_REFERENCE:
		/op:\/\/([\w -]+)\/([\w -]+)\/([\w -]+)(?:\/([\w -]+))?(?<! )/,
	CAPITALIZED_WORDS: /(api|aws|id|uuid|url)/gi,
};

// Used for testing
export const SENSITIVE_FIELD_TYPES = [
	"CONCEALED",
	"SSHKEY",
	"CREDIT_CARD_NUMBER",
] as const;

export const NONSENSITIVE_FIELD_TYPES = [
	"ADDRESS",
	"CREDIT_CARD_TYPE",
	"DATE",
	"EMAIL",
	"GENDER",
	"MENU",
	"MONTH_YEAR",
	"PHONE",
	"STRING",
	"URL",
] as const;
