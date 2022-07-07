import {
	findBrand,
	matchFromRegexp,
	suggestionFromKey,
	validValueIsolation,
} from ".";
import { sample } from "../../../test/utils";
import { getPatternSuggestion } from "../patterns";
import { BRANDS } from "../suggestion";

describe("findBrand", () => {
	it("finds a known brand name in a string", () => {
		const brand = sample(BRANDS);
		expect(findBrand(`some ${brand} text`)).toEqual(brand);
		expect(findBrand(`some-${brand}-text`)).toEqual(brand);
		expect(findBrand(`some_${brand}_text`)).toEqual(brand);
	});

	it("bails if brand doesn't have adequate spacer", () => {
		const brand = sample(BRANDS);
		expect(findBrand(`some${brand}text`)).toBeUndefined();
	});
});

describe("matchFromRegexp", () => {
	it("returns nothing if no match is found", () => {
		const match = matchFromRegexp("some string");
		expect(match).toBeUndefined();
	});

	const exampleStripeKey = "sk_test_Hrs6SAopgFPF0bZXSN3f6ELN";
	const mixedStripeKey = `${exampleStripeKey} some other value`;

	it("returns a match based on a known regexp pattern", () => {
		const suggestion = getPatternSuggestion("stripe-sk");
		const match = matchFromRegexp(exampleStripeKey);
		expect(match).toEqual({
			value: exampleStripeKey,
			index: 0,
			suggestion,
		});
	});

	it("requires the match to be the entire value by default", () => {
		const match = matchFromRegexp(mixedStripeKey);
		expect(match).toBeUndefined();
	});

	it("can match a value that also contains other non-matching characters", () => {
		const suggestion = getPatternSuggestion("stripe-sk");
		const match = matchFromRegexp(mixedStripeKey, true);
		expect(match).toEqual({
			value: exampleStripeKey,
			index: 0,
			suggestion,
		});
	});

	it("returns a match from a generic suggestion with an implied brand", () => {
		const exampleUuid = "49ff1802-9bb4-4cc1-9093-f790e7663399";
		const brand = "Heroku";
		const suggestion = getPatternSuggestion("uuid");
		suggestion.item = brand;
		const match = matchFromRegexp(`${brand} ${exampleUuid}`, true);
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

	it("bails if hinted key doesn't have adequate spacer", () => {
		expect(suggestionFromKey("stripe secretkey")).toBeUndefined();
		// this was a real false positive, "password"
		expect(suggestionFromKey("@1password/front-end-style")).toBeUndefined();
	});
});

describe("validValueIsolation", () => {
	const spaceInput = "value test string";
	const noSpaceInput = "valueteststring";
	const dashInput = "value-test-string";
	const underscoreInput = "value_test_string";

	it("returns true if the match is the same as the input", () =>
		expect(validValueIsolation(spaceInput, spaceInput)).toBe(true));

	it("returns true if the match is a substring of the input, with a following space", () =>
		expect(validValueIsolation(spaceInput, "value")).toBe(true));

	it("returns true if the match is a substring of the input, with a preceding space", () =>
		expect(validValueIsolation(spaceInput, "string")).toBe(true));

	it("returns true if the match is a substring of the input, with surrounding space", () =>
		expect(validValueIsolation(spaceInput, "test")).toBe(true));

	it("returns true if the match is a substring of the input and is separated by dashes", () => {
		expect(validValueIsolation(dashInput, "value")).toBe(true);
		expect(validValueIsolation(dashInput, "string")).toBe(true);
		expect(validValueIsolation(dashInput, "test")).toBe(true);
	});

	it("returns true if the match is a substring of the input and is separated by underscores", () => {
		expect(validValueIsolation(underscoreInput, "value")).toBe(true);
		expect(validValueIsolation(underscoreInput, "string")).toBe(true);
		expect(validValueIsolation(underscoreInput, "test")).toBe(true);
	});

	it("returns false if the match is a substring of the input, but has no spacing", () => {
		expect(validValueIsolation(noSpaceInput, "value")).toBe(false);
		expect(validValueIsolation(noSpaceInput, "string")).toBe(false);
		expect(validValueIsolation(noSpaceInput, "test")).toBe(false);
	});

	it("returns false with mixed separator characters", () => {
		expect(validValueIsolation("value test-string", "test")).toBe(false);
		expect(validValueIsolation("value_test-string", "test")).toBe(false);
		expect(validValueIsolation("value_test string", "test")).toBe(false);
	});
});
