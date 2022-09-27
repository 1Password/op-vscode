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
});
