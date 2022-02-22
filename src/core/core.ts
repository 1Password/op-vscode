import { default as open } from "open";
import {
	commands,
	env,
	ExtensionContext,
	Uri,
	UriHandler,
	window,
} from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS, DEBUG, QUALIFIED_EXTENSION_ID, STATE } from "../constants";
import { logger } from "../logger";
import { CLI } from "./cli";
import { Editable } from "./editable";
import { Editor } from "./editor";
import { General } from "./general";
import { Injection } from "./injection";
import { Items } from "./items";

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

class OpvsUriHandler implements UriHandler {
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
	private general: General;
	public items: Items;

	public constructor(public context: ExtensionContext) {
		this.context.subscriptions.push(
			window.registerUriHandler(new OpvsUriHandler()),
			commands.registerCommand(
				COMMANDS.OPEN_1PASSWORD,
				// eslint-disable-next-line unicorn/no-object-as-default-parameter
				async ({ action, ...args }: { action: string } = { action: "" }) => {
					const url = new URL(`onepassword://${action}`);

					switch (action) {
						case AppAction.VaultItem:
							const { vaultValue, itemValue } = args as {
								vaultValue: string;
								itemValue: string;
							};
							url.searchParams.append("a", this.accountId);
							url.searchParams.append("v", vaultValue);
							url.searchParams.append("i", itemValue);
							break;
					}

					logger.logDebug(`Opening 1Password:`, {
						url: url.href,
						action,
						...args,
					});
					await open(url.href);
				},
			),
			commands.registerCommand(COMMANDS.OPEN_LOGS, () => logger.show()),
		);

		// TODO: revisit this, it was too aggressive
		// config.onDidChange(this.configure.bind(this));

		this.cli = new CLI(this);
		this.general = new General(this);
		this.items = new Items(this);

		new Editor(this);
		new Editable(this);
		new Injection(this);

		void this.cli.validate().then(async () => {
			await this.configure();
		});
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private async configure(): Promise<void> {
		if (!this.cli.valid) {
			return;
		}

		this.general.accountId = config.get<string>(ConfigKey.AccountId);
		this.general.accountUrl = config.get<string>(ConfigKey.AccountUrl);
		this.general.vaultId = config.get<string>(ConfigKey.VaultId);
		let promptForVault = true;

		const dontRemindMe = "Don't remind me";
		let reminderDisabled =
			!DEBUG &&
			this.context.globalState.get<boolean>(STATE.DISABLE_CONFIG_REMINDER);
		const disableReminder = async () =>
			await this.context.globalState.update(
				STATE.DISABLE_CONFIG_REMINDER,
				true,
			);

		if ((!this.accountId || !this.accountUrl) && !reminderDisabled) {
			const chooseAccount = "Choose account";

			const response = await window.showInformationMessage(
				"Please choose an account to perform 1Password operations in VS Code.",
				chooseAccount,
			);

			if (response === chooseAccount) {
				const { id, url } = await this.general.chooseAccount();
				this.general.accountId = id;
				this.general.accountUrl = url;
				promptForVault = false;
			}
		}

		if (!this.accountId || !this.accountUrl) {
			if (!reminderDisabled) {
				const response = await window.showWarningMessage(
					'You must choose an account to perform 1Password operations in VS Code. When you want to choose an account run the "1Password: Choose account" command.',
					dontRemindMe,
				);

				if (response === dontRemindMe) {
					await disableReminder();
					reminderDisabled = true;
				}
			}

			return;
		}

		if (!this.vaultId && !reminderDisabled) {
			if (promptForVault) {
				const chooseVault = "Choose vault";

				const response = await window.showInformationMessage(
					"Please choose a vault to perform 1Password operations in VS Code.",
					chooseVault,
				);

				if (response === chooseVault) {
					this.general.vaultId = await this.general.chooseVault();
				}
			} else {
				this.general.vaultId = await this.general.chooseVault();
			}
		}

		if (!this.vaultId && !reminderDisabled) {
			const response = await window.showWarningMessage(
				'You must choose a vault to perform 1Password operations in VS Code. When you want to choose an account run the "1Password: Choose vault" command.',
				dontRemindMe,
			);

			if (response === dontRemindMe) {
				await disableReminder();
				reminderDisabled = true;
			}
		}
	}

	public get accountId(): string {
		return this.general.accountId;
	}

	public get accountUrl(): string {
		return this.general.accountUrl;
	}

	public get vaultId(): string {
		return this.general.vaultId;
	}
}
