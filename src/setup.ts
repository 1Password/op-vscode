import {
	AbbreviatedVault,
	account,
	ListAccount,
	setGlobalFlags,
	vault,
} from "@1password/1password-js";
import { commands, window } from "vscode";
import { COMMANDS, DEBUG, STATE } from "./constants";
import type { Core } from "./core";

export class Setup {
	accountUuid?: string;
	accountUrl?: string;
	vaultId?: string;
	vaultName?: string;

	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(
				COMMANDS.CHOOSE_ACCOUNT,
				async () => await this.chooseAccount(),
			),
			commands.registerCommand(
				COMMANDS.CHOOSE_VAULT,
				async () => await this.chooseVault(),
			),
		);
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

		this.accountUuid = this.core.context.globalState.get<string>(
			STATE.ACCOUNT_UUID,
		);
		this.accountUrl = this.core.context.globalState.get<string>(
			STATE.ACCOUNT_URL,
		);
		this.vaultId = this.core.context.globalState.get<string>(STATE.VAULT_ID);
		this.vaultName = this.core.context.globalState.get<string>(
			STATE.VAULT_NAME,
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

		if ((!this.accountUuid || !this.accountUrl) && !reminderDisabled) {
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

		if (!this.accountUuid || !this.accountUrl) {
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

	public async chooseAccount(): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		const accountsList = await this.core.cli.execute<ListAccount[]>(() =>
			account.list(),
		);

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

			const isChanged = this.accountUuid !== account.account_uuid;
			this.accountUuid = account.user_uuid;
			this.accountUrl = account.url;
			await this.core.context.globalState.update(
				STATE.ACCOUNT_UUID,
				account.account_uuid,
			);
			await this.core.context.globalState.update(
				STATE.ACCOUNT_URL,
				account.url,
			);
			this.setAccountUrlFlag();

			if (isChanged) {
				await this.chooseVault();
			}
		}
	}

	public async chooseVault(): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		if (!this.accountUuid || !this.accountUrl) {
			await window.showErrorMessage(
				'You must choose a 1Password account before choosing a vault. When you want to choose an account run the "1Password: Choose account" command.',
			);
		}

		const vaultsList = await this.core.cli.execute<AbbreviatedVault[]>(() =>
			vault.list(),
		);

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
			await this.core.context.globalState.update(STATE.VAULT_ID, vault.id);
			await this.core.context.globalState.update(STATE.VAULT_NAME, vault.name);
		}
	}
}
