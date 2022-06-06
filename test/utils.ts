import { v4 as uuidv4 } from "uuid";

// eslint-disable-next-line no-restricted-syntax
export const randomNumber = (): number => Math.floor(Math.random() * 100);

export const generateUUID = (): string => uuidv4();

export const sample = <T>(items: T[]): T =>
	items[randomNumber() % items.length];
