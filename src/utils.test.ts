import { REGEXP } from "./constants";
import {
	combineRegexp,
	endWithPunctuation,
	formattedTitle,
	isInRange,
	maskString,
	titleCase,
} from "./utils";

describe("titleCase", () => {
	it("converts a string to title case", () => {
		expect(titleCase("hello world")).toBe("Hello World");
	});

	it("returns the same string if it's the correct case", () => {
		expect(titleCase("Cool Story")).toBe("Cool Story");
	});

	it("ignores other characters", () => {
		expect(titleCase(".1k3?*")).toBe(".1k3?*");
	});
});

describe("combineRegexp", () => {
	it("creates a regexp that combines one or more input regexps", () => {
		const regexp1 = /hello/;
		const regexp2 = /world/;
		const regexp3 = /\d/;
		const combinedRegexp = combineRegexp(regexp1, regexp2, regexp3);
		expect("hello").toMatch(combinedRegexp);
		expect("world").toMatch(combinedRegexp);
		expect("24").toMatch(combinedRegexp);
		expect("hello world 24").toMatch(combinedRegexp);
		expect("goodbye").not.toMatch(combinedRegexp);
	});
});

describe("formattedTitle", () => {
	it("converts a string to title case", () => {
		expect(formattedTitle("manchester orchestra")).toBe("Manchester Orchestra");
	});

	it("replaces underscores with spaces", () => {
		expect(formattedTitle("hello_world")).toBe("Hello World");
	});

	it.each(REGEXP.CAPITALIZED_WORDS.source.split("|"))(
		"capitalizes string containing %s",
		(input) => expect(formattedTitle(input)).toMatch(input.toUpperCase()),
	);
});

describe("endWithPunctuation", () => {
	it("adds a period if the string doesn't end with punctuation", () => {
		expect(endWithPunctuation("hello")).toBe("hello.");
	});

	it.each(["hello.", "hello!", "hello?", "hello:", "hello,"])(
		"returns %s because it ends with punctuation",
		(input) => expect(endWithPunctuation(input)).toBe(input),
	);
});

describe("isInRange", () => {
	it("returns true if the number is in the range", () => {
		expect(isInRange(1, 5, 3)).toBe(true);
		expect(isInRange(1, 5, 3, true)).toBe(true);
	});

	it("returns false if the number is not in the range", () => {
		expect(isInRange(1, 5, 6)).toBe(false);
		expect(isInRange(1, 5, 6, true)).toBe(false);
	});

	it("is exclusive by default", () => {
		expect(isInRange(1, 5, 5)).toBe(false);
	});

	it("can be inclusive", () => {
		expect(isInRange(1, 5, 5, true)).toBe(true);
	});
});

describe("maskString", () => {
	it.each([
		["a", "a"],
		["ab", "a*"],
		["abc", "a**"],
		["abcd", "a***"],
	])("1-4 characters: masks %s with %s", (input, expected) =>
		expect(maskString(input)).toBe(expected),
	);

	it("5 characters: masks abcde with a***e", () =>
		expect(maskString("abcde")).toBe("a***e"));

	it.each([
		["abcdef", "ab**ef"],
		["abcdefghij", "ab******ij"],
	])("6+ characters: masks %s with %s", (input, expected) =>
		expect(maskString(input)).toBe(expected),
	);

	it("maxes out at 8 asterisks", () =>
		expect(maskString("abcdefghijklmnopqrstuvwxyz")).toBe("ab********yz"));
});
