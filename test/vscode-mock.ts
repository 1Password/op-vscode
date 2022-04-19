export const EventEmitter = jest.fn();

const outputAppendSpy = jest.fn();
const outputShowSpy = jest.fn();
export const window = {
	createOutputChannel: () => ({
		appendLine: outputAppendSpy,
		show: outputShowSpy,
	}),

	showInputBox: jest.fn(),
	showQuickPick: jest.fn(),

	showInformationMessage: jest.fn(),
	showErrorMessage: jest.fn(),
	showWarningMessage: jest.fn(),

	activeTextEditor: {
		selections: [jest.fn()],
		document: {
			isClosed: false,
		},
		edit: jest.fn(),
	},
};

export const commands = {
	registerCommand: jest.fn(),
};

export const env = {
	clipboard: {
		writeText: jest.fn(),
	},
};

export const configGet = jest.fn();
export const workspace = {
	getConfiguration: () => ({
		get: configGet,
	}),
};
