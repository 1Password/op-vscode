import { FieldAssignmentType } from "@1password/op-js";

export interface Suggestion {
	item?: string | string[];
	field: string | string[];
	type: FieldAssignmentType;
	pattern?: string;
}

export type PatternSuggestion = Suggestion & {
	pattern: string;
};

export const fieldAssignmentTypes = [
	"concealed",
	"text",
	"email",
	"url",
] as const;

export const SECRET_KEY_HINT =
	/((private|secret) )?((bearer|api|access|auth) )?(secret|token|key|password|passwd|pwd|account)/i;

export const BRANDS = [
	"1Password",
	"Amazon",
	"AWS",
	"Braintree",
	"Facebook",
	"GCP",
	"GitHub",
	"GitLab",
	"Google",
	"Heroku",
	"HubSpot",
	"MailChimp",
	"Mailgun",
	"PayPal",
	"SendGrid",
	"Slack",
	"Square",
	"Stripe",
	"Twilio",
	"Twitter",
	"YouTube",
];