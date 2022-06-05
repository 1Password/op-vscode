import { FieldAssignmentType } from "@1password/op-js";
import { Range, TextDocument } from "vscode";
import { combineRegexp, formatField } from "../../utils";
import { FIELD_TYPE_PATTERNS, VALUE_PATTERNS } from "../patterns";
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

const patternSuggestions = [...VALUE_PATTERNS, FIELD_TYPE_PATTERNS.ccard];
const patternsRegex = combineRegexp(
	...patternSuggestions.map((detection) => new RegExp(detection.pattern)),
);

export const findBrand = (input: string): string | undefined =>
	BRANDS.find((brand) => input.toLowerCase().includes(brand.toLowerCase()));

export const matchFromRegexp = (input: string): MatchDetail | undefined => {
	const patternMatch = patternsRegex.exec(input);
	if (!patternMatch) {
		return;
	}

	let suggestion: Suggestion;
	const value = patternMatch[0];
	const index = patternMatch.index;

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

	if (!extractedKey) {
		return;
	}

	return {
		item: extractedBrand,
		field: extractedKey ? formatField(extractedKey) : null,
		type: "concealed" as FieldAssignmentType,
	};
};
