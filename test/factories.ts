/* eslint-disable @typescript-eslint/naming-convention */
import {
	Category,
	FieldType,
	VaultItem,
	VaultItemField,
	VaultItemFile,
	VaultItemURL,
} from "../src/core/cli";
import { generateUUID, randomNumber, sample } from "./utils";

export const createItem = (overrides: Partial<VaultItem> = {}): VaultItem => {
	const id = randomNumber();
	const uuid = generateUUID();
	return {
		id: uuid,
		title: `Vault Item ${id}`,
		vault: {
			id: `vault-123`,
		},
		category: Category.Login,
		last_edited_by: "user-123",
		created_at: new Date().toString(),
		updated_at: new Date().toString(),
		fields: [createItemField()],
		...overrides,
	};
};

export const createItemField = (
	overrides: Partial<VaultItemField> = {},
): VaultItemField => {
	const type = sample(Object.values(FieldType));
	return {
		id: generateUUID(),
		type,
		label: `${type} field ${randomNumber()}`,
		value: "Some Value",
		...overrides,
	};
};

export const createItemFile = (
	overrides: Partial<VaultItemFile> = {},
): VaultItemFile => ({
	id: generateUUID(),
	name: `File ${randomNumber()}`,
	size: 260,
	content_path: "/path/to/file.txt",
	...overrides,
});

export const createItemUrlField = (primary = true): VaultItemURL => ({
	primary,
	href: `https://1password.com/${generateUUID()}`,
});
