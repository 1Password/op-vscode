import type { TextDocument } from "vscode";
import { CodeLens } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS } from "../constants";
import { Parser } from "../secret-detection/parsers";
import DotEnvParser from "../secret-detection/parsers/dotenv";
import GenericParser from "../secret-detection/parsers/generic";
import JsonParser from "../secret-detection/parsers/json";
import YamlParser from "../secret-detection/parsers/yaml";

export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	let parser: Parser;

	if (document.languageId === "dotenv") {
		parser = new DotEnvParser(document);
	} else if (document.languageId === "yaml") {
		parser = new YamlParser(document);
	} else if (["json", "jsonc"].includes(document.languageId)) {
		parser = new JsonParser(document);
	} else {
		parser = new GenericParser(document);
	}

	return parser.getMatches().map(
		({ range, fieldValue, suggestion }) =>
			new CodeLens(range, {
				title: "$(lock) Save in 1Password",
				command: COMMANDS.SAVE_VALUE_TO_ITEM,
				arguments: [[{ location: range, fieldValue, suggestion }]],
			}),
	);
};
