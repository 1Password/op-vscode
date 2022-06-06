import { vault } from "@1password/op-js";
import type { ExtensionContext } from "vscode";
import { commands, window } from "vscode";
import { CLI } from "./cli";
import { COMMANDS, INTERNAL_COMMANDS } from "./constants";
import { Editor } from "./editor";
import { Injection } from "./injection";
import { Items } from "./items";
import { logger } from "./logger";
import { Setup } from "./setup";
import { createOpenOPHandler, OpvsUriHandler } from "./url-utils";

export class Core {
	public cli: CLI;
	private setup: Setup;
	public items: Items;

	public constructor(public context: ExtensionContext) {
		this.context.subscriptions.push(
			window.registerUriHandler(new OpvsUriHandler()),
			commands.registerCommand(
				COMMANDS.OPEN_1PASSWORD,
				createOpenOPHandler(this),
			),
			commands.registerCommand(COMMANDS.OPEN_LOGS, () => logger.show()),
			commands.registerCommand(INTERNAL_COMMANDS.AUTHENTICATE, async () =>
				this.authenticate(),
			),
		);

		this.cli = new CLI();
		this.setup = new Setup(this);
		this.items = new Items(this);

		new Editor(this);
		new Injection(this);

		void this.setup.configure();
	}

	private async authenticate(): Promise<void> {
		if (await this.cli.isInvalid()) {
			return;
		}

		// Hack to get CLI to prompt for biometrics
		await this.cli.execute(() => vault.list(), false);
	}

	public get accountUuid(): string {
		return this.setup.accountUuid;
	}

	public get accountUrl(): string {
		return this.setup.accountUrl;
	}

	public get vaultId(): string {
		return this.setup.vaultId;
	}
}
