import { DOTENV_LINE } from "./dotenv";

describe("DOTENV_LINE", () => {
	// This regex is from dotenv, which has thoroughly tested it:
	// https://github.com/motdotla/dotenv/tree/master/tests
	it("matches a line of a .env file", () => {
		const line = "VAR=value";
		expect(line).toHaveRegExpParts(DOTENV_LINE, "VAR", "value");
	});
});
