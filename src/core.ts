import type { ExtensionContext } from "vscode";
import { commands, window } from "vscode";
import { OnePassword } from "./client";
import { COMMANDS, INTERNAL_COMMANDS } from "./constants";
import { Editor } from "./editor";
import { Injection } from "./injection";
import { Items } from "./items";
import { logger } from "./logger";
import { Setup } from "./setup";
import { createOpenOPHandler, OpvsUriHandler } from "./url-utils";

export class Core {
	public op: OnePassword;
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

		this.op = new OnePassword();
		this.setup = new Setup(this);
		this.items = new Items(this);

		new Editor(this);
		new Injection(this);

		void this.setup.configure();
	}

	private async authenticate(): Promise<void> {
		// Creating the SDK client prompts the desktop app for biometric unlock.
		await this.op.getClient();
	}

	public get accountId(): string {
		return this.setup.accountId;
	}

	public get vaultId(): string {
		return this.setup.vaultId;
	}
}
