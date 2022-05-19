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
	ACCOUNT_UUID: "accountUuid",
	ACCOUNT_URL: "accountUrl",
	VAULT_ID: "vaultId",
	VAULT_NAME: "vaultName",
	DISABLE_CONFIG_REMINDER: "disableConfigReminder",
};

export const URLS = {
	CLI_INSTALL_DOCS: "https://developer.1password.com/docs/cli/install",
	CLI_UPGRADE_DOCS: "https://developer.1password.com/docs/cli/upgrade",
};

export const REGEXP = {
	CLI_ERROR: /\[ERROR] \d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} (.+)/,
	SECRET_REFERENCE: /op:\/\/([\w -]+)\/([\w -]+)\/([\w -]+)/,
	// Hat tip: https://github.com/motdotla/dotenv
	DOTENV_LINE:
		/^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^\n\r#]+)?\s*(?:#.*)?$/,
	SECRET_KEY_HINT:
		/(private_|secret_)?(api_|access_|auth_)?(secret|token|key|password|passwd|pwd|account)/i,
	CAPITALIZED_WORDS: /(api|aws|id|uuid|url)/gi,
	URL: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\w$&+,:;-]+@)?[\d.A-Za-z-]+|(?:www\.|[\w$&+,:;=-]+@)[\d.A-Za-z-]+)((?:\/[\w%+./~-]*)?\??[\w%&+.;=@-]*#?[\w!./\\-]*)?)/,
};

// Hat tip: https://github.com/vietjovi/secret-detection/
// Hat tip: https://github.com/Skyscanner/whispers
/* eslint-disable unicorn/better-regex */
export const DETECTABLE_VALUE_REGEXP = {
	AMAZON_AWS_ACCESS_KEY_ID: /AKIA[0-9A-Z]{16}/,
	AMAZON_MWS_AUTH_TOKEN:
		/amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
	AWS_API_KEY: /AKIA[0-9A-Z]{16}/,
	FACEBOOK_ACCESS_TOKEN: /EAACEdEose0cBA[0-9A-Za-z]+/,
	GOOGLE_API_KEY: /AIza[0-9A-Za-z\-_]{35}/,
	GOOGLE_CLOUD_PLATFORM_OAUTH:
		/[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/,
	GOOGLE_DRIVE_OAUTH: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/,
	GOOGLE_GMAIL_OAUTH: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/,
	GOOGLE_OAUTH_ACCESS_TOKEN: /ya29\.[0-9A-Za-z\-_]+/,
	GOOGLE_YOUTUBE_OAUTH: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/,
	HEROKU_API_KEY:
		/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
	HEROKU_OAUTH: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
	MAILCHIMP_API_KEY: /[0-9a-f]{32}-us[0-9]{1,2}/,
	MAILGUN_API_KEY: /key-[0-9a-zA-Z]{32}/,
	PASSWORD_IN_URL:
		/[a-zA-Z]{3,10}:\/\/[^/\s:@]{3,20}:[^/\s:@]{3,20}@.{1,100}["'\s]/,
	PAYPAL_BRAINTREE_ACCESS_TOKEN:
		/access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/,
	PICATIC_API_KEY: /sk_live_[0-9a-z]{32}/,
	SENDGRID_API: /SG\.[0-9A-Za-z\-._]{66}/,
	SLACK_TOKEN: /(xox[p|b|o|a]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})/,
	SLACK_WEBHOOK:
		/https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]{9}\/[A-Z0-9]{9}\/[a-zA-Z0-9]+/,
	SQUARE_ACCESS_TOKEN: /sq0atp-[0-9A-Za-z\-_]{22}/,
	SQUARE_OAUTH_SECRET: /sq0csp-[0-9A-Za-z\-_]{43}/,
	STRIPE_PUBLIC_API_KEY: /pk_(test|live)_[0-9a-zA-Z]{24,99}/,
	STRIPE_SECRET_API_KEY: /sk_(test|live)_[0-9a-zA-Z]{24,99}/,
	STRIPE_RESTRICTED_API_KEY: /rk_(test|live)_[0-9a-zA-Z]{24,99}/,
	TWILIO_API_KEY: /SK[0-9a-fA-F]{32}/,
	TWILIO_WEBHOOK: /https:\/\/chat\.twilio\.com\/v2\/Services\/[A-Z0-9]{32}/,
	TWITTER_ACCESS_TOKEN: /[1-9][ 0-9]+-[0-9a-zA-Z]{40}/,
	GITHUB_TOKEN: /(gh[pous]_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{76})/,
	HUBSPOT_WEBHOOK: /https:\/\/api\.hubapi\.com\/webhooks\/v1\/[a-z0-9]+\//,
	PRIVATE_KEY:
		/.*[-]{3,}BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE)? ?(PRIVATE)? KEY[-]{3,}.*/,
	EMAIL: /[a-zA-Z0-9.!#$%&’*+/?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/,
	CREDIT_CARD:
		/4\d{12}(?:\d{3})?|[25][1-7]\d{14}|6(?:011|5\d\d)\d{12}|3[47]\d{13}|3(?:0[0-5]|[68]\d)\d{11}|(?:2131|1800|35\d{3})\d{11}/,
	UUID: /[\da-f]{4}(?:[\da-f]{4}-){4}[\da-f]{12}/i,
};
/* eslint-enable unicorn/better-regex */
