import {
	AbbreviatedVault,
	account,
	ListAccount,
	setGlobalFlags,
	vault,
} from "@1password/op-js";
import { commands, window } from "vscode";
import { COMMANDS, DEBUG, STATE } from "./constants";
import type { Core } from "./core";

export class Setup {
	public accountUuid?: string;
	public accountUrl?: string;
	public vaultId?: string;

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

	private setAccountIdFlag() {
		setGlobalFlags({
			account: this.accountUuid,
		});
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	public async configure(): Promise<void> {
		if (await this.core.cli.isInvalid()) {
			return;
		}

		this.accountUuid = await this.core.context.secrets.get(STATE.ACCOUNT_UUID);
		this.accountUrl = await this.core.context.secrets.get(STATE.ACCOUNT_URL);
		this.vaultId = await this.core.context.secrets.get(STATE.VAULT_ID);

		let promptForVault = true;

		const dontRemindMe = "Don't remind me";
		let reminderDisabled =
			!DEBUG &&
			Boolean(
				await this.core.context.secrets.get(STATE.DISABLE_CONFIG_REMINDER),
			);
		const disableReminder = async () =>
			await this.core.context.secrets.store(
				STATE.DISABLE_CONFIG_REMINDER,
				"true",
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
			this.setAccountIdFlag();
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

		if (!this.vaultId && !reminderDisabled) {
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
		if (await this.core.cli.isInvalid()) {
			return;
		}

		const accountsList = await this.core.cli.execute<ListAccount[]>(() =>
			account.list(),
		);

		if (accountsList.length === 0) {
			const open1Password = "Open 1Password";

			const response = await window.showInformationMessage(
				"You don't have any 1Password accounts. Please create one to perform operations in VS Code.",
				open1Password,
			);

			if (response === open1Password) {
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD);
			}

			return;
		}

		const response = await window.showQuickPick(
			accountsList
				.map((account) => ({
					label: account.email,
					description: account.url,
				}))
				.sort((a, b) => {
					if (a.label < b.label) {
						return -1;
					}
					if (a.label > b.label) {
						return 1;
					}
					return 0;
				}),
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
			await this.core.context.secrets.store(
				STATE.ACCOUNT_UUID,
				account.account_uuid,
			);
			await this.core.context.secrets.store(STATE.ACCOUNT_URL, account.url);
			this.setAccountIdFlag();

			if (isChanged) {
				await this.chooseVault();
			}
		}
	}

	public async chooseVault(): Promise<void> {
		if (await this.core.cli.isInvalid()) {
			return;
		}

		if (!this.accountUuid || !this.accountUrl) {
			await window.showErrorMessage(
				'You must choose a 1Password account before choosing a vault. To choose an account run the "1Password: Choose account" command.',
			);
		}

		const vaultsList = await this.core.cli.execute<AbbreviatedVault[]>(() =>
			vault.list(),
		);

		// You cannot have 0 vaults, but if you don't authorize the
		// vault lookup this value will be undefined.
		if (!vaultsList) {
			return;
		}

		const response = await window.showQuickPick(
			vaultsList.map((vault) => vault.name).sort(),
			{
				title: "Choose an account vault",
				ignoreFocusOut: true,
			},
		);

		if (response) {
			const vault = vaultsList.find((vault) => vault.name === response);

			this.vaultId = vault.id;
			await this.core.context.secrets.store(STATE.VAULT_ID, vault.id);
		}
	}
}
