// eslint-disable-next-line import/order
import { findBrand, matchFromRegexp, suggestionFromKey } from ".";
import { sample } from "../../../test/utils";
import { VALUE_PATTERNS } from "../patterns";
import { BRANDS } from "../suggestion";

describe("findBrand", () => {
	it("finds a known brand name in a string", () => {
		const brand = sample(BRANDS);
		expect(findBrand(`some ${brand} text`)).toEqual(brand);
	});
});

describe("matchFromRegexp", () => {
	it("returns nothing if no match is found", () => {
		const match = matchFromRegexp("some string");
		expect(match).toBeUndefined();
	});

	it("returns a match based on a known regexp pattern", () => {
		const exampleStripeKey = "sk_test_Hrs6SAopgFPF0bZXSN3f6ELN";
		const suggestion = VALUE_PATTERNS.find(
			(p) => p.pattern === "sk_(test|live)_[0-9a-zA-Z]{24,99}",
		);
		const match = matchFromRegexp(exampleStripeKey);
		expect(match).toEqual({
			value: exampleStripeKey,
			index: 0,
			suggestion,
		});
	});

	it("returns a match from a generic suggestion with an implied brand", () => {
		const exampleUuid = "49ff1802-9bb4-4cc1-9093-f790e7663399";
		const brand = "Heroku";
		const suggestion = VALUE_PATTERNS.find((p) => p.field === "uuid");
		suggestion.item = brand;
		const match = matchFromRegexp(`${brand} ${exampleUuid}`);
		expect(match).toEqual({
			value: exampleUuid,
			index: brand.length + 1,
			suggestion,
		});
	});
});

describe("suggestionFromKey", () => {
	it("returns nothing if field name can't be implied", () => {
		const suggestion = suggestionFromKey("banana");
		expect(suggestion).toBeUndefined();
	});

	it("creates a suggestion from a known key", () => {
		const suggestion = suggestionFromKey("some auth token");
		expect(suggestion).toEqual({
			item: undefined,
			field: "auth token",
			type: "concealed",
		});
	});

	it("can infer an item name based on a brand", () => {
		const suggestion = suggestionFromKey("my stripe secret key");
		expect(suggestion).toEqual({
			item: "Stripe",
			field: "secret key",
			type: "concealed",
		});
	});
});
