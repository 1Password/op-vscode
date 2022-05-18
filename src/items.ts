import type {
	Field,
	FieldAssignment,
	FieldAssignmentType,
	Item,
	OutputCategory,
} from "@1password/1password-js";
import { item } from "@1password/1password-js";
import type { Range, Selection } from "vscode";
import { commands, env, window } from "vscode";
import { config, ConfigKey } from "./configuration";
import { COMMANDS, DETECTABLE_VALUE_REGEXP, REGEXP } from "./constants";
import type { Core } from "./core";
import { valueSuggestion } from "./utils";

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
	itemKey?: string;
	itemValue: string;
	location: Range | Selection;
}

export const generatePasswordArg = "generate-pasword";

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
		if (!this.core.cli.valid) {
			return this.getItemCallback();
		}

		if (!this.core.vaultId) {
			await window.showErrorMessage(
				'You must choose a vault before looking up items. When you want to choose an account run the "1Password: Choose vault" command.',
			);

			return this.getItemCallback();
		}

		const itemValue = await window.showInputBox({
			title: "Enter a vault item name or ID:",
			ignoreFocusOut: true,
		});

		if (!itemValue) {
			return this.getItemCallback();
		}

		const vaultItem = await this.core.cli.execute<Item>(() =>
			item.get(itemValue, {
				vault: this.core.vaultId,
				cache: config.get<boolean>(ConfigKey.ItemsCacheValues),
			}),
		);

		if (!vaultItem) {
			return this.getItemCallback();
		}

		const fieldsWithValues = vaultItem.fields.filter((field) =>
			Boolean(field.value),
		);
		if (fieldsWithValues.length === 0) {
			await window.showWarningMessage("This item has no fields with values.");
			return await this.getItemCallback();
		}

		const fieldValue = await window.showQuickPick(
			fieldsWithValues.map((field) => field.label),
			{
				title: "Choose which field to use",
				ignoreFocusOut: true,
			},
		);

		if (!fieldValue) {
			return this.getItemCallback();
		}

		const field = vaultItem.fields.find((f) => f.label === fieldValue);
		return this.getItemCallback(field);
	}

	public async getReferenceMetadata(
		vaultId: string,
		itemId: string,
		fieldId: string,
	): Promise<ReferenceMetaData> {
		if (!this.core.cli.valid) {
			return;
		}

		const vaultItem = await this.core.cli.execute<Item>(
			() =>
				item.get(itemId, {
					vault: vaultId,
					cache: config.get<boolean>(ConfigKey.ItemsCacheValues),
				}),
			false,
		);

		if (!vaultItem) {
			throw new Error("Could not find vault item.");
		}

		const field = vaultItem.fields.find(
			(f) => f.id === fieldId || f.label === fieldId,
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
				value: field.type === "CONCEALED" ? undefined : field.value,
			},
		};
	}

	public async saveItem(
		input?: SaveItemInput[] | typeof generatePasswordArg,
	): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!input || input?.length === 0) {
			return;
		}

		const generatePassword = input === generatePasswordArg;

		let titleSuggestion = "";
		if (input.length === 1 && !generatePassword && input[0].itemKey) {
			titleSuggestion = valueSuggestion(input[0].itemKey);
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

		// TODO: Should be able to remove this once the CLI
		// returns references during create operations
		vaultItem = await this.core.cli.execute<Item>(() => item.get(vaultItem.id));

		if (!vaultItem) {
			return;
		}

		await this.insertSavedItem(input, vaultItem);

		await window.showInformationMessage(
			`Item titled "${itemTitle}" saved successfully to your vault.`,
		);
	}

	private async getItemCallback(field?: Field): Promise<void> {
		if (!field) {
			return;
		}

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

		if (selections.length === 0) {
			await window.showErrorMessage(
				"Please make a selection to save its value.",
			);
			return;
		}

		return selections.map((selection) => ({
			itemValue: editor.document.getText(selection),
			location: selection,
		}));
	}

	private async createFieldAssignments(
		input: SaveItemInput[],
	): Promise<FieldAssignment[]> {
		const fields: FieldAssignment[] = [];
		const isOnlyOne = input.length === 1;

		for (const set of input) {
			const { itemValue, itemKey } = set;
			let fieldType: FieldAssignmentType;
			let suggestedLabel: string;

			if (itemKey) {
				const extractedLabel = REGEXP.SECRET_KEY_HINT.exec(itemKey);
				suggestedLabel = extractedLabel?.[0] || itemKey;
			}

			switch (true) {
				case DETECTABLE_VALUE_REGEXP.EMAIL.test(itemValue):
					fieldType = "email";
					suggestedLabel = "email";
					break;
				case DETECTABLE_VALUE_REGEXP.CREDIT_CARD.test(itemValue):
					fieldType = "text";
					suggestedLabel = "credit card";
					break;
				case REGEXP.URL.test(itemValue):
					fieldType = "text";
					suggestedLabel = "url";
					break;
				default:
					// TODO: change this to "concealed"
					fieldType = "password";
					break;
			}

			const fieldLabel = await window.showInputBox({
				title: isOnlyOne
					? "What do you want this field to be called?"
					: `What do you want to call the field with the value "${itemValue}"?`,
				value: valueSuggestion(suggestedLabel),
				ignoreFocusOut: true,
			});

			if (!fieldLabel) {
				continue;
			}

			fields.push([fieldLabel, fieldType, itemValue]);
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
				const { itemValue, location } = set;
				// TODO: this is finding by value, so if there are two items with the
				// same value this will break. Find a better way to find the field
				const field = vaultItem.fields.find(
					(field) => field.value === itemValue,
				);
				await editor.edit((editBuilder) =>
					editBuilder.replace(location, field.reference),
				);
			}
		}
	}
}
