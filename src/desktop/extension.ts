import type { ExtensionContext } from "vscode";
import { config, ConfigKey } from "./configuration";
import { DEBUG } from "./constants";
import { Core } from "./core";
import { logger } from "./logger";
import { startup, shutdown } from "~/shared";

export const activate = (ctx: ExtensionContext): void => {
	startup(ctx);

	config.configure(ctx);

	if (config.get<boolean>(ConfigKey.DebugEnabled) || DEBUG) {
		logger.setOutputLevel("DEBUG");
	}

	new Core(ctx);
};

export function deactivate() {
	shutdown();
}
