import type { TextDocument } from "vscode";
import { CodeLens } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS } from "../constants";
import DotEnvParser from "../secret-detection/parsers/dotenv";
import GenericParser from "../secret-detection/parsers/generic";

export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	const parser =
		document.languageId === "dotenv"
			? new DotEnvParser(document)
			: new GenericParser(document);

	return parser.getMatches().map(
		({ range, fieldValue, suggestion }) =>
			new CodeLens(range, {
				title: "$(lock) Save in 1Password",
				command: COMMANDS.SAVE_VALUE_TO_ITEM,
				arguments: [[{ location: range, fieldValue, suggestion }]],
			}),
	);
};
