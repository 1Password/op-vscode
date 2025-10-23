declare global {
	namespace jest {
		interface Matchers<R> {
			toMatchRegExp(pattern: RegExp, exact?: string): R;
			toHaveRegExpParts(pattern: RegExp, ...parts: string[]): R;
		}
	}
}

export {};
