import { window } from "../test/vscode-mock";
import { logger } from "./logger";

describe("Logger", () => {
	const mockedTime = "4:20:00 PM";
	let showSpy: jest.SpyInstance;
	let appendSpy: jest.SpyInstance;

	const expectLoggedMessage = (
		type: "DEBUG" | "INFO" | "ERROR",
		message: string,
	) =>
		expect(appendSpy).toHaveBeenCalledWith(
			`["${type}" - ${mockedTime}] ${message}`,
		);

	const expectLoggedData = (data: unknown) => {
		const message =
			typeof data === "string" ? data : JSON.stringify(data, undefined, 2);
		expect(appendSpy).toHaveBeenCalledWith(message);
	};

	beforeAll(() => {
		jest
			.spyOn(Date.prototype, "toLocaleTimeString")
			.mockReturnValue(mockedTime);

		const outputChannel = window.createOutputChannel();
		showSpy = jest.spyOn(outputChannel, "show");
		appendSpy = jest.spyOn(outputChannel, "appendLine");
	});

	afterEach(() => {
		showSpy.mockClear();
		appendSpy.mockClear();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe("show", () => {
		it("shows the output channel", () => {
			logger.show();
			expect(showSpy).toHaveBeenCalled();
		});
	});

	describe("logDebug", () => {
		beforeEach(() => {
			logger.setOutputLevel("DEBUG");
		});

		it("does nothing when logLevel is NONE, INFO, or ERROR", () => {
			logger.setOutputLevel("NONE");
			logger.logDebug("message");
			logger.setOutputLevel("INFO");
			logger.logDebug("message");
			logger.setOutputLevel("ERROR");
			logger.logDebug("message");
			expect(appendSpy).not.toHaveBeenCalled();
		});

		it("creates a DEBUG log message", () => {
			logger.logDebug("message");
			expectLoggedMessage("DEBUG", "message");
		});

		it("appends a data message when data is attached", () => {
			const data = { data: "data" };
			logger.logDebug("message", data);
			expectLoggedData(data);
		});
	});

	describe("logInfo", () => {
		beforeEach(() => {
			logger.setOutputLevel("INFO");
		});

		it("does nothing when logLevel is NONE or ERROR", () => {
			logger.setOutputLevel("NONE");
			logger.logInfo("message");
			logger.setOutputLevel("ERROR");
			logger.logInfo("message");
			expect(appendSpy).not.toHaveBeenCalled();
		});

		it("creates an INFO log message", () => {
			logger.logInfo("message");
			expectLoggedMessage("INFO", "message");
		});

		it("appends a data message when data is attached", () => {
			const data = { data: "data" };
			logger.logInfo("message", data);
			expectLoggedData(data);
		});
	});

	describe("logError", () => {
		beforeEach(() => {
			logger.setOutputLevel("ERROR");
		});

		it("does nothing when logLevel is NONE", () => {
			logger.setOutputLevel("NONE");
			logger.logError("message");
			expect(appendSpy).not.toHaveBeenCalled();
		});

		it("creates an ERROR log message", () => {
			logger.logError("message");
			expectLoggedMessage("ERROR", "message");
		});

		describe("error argument is a string", () => {
			it("appends the error message", () => {
				const error = "error";
				logger.logError("message", error);
				expect(appendSpy).toHaveBeenCalledWith(error);
			});
		});

		describe("error argument is an instance of Error", () => {
			const error = new Error("error");

			it("appends the message as an ERROR message", () => {
				logger.logError("message", error);
				expectLoggedMessage("ERROR", error.message);
			});

			it("appends the error stack", () => {
				logger.logError("message", error);
				expect(appendSpy).toHaveBeenCalledWith(error.stack);
			});
		});

		describe("error argument is some other type", () => {
			it("appends the error as a data message", () => {
				const data = { data: "data" };
				logger.logError("message", data);
				expectLoggedData(data);
			});
		});
	});
});
