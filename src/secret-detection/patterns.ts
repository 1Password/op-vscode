import { PatternSuggestion } from "./suggestion";

export const getPatternSuggestion = (id: string): PatternSuggestion =>
	[...FIELD_TYPE_PATTERNS, ...VALUE_PATTERNS].find(
		(pattern) => pattern.id === id,
	);

export const FIELD_TYPE_PATTERNS: PatternSuggestion[] = [
	{
		id: "email",
		field: "email",
		type: "email",
		pattern: "[^\t\n\r \"'@]+@[^\t\n\r \"'@]+.[^\t\n\r \"'@]+",
	},
	{
		id: "url",
		field: "address",
		type: "url",
		pattern:
			"https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()!@:%_\\+.~#?&\\/\\/=]*)",
	},
	{
		id: "ccard",
		field: "credit card",
		type: "text",
		pattern:
			"(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11})",
	},
];

// Hat tip: https://github.com/vietjovi/secret-detection/
// Hat tip: https://github.com/Skyscanner/whispers
/* eslint-disable sonarjs/no-duplicate-string */
export const VALUE_PATTERNS: PatternSuggestion[] = [
	{
		id: "aws-access-key-id",
		item: "AWS",
		field: "access key id",
		type: "text",
		pattern:
			"(?=.*[A-Z])(?=.*[0-9])A(AG|CC|GP|ID|IP|KI|NP|NV|PK|RO|SC|SI)A[A-Z0-9]{16}",
	},
	{
		id: "facebook-access-token",
		item: "Facebook",
		field: "access token",
		type: "concealed",
		pattern: "EAA[0-9a-zA-Z]{160,180}ZDZD",
	},
	{
		id: "google-api-key",
		item: "Google",
		field: "api key",
		type: "concealed",
		pattern: "AIza[0-9A-Za-z-_]{35}",
	},
	{
		id: "gcp-client-id",
		item: "GCP",
		field: "client id",
		type: "concealed",
		pattern: "[0-9]+-[0-9A-Za-z_]{32}.apps.googleusercontent.com",
	},
	{
		id: "mailchimp-api-key",
		item: "Mailchimp",
		field: "api key",
		type: "concealed",
		pattern: "[0-9a-f]{32}-us[0-9]{1,2}",
	},
	{
		id: "braintree-access-token",
		item: "PayPal Braintree",
		field: "access token",
		type: "concealed",
		pattern: "access_token\\$(production|sandbox)\\[0-9a-z]{16}\\$[0-9a-f]{32}",
	},
	{
		id: "braintree-client-id",
		item: "PayPal Braintree",
		field: "client id",
		type: "concealed",
		pattern: "client_id\\$(production|sandbox)\\$[0-9a-z]{16}",
	},
	{
		id: "braintree-client-secret",
		item: "PayPal Braintree",
		field: "client secret",
		type: "concealed",
		pattern: "client_secret\\$(production|sandbox)\\$[0-9a-z]{32}",
	},
	{
		id: "braintree-l10n-key",
		item: "PayPal Braintree",
		field: "tokenization key",
		type: "concealed",
		pattern: "(production|sandbox)_[0-9a-z]{8}_[0-9a-z]{16}",
	},
	{
		id: "sendgrid-api-key",
		item: "SendGrid",
		field: "api key",
		type: "concealed",
		pattern: "SG.[0-9A-Za-z-._]{66}",
	},
	{
		id: "slack-api-token",
		item: "Slack",
		field: "api token",
		type: "concealed",
		pattern: "xox[p|b|o|a]-[0-9]{12}-[0-9]{12,13}-[a-zA-Z0-9]{23,32}",
	},
	{
		id: "slack-webhook",
		item: "Slack",
		field: "webhook",
		type: "url",
		pattern:
			"https:\\/\\/hooks.slack.com\\/services\\/[A-Z0-9]{9}\\/[A-Z0-9]{9,11}\\/[a-zA-Z0-9]+",
	},
	{
		id: "digitalocean-access-token",
		item: "DigitalOcean",
		field: "access token",
		type: "concealed",
		pattern: "dop_v1_[a-z0-9]{64}",
	},
	{
		id: "supbase-api-key",
		item: "Supabase",
		field: "api-key",
		type: "concealed",
		pattern: "sbp_[a-zA-Z0-9]{40}",
	},
	{
		id: "typeform-pat",
		item: "Typeform",
		field: "personal access token",
		type: "concealed",
		pattern: "tfp_[a-zA-Z0-9]{44}_[a-zA-Z0-9]{14}",
	},
	{
		id: "stripe-pk",
		item: "Stripe",
		field: "publishable key",
		type: "concealed",
		pattern: "pk_(test|live)_[0-9a-zA-Z]{24,99}",
	},
	{
		id: "stripe-sk",
		item: "Stripe",
		field: "secret key",
		type: "concealed",
		pattern: "sk_(test|live)_[0-9a-zA-Z]{24,99}",
	},
	{
		id: "twilio-api-key",
		item: "Twilio",
		field: "api key",
		type: "concealed",
		pattern: "SK[0-9a-fA-F]{32}",
	},
	{
		id: "github-token",
		item: "GitHub",
		field: "token",
		type: "concealed",
		pattern: "(gh[pous]_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{76})",
	},
	{
		id: "hubspot-webhook",
		item: "HubSpot",
		field: "webhook",
		type: "url",
		pattern: "https://api.hubapi.com/webhooks/v1/[a-z0-9]+/",
	},
	{
		id: "hubspot-pat",
		item: "HubSpot",
		field: "private app token",
		type: "concealed",
		pattern: "pat-(na|eu)1-[a-fA-F\\d]{4}(?:[a-fA-F\\d]{4}-){4}[a-fA-F\\d]{12}",
	},
	{
		id: "ssh-key",
		item: "SSH Key",
		field: "private key",
		type: "concealed",
		pattern:
			"[-]{3,}BEGIN (RSA|DSA|EC|OPENSSH|PRIVATE)? ?(PRIVATE)? KEY[-]{3,}[\\D\\d\\s]*[-]{3,}END (RSA|DSA|EC|OPENSSH|PRIVATE)? ?(PRIVATE)? KEY[-]{3,}(\\n)?",
	},
	{
		id: "uuid",
		field: "uuid",
		type: "concealed",
		pattern: "[a-fA-F\\d]{4}(?:[a-fA-F\\d]{4}-){4}[a-fA-F\\d]{12}",
	},

	// The following patterns have not been able to be tested
	{
		id: "aws-session-token",
		item: "AWS",
		field: "session token",
		type: "concealed",
		pattern: "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9+/]{270,450}",
	},
	{
		id: "amazon-mws",
		item: "Amazon MWS",
		field: "auth token",
		type: "concealed",
		pattern:
			"amzn.mws.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
	},
	{
		id: "google-oauth-token",
		item: "Google",
		field: "oauth token",
		type: "concealed",
		pattern: "ya29.[0-9A-Za-z-_]+",
	},
	{
		id: "mailgun-api-key",
		item: "Mailgun",
		field: "api key",
		type: "concealed",
		pattern: "key-[0-9a-zA-Z]{32}",
	},
	{
		id: "square-access-token",
		item: "Square",
		field: "access token",
		type: "concealed",
		pattern: "sq0atp-[0-9A-Za-z-_]{22}",
	},
	{
		id: "square-oauth-token",
		item: "Square",
		field: "oauth token",
		type: "concealed",
		pattern: "sq0csp-[0-9A-Za-z-_]{43}",
	},
	{
		id: "twilio-webhook",
		item: "Twilio",
		field: "webhook",
		type: "url",
		pattern: "https://chat.twilio.com/v2/Services/[A-Z0-9]{32}",
	},
];
/* eslint-enable sonarjs/no-duplicate-string */
