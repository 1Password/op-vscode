import { setCommandLogger } from "@1password/1password-js";
import { default as open } from "open";
import type { ExtensionContext, UriHandler } from "vscode";
import { commands, env, Uri, window } from "vscode";
import { CLI } from "./cli";
import { COMMANDS, QUALIFIED_EXTENSION_ID } from "./constants";
import { Editor } from "./editor";
import { Injection } from "./injection";
import { Items } from "./items";
import { logger } from "./logger";
import { Setup } from "./setup";

export enum UriAction {
	OpenItem = "open-item",
}

export enum AppAction {
	VaultItem = "vault-item",
}

export const createInternalUrl = (
	action: UriAction,
	queryParams: Record<string, string> = {},
) =>
	Uri.from({
		scheme: env.uriScheme,
		authority: QUALIFIED_EXTENSION_ID,
		query: new URLSearchParams({ action, ...queryParams }).toString(),
	});

export const createOpenOPHandler =
	(core: InstanceType<typeof Core>) =>
	// eslint-disable-next-line unicorn/no-object-as-default-parameter
	async ({ action, ...args }: { action: AppAction | "" } = { action: "" }) => {
		const url = new URL(`onepassword://${action}`);

		switch (action) {
			case AppAction.VaultItem:
				const { vault, item } = args as {
					vault: string;
					item: string;
				};
				url.searchParams.append("a", core.accountId);
				url.searchParams.append("v", vault);
				url.searchParams.append("i", item);
				break;
		}

		logger.logDebug(`Opening 1Password:`, {
			url: url.href,
			action,
			...args,
		});

		await open(url.href);
	};

export class OpvsUriHandler implements UriHandler {
	public async handleUri(uri: Uri): Promise<void> {
		logger.logDebug(`Handling URI:`, uri.toString());

		const params = new URLSearchParams(uri.query);

		switch (params.get("action")) {
			case UriAction.OpenItem:
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD, {
					action: AppAction.VaultItem,
					vault: params.get("vaultValue"),
					item: params.get("itemValue"),
				});
				break;
		}
	}
}

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
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		setCommandLogger((message) => logger.logDebug("Command used:", message));

		this.cli = new CLI();
		this.setup = new Setup(this);
		this.items = new Items(this);

		new Editor(this);
		new Injection(this);

		void this.cli.validate().then(async () => {
			await this.setup.configure();
		});
	}

	public get accountId(): string {
		return this.setup.accountId;
	}

	public get accountUrl(): string {
		return this.setup.accountUrl;
	}

	public get vaultId(): string {
		return this.setup.vaultId;
	}

	public get vaultName(): string {
		return this.setup.vaultName;
	}
}
