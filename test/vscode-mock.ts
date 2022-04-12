const outputAppendSpy = jest.fn();
const outputShowSpy = jest.fn();

export const window = {
	createOutputChannel: () => ({
		appendLine: outputAppendSpy,
		show: outputShowSpy,
	}),
};
