import { sample } from "../../test/utils";
import { findBrand } from "../secret-detection/parsers";
import { BRANDS } from "../secret-detection/suggestion";

// describe("DOTENV_LINE", () => {
// 	// This regex is from dotenv, which has thoroughly tested it:
// 	// https://github.com/motdotla/dotenv/tree/master/tests
// 	it("matches a line of a .env file", () => {
// 		const line = "VAR=value";
// 		expect(line).toHaveRegExpParts(DOTENV_LINE, "VAR", "value");
// 	});
// });

describe("findBrandKeyword", () => {
	it("finds a known brand name in a string", () => {
		const brand = sample(BRANDS);
		expect(findBrand(`some ${brand} text`)).toEqual(brand);
	});
});
