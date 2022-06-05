import { PatternSuggestion } from "./suggestion";

export const FIELD_TYPE_PATTERNS: Record<string, PatternSuggestion> = {
	email: {
		field: "email",
		type: "email",
		pattern: "[^\t\n\r \"'@]+@[^\t\n\r \"'@]+.[^\t\n\r \"'@]+",
	},
	url: {
		field: "url",
		type: "url",
		pattern:
			"https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()!@:%_\\+.~#?&\\/\\/=]*)",
	},
	ccard: {
		field: "credit card",
		type: "text",
		pattern:
			"(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11})",
	},
};

// Hat tip: https://github.com/vietjovi/secret-detection/
// Hat tip: https://github.com/Skyscanner/whispers
/* eslint-disable sonarjs/no-duplicate-string */
export const VALUE_PATTERNS: PatternSuggestion[] = [
	{
		item: "AWS",
		field: "access key id",
		type: "text",
		pattern:
			"(?=.*[A-Z])(?=.*[0-9])A(AG|CC|GP|ID|IP|KI|NP|NV|PK|RO|SC|SI)A[A-Z0-9]{16}",
	},
	{
		item: "Facebook",
		field: "access token",
		type: "concealed",
		pattern: "EAA[0-9a-zA-Z]{160,180}ZDZD",
	},
	{
		item: "Google",
		field: "api key",
		type: "concealed",
		pattern: "AIza[0-9A-Za-z-_]{35}",
	},
	{
		item: ["GCP", "Google Drive", "Gmail", "YouTube"],
		field: "client id",
		type: "concealed",
		pattern: "[0-9]+-[0-9A-Za-z_]{32}.apps.googleusercontent.com",
	},
	{
		item: "Mailchimp",
		field: "api key",
		type: "concealed",
		pattern: "[0-9a-f]{32}-us[0-9]{1,2}",
	},
	{
		item: "PayPal Braintree",
		field: "access token",
		type: "concealed",
		pattern: "access_token\\$(production|sandbox)\\[0-9a-z]{16}\\$[0-9a-f]{32}",
	},
	{
		item: "PayPal Braintree",
		field: "client id",
		type: "concealed",
		pattern: "client_id\\$(production|sandbox)\\$[0-9a-z]{16}",
	},
	{
		item: "PayPal Braintree",
		field: "client secret",
		type: "concealed",
		pattern: "client_secret\\$(production|sandbox)\\$[0-9a-z]{32}",
	},
	{
		item: "PayPal Braintree",
		field: "tokenization key",
		type: "concealed",
		pattern: "(production|sandbox)_[0-9a-z]{8}_[0-9a-z]{16}",
	},
	{
		item: "SendGrid",
		field: "api key",
		type: "concealed",
		pattern: "SG.[0-9A-Za-z-._]{66}",
	},
	{
		item: "Slack",
		field: "api token",
		type: "concealed",
		pattern: "xox[p|b|o|a]-[0-9]{12}-[0-9]{12,13}-[a-zA-Z0-9]{23,32}",
	},
	{
		item: "Slack",
		field: "webhook",
		type: "url",
		pattern:
			"https:\\/\\/hooks.slack.com\\/services\\/[A-Z0-9]{9}\\/[A-Z0-9]{9,11}\\/[a-zA-Z0-9]+",
	},
	{
		item: "Stripe",
		field: "publishable key",
		type: "concealed",
		pattern: "pk_(test|live)_[0-9a-zA-Z]{24,99}",
	},
	{
		item: "Stripe",
		field: "secret key",
		type: "concealed",
		pattern: "sk_(test|live)_[0-9a-zA-Z]{24,99}",
	},
	{
		item: "Twilio",
		field: "api key",
		type: "concealed",
		pattern: "SK[0-9a-fA-F]{32}",
	},
	{
		item: "GitHub",
		field: "token",
		type: "concealed",
		pattern: "(gh[pous]_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{76})",
	},
	{
		item: "HubSpot",
		field: "webhook",
		type: "url",
		pattern: "https://api.hubapi.com/webhooks/v1/[a-z0-9]+/",
	},
	{
		item: "HubSpot",
		field: "private app token",
		type: "concealed",
		pattern: "pat-(na|eu)1-[a-fA-F\\d]{4}(?:[a-fA-F\\d]{4}-){4}[a-fA-F\\d]{12}",
	},
	{
		item: "SSH Key",
		field: "private key",
		type: "concealed",
		pattern:
			".*[-]{3,}BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE)? ?(PRIVATE)? KEY[-]{3,}.*",
	},
	{
		field: "uuid",
		type: "concealed",
		pattern: "[a-fA-F\\d]{4}(?:[a-fA-F\\d]{4}-){4}[a-fA-F\\d]{12}",
	},

	// The following patterns have not been able to be tested
	{
		item: "AWS",
		field: "session token",
		type: "concealed",
		pattern: "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9+/]{270,450}",
	},
	{
		item: "Amazon MWS",
		field: "auth token",
		type: "concealed",
		pattern:
			"amzn.mws.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
	},
	{
		item: "Google",
		field: "oauth token",
		type: "concealed",
		pattern: "ya29.[0-9A-Za-z-_]+",
	},
	{
		item: "Mailgun",
		field: "api key",
		type: "concealed",
		pattern: "key-[0-9a-zA-Z]{32}",
	},
	{
		item: "Square",
		field: "access token",
		type: "concealed",
		pattern: "sq0atp-[0-9A-Za-z-_]{22}",
	},
	{
		item: "Square",
		field: "oauth token",
		type: "concealed",
		pattern: "sq0csp-[0-9A-Za-z-_]{43}",
	},
	{
		item: "Twilio",
		field: "webhook",
		type: "url",
		pattern: "https://chat.twilio.com/v2/Services/[A-Z0-9]{32}",
	},

	// The following patterns are too broad
	// {
	// 	item: "Heroku",
	// 	field: "api key",
	// 	type: "concealed",
	// 	pattern:
	// 		"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
	// },
	// {
	// 	item: "AWS",
	// 	field: "secret access key",
	// 	type: "concealed",
	// 	pattern: "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9+/]{40}",
	// },
	// {
	// 	item: "Twitter",
	// 	field: "access token",
	// 	type: "concealed",
	// 	pattern: "[1-9][ 0-9]+-[0-9a-zA-Z]{40}",
	// },
];
/* eslint-enable sonarjs/no-duplicate-string */
