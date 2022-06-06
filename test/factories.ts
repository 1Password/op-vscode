/* eslint-disable @typescript-eslint/naming-convention */
import { Field, File, Item } from "@1password/op-js";
import { generateUUID, randomNumber, sample } from "./utils";

export const createItem = (overrides: Partial<Item> = {}): Item => {
	const id = randomNumber();
	const uuid = generateUUID();
	return {
		id: uuid,
		title: `Vault Item ${id}`,
		vault: {
			id: `vault-123`,
			name: "My Vault",
		},
		category: "LOGIN",
		last_edited_by: "user-123",
		created_at: new Date().toString(),
		updated_at: new Date().toString(),
		fields: [createItemField()],
		version: 1,
		sections: [],
		...overrides,
	};
};

export const createItemField = (overrides: Partial<Field> = {}): Field => {
	const type = sample([
		"STRING",
		"URL",
		"ADDRESS",
		"DATE",
		"MONTH_YEAR",
		"EMAIL",
		"PHONE",
	]);
	return {
		id: generateUUID(),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		type: type as any,
		label: `${type} field ${randomNumber()}`,
		value: "Some Value",
		...overrides,
	};
};

export const createItemFile = (overrides: Partial<File> = {}): File => ({
	id: generateUUID(),
	name: `File ${randomNumber()}`,
	size: 260,
	content_path: "/path/to/file.txt",
	section: {
		id: `section-123`,
	},
	...overrides,
});

export const createItemUrlField = (
	primary = true,
): {
	primary: boolean;
	href: string;
} => ({
	primary,
	href: `https://1password.com/${generateUUID()}`,
});
