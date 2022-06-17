import { ListAccount, whoami } from "@1password/op-js";
import { format as formatTime } from "timeago.js";
import type { TextDocument } from "vscode";
import { Hover, MarkdownString, Position, Range } from "vscode";
import {
	INTERNAL_COMMANDS,
	NONSENSITIVE_FIELD_TYPES,
	REGEXP,
} from "../constants";
import type { Core } from "../core";
import { ReferenceMetaData } from "../items";
import { formatTitle, isInRange, titleCase } from "../utils";

export async function provideHover(
	this: Core,
	document: TextDocument,
	position: Position,
): Promise<Hover> {
	const line = document.lineAt(position.line).text;
	const matches = [
		...line.matchAll(new RegExp(REGEXP.SECRET_REFERENCE.source, "g")),
	];

	// Identify which, if any, secret reference is being hovered over
	const match = matches.find((m) =>
		isInRange(m.index, m.index + m[0].length, position.character, true),
	);

	if (!match) {
		return;
	}

	const index = match.index;
	const [value, vault, item] = match;
	let field = match[3];

	// If there's a fourth part it means the third part
	// is a section, use the fourth as the field name
	if (match[4]) {
		field = match[4];
	}

	const range = new Range(
		new Position(position.line, index),
		new Position(position.line, index + value.length - 1),
	);

	const authenticated = await this.cli.execute<ListAccount | null>(() =>
		whoami(),
	);

	if (!authenticated) {
		const markdownUnauthed = new MarkdownString();
		markdownUnauthed.isTrusted = true;
		markdownUnauthed.appendMarkdown(
			`Please authenticate your 1Password account to reveal details when hovering secret references. [Authenticate](command:${INTERNAL_COMMANDS.AUTHENTICATE})`,
		);
		return new Hover(markdownUnauthed, range);
	}

	// HACK / FIXME: In Windows the CLI cannot perform succesive commands too quickly,
	// so we need to give it a second after the whoami call before looking up item details.
	// This is an issue in the CLI, not the extension.
	await new Promise((resolve) => setTimeout(resolve, 1000));

	let metaData: ReferenceMetaData;
	try {
		metaData = await this.items.getReferenceMetadata(vault, item, field);
	} catch (error) {
		if (error instanceof Error) {
			const markdownError = new MarkdownString();
			markdownError.isTrusted = true;
			markdownError.appendMarkdown(error.message);
			return new Hover(markdownError, range);
		}
	}

	const markdownItem = new MarkdownString();
	markdownItem.supportThemeIcons = true;
	markdownItem.isTrusted = true;
	markdownItem.appendMarkdown(
		`$(file) Item: **${metaData.item.title}**\n\n- Category: ${titleCase(
			formatTitle(metaData.item.category),
		)}\n- Created: ${formatTime(
			metaData.item.createdAt,
		)}\n- Updated: ${formatTime(metaData.item.updatedAt)}`,
	);

	const markdownField = new MarkdownString();
	markdownField.supportThemeIcons = true;
	markdownField.appendMarkdown(
		`$(output-view-icon) Field: **${metaData.field.label}**\n\n${
			// @ts-expect-error TODO: op-js needs to update these types
			NONSENSITIVE_FIELD_TYPES.includes(metaData.field.type)
				? `\`\`\`\n${metaData.field.value}\n\`\`\``
				: "_Value hidden_"
		}`,
	);

	return new Hover([markdownItem, markdownField], range);
}
