import pckg from "../package.json";
import { COMMANDS, REGEXP } from "./constants";

describe("COMMANDS", () => {
	it("exports all the commands defined by the extension", () => {
		expect(
			pckg.contributes.commands.map((c) => c.command).sort(),
		).toStrictEqual(Object.values(COMMANDS).sort());
	});
});

describe("REGEXP", () => {
	describe("CLI_ERROR", () => {
		it("matches an error produced by the CLI", () => {
			const message = "[ERROR] 2022/06/01 13:08:57 unknown command";
			expect(message).toMatchRegExp(REGEXP.CLI_ERROR);
			expect(message).toHaveRegExpParts(REGEXP.CLI_ERROR, "unknown command");
		});
	});

	describe("SECRET_REFERENCE", () => {
		it("matches 3 and 4-part secret references", () => {
			const threePartRef = "op://vault/item/field";
			expect(threePartRef).toMatchRegExp(REGEXP.SECRET_REFERENCE);
			expect(threePartRef).toHaveRegExpParts(
				REGEXP.SECRET_REFERENCE,
				"vault",
				"item",
				"field",
			);

			const fourPartRef = "op://vault/item/section/field";
			expect(fourPartRef).toMatchRegExp(REGEXP.SECRET_REFERENCE);
			expect(fourPartRef).toHaveRegExpParts(
				REGEXP.SECRET_REFERENCE,
				"vault",
				"item",
				"section",
				"field",
			);

			const twoPartRef = "op://item/field";
			expect(twoPartRef).not.toMatchRegExp(REGEXP.SECRET_REFERENCE);
		});

		it("can be used in a line with other code", () => {
			const ref = "op://vault/item/field";

			const code1 = `const variable = new Test("${ref}");`;
			expect(code1).toMatchRegExp(REGEXP.SECRET_REFERENCE, ref);

			// Doesn't match the space between ref and #
			const code2 = `ENV_VAR=${ref} # comment`;
			expect(code2).toMatchRegExp(REGEXP.SECRET_REFERENCE, ref);

			const code3 = `if (token === "${ref}") {`;
			expect(code3).toMatchRegExp(REGEXP.SECRET_REFERENCE, ref);
		});
	});

	describe("DOTENV_LINE", () => {
		// This regex is from dotenv, which has thoroughly tested it:
		// https://github.com/motdotla/dotenv/tree/master/tests
		it("matches a line of a .env file", () => {
			const line = "VAR=value";
			expect(line).toHaveRegExpParts(REGEXP.DOTENV_LINE, "VAR", "value");
		});
	});

	describe("SECRET_KEY_HINT", () => {
		it.each([
			["PRIVATE_KEY", "GCP_PRIVATE_KEY_ID"],
			["ACCESS_KEY", "AWS_ACCESS_KEY_ID"],
			["AUTH_TOKEN", "TWILIO_AUTH_TOKEN"],
			["PRIVATE_KEY", "RSA_PRIVATE_KEY"],
			["PASSWORD", "B5_PASSWORD"],
			["API_TOKEN", "EVENTS_API_TOKEN"],
		])("matches the hint %s within %s", (match, key) =>
			expect(key).toMatchRegExp(REGEXP.SECRET_KEY_HINT, match),
		);
	});

	describe("URL", () => {
		// There are many good URL regexes, so this will likely cover a lot of cases,
		// but not all. We're only using this to infer field labels, so false positives
		// and negatives are not a big deal.
		it.each([
			"https://github.com/1Password/op-vscode",
			"https://www.1password.com/",
			"https://start.1password.com/sign-up/team?l=en&c=STARTER",
			// eslint-disable-next-line no-restricted-syntax
			"http://www.example.com/",
		])("matches the URL %s", (url) => expect(url).toMatchRegExp(REGEXP.URL));
	});

	describe("EMAIL", () => {
		// There are many good Email regexes, so this will likely cover a lot of cases,
		// but not all. We're only using this to infer field labels, so false positives
		// and negatives are not a big deal.
		it.each([
			"email@example.com",
			"firstname.lastname@example.com",
			"email@subdomain.example.com",
			"firstname+lastname@example.com",
			"email@123.123.123.123",
			"1234567890@example.com",
			"email@example-one.com",
			"_______@example.com",
			"email@example.co.jp",
			"firstname-lastname@example.com",
		])("matches the email %s", (email) =>
			expect(email).toMatchRegExp(REGEXP.EMAIL),
		);
	});
});
