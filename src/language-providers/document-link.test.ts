import { DocumentLink } from "vscode";
import { createDocument } from "../../test/utils";
import * as vscode from "../../test/vscode-mock";
import * as urlUtils from "../url-utils";
import { UriAction } from "../url-utils";
import { provideDocumentLinks } from "./document-link";

jest.mock("../url-utils");

const documentLinkSpy = jest.spyOn(vscode, "DocumentLink");
const reference = "op://vault/item/field";

const createDocumentLinks = (textAtLine: string): DocumentLink[] =>
	provideDocumentLinks(createDocument([textAtLine]));

describe("provideDocumentLinks", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("provides nothing if no secret reference is found", () => {
		const result = createDocumentLinks("not a secret reference");

		expect(result).toHaveLength(0);
		expect(documentLinkSpy).not.toHaveBeenCalled();
	});

	it("provides a document link if a secret reference is found", () => {
		const internalUrlSpy = jest.spyOn(urlUtils, "createInternalUrl");
		const result = createDocumentLinks(reference);

		expect(result).toHaveLength(1);
		expect(documentLinkSpy).toHaveBeenCalledTimes(1);
		expect(internalUrlSpy).toHaveBeenCalledWith(UriAction.OpenItem, {
			vaultValue: "vault",
			itemValue: "item",
		});
	});

	it("support multiple references on the same line", () => {
		const result = createDocumentLinks(
			`${reference}, ${reference}, ${reference}`,
		);

		expect(result).toHaveLength(3);
		expect(documentLinkSpy).toHaveBeenCalledTimes(3);
	});
});
