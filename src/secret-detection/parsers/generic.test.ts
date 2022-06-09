import { createDocument, sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { BRANDS } from "../suggestion";
import GenericParser from "./generic";
import { createParserData, expectParserMatches } from "./test-utils";

describe("GenericParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = createParserData(
			4,
			(suggestion, value) => `${suggestion.item}: ${value}`,
		);

		const document = createDocument(data.map(({ content }) => content));
		const parser = new GenericParser(document);

		expectParserMatches(parser, data);
	});

	it("gets suggestions from known field pattern, implied brand name", () => {
		const suggestion = getPatternSuggestion("uuid");
		const brand = sample(BRANDS);
		const value = "887144ef-a12c-49a3-a7f3-0768396a60a4";
		suggestion.item = brand;

		const document = createDocument([`${brand}: ${value}`]);
		const parser = new GenericParser(document);

		expectParserMatches(parser, [
			{
				content: value,
				value,
				suggestion,
			},
		]);
	});
});
