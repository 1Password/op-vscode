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
export const configUpdate = jest.fn();
export const workspace = {
	getConfiguration: () => ({
		get: configGet,
		update: configUpdate,
	}),
	onDidChangeConfiguration: jest.fn(),
};

export enum ConfigurationTarget {
	Global = 1,
	Workspace = 2,
	WorkspaceFolder = 3,
}

export const Range = jest.fn();
export const Position = jest.fn();
export const Hover = jest.fn();
export const MarkdownString = jest.fn();
export const DocumentLink = jest.fn();
