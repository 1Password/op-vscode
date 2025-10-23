import * as opjs from "@1password/op-js";
import { version } from "../package.json";
import { window } from "../test/vscode-mock";
import { CLI, createErrorHandler } from "./cli";
import { logger } from "./logger";
import { semverToInt } from "./utils";

const cli = new CLI();
const goodCommand = jest.fn().mockReturnValue("good");
const error = new Error("bad");
const badCommand = jest.fn().mockImplementation(() => {
	throw error;
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@1password/op-js", () => ({
	...jest.requireActual("@1password/op-js"),
	setClientInfo: jest.fn(),
	validateCli: jest.fn(),
}));

describe("createErrorHandler", () => {
	const error = new Error("test");
	const handler = createErrorHandler(true);

	beforeEach(() => window.showErrorMessage.mockClear());

	it("returns a function", () => {
		expect(handler).toBeInstanceOf(Function);
	});

	it("handler logs the error", async () => {
		const loggerSpy = jest.spyOn(logger, "logError");
		await handler(error);
		expect(loggerSpy).toHaveBeenCalledWith(expect.any(String));
	});

	it("handler displays the error if showError is true", async () => {
		await handler(error);
		expect(window.showErrorMessage).toHaveBeenCalled();
	});

	it("handler won't display the error if showError is false", async () => {
		await createErrorHandler(false)(error);
		expect(window.showErrorMessage).not.toHaveBeenCalled();
	});
});

describe("CLI", () => {
	beforeAll(() => {
		cli.valid = true;
	});

	describe("constructor", () => {
		it("sets op-js user agent info", () => {
			new CLI();
			expect(opjs.setClientInfo).toHaveBeenCalledWith({
				build: semverToInt(version),
				id: "VSC",
				name: "1Password for VS Code",
			});
		});
	});

	describe("execute", () => {
		it("guards against execution when cli is invalid", async () => {
			cli.valid = false;
			await expect(async () => cli.execute(goodCommand)).rejects.toEqual(
				new Error("CLI is not valid, please validate it first."),
			);
			cli.valid = true;
		});

		it("calls the provided command, returns the command result", async () => {
			await expect(cli.execute(goodCommand)).resolves.toEqual("good");
		});

		it("handles exceptions", async () => {
			const loggerSpy = jest.spyOn(logger, "logError");
			await expect(cli.execute(badCommand)).resolves.toBeUndefined();
			expect(loggerSpy).toHaveBeenCalledWith(expect.any(String));
		});
	});

	describe("isInvalid", () => {
		const validateSpy = jest.spyOn(cli, "validate");

		beforeEach(() => validateSpy.mockClear());

		it("returns false if valid is true, does not check again", async () => {
			const result = await cli.isInvalid();
			expect(validateSpy).not.toHaveBeenCalled();
			expect(result).toBe(false);
		});

		it("checks validity if valid is false", async () => {
			cli.valid = false;
			await cli.isInvalid();
			expect(validateSpy).toHaveBeenCalled();
			cli.valid = true;
		});
	});

	describe("validate", () => {
		it("sets valid to true when cli is valid", async () => {
			await cli.validate();
			expect(opjs.validateCli).toHaveBeenCalled();
			expect(cli.valid).toBe(true);
		});

		it("sets valid to false and warns when cli could not be located", async () => {
			const error = new opjs.ValidationError("not-found");
			jest.spyOn(opjs, "validateCli").mockImplementation(() => {
				throw error;
			});
			await cli.validate();
			expect(cli.valid).toBe(false);
		});

		it("sets valid to false and warns when cli is incorrect version", async () => {
			const error = new opjs.ValidationError("version");
			jest.spyOn(opjs, "validateCli").mockImplementation(() => {
				throw error;
			});
			await cli.validate();
			expect(cli.valid).toBe(false);
		});

		it("re-throws a caught error that is not a ValidationError", async () => {
			const error = new Error("foo");
			jest.spyOn(opjs, "validateCli").mockImplementation(() => {
				throw error;
			});
			await expect(async () => await cli.validate()).rejects.toThrow(
				error.message,
			);
			expect(cli.valid).toBe(false);
		});

		it("re-throws a caught ValidationError with an unknown type", async () => {
			// @ts-expect-error testing invalid type
			const error = new opjs.ValidationError("foo");
			jest.spyOn(opjs, "validateCli").mockImplementation(() => {
				throw error;
			});
			await expect(async () => await cli.validate()).rejects.toThrow(
				error.message,
			);
			expect(cli.valid).toBe(false);
		});
	});
});
