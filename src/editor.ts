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
import { COMMANDS, REGEXP } from "./constants";
import type { Core } from "./core";
import { createInternalUrl, UriAction } from "./core";
import type { ReferenceMetaData } from "./items";
import { combineRegexp, titleCase } from "./utils";

interface LensMatch {
	range: Range;
	itemValue: string;
}

interface LinkMatch {
	range: Range;
	vaultValue: string;
	itemValue: string;
}

export const provideCodeLenses = (document: TextDocument): CodeLens[] => {
	if (!config.get<boolean>(ConfigKey.EditorSuggestStorage)) {
		return;
	}

	const regexp = combineRegexp(REGEXP.UUID, REGEXP.CREDIT_CARD, REGEXP.EMAIL);
	const lensMatches: LensMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;

		const matches = regexp.exec(line);
		if (matches) {
			const index = matches.index;
			const itemValue = matches[0];
			const range = new Range(
				new Position(i, index),
				new Position(i, index + itemValue.length),
			);

			lensMatches.push({
				itemValue,
				range,
			});
		}
	}

	return lensMatches.map(
		({ range, itemValue }) =>
			new CodeLens(range, {
				title: "$(lock) Save value in 1Password",
				command: COMMANDS.SAVE_VALUE_TO_ITEM,
				arguments: [[{ itemValue, location: range }]],
			}),
	);
};

export const provideDocumentLinks = (
	document: TextDocument,
): DocumentLink[] => {
	const linkMatches: LinkMatch[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i).text;

		const matches = REGEXP.REFERENCE.exec(line);
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
	const matches = REGEXP.REFERENCE.exec(line);

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
