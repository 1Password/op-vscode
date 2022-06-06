import { ExtensionContext } from "vscode";
import pckg from "../package.json";
import { config } from "./configuration";
import * as core from "./core";
import { activate } from "./extension";
import { logger } from "./logger";

jest.mock("./core");

const mockContext = {} as ExtensionContext;

describe("extension", () => {
	describe("activate", () => {
		it("sets up the config", () => {
			const configureMock = jest.fn();
			config.configure = configureMock;
			activate(mockContext);
			expect(configureMock).toHaveBeenCalledWith(mockContext);
		});

		it("logs the version of the extension", () => {
			const logInfoMock = jest.fn();
			logger.logInfo = logInfoMock;
			activate(mockContext);
			expect(logInfoMock).toHaveBeenCalledWith(
				`Extension Version: ${pckg.version}.`,
			);
		});

		it("sets the logger output level to debug when debug is enabled", () => {
			const outputLevelMock = jest.fn();
			logger.setOutputLevel = outputLevelMock;
			activate(mockContext);
			expect(outputLevelMock).toHaveBeenCalledWith("DEBUG");
		});

		it("initializes the core class", () => {
			const coreSpy = jest.spyOn(core, "Core");
			activate(mockContext);
			expect(coreSpy).toHaveBeenCalledWith(mockContext);
		});
	});
});
