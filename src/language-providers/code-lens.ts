import type { TextDocument } from "vscode";
import { CodeLens, Position, Range } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS, DETECTABLE_VALUE_REGEXP, REGEXP } from "../constants";
import { combineRegexp } from "../utils";

interface LensMatch {
	range: Range;
	itemKey: string;
	itemValue: string;
}

interface MatchDetail {
	itemKey: string;
	itemValue: string;
	valueIndex: number;
}

const detectablePatterns = combineRegexp(
	...Object.values(DETECTABLE_VALUE_REGEXP),
);

const isDotEnv = (document: TextDocument): boolean =>
	document.languageId === "dotenv" || document.fileName.endsWith(".env");

const dotEnvLineParse = (line: string): MatchDetail => {
	let itemKey: string;
	let itemValue: string;
	let valueIndex: number;

	const match = REGEXP.DOTENV_LINE.exec(line);
	if (match) {
		itemKey = match[1];
		// Default nullish to empty string
		itemValue = match[2] || "";
		// Remove whitespace
		itemValue = itemValue.trim();
		// Remove surrounding quotes
		itemValue = itemValue.replace(/^(["'`])([\S\s]*)\1$/gm, "$2");

		if (
			(REGEXP.SECRET_KEY_HINT.test(itemKey) ||
				detectablePatterns.test(itemValue)) &&
			// Don't match with existing secret references
			!REGEXP.SECRET_REFERENCE.test(itemValue)
		) {
			valueIndex = line.indexOf(itemValue);
		}
	}

	return { itemKey, itemValue, valueIndex };
};

const regexpLineParse = (line: string): MatchDetail => {
	let itemKey: string;
	let itemValue: string;
	let valueIndex: number;

	const match = detectablePatterns.exec(line);
	if (match) {
		valueIndex = match.index;
		itemValue = match[0];

		for (const [key, value] of Object.entries(DETECTABLE_VALUE_REGEXP)) {
			if (value.test(itemValue)) {
				itemKey = key;
				break;
			}
		}
	}

	return { itemKey, itemValue, valueIndex };
};

export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	const lensMatches: LensMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;
		let detail: MatchDetail;

		// If it's a line in a dotenv file, try to find any key/value pair
		// where the key contains a secret hint (e.g. "token", "key") or the
		// value matches our combined regexp.
		// Hat tip: https://github.com/motdotla/dotenv
		if (isDotEnv(document)) {
			detail = dotEnvLineParse(line);
		}

		// If it's not a dotenv file, or we couldn't find a
		// match for the dotenv line, fall back to regexp
		if (!detail || !detail.itemValue || detail.valueIndex === undefined) {
			detail = regexpLineParse(line);
		}

		if (!detail) {
			continue;
		}

		const { itemKey, itemValue, valueIndex } = detail;
		if (itemValue && valueIndex !== undefined) {
			const range = new Range(
				new Position(i, valueIndex),
				new Position(i, valueIndex + itemValue.length),
			);

			lensMatches.push({
				itemKey,
				itemValue,
				range,
			});
		}
	}

	return lensMatches.map(
		({ range, itemKey, itemValue }) =>
			new CodeLens(range, {
				title: "$(lock) Save in 1Password",
				command: COMMANDS.SAVE_VALUE_TO_ITEM,
				arguments: [[{ itemKey, itemValue, location: range }]],
			}),
	);
};
