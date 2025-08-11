import { commands, Disposable } from "vscode";
import type { Core } from "./core";
import { AppAction, createOpenOPHandler } from "./url-utils";
import { COMMANDS } from "./constants";

export class Environments {
	public constructor(private core: Core) {
		commands.registerCommand(COMMANDS.IMPORT_PROJECT, async () =>
			createOpenOPHandler(this.core)({
				action: AppAction.ImportProject,
			}),
		);
	}
}
