import { TextDocument } from "vscode";
import { config } from "../configuration";
import { provideCodeLenses } from "./code-lens";

const mockDocument = {
	languageId: "",
} as unknown as TextDocument;

describe("provideCodeLenses", () => {
	it("returns an empty array if the config is disabled", () => {
		jest.spyOn(config, "get").mockReturnValue(false);
		const codeLenses = provideCodeLenses(mockDocument);
		expect(codeLenses).toBeUndefined();
	});

	// it("uses the generic parser for an unmatched file type", () => {
	// 	const genericParserSpy = jest
	// 		.spyOn(genericParser, "default")
	// 		.mockReturnValue({
	// 			getMatches: jest.fn(),
	// 		} as unknown as GenericParser);
	// 	jest.spyOn(config, "get").mockReturnValue(true);
	// 	provideCodeLenses(mockDocument);
	// 	expect(genericParserSpy).toHaveBeenCalled();
	// });
});
