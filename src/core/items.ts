import { commands, env, Range, Selection, window } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS, REGEXP } from "../constants";
import {
	Category,
	CLIField,
	FieldInputType,
	FieldType,
	Vault,
	VaultItem,
	VaultItemField,
	VaultItemFile,
} from "./cli";
import { Core } from "./core";

export interface ReferenceMetaData {
	item: {
		title: string;
		category: Category;
		createdAt: string;
		updatedAt: string;
	};
	field: {
		label: string;
		type: FieldType;
		value: string;
	};
}

export interface SaveItemInput {
	itemValue: string;
	location: Range | Selection;
}

export interface GetItemResult {
	vaultItem: VaultItem;
	field: VaultItemField;
}

export const safeReferenceValue = (label: string, id: string): string =>
	REGEXP.REFERENCE_PERMITTED.test(label) ? label : id;

export const createSecretReference = (
	vaultValue: string,
	item: VaultItem,
	fieldOrFile: VaultItemField | VaultItemFile,
): string => {
	const fieldValue =
		"label" in fieldOrFile
			? safeReferenceValue(fieldOrFile.label, fieldOrFile.id)
			: safeReferenceValue(fieldOrFile.name, fieldOrFile.id);

	return `op://${vaultValue}/${safeReferenceValue(
		item.title,
		item.id,
	)}/${fieldValue}`;
};

const generatePasswordArg = "generate-pasword";

export class Items {
	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(
				COMMANDS.GET_VALUE_FROM_ITEM,
				async (
					callback: null | ((result?: GetItemResult) => Promise<void>),
					prefill?: {
						itemValue?: string;
						fieldValue?: string;
					},
					plugin?: {
						name: string;
						label: string;
					},
				) =>
					this.getItem(
						callback === null ? undefined : this.valueActions.bind(this),
						prefill,
						plugin,
					),
			),
			commands.registerCommand(
				COMMANDS.SAVE_VALUE_TO_ITEM,
				async (input?: SaveItemInput[]) => {
					input = input || (await this.getSelections());
					await this.saveItem(input);
				},
			),
			commands.registerCommand(
				COMMANDS.CREATE_PASSWORD,
				async () => await this.saveItem(generatePasswordArg),
			),
		);
	}

	private async getItem(
		callback?: (result?: GetItemResult) => Promise<void>,
		prefill?: {
			itemValue?: string;
			fieldValue?: string;
		},
		plugin?: {
			name: string;
			label: string;
		},
	): Promise<GetItemResult | void> {
		const done = async (result?: GetItemResult) =>
			callback ? await callback(result) : result;

		if (!this.core.cli.valid) {
			return done();
		}

		if (!this.core.vaultId) {
			await window.showErrorMessage(
				'You must choose a vault before looking up items. When you want to choose an account run the "1Password: Choose vault" command.',
			);

			return done();
		}

		let itemValue = prefill?.itemValue;
		if (!itemValue) {
			let message = "Enter a vault item name or ID:";
			if (plugin) {
				message = `${plugin.name} is requesting a 1Password vault item for "${plugin.label}". ${message}`;
			}

			itemValue = await window.showInputBox({
				title: message,
				ignoreFocusOut: true,
			});
		}
		if (!itemValue) {
			return done();
		}

		const vaultItem = await this.core.cli.execute<VaultItem>("GetItem", {
			args: [itemValue],
		});

		if (!vaultItem) {
			return done();
		}

		let fieldValue = prefill?.fieldValue;
		if (!fieldValue) {
			const fieldsWithValues = vaultItem.fields.filter((field) =>
				Boolean(field.value),
			);
			if (fieldsWithValues.length === 0) {
				await window.showWarningMessage("This item has no fields with values.");
				return await done();
			}

			fieldValue = await window.showQuickPick(
				fieldsWithValues.map((field) => field.label),
				{
					title: "Choose which field to use",
					ignoreFocusOut: true,
				},
			);
		}
		if (!fieldValue) {
			return done();
		}

		const field = vaultItem.fields.find((f) => f.label === fieldValue);
		return done({ vaultItem, field });
	}

	public async getReferenceMetadata(
		vaultId: string,
		itemId: string,
		fieldId: string,
	): Promise<ReferenceMetaData> {
		if (!this.core.cli.valid) {
			return;
		}

		const vaultItem = await this.core.cli.execute<VaultItem>("GetItem", {
			args: [itemId],
			options: {
				vault: vaultId,
			},
			showError: false,
		});

		if (!vaultItem) {
			throw new Error("Could not find vault item details.");
		}

		const field = vaultItem.fields.find(
			(f) => f.id === fieldId || f.label === fieldId,
		);

		if (!field) {
			throw new Error("Could not find field details.");
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
				value:
					field.type.toLowerCase() === FieldType.Concealed
						? undefined
						: field.value,
			},
		};
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private async saveItem(
		input?: SaveItemInput[] | typeof generatePasswordArg,
	): Promise<void> {
		if (!input || input?.length === 0) {
			return;
		}

		const editor = window.activeTextEditor;
		const itemTitle = await window.showInputBox({
			title: "What do you want to call this item?",
			ignoreFocusOut: true,
		});

		if (!itemTitle) {
			return;
		}

		const generatePassword = input === generatePasswordArg;
		const fields: CLIField[] = [];

		if (!generatePassword) {
			const isOnlyOne = input.length === 1;

			for (const set of input) {
				const { itemValue } = set;

				let fieldType: FieldInputType;
				let suggestedLabel: string;
				switch (true) {
					case REGEXP.EMAIL.test(itemValue):
						fieldType = FieldInputType.Email;
						suggestedLabel = "email";
						break;
					case REGEXP.CREDIT_CARD.test(itemValue):
						fieldType = FieldInputType.Text;
						suggestedLabel = "credit card";
						break;
					default:
						fieldType = FieldInputType.Password;
						suggestedLabel = "value";
						break;
				}

				const fieldLabel = await window.showInputBox({
					title: isOnlyOne
						? "What do you want this field to be called?"
						: `What do you want to call the field with the value "${itemValue}"?`,
					value: suggestedLabel,
					ignoreFocusOut: true,
				});

				if (!fieldLabel) {
					return;
				}

				fields.push([fieldLabel, fieldType, itemValue]);
			}

			if (fields.length === 0) {
				return;
			}
		}
		const vaultItem = await this.core.cli.execute<VaultItem>("CreateItem", {
			args: fields,
			options: {
				title: itemTitle,
				category: "Login",
				"generate-password": generatePassword
					? config.get<string>(ConfigKey.ItemsPasswordRecipe)
					: false,
			},
		});

		if (!vaultItem) {
			return;
		}

		const useReference = config.get<boolean>(
			ConfigKey.ItemsReplaceWithReference,
		);

		if (editor && !editor.document.isClosed) {
			const vault = await this.core.cli.execute<Vault>("GetVault", {
				args: [this.core.vaultId],
			});
			const vaultValue = safeReferenceValue(vault.name, vault.id);

			if (input === generatePasswordArg) {
				const selections = editor?.selections;
				if (selections.length === 1) {
					const field = vaultItem.fields.find(
						(field) => field.label === "password",
					);
					await editor.edit((editBuilder) =>
						editBuilder.insert(
							selections[0].active,
							useReference
								? createSecretReference(vaultValue, vaultItem, field)
								: field.value,
						),
					);
				}
			} else if (useReference) {
				for (const set of input) {
					const { itemValue, location } = set;
					// TODO: this is finding by value, so if there are two items with the
					// same value this will break. Find a better way to find the field
					const field = vaultItem.fields.find(
						(field) => field.value === itemValue,
					);
					await editor.edit((editBuilder) =>
						editBuilder.replace(
							location,
							createSecretReference(vaultValue, vaultItem, field),
						),
					);
				}
			}
		}

		await window.showInformationMessage(
			`Item titled "${itemTitle}" saved successfully to your vault.`,
		);
	}

	private async valueActions(result?: GetItemResult): Promise<void> {
		if (!result) {
			return;
		}

		const { vaultItem, field } = result;

		const editor = window.activeTextEditor;
		const selections = editor?.selections;
		if (!editor || selections.length === 0) {
			await env.clipboard.writeText(field.value);
			await window.showInformationMessage(
				"Copied vault item value to the clipboard.",
			);
		}

		const vault = await this.core.cli.execute<Vault>("GetVault", {
			args: [this.core.vaultId],
		});
		const vaultValue = safeReferenceValue(vault.name, vault.id);
		const useReference = config.get<boolean>(
			ConfigKey.ItemsReplaceWithReference,
		);

		if (editor && !editor.document.isClosed) {
			await editor.edit((editBuilder) => {
				for (const selection of selections) {
					editBuilder.replace(
						selection,
						useReference
							? createSecretReference(vaultValue, vaultItem, field)
							: field.value,
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
}
