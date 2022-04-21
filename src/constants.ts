export const DEBUG = process.env.NODE_ENV !== "production";

export const EXTENSION_ID = "opvs";
export const QUALIFIED_EXTENSION_ID = `1password.${EXTENSION_ID}`;

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

export const STATE = {
	DISABLE_CONFIG_REMINDER: "disableConfigReminder",
	VAULT_NAME_PREFIX: "vaultName",
};

export const URLS = {
	CLI_INSTALL_DOCS: "https://developer.1password.com/docs/cli/install",
	CLI_UPGRADE_DOCS: "https://developer.1password.com/docs/cli/upgrade",
};

export const REGEXP = {
	ERROR_MATCH: /\[ERROR] \d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} (.+)/,
	REFERENCE: /op:\/\/([\w -]+)\/([\w -]+)\/([\w -]+)/,
	REFERENCE_PERMITTED: /^[\w ./-]+$/i,
	UUID: /[\da-f]{4}(?:[\da-f]{4}-){4}[\da-f]{12}/i,
	CREDIT_CARD:
		/4\d{12}(?:\d{3})?|[25][1-7]\d{14}|6(?:011|5\d\d)\d{12}|3[47]\d{13}|3(?:0[0-5]|[68]\d)\d{11}|(?:2131|1800|35\d{3})\d{11}/,
	EMAIL:
		/(([^\s"(),.:;<=>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))/,
	// eslint-disable-next-line no-useless-escape, unicorn/better-regex
	URL: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\w$&+,:;-]+@)?[\d.A-Za-z-]+|(?:www\.|[\w$&+,:;=-]+@)[\d.A-Za-z-]+)((?:\/[\w%+.\/~-]*)?\??[\w%&+.;=@-]*#?[\w!.\/\\-]*)?)/,
};
