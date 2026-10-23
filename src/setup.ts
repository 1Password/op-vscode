import { commands, window } from "vscode";
import { COMMANDS, DEBUG, STATE } from "./constants";
import type { Core } from "./core";

export class Setup {
	public accountId?: string;
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

	// eslint-disable-next-line sonarjs/cognitive-complexity
	public async configure(): Promise<void> {
		this.accountId = await this.core.context.secrets.get(STATE.ACCOUNT_UUID);
		this.vaultId = await this.core.context.secrets.get(STATE.VAULT_ID);

		// Make the stored account available to the SDK client so it can
		// authenticate against the 1Password desktop app.
		this.core.op.setAccount(this.accountId);

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

		if (!this.accountId && !reminderDisabled) {
			const chooseAccount = "Choose account";

			const response = await window.showInformationMessage(
				"Please choose an account to perform 1Password operations in VS Code.",
				chooseAccount,
			);

			if (response === chooseAccount) {
				await this.chooseAccount();
				promptForVault = false;
			}
		}

		if (!this.accountId) {
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
		// The SDK can't enumerate accounts, so the user supplies the account
		// name (as shown in the 1Password desktop app), its sign-in address, or
		// its UUID. This value is used to authenticate via the desktop app.
		const account = await window.showInputBox({
			title: "Enter your 1Password account",
			prompt:
				"Use your account name as shown in the 1Password desktop app, its sign-in address (e.g. my.1password.com), or its UUID.",
			placeHolder: "my.1password.com",
			ignoreFocusOut: true,
		});

		if (!account) {
			return;
		}

		const isChanged = this.accountId !== account;
		this.accountId = account;
		await this.core.context.secrets.store(STATE.ACCOUNT_UUID, account);
		this.core.op.setAccount(account);

		if (isChanged) {
			await this.chooseVault();
		}
	}

	public async chooseVault(): Promise<void> {
		if (!this.accountId) {
			await window.showErrorMessage(
				'You must choose a 1Password account before choosing a vault. To choose an account run the "1Password: Choose account" command.',
			);
			return;
		}

		const vaultsList = await this.core.op.execute(async (client) =>
			client.vaults.list({ decryptDetails: true }),
		);

		// If the desktop app authorization was declined this value is undefined.
		if (!vaultsList) {
			return;
		}

		const response = await window.showQuickPick(
			vaultsList.map((vault) => vault.title).sort(),
			{
				title: "Choose an account vault",
				ignoreFocusOut: true,
			},
		);

		if (response) {
			const vault = vaultsList.find((vault) => vault.title === response);

			this.vaultId = vault.id;
			await this.core.context.secrets.store(STATE.VAULT_ID, vault.id);
		}
	}
}
