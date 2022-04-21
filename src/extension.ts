import { ExtensionContext } from "vscode";
import pckg from "../package.json";
import { config, ConfigKey } from "./configuration";
import { DEBUG } from "./constants";
import { Core } from "./core";
import { logger } from "./logger";

export const activate = (context: ExtensionContext): void => {
	config.configure(context);

	logger.logInfo(`Starting 1Password for VS Code.`);
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions,
	// @typescript-eslint/no-unsafe-member-access
	logger.logInfo(`Extension Version: ${pckg.version}.`);

	if (config.get<boolean>(ConfigKey.DebugEnabled) || DEBUG) {
		logger.setOutputLevel("DEBUG");
	}

	new Core(context);
};
