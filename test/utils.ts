import { v4 as uuidv4 } from "uuid";
import { TextDocument } from "vscode";
import { forceArray } from "../src/utils";

// eslint-disable-next-line no-restricted-syntax
export const randomNumber = (): number => Math.floor(Math.random() * 100);

export const generateUUID = (): string => uuidv4();

export const sample = <T>(items: T[]): T =>
	items[randomNumber() % items.length];

export const firstValue = (input: string | string[]) => {
	const values = forceArray(input);
	return values[0];
};

export const createDocument = (lines: string[]) =>
	({
		lineCount: lines.length,
		lineAt: jest.fn((index: number) => ({ text: lines[index] })),
	} as unknown as TextDocument);
