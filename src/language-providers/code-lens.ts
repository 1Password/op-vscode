import type { TextDocument } from "vscode";
import { CodeLens } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS } from "../constants";
import { Parser } from "../secret-detection/parsers";
import DotEnvParser from "../secret-detection/parsers/dotenv";
import GenericParser from "../secret-detection/parsers/generic";
import JsonParser from "../secret-detection/parsers/json";
import YamlParser from "../secret-detection/parsers/yaml";

export const documentMatcher =
	(document: TextDocument) => (ids: string[], exts: string[]) =>
		ids.includes(document.languageId) ||
		exts.some((ext) => document.fileName.endsWith(`.${ext}`));

export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	const matchDocument = documentMatcher(document);
	let parser: Parser;

	if (matchDocument(["dotenv", "properties"], ["env"])) {
		parser = new DotEnvParser(document);
	} else if (matchDocument(["yaml"], ["yaml", "yml"])) {
		parser = new YamlParser(document);
	} else if (matchDocument(["json", "jsonc"], ["json"])) {
		parser = new JsonParser(document);
	} else {
		parser = new GenericParser(document);
	}

	return parser
		.getMatches()
		.filter(
			// Ignore values within secret template variables
			({ range, fieldValue, suggestion }) =>
				!new RegExp(/\${{(.*?)}}/).test(fieldValue),
		)
		.map(
			({ range, fieldValue, suggestion }) =>
				new CodeLens(range, {
					title: "$(lock) Save in 1Password",
					command: COMMANDS.SAVE_VALUE_TO_ITEM,
					arguments: [[{ location: range, fieldValue, suggestion }]],
				}),
		);
};
