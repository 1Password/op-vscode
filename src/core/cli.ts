/* eslint-disable @typescript-eslint/naming-convention */
import { lookpath } from "lookpath";
import { default as open } from "open";
import { window } from "vscode";
import { config, ConfigKey } from "../configuration";
import { REGEXP, URLS } from "../constants";
import { logger } from "../logger";
import { endWithPunctuation, execute } from "../utils";
import { Core } from "./core";

export enum FieldInputType {
	Password = "password",
	Text = "text",
	Email = "email",
	URL = "url",
	Date = "date",
	MonthYear = "monthYear",
	Phone = "phone",
	// Used for deleting a field
	Delete = "delete",
}

export type CLIField = [field: string, type: FieldInputType, value: string];
export type CLIOptions = Record<string, string | boolean>;

export enum Category {
	SoftwareLicense = "Software License",
	APICredential = "API Credential",
	BankAccount = "Bank Account",
	Document = "Document",
	Identity = "Identity",
	Membership = "Membership",
	WirelessRouter = "Wireless Router",
	Server = "Server",
	Database = "Database",
	DriverLicense = "Driver License",
	RewardProgram = "Reward Program",
	SocialSecurityNumber = "Social Security Number",
	CryptoWallet = "Crypto Wallet",
	Login = "Login",
	OutdoorLicense = "Outdoor License",
	Passport = "Passport",
	CreditCard = "Credit Card",
	EmailAccount = "Email Account",
	MedicalRecord = "Medical Record",
	Password = "Password",
	SecureNote = "Secure Note",
}

export enum FieldType {
	Address = "Address",
	Concealed = "concealed",
	CreditCardNumber = "creditCardNumber",
	CreditCardType = "creditCardType",
	Date = "Date",
	Email = "Email",
	File = "File",
	Gender = "Gender",
	Menu = "Menu",
	MonthYear = "MonthYear",
	OTP = "OTP",
	Phone = "Phone",
	Reference = "Reference",
	// eslint-disable-next-line id-denylist
	String = "String",
	URL = "URL",
}

export enum Purpose {
	Username = "Username",
	Password = "Password",
	Notes = "Notes",
}

export interface Account {
	url: string;
	email: string;
	user_uuid: string;
}

export interface Vault {
	id: string;
	name: string;
}

export interface VaultItemField {
	id: string;
	type: FieldType;
	purpose?: Purpose;
	label: string;
	value?: string;
	section?: {
		id: string;
		label: string;
	};
}

export interface VaultItemURL {
	primary: boolean;
	href: string;
}

export interface VaultItemFile {
	id: string;
	name: string;
	size: number;
	content_path: string;
	section?: {
		id: string;
	};
}

export interface VaultItem {
	id: string;
	title: string;
	version?: number;
	vault: {
		id: string;
	};
	category: Category;
	last_edited_by: string;
	created_at: string;
	updated_at: string;
	fields: VaultItemField[];
	urls?: VaultItemURL[];
	files?: VaultItemFile[];
}

export type VaultFile = string;

export const Command = {
	ListAccounts: {
		description: "list all accounts",
		commands: ["account", "list"],
		baseOptions: [],
	},
	ListVaults: {
		description: "list all vaults",
		commands: ["vault", "list"],
		baseOptions: ["account"],
	},
	GetVault: {
		description: "get a vault's details",
		commands: ["vault", "get"],
		baseOptions: ["account"],
	},
	GetItem: {
		description: "get an item's details",
		commands: ["item", "get"],
		baseOptions: ["account", "vault", "cache"],
	},
	CreateItem: {
		description: "create an item",
		commands: ["item", "create"],
		baseOptions: ["account", "vault"],
	},
	EditItem: {
		description: "edit an item",
		commands: ["item", "edit"],
		baseOptions: ["account", "vault"],
	},
	GetDocument: {
		description: "get a document's contents",
		commands: ["document", "get"],
		baseOptions: ["account", "vault", "cache"],
	},
	EditDocument: {
		description: "edit a document",
		commands: ["document", "edit"],
		baseOptions: ["account", "vault"],
	},
	GetSecret: {
		description: "get a secret's value",
		commands: ["read"],
		baseOptions: ["account", "cache"],
	},
	Inject: {
		description: "inject secrets",
		commands: ["inject"],
		baseOptions: ["account"],
	},
};

export class CLI {
	valid = false;

	public constructor(private core: Core) {}

	private createItemField([field, type, value]: CLIField): string {
		return `"${field}[${type}]=${value}"`;
	}

	private createOptions(
		commandKey: keyof typeof Command,
		customOptions: Record<string, string | boolean>,
	): string[] {
		const options: Record<string, string | boolean> = {};
		options.format = "json";

		const useCache = config.get<boolean>(ConfigKey.ItemsCacheValues);
		const baseOptions = Command[commandKey].baseOptions;
		for (const name of baseOptions) {
			switch (name) {
				case "account":
					options.account = this.core.accountUrl;
					break;
				case "vault":
					options.vault = this.core.vaultId;
					break;
				case "cache":
					options.cache = useCache;
					break;
			}
		}

		Object.assign(options, customOptions);
		return Object.entries(options)
			.filter(([_, value]) => Boolean(value))
			.map(
				([flag, value]) =>
					`--${flag}${typeof value === "string" ? `="${value}"` : ""}`,
			);
	}

	public async execute<T>(
		commandKey: keyof typeof Command,
		{
			args = [],
			options = {},
			format = true,
			showError = true,
			asString = false,
		}: {
			args?: (string | CLIField)[];
			options?: CLIOptions;
			format?: boolean;
			showError?: boolean;
			asString?: boolean;
		} = {},
	): Promise<T> {
		if (!this.valid) {
			await window.showErrorMessage(
				"Can't execute command. Please ensure your CLI setup is valid.",
			);
			return;
		}

		const { description, commands } = Command[commandKey];
		const command = ["op", ...commands];

		for (const arg of args) {
			if (typeof arg === "string") {
				command.push(`"${arg}"`);
			} else {
				command.push(this.createItemField(arg));
			}
		}

		command.push(...this.createOptions(commandKey, options));

		if (asString) {
			return command.join(" ") as unknown as T;
		}

		const handleError = this.createErrorHandler(description, showError);
		let output: string;
		try {
			output = execute(command);
		} catch (error) {
			await handleError(error);
			return;
		}

		let value: T;
		if (format) {
			try {
				value = JSON.parse(output) as T;
			} catch (error) {
				await handleError(error);
				return;
			}
		} else {
			value = output as unknown as T;
		}

		return value;
	}

	public async validate(): Promise<void> {
		const cliExists = !!(await lookpath("op"));
		this.valid = true;

		if (!cliExists) {
			this.valid = false;
			const openInstallDocs = "Open installation documentation";

			const response = await window.showErrorMessage(
				"CLI is not installed. Please install it to use 1Password for VS Code.",
				openInstallDocs,
			);

			if (response === openInstallDocs) {
				await open(URLS.CLI_INSTALL_DOCS);
			}
		}

		const cliVersion = execute(["op", "--version"]);
		logger.logInfo(`CLI version: ${cliVersion}`);

		if (Number(cliVersion.charAt(0)) < 2) {
			this.valid = false;
			const openUpgradeDocs = "Open upgrade documentation";

			const response = await window.showErrorMessage(
				"Your CLI version isn't compatible with this extension. Please upgrade to the latest version to use 1Password for VS Code.",
				openUpgradeDocs,
			);

			if (response === openUpgradeDocs) {
				await open(URLS.CLI_UPGRADE_DOCS);
			}
		}
	}

	private createErrorHandler(description: string, showError: boolean) {
		const openLogs = "Open Logs";
		const errorPrefix = `Failed to ${description}`;
		const errorSuffix = "Check the logs for more details.";

		return async (error: Error) => {
			let errorMessage = errorPrefix;
			const responseMessage = error.message.match(REGEXP.ERROR_MATCH);
			errorMessage += responseMessage
				? `: ${endWithPunctuation(responseMessage[1])} ${errorSuffix}`
				: `. ${errorSuffix}`;

			logger.logError(errorPrefix, error);

			if (!showError) {
				return;
			}

			if (showError) {
				const response = await window.showErrorMessage(errorMessage, openLogs);
				if (response === openLogs) {
					logger.show();
				}
			}
		};
	}
}
