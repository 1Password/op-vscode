import { REGEXP } from "./constants";
import {
	combineRegexp,
	endWithPunctuation,
	formatField,
	formatTitle,
	isInRange,
	maskString,
	semverToInt,
	titleCase,
} from "./utils";

describe("semverToInt", () => {
	it("converts a semver string to build number", () => {
		expect(semverToInt("0.1.2")).toBe("000102");
		expect(semverToInt("1.2.3")).toBe("010203");
		expect(semverToInt("12.2.39")).toBe("120239");
		expect(semverToInt("2.1.284")).toBe("0201284");
	});
});

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

describe("formatTitle", () => {
	it("converts a string to title case, replacing underscores with spaces", () => {
		expect(formatTitle("manchester_orchestra")).toBe("Manchester Orchestra");
	});

	it.each(REGEXP.CAPITALIZED_WORDS.source.split("|"))(
		"capitalizes string containing %s",
		(input) => expect(formatTitle(input)).toMatch(input.toUpperCase()),
	);
});

describe("formatField", () => {
	it("converts a string to lower case, replacing underscores with spaces", () => {
		expect(formatField("BRIGHT_EYES")).toBe("bright eyes");
	});
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
