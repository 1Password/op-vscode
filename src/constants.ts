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
	VAULT_ID: "vaultId",
	DISABLE_CONFIG_REMINDER: "disableConfigReminder",
};

export const URLS = {
	DESKTOP_APP_DOCS:
		"https://developer.1password.com/docs/sdks/setup-authentication/#desktop-app-integration",
	SDK_DOCS: "https://developer.1password.com/docs/sdks",
};

export const REGEXP = {
	SECRET_REFERENCE:
		/op:\/\/([\w -]+)\/([\w -]+)\/([\w -]+)(?:\/([\w -]+))?(?<! )/,
	CAPITALIZED_WORDS: /(api|aws|id|uuid|url)/gi,
};

// These map to the 1Password SDK's `ItemFieldType` enum values.
export const SENSITIVE_FIELD_TYPES: readonly string[] = [
	"Concealed",
	"SshKey",
	"CreditCardNumber",
];

export const NONSENSITIVE_FIELD_TYPES: readonly string[] = [
	"Address",
	"CreditCardType",
	"Date",
	"Email",
	"Menu",
	"MonthYear",
	"Phone",
	"Text",
	"Url",
];
