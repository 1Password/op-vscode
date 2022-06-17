import { Parser } from ".";
import { sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { PatternSuggestion } from "../suggestion";
import testData from "./../pattern-test-data.json";

interface ParserDataSet<TContent> {
	content: TContent;
	value: string;
	suggestion: PatternSuggestion;
}

export const createParserData = <TContent>(
	length: number,
	createContent: (suggestion: PatternSuggestion, value: string) => TContent,
): ParserDataSet<TContent>[] =>
	Array.from({ length }).map(() => {
		const [id, value] = sample(testData);
		const suggestion = getPatternSuggestion(id);
		const content = createContent(suggestion, value);
		return { content, value, suggestion };
	});

export const expectParserMatches = <TContent>(
	parser: Parser,
	data: ParserDataSet<TContent>[],
) => {
	for (const match of parser.getMatches()) {
		const item = data.find((d) => d.value === match.fieldValue);

		expect(match).toEqual({
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			range: expect.any(Object),
			fieldValue: item.value,
			suggestion: item.suggestion,
		});
	}
};
