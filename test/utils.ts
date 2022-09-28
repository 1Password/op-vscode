import { v4 as uuidv4 } from "uuid";
import { TextDocument } from "vscode";

// eslint-disable-next-line no-restricted-syntax
export const randomNumber = (): number => Math.floor(Math.random() * 100);

export const generateUUID = (): string => uuidv4();

export const sample = <T>(items: T[]): T =>
	items[randomNumber() % items.length];

export const createDocument = (
	lines: string | string[] = [],
	languageId = "plaintext",
	fileName = "test.txt",
) => {
	const content = Array.isArray(lines) ? lines : [lines];
	return {
		lineCount: content.length,
		lineAt: jest.fn((index: number) => ({ text: content[index] })),
		getText: jest.fn(() => content.join("\n")),
		positionAt: jest.fn(),
		languageId,
		fileName,
	} as unknown as TextDocument;
};
