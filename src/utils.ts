import { REGEXP } from "./constants";

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

export const formatTitle = (value: string): string =>
	titleCase(value.replace(/_/g, " ")).replace(
		REGEXP.CAPITALIZED_WORDS,
		(value: string) => value.toUpperCase(),
	);

export const formatField = (value: string): string =>
	value.replace(/_/g, " ").toLowerCase();

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

export const forceArray = <T>(value: T | T[]): T[] =>
	Array.isArray(value) ? value : [value];
