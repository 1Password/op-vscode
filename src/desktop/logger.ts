import { window } from "vscode";

type LogLevel = "DEBUG" | "INFO" | "ERROR" | "NONE";

class Logger {
	private outputChannel = window.createOutputChannel("1Password");

	private logLevel: LogLevel = "INFO";

	public setOutputLevel(logLevel: LogLevel) {
		this.logLevel = logLevel;
	}

	public logDebug(message: string, data?: unknown): void {
		if (
			this.logLevel === "NONE" ||
			this.logLevel === "INFO" ||
			this.logLevel === "ERROR"
		) {
			return;
		}
		this.logMessage(message, "DEBUG");
		if (data) {
			this.logData(data);
		}
	}

	public logInfo(message: string, data?: unknown): void {
		if (this.logLevel === "NONE" || this.logLevel === "ERROR") {
			return;
		}
		this.logMessage(message, "INFO");
		if (data) {
			this.logData(data);
		}
	}

	public logError(message: string, error?: unknown) {
		if (this.logLevel === "NONE") {
			return;
		}
		this.logMessage(message, "ERROR");
		if (typeof error === "string") {
			this.outputChannel.appendLine(error);
		} else if (error instanceof Error) {
			if (error?.message) {
				this.logMessage(error.message, "ERROR");
			}
			if (error?.stack) {
				this.outputChannel.appendLine(error.stack);
			}
		} else if (error) {
			this.logData(error);
		}
	}

	public show() {
		this.outputChannel.show();
	}

	private logData(data: unknown): void {
		const message =
			typeof data === "string" ? data : JSON.stringify(data, undefined, 2);
		this.outputChannel.appendLine(message);
	}

	private logMessage(message: string, logLevel: LogLevel): void {
		const title = new Date().toLocaleTimeString();
		this.outputChannel.appendLine(`["${logLevel}" - ${title}] ${message}`);
	}
}

export const logger = new Logger();
