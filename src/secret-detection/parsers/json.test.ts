import { createDocument } from "../../../test/utils";
import JsonParser from "./json";
import { createParserData, expectParserMatches } from "./test-utils";

describe("JsonParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = createParserData(4, (suggestion, value) => [
			suggestion.item,
			value,
		]);

		const document = createDocument([
			JSON.stringify({
				objects: Object.fromEntries(
					data.slice(0, 2).map((d) => [d.content[0], d.content[1]]),
				),
				arrays: data.slice(2).map((d) => d.content[1]),
			}),
		]);

		const parser = new JsonParser(document);
		expectParserMatches(parser, data);
	});
});
