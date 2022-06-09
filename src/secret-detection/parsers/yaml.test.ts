import { stringify as yamlStringify } from "yaml";
import { createDocument } from "../../../test/utils";
import { createParserData, expectParserMatches } from "./test-utils";
import YamlParser from "./yaml";

describe("YamlParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = createParserData(4, (suggestion, value) => [
			suggestion.item,
			value,
		]);

		const document = createDocument([
			yamlStringify({
				objects: Object.fromEntries(
					data.slice(0, 2).map((d) => [d.content[0], d.content[1]]),
				),
				arrays: data.slice(2).map((d) => d.content[1]),
			}),
		]);

		const parser = new YamlParser(document);
		expectParserMatches(parser, data);
	});
});
