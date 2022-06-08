import { createDocument, firstValue, sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { BRANDS } from "../suggestion";
import testData from "./../pattern-test-data.json";
import GenericParser from "./generic";

describe("GenericParser", () => {
	it("gets suggestions from known value patterns", () => {
		const data = Array.from({ length: 5 }).map(() => {
			const [id, value] = sample(testData);
			const suggestion = getPatternSuggestion(id);
			const line = `${firstValue(suggestion.item)}: ${value}`;
			return { line, value, suggestion };
		});

		const parser = new GenericParser(
			createDocument(data.map(({ line }) => line)),
		);

		for (const match of parser.getMatches()) {
			const item = data.find((d) => d.value === match.fieldValue);

			expect(match).toEqual({
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				range: expect.any(Object),
				fieldValue: item.value,
				suggestion: item.suggestion,
			});
		}
	});

	it("gets suggestions from known field pattern, implied brand name", () => {
		const suggestion = getPatternSuggestion("uuid");
		const brand = sample(BRANDS);
		const value = "887144ef-a12c-49a3-a7f3-0768396a60a4";

		suggestion.item = brand;

		const parser = new GenericParser(createDocument([`${brand}: ${value}`]));

		expect(parser.getMatches()).toEqual([
			{
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				range: expect.any(Object),
				fieldValue: value,
				suggestion,
			},
		]);
	});
});
