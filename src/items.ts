import type {
	Field,
	FieldAssignment,
	FieldPurpose,
	Item,
	OutputCategory,
} from "@1password/op-js";
import { item } from "@1password/op-js";
import type { Range, Selection } from "vscode";
import { commands, env, window } from "vscode";
import { config, ConfigKey } from "./configuration";
import { COMMANDS, NONSENSITIVE_FIELD_TYPES } from "./constants";
import type { Core } from "./core";
import { FIELD_TYPE_PATTERNS } from "./secret-detection/patterns";
import { Suggestion } from "./secret-detection/suggestion";
import { formatField, formatTitle, maskString } from "./utils";

export interface ReferenceMetaData {
	item: {
		title: string;
		category: OutputCategory;
		createdAt: string;
		updatedAt: string;
	};
	field: Pick<Field, "label" | "type" | "value">;
}

export interface SaveItemInput {
	location: Range | Selection;
	fieldValue: string;
	suggestion?: Suggestion;
}

export const generatePasswordArg = "generate-password";

export class Items {
	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(COMMANDS.GET_VALUE_FROM_ITEM, async () =>
				this.getItem(),
			),
			commands.registerCommand(
				COMMANDS.SAVE_VALUE_TO_ITEM,
				async (input?: SaveItemInput[]) =>
					await this.saveItem(input || (await this.getSelections())),
			),
			commands.registerCommand(
				COMMANDS.CREATE_PASSWORD,
				async () => await this.saveItem(generatePasswordArg),
			),
		);
	}

	public async getItem(): Promise<Field | void> {
		if (await this.core.cli.isInvalid()) {
			return;
		}

		if (!this.core.vaultId) {
			await window.showErrorMessage(
				'You must choose a vault before looking up items. When you want to choose a vault run the "1Password: Choose vault" command.',
			);

			return;
		}

		const itemValue = await window.showInputBox({
			title: "Enter a vault item name or ID:",
			ignoreFocusOut: true,
		});

		if (!itemValue) {
			return;
		}

		const vaultItem = await this.core.cli.execute<Item>(
			() =>
				item.get(itemValue, {
					vault: this.core.vaultId,
					cache: config.get<boolean>(ConfigKey.ItemsCacheValues),
				}) as Item,
		);

		if (!vaultItem) {
			return;
		}

		const fieldsWithValues = vaultItem.fields.filter((field) =>
			Boolean(field.value),
		);
		if (fieldsWithValues.length === 0) {
			await window.showWarningMessage("This item has no fields with values.");
			return;
		}

		const fieldValue = await window.showQuickPick(
			fieldsWithValues.map((field) => field.label),
			{
				title: "Choose which field to use",
				ignoreFocusOut: true,
			},
		);

		if (!fieldValue) {
			return;
		}

		const field = vaultItem.fields.find((f) => f.label === fieldValue);
		return this.getItemCallback(field);
	}

	public async getReferenceMetadata(
		vaultId: string,
		itemId: string,
		fieldIdOrLabel: string,
	): Promise<ReferenceMetaData> {
		if (await this.core.cli.isInvalid()) {
			return;
		}

		const vaultItem = await this.core.cli.execute<Item>(
			() =>
				item.get(itemId, {
					vault: vaultId,
					cache: config.get<boolean>(ConfigKey.ItemsCacheValues),
				}) as Item,
			false,
		);

		if (!vaultItem) {
			throw new Error("Could not find vault item.");
		}

		const field = vaultItem.fields.find(
			(f) => f.id === fieldIdOrLabel || f.label === fieldIdOrLabel,
		);

		if (!field) {
			throw new Error("Could not find vault item field.");
		}

		return {
			item: {
				title: vaultItem.title,
				category: vaultItem.category,
				createdAt: vaultItem.created_at,
				updatedAt: vaultItem.updated_at,
			},
			field: {
				label: field.label,
				type: field.type,
				// @ts-expect-error TODO: op-js needs to update these types
				value: NONSENSITIVE_FIELD_TYPES.includes(field.type)
					? field.value
					: undefined,
			},
		};
	}

	public async saveItem(
		input?: SaveItemInput[] | typeof generatePasswordArg,
	): Promise<void> {
		if (await this.core.cli.isInvalid()) {
			return;
		}

		if (!input || input?.length === 0) {
			return;
		}

		const generatePassword = input === generatePasswordArg;

		let titleSuggestion: string;
		if (input.length === 1 && !generatePassword && input[0].suggestion?.item) {
			titleSuggestion = formatTitle(input[0].suggestion.item);
		}

		const itemTitle = await window.showInputBox({
			title: "What do you want to call this item?",
			ignoreFocusOut: true,
			value: titleSuggestion,
		});

		if (!itemTitle) {
			return;
		}

		let fields: FieldAssignment[] = [];

		if (!generatePassword) {
			fields = await this.createFieldAssignments(input);

			if (fields.length === 0) {
				return;
			}
		}

		let vaultItem = await this.core.cli.execute<Item>(() =>
			item.create(fields, {
				title: itemTitle,
				category: "Login",
				vault: this.core.vaultId,
				generatePassword: generatePassword
					? config.get<string>(ConfigKey.ItemsPasswordRecipe)
					: false,
			}),
		);

		// If the vault is locked this will be undefined
		if (!vaultItem) {
			return;
		}

		vaultItem = await this.core.cli.execute<Item>(
			() => item.get(vaultItem.id) as Item,
		);

		if (!vaultItem) {
			return;
		}

		await this.insertSavedItem(input, vaultItem);

		await window.showInformationMessage(
			`Item titled "${itemTitle}" saved successfully to your vault.`,
		);
	}

	private async getItemCallback(field: Field): Promise<void> {
		const editor = window.activeTextEditor;
		const selections = editor?.selections;
		if (!editor || selections.length === 0) {
			await env.clipboard.writeText(field.value);
			await window.showInformationMessage(
				"Copied vault item value to the clipboard.",
			);

			return;
		}

		if (editor && !editor.document.isClosed) {
			const useReference = config.get<boolean>(
				ConfigKey.ItemsUseSecretReferences,
			);

			await editor.edit((editBuilder) => {
				for (const selection of selections) {
					editBuilder.replace(
						selection,
						useReference ? field.reference : field.value,
					);
				}
			});
		}
	}

	private async getSelections(): Promise<SaveItemInput[]> {
		const editor = window.activeTextEditor;
		const selections = editor?.selections || [];

		if (selections.length === 0 || selections.some((s) => s.isEmpty)) {
			await window.showErrorMessage(
				"Please make a selection to save its value.",
			);
			return;
		}

		return selections.map((selection) => ({
			fieldValue: editor.document.getText(selection),
			location: selection,
		}));
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private async createFieldAssignments(
		input: SaveItemInput[],
	): Promise<FieldAssignment[]> {
		const fields: FieldAssignment[] = [];
		const isOnlyOne = input.length === 1;
		let passwordPurposeAssigned = false;

		for (const set of input) {
			const { fieldValue } = set;
			let suggestion = set.suggestion;

			if (!suggestion) {
				for (const fieldTypeSuggestion of Object.values(FIELD_TYPE_PATTERNS)) {
					if (new RegExp(fieldTypeSuggestion.pattern).test(fieldValue)) {
						suggestion = fieldTypeSuggestion;
						break;
					}
				}
			}

			const suggestedLabel = suggestion?.field || "value";
			const fieldType = suggestion?.type || "concealed";
			let purpose: FieldPurpose | undefined;

			const fieldLabel = await window.showInputBox({
				title: isOnlyOne
					? "What do you want this field to be called?"
					: `What do you want to call the field with the value "${maskString(
							fieldValue,
						)}"?`,
				value: formatField(suggestedLabel),
				ignoreFocusOut: true,
			});

			if (!fieldLabel) {
				continue;
			}

			if (!passwordPurposeAssigned) {
				switch (fieldLabel) {
					case "password":
						purpose = "PASSWORD";
						passwordPurposeAssigned = true;
						break;
				}
			}

			fields.push([fieldLabel, fieldType, fieldValue, purpose]);
		}

		return fields;
	}

	private async insertSavedItem(
		input: SaveItemInput[] | typeof generatePasswordArg,
		vaultItem: Item,
	): Promise<void> {
		const editor = window.activeTextEditor;
		if (!editor || editor.document.isClosed) {
			return;
		}

		const useReference = config.get<boolean>(
			ConfigKey.ItemsUseSecretReferences,
		);

		if (input === generatePasswordArg) {
			const selections = editor?.selections;
			if (selections.length === 1) {
				const field = vaultItem.fields.find(
					(field) => field.label === "password",
				);
				await editor.edit((editBuilder) =>
					editBuilder.insert(
						selections[0].active,
						useReference ? field.reference : field.value,
					),
				);
			}

			return;
		}

		if (useReference) {
			for (const set of input) {
				const { fieldValue, location } = set;
				// TODO: this is finding by value, so if there are two items with the
				// same value this will break. Find a better way to find the field
				const field = vaultItem.fields.find(
					(field) => field.value === fieldValue,
				);
				await editor.edit((editBuilder) =>
					editBuilder.replace(location, field.reference),
				);
			}
		}
	}
}
