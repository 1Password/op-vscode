import { Item, ItemCategory, ItemField, ItemFieldType } from "@1password/sdk";
import { generateUUID, randomNumber, sample } from "./utils";

export const createItem = (overrides: Partial<Item> = {}): Item => {
	const id = randomNumber();
	const uuid = generateUUID();
	return {
		id: uuid,
		title: `Vault Item ${id}`,
		category: ItemCategory.Login,
		vaultId: "vault-123",
		fields: [createItemField()],
		sections: [],
		notes: "",
		tags: [],
		websites: [],
		version: 1,
		files: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
};

export const createItemField = (
	overrides: Partial<ItemField> = {},
): ItemField => {
	const fieldType = sample([
		ItemFieldType.Text,
		ItemFieldType.Url,
		ItemFieldType.Address,
		ItemFieldType.Date,
		ItemFieldType.MonthYear,
		ItemFieldType.Email,
		ItemFieldType.Phone,
	]);
	return {
		id: generateUUID(),
		title: `${fieldType} field ${randomNumber()}`,
		fieldType,
		value: "Some Value",
		...overrides,
	};
};
