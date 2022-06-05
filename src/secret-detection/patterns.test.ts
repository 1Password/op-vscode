import { FIELD_TYPE_PATTERNS } from "./patterns";

describe("FIELD_TYPE_PATTERNS", () => {
	describe("email", () => {
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
			expect(email).toMatchRegExp(
				new RegExp(FIELD_TYPE_PATTERNS.email.pattern),
			),
		);
	});

	describe("url", () => {
		// There are many good URL regexes, so this will likely cover a lot of cases,
		// but not all. We're only using this to infer field labels, so false positives
		// and negatives are not a big deal.
		it.each([
			"https://github.com/1Password/op-vscode",
			"https://www.1password.com/",
			"https://start.1password.com/sign-up/team?l=en&c=STARTER",
			// eslint-disable-next-line no-restricted-syntax
			"http://www.example.com/",
		])("matches the URL %s", (url) =>
			expect(url).toMatchRegExp(new RegExp(FIELD_TYPE_PATTERNS.url.pattern)),
		);
	});

	describe("credit card", () => {
		it.each([
			["Visa", "4012888888881881"],
			["MasterCard", "5555555555554444"],
			["Amex", "371449635398431"],
		])("matches the credit card %s", (name, num) =>
			expect(num).toMatchRegExp(new RegExp(FIELD_TYPE_PATTERNS.ccard.pattern)),
		);
	});
});
