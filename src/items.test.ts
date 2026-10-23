import { type ItemFieldType, Secrets } from "@1password/sdk";
import { createItem, createItemField } from "../test/factories";
import { generateUUID } from "../test/utils";
import { commands, configGet, env, window } from "../test/vscode-mock";
import {
	COMMANDS,
	NONSENSITIVE_FIELD_TYPES,
	SENSITIVE_FIELD_TYPES,
} from "./constants";
import { generatePasswordArg, Items } from "./items";

jest.mock("@1password/sdk", () => ({
	ItemCategory: { Login: "Login" },
	ItemFieldType: {
		Concealed: "Concealed",
		Text: "Text",
		Url: "Url",
		Email: "Email",
		Address: "Address",
		Date: "Date",
		MonthYear: "MonthYear",
		Phone: "Phone",
	},
	Secrets: {
		generatePassword: jest.fn(() => ({ password: "generated-password" })),
	},
}));

describe("Items", () => {
	let items: Items;
	const core = {
		context: {
			subscriptions: [],
		},
		op: {
			isInvalid: jest.fn().mockResolvedValue(false),
			resolveItem: jest.fn(),
			execute: jest.fn(),
		},
		vaultId: generateUUID(),
	};

	beforeEach(() => {
		items = new Items(core as any);
		(Secrets.generatePassword as jest.Mock).mockReturnValue({
			password: "generated-password",
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
		core.op.isInvalid.mockResolvedValue(false);
	});

	describe("constructor", () => {
		it("registers commands for getting and saving items", () => {
			expect(commands.registerCommand).toHaveBeenCalledTimes(3);
			expect(commands.registerCommand).toHaveBeenCalledWith(
				COMMANDS.GET_VALUE_FROM_ITEM,
				expect.any(Function),
			);
			expect(commands.registerCommand).toHaveBeenCalledWith(
				COMMANDS.SAVE_VALUE_TO_ITEM,
				expect.any(Function),
			);
			expect(commands.registerCommand).toHaveBeenCalledWith(
				COMMANDS.CREATE_PASSWORD,
				expect.any(Function),
			);
		});
	});

	describe("getItem", () => {
		const title = "My Item";

		it("asks for the vault item", async () => {
			await items.getItem();
			expect(window.showInputBox).toHaveBeenCalledWith({
				title: expect.stringContaining("item name or ID") as string,
				ignoreFocusOut: true,
			});
		});

		it("aborts if no vault item value supplied", async () => {
			window.showInputBox.mockReturnValue(null);
			await items.getItem();
			expect(core.op.resolveItem).not.toHaveBeenCalled();
		});

		it("uses the SDK to get the vault item", async () => {
			window.showInputBox.mockReturnValue(title);
			await items.getItem();
			expect(core.op.resolveItem).toHaveBeenCalled();
		});

		it("aborts if the vault item is not found", async () => {
			window.showInputBox.mockReturnValue("My Item");
			core.op.resolveItem.mockReturnValue(null);
			await items.getItem();
			expect(window.showQuickPick).not.toHaveBeenCalled();
		});

		it("aborts if the vault item has no value fields", async () => {
			const item = createItem({
				title,
				fields: [createItemField({ value: undefined })],
			});
			window.showInputBox.mockReturnValue(title);
			core.op.resolveItem.mockReturnValue(item);
			await items.getItem();
			expect(window.showWarningMessage).toHaveBeenCalledWith(
				expect.stringContaining("no fields with values"),
			);
		});

		it("asks for the field to use", async () => {
			const item = createItem({ title });
			window.showInputBox.mockReturnValue(title);
			core.op.resolveItem.mockReturnValue(item);
			await items.getItem();
			expect(window.showQuickPick).toHaveBeenCalledWith(
				item.fields.map((field) => field.title),
				{
					ignoreFocusOut: true,
					title: "Choose which field to use",
				},
			);
		});

		it("aborts if no field is chosen", async () => {
			const item = createItem({ title });
			window.showInputBox.mockReturnValue(title);
			core.op.resolveItem.mockReturnValue(item);
			window.showQuickPick.mockReturnValue(null);
			await items.getItem();
		});

		it("copies the item to the clipboard if no editor selection", async () => {
			const originalSelections = [...window.activeTextEditor.selections];
			const item = createItem({ title });
			window.showInputBox.mockReturnValue(title);
			window.activeTextEditor.selections = [];
			core.op.resolveItem.mockReturnValue(item);
			window.showQuickPick.mockReturnValue(item.fields[0].title);
			await items.getItem();
			expect(env.clipboard.writeText).toHaveBeenCalledWith(
				item.fields[0].value,
			);
			expect(window.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining("Copied vault item"),
			);
			window.activeTextEditor.selections = originalSelections;
		});

		it("replaces the selection with the retrieved item value", async () => {
			const item = createItem({ title });
			window.showInputBox.mockReturnValue(title);
			core.op.resolveItem.mockReturnValue(item);
			window.showQuickPick.mockReturnValue(item.fields[0].title);
			await items.getItem();
			expect(window.activeTextEditor.edit).toHaveBeenCalled();
		});
	});

	describe("getReferenceMetadata", () => {
		const vaultName = "Demo";
		const itemTitle = "API Keys";
		const fieldLabel = "bearer token";

		it("aborts if the client is not valid", async () => {
			core.op.isInvalid.mockResolvedValue(true);
			await items.getReferenceMetadata(vaultName, itemTitle, fieldLabel);
			expect(core.op.resolveItem).not.toHaveBeenCalled();
		});

		it("uses the SDK to get the vault item, throws if no vault item found", async () => {
			await expect(
				items.getReferenceMetadata(vaultName, itemTitle, fieldLabel),
			).rejects.toEqual(new Error("Could not find vault item."));
			expect(core.op.resolveItem).toHaveBeenCalled();
		});

		it("throws if unable to find the specified field in a vault item", async () => {
			const item = createItem();
			core.op.resolveItem.mockReturnValue(item);
			await expect(
				items.getReferenceMetadata(vaultName, itemTitle, fieldLabel),
			).rejects.toEqual(new Error("Could not find vault item field."));
		});

		it("returns the item formatted as item and field metadata", async () => {
			const item = createItem({
				title: itemTitle,
				fields: [createItemField({ title: fieldLabel })],
			});
			core.op.resolveItem.mockReturnValue(item);
			await expect(
				items.getReferenceMetadata(vaultName, itemTitle, fieldLabel),
			).resolves.toEqual({
				field: {
					label: fieldLabel,
					type: expect.any(String) as string,
					value: expect.any(String) as string,
				},
				item: {
					category: expect.any(String) as string,
					createdAt: expect.any(Date) as Date,
					title: itemTitle,
					updatedAt: expect.any(Date) as Date,
				},
			});
		});

		it("does not omit field value if field is a non-sensitive type", async () => {
			for (const type of NONSENSITIVE_FIELD_TYPES) {
				const field = createItemField({
					title: fieldLabel,
					fieldType: type as unknown as ItemFieldType,
				});
				const item = createItem({
					fields: [field],
				});
				core.op.resolveItem.mockReturnValue(item);
				const result = await items.getReferenceMetadata(
					vaultName,
					itemTitle,
					fieldLabel,
				);
				expect(result.field.value).toEqual(field.value);
			}
		});

		it("omits field value if field is a sensitive type", async () => {
			for (const type of SENSITIVE_FIELD_TYPES) {
				const item = createItem({
					fields: [
						createItemField({
							title: fieldLabel,
							fieldType: type as unknown as ItemFieldType,
						}),
					],
				});
				core.op.resolveItem.mockReturnValue(item);
				const result = await items.getReferenceMetadata(
					vaultName,
					itemTitle,
					fieldLabel,
				);
				expect(result.field.value).toBeUndefined();
			}
		});
	});

	describe("saveItem", () => {
		const title = "My Item";

		it("aborts if there is no input", async () => {
			await items.saveItem();
			expect(window.showInputBox).not.toHaveBeenCalled();
		});

		it("asks for an item name", async () => {
			await items.saveItem(generatePasswordArg);
			expect(window.showInputBox).toHaveBeenCalledWith({
				ignoreFocusOut: true,
				title: "What do you want to call this item?",
				value: undefined,
			});
		});

		it("aborts if no item name supplied", async () => {
			window.showInputBox.mockReturnValue(null);
			await items.saveItem(generatePasswordArg);
			expect(core.op.execute).not.toHaveBeenCalled();
		});

		it("generates a password and creates an item when generating a password", async () => {
			const recipe = "letters,digits,symbols,32";
			window.showInputBox.mockReturnValue(title);
			configGet.mockReturnValue(recipe);
			await items.saveItem(generatePasswordArg);
			expect(core.op.execute).toHaveBeenCalled();
		});

		it("creates an item with field assignments when saving from individual inputs", async () => {
			const input = {
				fieldValue: "foo",
				location: "example location",
			};
			window.showInputBox.mockReturnValue(title);
			await items.saveItem([input] as any);
			expect(core.op.execute).toHaveBeenCalled();
		});
	});
});
