// Hack so we can augment global namespace type
export {};

declare global {
	namespace jest {
		interface Matchers<R, T> {
			toMatchRegExp(pattern: RegExp, exact?: string): R;
			toHaveRegExpParts(pattern: RegExp, ...parts: string[]): R;
		}
	}
}

expect.extend({
	toMatchRegExp: (receivedInput: string, pattern: RegExp, exact?: string) => {
		const match = receivedInput.match(pattern);
		const errorPrefix = `Expected to find match with "${receivedInput}"`;
		const errorSuffix = `\nUsing expression: ${pattern.toString()}`;
		let pass = true;
		let errorIssue: string;

		if (!match) {
			pass = false;
			errorIssue = `, but it did not match`;
		} else if (exact && match[0] !== exact) {
			pass = false;
			errorIssue = `, the matched string was "${match[0]}", but expected "${exact}"`;
		}

		return {
			message: () =>
				pass ? "Success" : errorPrefix + errorIssue + errorSuffix,
			pass,
		};
	},
	toHaveRegExpParts: (
		receivedInput: string,
		pattern: RegExp,
		...parts: string[]
	) => {
		const errorPrefix = `Expected "${receivedInput}" to contain parts:${parts
			.map((p) => `\n  - ${p}`)
			.join("")}\n`;
		const errorSuffix = `\nUsing expression: ${pattern.toString()}`;
		let errorIssue: string;
		let pass = true;

		const matches = receivedInput.match(pattern);

		if (matches === null) {
			pass = false;
			errorIssue = "But did not match the pattern";
		} else {
			for (const [i, part] of parts.entries()) {
				if (matches[i + 1] !== part) {
					pass = false;
					errorIssue = `Part ${i} was "${
						matches[i + 1]
					}" but should be "${part}"`;
				}
			}
		}

		return {
			message: () =>
				pass ? "Success" : errorPrefix + errorIssue + errorSuffix,
			pass,
		};
	},
});
