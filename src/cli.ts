import { setClientInfo, validateCli, ValidationError } from "@1password/op-js";
import { default as open } from "open";
import { window } from "vscode";
import { version } from "../package.json";
import { URLS } from "./constants";
import { logger } from "./logger";
import { endWithPunctuation, semverToInt } from "./utils";

export const createErrorHandler =
	(showError: boolean) => async (error: Error) => {
		const errorPrefix = "Error executing CLI command";

		let errorMessage = errorPrefix;
		if (error.message) {
			errorMessage += `: ${endWithPunctuation(error.message)}`;
		}

		// TODO: update to log error code when JS wrapper starts providing it
		logger.logError(errorPrefix);

		if (!showError) {
			return;
		}

		await window.showErrorMessage(errorMessage);
	};

export class CLI {
	public valid = false;

	public constructor() {
		setClientInfo({
			name: "1Password for VS Code",
			id: "VSC",
			build: semverToInt(version),
		});
	}

	public async execute<TReturn>(
		command: () => TReturn,
		showError = true,
	): Promise<TReturn> {
		if (!this.valid) {
			throw new Error("CLI is not valid, please validate it first.");
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

	public async isInvalid(): Promise<boolean> {
		if (!this.valid) {
			await this.validate();
		}

		return !this.valid;
	}

	public async validate(): Promise<void> {
		this.valid = true;

		try {
			await validateCli();
		} catch (error: any) {
			this.valid = false;

			if (!(error instanceof ValidationError)) {
				throw error;
			}

			switch (error.type) {
				case "not-found":
					const openInstallDocs = "Open installation documentation";

					if (
						(await window.showErrorMessage(
							"CLI is not installed. Please install it to use 1Password for VS Code.",
							openInstallDocs,
						)) === openInstallDocs
					) {
						await open(URLS.CLI_INSTALL_DOCS);
					}

					break;
				case "version":
					const openUpgradeDocs = "Open upgrade documentation";

					if (
						(await window.showErrorMessage(
							`${error.message}. Please upgrade to the latest version to use 1Password for VS Code.`,
							openUpgradeDocs,
						)) === openUpgradeDocs
					) {
						await open(URLS.CLI_UPGRADE_DOCS);
					}

					break;
				default:
					throw error;
			}
		}
	}
}
