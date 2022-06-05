import { format as formatTime } from "timeago.js";
import { Hover } from "vscode";
import * as vscode from "../../test/vscode-mock";
import { Core } from "../core";
import { ReferenceMetaData } from "../items";
import { formatTitle } from "../utils";
import { provideHover } from "./hover";

const appendMarkdownSpy = jest.fn<{ value: string }, string[]>();
const hoverSpy = jest.spyOn(vscode, "Hover");
const markdownStringSpy = jest
	.spyOn(vscode, "MarkdownString")
	.mockImplementation(() => ({
		appendMarkdown: appendMarkdownSpy,
	}));
const reference = "op://vault/item/field";
const core = {
	cli: {
		execute: jest.fn(),
	},
	items: {
		getReferenceMetadata: jest.fn(),
	},
};
const mockMetaData: ReferenceMetaData = {
	item: {
		title: "Item Test",
		category: "LOGIN",
		createdAt: "2017-10-15T23:26:32Z",
		updatedAt: "2019-06-20T22:09:59Z",
	},
	field: {
		label: "Field Test",
		type: "STRING",
		value: "Value Test",
	},
};

const createHover = async (textAtLine: string): Promise<Hover> =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	await provideHover.call(
		core as unknown as Core,
		{
			lineAt: () => ({ text: textAtLine }),
		},
		{
			line: 1,
			character: 0,
		},
	);

describe("provideHover", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("provides nothing if no secret reference is found", async () => {
		const result = await createHover("not a secret reference");

		expect(result).toBeUndefined();
		expect(hoverSpy).not.toHaveBeenCalled();
		expect(markdownStringSpy).not.toHaveBeenCalled();
	});

	it("provides a 'please authenticate' hover if the user is not authenticated", async () => {
		core.cli.execute.mockResolvedValueOnce(null);
		const result = await createHover(reference);

		expect(result).toBeDefined();
		expect(hoverSpy).toHaveBeenCalledTimes(1);
		expect(markdownStringSpy).toHaveBeenCalledTimes(1);
		expect(appendMarkdownSpy.mock.calls[0][0]).toContain(
			"Please authenticate your 1Password",
		);
	});

	it("provides an error hover if one occured in getReferenceMetadata while retrieving reference metadata", async () => {
		const errorMessage = "you've done it again!";
		core.cli.execute.mockResolvedValueOnce({});
		core.items.getReferenceMetadata.mockRejectedValueOnce(
			new Error(errorMessage),
		);
		const result = await createHover(reference);

		expect(result).toBeDefined();
		expect(hoverSpy).toHaveBeenCalledTimes(1);
		expect(markdownStringSpy).toHaveBeenCalledTimes(1);
		expect(appendMarkdownSpy.mock.calls[0][0]).toContain(errorMessage);
	});

	it("provides a hover with the reference metadata", async () => {
		core.cli.execute.mockResolvedValueOnce({});
		core.items.getReferenceMetadata.mockResolvedValueOnce(mockMetaData);
		const result = await createHover(reference);

		expect(result).toBeDefined();
		expect(hoverSpy).toHaveBeenCalledTimes(1);
		expect(markdownStringSpy).toHaveBeenCalledTimes(2);

		for (const text of [
			mockMetaData.item.title,
			formatTitle(mockMetaData.item.category),
			`Created: ${formatTime(mockMetaData.item.createdAt)}`,
			`Updated: ${formatTime(mockMetaData.item.updatedAt)}`,
		]) {
			expect(appendMarkdownSpy.mock.calls[0][0]).toContain(text);
		}

		for (const text of [mockMetaData.field.label, mockMetaData.field.value]) {
			expect(appendMarkdownSpy.mock.calls[1][0]).toContain(text);
		}
	});
});
