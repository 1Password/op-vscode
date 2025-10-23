import { Position, Range, TextDocument } from "vscode";
import { matchFromRegexp, Parser, suggestionFromKey } from ".";
import { REGEXP } from "../../constants";

// Hat tip: https://github.com/motdotla/dotenv
export const DOTENV_LINE =
	/^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^\n\r#]+)?\s*(?:#.*)?$/;

export default class DotEnvParser extends Parser {
	public constructor(document: TextDocument) {
		super(document);
	}

	protected parse() {
		for (
			let lineNumber = 0;
			lineNumber < this.document.lineCount;
			lineNumber++
		) {
			const lineValue = this.document.lineAt(lineNumber).text;
			const match = DOTENV_LINE.exec(lineValue);

			if (!match) {
				continue;
			}

			const keyValue = match[1];
			// Default nullish to empty string
			let fieldValue = match[2] || "";
			// Remove whitespace
			fieldValue = fieldValue.trim();
			// Remove surrounding quotes
			fieldValue = fieldValue.replace(/^(["'`])([\S\s]*)\1$/gm, "$2");

			if (fieldValue.length === 0 || REGEXP.SECRET_REFERENCE.test(fieldValue)) {
				continue;
			}

			const index = lineValue.indexOf(fieldValue);
			const range = new Range(
				new Position(lineNumber, index),
				new Position(lineNumber, index + fieldValue.length),
			);

			// Start by trying to find an exact pattern match
			// If one is found, use it and continue to next line
			const regexpMatch = matchFromRegexp(fieldValue);
			const suggestion = regexpMatch?.suggestion || suggestionFromKey(keyValue);

			if (suggestion) {
				this.matches.push({ range, fieldValue, suggestion });
			}
		}
	}
}
