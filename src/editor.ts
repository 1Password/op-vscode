import {
	CodeLens,
	Disposable,
	DocumentLink,
	Hover,
	languages,
	MarkdownString,
	Position,
	Range,
	TextDocument,
} from "vscode";
import { config, ConfigKey } from "./configuration";
import { COMMANDS, DETECTABLE_VALUE_REGEXP, REGEXP } from "./constants";
import type { Core } from "./core";
import { createInternalUrl, UriAction } from "./core";
import type { ReferenceMetaData } from "./items";
import { combineRegexp, titleCase } from "./utils";

interface LensMatch {
	range: Range;
	itemKey: string;
	itemValue: string;
}

interface LinkMatch {
	range: Range;
	vaultValue: string;
	itemValue: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	const isDotEnv =
		document.languageId === "dotenv" || document.fileName.endsWith(".env");
	const combinedRegexp = combineRegexp(
		...Object.values(DETECTABLE_VALUE_REGEXP),
	);
	const lensMatches: LensMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;
		let itemKey: string;
		let itemValue: string;
		let valueIndex: number;

		// If it's a line in a dotenv file, try to find any key/value pair
		// where the key contains a secret hint (e.g. "token", "key") or the
		// value matches our combined regexp.
		// Hat tip: https://github.com/motdotla/dotenv
		if (isDotEnv) {
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
						combinedRegexp.test(itemValue)) &&
					// Don't match with existing secret references
					!REGEXP.SECRET_REFERENCE.test(itemValue)
				) {
					valueIndex = line.indexOf(itemValue);
				}
			}
		}

		// If it's not a dotenv file, or we couldn't find a
		// match for the dotenv line, fall back to regexp
		if (!itemValue || valueIndex === undefined) {
			const match = combinedRegexp.exec(line);
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
		}

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
				title: "$(lock) Save value in 1Password",
				command: COMMANDS.SAVE_VALUE_TO_ITEM,
				arguments: [[{ itemKey, itemValue, location: range }]],
			}),
	);
};

export const provideDocumentLinks = (
	document: TextDocument,
): DocumentLink[] => {
	const linkMatches: LinkMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;

		const matches = REGEXP.SECRET_REFERENCE.exec(line);
		if (matches) {
			const index = matches.index;
			const itemValue = matches[0];
			const range = new Range(
				new Position(i, index),
				new Position(i, index + itemValue.length),
			);

			linkMatches.push({
				range,
				vaultValue: matches[1],
				itemValue: matches[2],
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

export async function provideHover(
	this: InstanceType<typeof Core>,
	document: TextDocument,
	position: Position,
): Promise<Hover> {
	const line = document.lineAt(position.line).text;
	const matches = REGEXP.SECRET_REFERENCE.exec(line);

	if (matches) {
		const index = matches.index;
		const [value, vault, item] = matches;
		let field = matches[3];

		if (field.includes("/")) {
			const parts = field.split("/");
			field = parts[1];
		}

		const range = new Range(
			new Position(position.line, index),
			new Position(position.line, index + value.length - 1),
		);

		let metaData: ReferenceMetaData;
		try {
			metaData = await this.items.getReferenceMetadata(vault, item, field);
		} catch (error) {
			if (error instanceof Error) {
				const markdownError = new MarkdownString();
				markdownError.isTrusted = true;
				markdownError.appendMarkdown(
					`${error.message} [Check the logs](command:opvs.openLogs)`,
				);
				return new Hover(markdownError, range);
			}
		}

		const markdownField = new MarkdownString();
		markdownField.supportThemeIcons = true;
		markdownField.appendMarkdown("$(output-view-icon) **Field**\n\n");
		markdownField.appendMarkdown(
			`- Label: ${metaData.field.label}\n- Type: ${titleCase(
				metaData.field.type,
			)}\n- Value: ${
				metaData.field.type === "CONCEALED"
					? "_Hidden_"
					: `\`${metaData.field.value}\``
			}`,
		);

		const markdownItem = new MarkdownString();
		markdownItem.supportThemeIcons = true;
		markdownItem.isTrusted = true;
		markdownItem.appendMarkdown("$(file) **Item**\n\n");
		markdownItem.appendMarkdown(
			`- Title: ${metaData.item.title}\n- Category: ${titleCase(
				metaData.item.category,
			)}\n- Created at: ${new Date(
				metaData.item.createdAt,
			).toLocaleString()}\n- Last updated: ${new Date(
				metaData.item.updatedAt,
			).toLocaleString()}`,
		);

		return new Hover([markdownItem, markdownField], range);
	}
}

export class Editor {
	subscriptions: Disposable[] = [];

	public constructor(private core: Core) {
		this.configure();

		config.onDidChange(this.configure.bind(this));
	}

	private configure(): void {
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}

		this.subscriptions = [
			languages.registerCodeLensProvider(
				{ scheme: "file" },
				{
					provideCodeLenses,
				},
			),
			languages.registerDocumentLinkProvider(
				{ scheme: "file" },
				{
					provideDocumentLinks,
				},
			),
			languages.registerHoverProvider(
				{ scheme: "file" },
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					provideHover: provideHover.bind(this.core),
				},
			),
		];

		this.core.context.subscriptions.push(...this.subscriptions);
	}
}
