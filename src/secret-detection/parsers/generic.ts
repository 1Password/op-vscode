import { Position, Range, TextDocument } from "vscode";
import { matchFromRegexp, Parser } from ".";

export default class GenericParser extends Parser {
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
			const regexpMatch = matchFromRegexp(lineValue, true);

			if (!regexpMatch) {
				continue;
			}

			const { value: fieldValue, index, suggestion } = regexpMatch;

			const range = new Range(
				new Position(lineNumber, index),
				new Position(lineNumber, index + fieldValue.length),
			);

			this.matches.push({ range, fieldValue, suggestion });
		}
	}
}
