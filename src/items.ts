import {
	Item,
	ItemCategory,
	ItemField,
	ItemFieldType,
	Secrets,
} from "@1password/sdk";
import type { Range, Selection } from "vscode";
import { commands, env, window } from "vscode";
import { config, ConfigKey } from "./configuration";
import { COMMANDS, NONSENSITIVE_FIELD_TYPES } from "./constants";
import type { Core } from "./core";
import { FIELD_TYPE_PATTERNS } from "./secret-detection/patterns";
import { Suggestion } from "./secret-detection/suggestion";
import {
	buildSecretReference,
	formatField,
	formatTitle,
	maskString,
	parsePasswordRecipe,
	toItemFieldType,
} from "./utils";

export interface ReferenceMetaData {
	item: {
		title: string;
		category: ItemCategory;
		createdAt: Date;
		updatedAt: Date;
	};
	field: {
		label: string;
		type: ItemFieldType;
		value?: string;
	};
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

	public async getItem(): Promise<void> {
		if (await this.core.op.isInvalid()) {
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

		const vaultItem = await this.core.op.resolveItem(
			this.core.vaultId,
			itemValue,
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
			fieldsWithValues.map((field) => field.title),
			{
				title: "Choose which field to use",
				ignoreFocusOut: true,
			},
		);

		if (!fieldValue) {
			return;
		}

		const field = vaultItem.fields.find((f) => f.title === fieldValue);
		const reference = buildSecretReference(
			vaultItem.vaultId,
			vaultItem.id,
			field.id,
		);
		return this.getItemCallback(field, reference);
	}

	public async getReferenceMetadata(
		vaultId: string,
		itemId: string,
		fieldIdOrLabel: string,
	): Promise<ReferenceMetaData> {
		if (await this.core.op.isInvalid()) {
			return;
		}

		const vaultItem = await this.core.op.resolveItem(vaultId, itemId, false);

		if (!vaultItem) {
			throw new Error("Could not find vault item.");
		}

		const field = vaultItem.fields.find(
			(f) => f.id === fieldIdOrLabel || f.title === fieldIdOrLabel,
		);

		if (!field) {
			throw new Error("Could not find vault item field.");
		}

		return {
			item: {
				title: vaultItem.title,
				category: vaultItem.category,
				createdAt: vaultItem.createdAt,
				updatedAt: vaultItem.updatedAt,
			},
			field: {
				label: field.title,
				type: field.fieldType,
				value: NONSENSITIVE_FIELD_TYPES.includes(field.fieldType)
					? field.value
					: undefined,
			},
		};
	}

	public async saveItem(
		input?: SaveItemInput[] | typeof generatePasswordArg,
	): Promise<void> {
		if (await this.core.op.isInvalid()) {
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

		let fields: ItemField[] = [];

		if (generatePassword) {
			const { password } = Secrets.generatePassword(
				parsePasswordRecipe(config.get<string>(ConfigKey.ItemsPasswordRecipe)),
			);

			fields = [
				{
					id: "",
					title: "password",
					fieldType: ItemFieldType.Concealed,
					value: password,
				},
			];
		} else {
			fields = await this.createFieldAssignments(input);

			if (fields.length === 0) {
				return;
			}
		}

		const vaultItem = await this.core.op.execute(async (client) =>
			client.items.create({
				vaultId: this.core.vaultId,
				title: itemTitle,
				category: ItemCategory.Login,
				fields,
			}),
		);

		// If the vault is locked this will be undefined
		if (!vaultItem) {
			return;
		}

		await this.insertSavedItem(input, vaultItem);

		await window.showInformationMessage(
			`Item titled "${itemTitle}" saved successfully to your vault.`,
		);
	}

	private async getItemCallback(
		field: ItemField,
		reference: string,
	): Promise<void> {
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
						useReference ? reference : field.value,
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

	private async createFieldAssignments(
		input: SaveItemInput[],
	): Promise<ItemField[]> {
		const fields: ItemField[] = [];
		const isOnlyOne = input.length === 1;

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
			const fieldType = toItemFieldType(suggestion?.type);

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

			fields.push({
				id: "",
				title: fieldLabel,
				fieldType,
				value: fieldValue,
			});
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
					(field) => field.title === "password",
				);
				const reference = buildSecretReference(
					vaultItem.vaultId,
					vaultItem.id,
					field.id,
				);
				await editor.edit((editBuilder) =>
					editBuilder.insert(
						selections[0].active,
						useReference ? reference : field.value,
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
				const reference = buildSecretReference(
					vaultItem.vaultId,
					vaultItem.id,
					field.id,
				);
				await editor.edit((editBuilder) =>
					editBuilder.replace(location, reference),
				);
			}
		}
	}
}
