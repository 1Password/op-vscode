import { account, setGlobalFlags, vault } from "@1password/1password-js";
import { commands, window } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS } from "../constants";
import { Core } from "./core";

export class General {
	accountId?: string;
	accountUrl?: string;
	vaultId?: string;

	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(
				COMMANDS.CHOOSE_ACCOUNT,
				async () => await this.chooseAccount(true),
			),
			commands.registerCommand(
				COMMANDS.CHOOSE_VAULT,
				async () => await this.chooseVault(true),
			),
		);
	}

	public async chooseAccount(
		force = false,
	): Promise<{ id: string; url: string }> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!force && this.accountId && this.accountUrl) {
			return { id: this.accountId, url: this.accountUrl };
		}

		const accountsList = await this.core.cli.execute<
			ReturnType<typeof account.list>
		>(() => account.list());

		if (!accountsList) {
			return;
		}

		if (accountsList.length === 0) {
			const open1Password = "Open 1Password";

			const response = await window.showInformationMessage(
				"You don't have any 1Password accounts. Please create one to perform operations in VS Code.",
				open1Password,
			);

			if (response === open1Password) {
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD);
			}
		}

		const response = await window.showQuickPick(
			accountsList.map((account) => ({
				label: account.email,
				description: account.url,
			})),
			{
				title: "Choose an account",
				ignoreFocusOut: true,
			},
		);

		if (response) {
			const account = accountsList.find(
				(account) =>
					account.email === response.label &&
					account.url === response.description,
			);

			this.accountId = account.user_uuid;
			this.accountUrl = account.url;
			await config.set(ConfigKey.AccountId, account.user_uuid);
			await config.set(ConfigKey.AccountUrl, account.url);
			setGlobalFlags({
				account: account.url,
			});
		}

		return { id: this.accountId, url: this.accountUrl };
	}

	public async chooseVault(setup = false): Promise<string> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!setup && this.vaultId) {
			return this.vaultId;
		}

		await this.chooseAccount();
		if (!this.accountId || !this.accountUrl) {
			await window.showErrorMessage(
				'You must choose a 1Password account before choosing a vault. When you want to choose an account run the "1Password: Choose account" command.',
			);
		}

		const vaultsList = await this.core.cli.execute<
			ReturnType<typeof vault.list>
		>(() => vault.list({ user: this.accountId }));

		if (!vaultsList) {
			return;
		}

		if (vaultsList.length === 0) {
			const open1Password = "Open 1Password";

			const response = await window.showInformationMessage(
				"You don't have any vaults set up with this account. Please create one to perform 1Password operations in VS Code.",
				open1Password,
			);

			if (response === open1Password) {
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD);
			}

			return;
		}

		const response = await window.showQuickPick(
			vaultsList.map((vault) => vault.name),
			{
				title: "Choose an account vault",
				ignoreFocusOut: true,
			},
		);

		if (response) {
			const vault = vaultsList.find((vault) => vault.name === response);

			this.vaultId = vault.id;
			await config.set(ConfigKey.VaultId, vault.id);
		}

		return this.vaultId;
	}
}
