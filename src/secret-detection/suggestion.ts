import { FieldAssignmentType } from "@1password/op-js";

export interface Suggestion {
	item?: string;
	field: string;
	type: FieldAssignmentType;
}

export type PatternSuggestion = Suggestion & {
	id: string;
	pattern: string;
};

export const fieldAssignmentTypes = [
	"concealed",
	"text",
	"email",
	"url",
] as const;

export const SECRET_KEY_HINT =
	/((private|secret)[ _-])?((bearer|api|access|auth)[ _-])?(secret|token|key|password|passwd|pwd|account|username|credentials)/i;

export const BRANDS = [
	"1Password",
	"Adobe",
	"Amazon",
	"Atlassian",
	"AWS",
	"Azure",
	"Braintree",
	"Datadog",
	"DigitalOcean",
	"Dropbox",
	"Facebook",
	"GCP",
	"GitHub",
	"GitLab",
	"Google",
	"Heroku",
	"HubSpot",
	"MailChimp",
	"Mailgun",
	"OpenAI",
	"PayPal",
	"Postman",
	"SendGrid",
	"Shopify",
	"Slack",
	"Square",
	"Stripe",
	"Supabase",
	"Twilio",
	"Twitter",
	"Typeform",
	"YouTube",
];
