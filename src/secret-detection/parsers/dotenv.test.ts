import { createDocument, sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { BRANDS } from "../suggestion";
import DotEnvParser, { DOTENV_LINE } from "./dotenv";
import { createParserData, expectParserMatches } from "./test-utils";

describe("DOTENV_LINE", () => {
	// This regex is from dotenv, which has thoroughly tested it:
	// https://github.com/motdotla/dotenv/tree/master/tests
	it("matches a line of a .env file", () => {
		const line = "VAR=value";
		expect(line).toHaveRegExpParts(DOTENV_LINE, "VAR", "value");
	});
});

describe("DotEnvParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = createParserData(
			4,
			(suggestion, value) => `${suggestion.item}=${value}`,
		);

		const document = createDocument(data.map(({ content }) => content));
		const parser = new DotEnvParser(document);

		expectParserMatches(parser, data);
	});

	it("gets suggestions from known field pattern, implied brand name", () => {
		const suggestion = getPatternSuggestion("ccard");
		const brand = sample(BRANDS);
		const value = "4012888888881881";
		suggestion.item = brand;

		const document = createDocument([`${brand}=${value}`]);
		const parser = new DotEnvParser(document);

		expectParserMatches(parser, [
			{
				content: value,
				value,
				suggestion,
			},
		]);
	});
});
