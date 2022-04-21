import { combineRegexp, titleCase } from "./utils";

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
		expect(combinedRegexp.test("hello")).toBe(true);
		expect(combinedRegexp.test("world")).toBe(true);
		expect(combinedRegexp.test("24")).toBe(true);
		expect(combinedRegexp.test("hello world 24")).toBe(true);
		expect(combinedRegexp.test("goodbye")).toBe(false);
	});
});
