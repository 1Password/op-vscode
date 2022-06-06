import type { TextDocument } from "vscode";
import { DocumentLink, Position, Range } from "vscode";
import { REGEXP } from "../constants";
import { createInternalUrl, UriAction } from "../url-utils";

interface LinkMatch {
	range: Range;
	vaultValue: string;
	itemValue: string;
}

export const provideDocumentLinks = (
	document: TextDocument,
): DocumentLink[] => {
	const linkMatches: LinkMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;

		const matches = [
			...line.matchAll(new RegExp(REGEXP.SECRET_REFERENCE.source, "g")),
		];
		for (const match of matches) {
			const index = match.index;
			const itemValue = match[0];
			const range = new Range(
				new Position(i, index),
				new Position(i, index + itemValue.length),
			);

			linkMatches.push({
				range,
				vaultValue: match[1],
				itemValue: match[2],
			});
		}
	}

	return linkMatches.map(
		({ range, vaultValue, itemValue }) =>
			new DocumentLink(
				range,
				createInternalUrl(UriAction.OpenItem, { vaultValue, itemValue }),
			),
	);
};
