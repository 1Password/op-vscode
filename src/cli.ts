import { validateCli } from "@1password/1password-js";
import { default as open } from "open";
import { window } from "vscode";
import { REGEXP, URLS } from "./constants";
import { logger } from "./logger";
import { endWithPunctuation } from "./utils";

export const createErrorHandler =
	(showError: boolean) => async (error: Error) => {
		const errorPrefix = "Error executing CLI command";
		const errorSuffix = "Check the logs for more details.";

		let errorMessage = errorPrefix;
		const responseMessage = error.message
			.replace(/[\n\r]/g, "")
			.replace(/(\s{2,}|\t)/g, " ")
			.match(REGEXP.CLI_ERROR);
		errorMessage += responseMessage
			? `: ${endWithPunctuation(responseMessage[1])} ${errorSuffix}`
			: `. ${errorSuffix}`;

		logger.logError(errorPrefix, error.stack);

		if (!showError) {
			return;
		}

		if (showError) {
			const openLogs = "Open Logs";
			const response = await window.showErrorMessage(errorMessage, openLogs);
			if (response === openLogs) {
				logger.show();
			}
		}
	};

export class CLI {
	valid = false;

	public async execute<TReturn>(
		command: () => TReturn,
		showError = true,
	): Promise<TReturn> {
		if (!this.valid) {
			await window.showErrorMessage(
				"Can't execute command. Please ensure your CLI setup is valid.",
			);
			return;
		}

		let output: TReturn;
		try {
			output = command();
		} catch (error) {
			await createErrorHandler(showError)(error);
			return;
		}

		return output;
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	public async validate(): Promise<void> {
		this.valid = true;

		try {
			await validateCli();
		} catch (error: any) {
			if (error instanceof Error) {
				if (error.message.includes("locate op CLI")) {
					this.valid = false;
					const openInstallDocs = "Open installation documentation";

					const response = await window.showErrorMessage(
						"CLI is not installed. Please install it to use 1Password for VS Code.",
						openInstallDocs,
					);

					if (response === openInstallDocs) {
						await open(URLS.CLI_INSTALL_DOCS);
					}

					return;
				} else if (error.message.includes("does not satisfy version")) {
					this.valid = false;

					const openUpgradeDocs = "Open upgrade documentation";

					const response = await window.showErrorMessage(
						`${error.message}. Please upgrade to the latest version to use 1Password for VS Code.`,
						openUpgradeDocs,
					);

					if (response === openUpgradeDocs) {
						await open(URLS.CLI_UPGRADE_DOCS);
					}

					return;
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}
	}
}
