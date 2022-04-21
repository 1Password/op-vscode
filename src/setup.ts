import { account, setGlobalFlags, vault } from "@1password/1password-js";
import { commands, window } from "vscode";
import { config, ConfigKey } from "./configuration";
import { COMMANDS, DEBUG, STATE } from "./constants";
import type { Core } from "./core";

export class Setup {
	accountId?: string;
	accountUrl?: string;
	vaultId?: string;
	vaultName?: string;

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

	private vaultNameState() {
		return `${STATE.VAULT_NAME_PREFIX}-${this.vaultId}`;
	}

	private setAccountUrlFlag() {
		setGlobalFlags({
			account: this.accountUrl,
		});
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	public async configure(): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		this.accountId = config.get<string>(ConfigKey.AccountId);
		this.accountUrl = config.get<string>(ConfigKey.AccountUrl);
		this.vaultId = config.get<string>(ConfigKey.VaultId);

		// Store vault name in the extension state because the user
		// already chooses its ID and the two are paired
		this.vaultName = this.core.context.globalState.get<string>(
			this.vaultNameState(),
		);

		let promptForVault = true;

		const dontRemindMe = "Don't remind me";
		let reminderDisabled =
			!DEBUG &&
			this.core.context.globalState.get<boolean>(STATE.DISABLE_CONFIG_REMINDER);
		const disableReminder = async () =>
			await this.core.context.globalState.update(
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
				await this.chooseAccount();
				promptForVault = false;
			}
		} else {
			this.setAccountUrlFlag();
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

		if ((!this.vaultId || !this.vaultName) && !reminderDisabled) {
			if (promptForVault) {
				const chooseVault = "Choose vault";

				const response = await window.showInformationMessage(
					"Please choose a vault to perform 1Password operations in VS Code.",
					chooseVault,
				);

				if (response === chooseVault) {
					await this.chooseVault();
				}
			} else {
				await this.chooseVault();
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

	public async chooseAccount(force = false): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!force && this.accountId && this.accountUrl) {
			return;
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
			this.setAccountUrlFlag();
		}
	}

	public async chooseVault(force = false): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!force && this.vaultId && this.vaultName) {
			return;
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
			this.vaultName = vault.name;
			await config.set(ConfigKey.VaultId, vault.id);
			await this.core.context.globalState.update(
				this.vaultNameState(),
				vault.name,
			);
		}
	}
}
