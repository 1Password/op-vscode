import { FieldAssignmentType } from "@1password/op-js";
import { Range, TextDocument } from "vscode";
import { combineRegexp } from "../../utils";
import { getPatternSuggestion, VALUE_PATTERNS } from "../patterns";
import { BRANDS, SECRET_KEY_HINT, Suggestion } from "../suggestion";

export interface ParserMatch {
	range: Range;
	fieldValue: string;
	suggestion?: Suggestion;
}

export interface MatchDetail {
	value: string;
	index: number;
	suggestion: Suggestion;
}

export class Parser {
	protected matches: ParserMatch[] = [];

	public constructor(protected document: TextDocument) {}

	protected parse() {
		throw new Error("Sub-class must implement this method");
	}

	public getMatches(): ParserMatch[] {
		this.parse();
		return this.matches;
	}
}

export const patternSuggestions = [
	...VALUE_PATTERNS,
	getPatternSuggestion("ccard"),
];
const patternsRegex = combineRegexp(
	...patternSuggestions.map((detection) => new RegExp(detection.pattern)),
);

export const validValueIsolation = (input: string, match: string) =>
	// the match is identical to the input we're testing against
	input === match ||
	// the match is surrounded by quotes
	["'", '"'].some((quote) =>
		new RegExp(`${quote}${match}${quote}`).test(input),
	) ||
	// the match is surrounded by, preceded by at the end of
	// a line, or followed by at the beginning of a line, a
	// space, dash, or underscore
	[" ", "\\-", "_"].some((spacer) =>
		combineRegexp(
			new RegExp(`${spacer}${match}$`),
			new RegExp(`^${match}${spacer}`),
			new RegExp(`${spacer}${match}${spacer}`),
		).test(input),
	);

export const findBrand = (input: string): string | undefined =>
	BRANDS.find((brand) =>
		validValueIsolation(input.toLowerCase(), brand.toLowerCase()),
	);

export const matchFromRegexp = (
	input: string,
	partial = false,
): MatchDetail | undefined => {
	const patternMatch = patternsRegex.exec(input);
	if (!patternMatch) {
		return;
	}

	let suggestion: Suggestion;
	const value = patternMatch[0];
	const index = patternMatch.index;

	if (
		(!partial && input !== value) ||
		(partial && !validValueIsolation(input, value))
	) {
		return;
	}

	// We know that the value matches one of the patterns,
	// now let's find out which one
	for (const patternSuggestion of patternSuggestions) {
		if (new RegExp(patternSuggestion.pattern).test(value)) {
			suggestion = patternSuggestion;

			// If the suggestion didn't come with an item
			// let's try and match the value to a brand
			if (!suggestion.item) {
				suggestion.item = findBrand(input);
			}

			break;
		}
	}

	return { value, index, suggestion };
};

export const suggestionFromKey = (input: string): Suggestion => {
	const extractedBrand = findBrand(input);
	const extractedKey = SECRET_KEY_HINT.exec(input)?.[0];

	if (!extractedKey || !validValueIsolation(input, extractedKey)) {
		return;
	}

	return {
		item: extractedBrand,
		field: extractedKey,
		type: "concealed" as FieldAssignmentType,
	};
};
