import { ItemFieldType, PasswordRecipe } from "@1password/sdk";
import { REGEXP } from "./constants";
import type { FieldAssignmentType } from "./secret-detection/suggestion";

export const semverToInt = (input: string) =>
	input
		.split(".")
		.map((n) => n.padStart(2, "0"))
		.join("");

// Build a secret reference (op://vault/item/field) from IDs. The SDK resolves
// references that use either names or IDs, and IDs are unambiguous.
export const buildSecretReference = (
	vaultId: string,
	itemId: string,
	fieldId: string,
): string => `op://${vaultId}/${itemId}/${fieldId}`;

// Map the extension's internal field assignment types (used by secret
// detection) to the SDK's `ItemFieldType` enum used when creating items.
export const toItemFieldType = (
	type: FieldAssignmentType = "concealed",
): ItemFieldType => {
	switch (type) {
		case "text":
			return ItemFieldType.Text;
		case "email":
			return ItemFieldType.Email;
		case "url":
			return ItemFieldType.Url;
		case "concealed":
		default:
			return ItemFieldType.Concealed;
	}
};

// Parse a CLI-style password recipe string (e.g. "letters,digits,symbols,32")
// into the SDK's `PasswordRecipe` object.
export const parsePasswordRecipe = (recipe: string): PasswordRecipe => {
	const parts = (recipe || "")
		.split(",")
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	const length =
		parts
			.map((part) => Number.parseInt(part, 10))
			.find((n) => !Number.isNaN(n)) ?? 32;

	return {
		type: "Random",
		parameters: {
			includeDigits: parts.includes("digits"),
			includeSymbols: parts.includes("symbols"),
			length,
		},
	};
};

export const titleCase = (value: string): string =>
	value.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
	);

export const combineRegexp = (...values: RegExp[]) => {
	// De-dupe flags
	let flags = values.map((regexp) => regexp.flags).join("");
	flags = [...new Set(flags)].join("");
	return new RegExp(values.map((regexp) => regexp.source).join("|"), flags);
};

// Format an item name to be title case with spaces
export const formatTitle = (value: string): string =>
	titleCase(value.replace(/[_-]/g, " ")).replace(
		REGEXP.CAPITALIZED_WORDS,
		(value: string) => value.toUpperCase(),
	);

// Format a field label to be lower case with spaces
export const formatField = (value: string): string =>
	value.replace(/[_-]/g, " ").toLowerCase();

export const endWithPunctuation = (value: string): string =>
	/[!,.:?]/.test(value.charAt(value.length - 1)) ? value : `${value}.`;

export const isInRange = (
	low: number,
	high: number,
	num: number,
	inclusive = false,
) => {
	if (inclusive && num >= low && num <= high) {
		return true;
	}
	return !!(num > low && num < high);
};

export const maskString = (input: string) => {
	const length = input.length;
	if (length === 0) {
		throw new Error("Cannot mask empty string");
	} else if (isInRange(1, 4, length, true)) {
		// "key" -> "k**"
		return input.slice(0, 1) + "*".repeat(length - 1);
	} else if (length === 5) {
		// "pswrd" -> "p***d"
		return input.slice(0, 1) + "*".repeat(3) + input.slice(length - 1);
	} else {
		// "big-secret" -> "bi******et"
		return (
			input.slice(0, 2) +
			// Max out at 8 asterisks
			"*".repeat(Math.min(length - 4, 8)) +
			input.slice(length - 2)
		);
	}
};
