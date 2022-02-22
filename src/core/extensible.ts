import { commands, ExtensionContext, extensions, window } from "vscode";
import { config, ConfigKey } from "../configuration";
import { COMMANDS, DEBUG, STATE } from "../constants";
import { Core } from "./core";
import { GetItemResult } from "./items";

type PermittedExtensions = string[];
type ExtensionMap = Record<string, [item: string, field: string]>;

const validateExtensions = () => {
	if (!config.get<boolean>(ConfigKey.ExtensionsEnabled)) {
		throw new Error(`User has not allowed extensions to use 1Password`);
	}
};

const getExtensionName = (id: string): string => {
	if (DEBUG) {
		return "Development Extension";
	}

	const extension = extensions.getExtension(id);
	if (!extension) {
		throw new Error(`Extension "${id}" not found`);
	}
	return (extension.packageJSON as { displayName: string }).displayName || id;
};

const blockState = (
	state: ExtensionContext["globalState"],
	id: string,
): {
	blocked: boolean;
	block: () => Promise<void>;
} => {
	const blocked = state.get<string[]>(STATE.BLOCKED_EXTENSIONS, []);

	return {
		blocked: !DEBUG && blocked.includes(id),
		block: async () =>
			await state.update(STATE.BLOCKED_EXTENSIONS, [...blocked, id]),
	};
};

export const extensionStorage = (
	state: ExtensionContext["globalState"],
	extensionId: string,
) => {
	const key = `${STATE.EXTENSION_STORAGE}.${extensionId}`;
	const lookup = () => state.get<ExtensionMap>(key, {});
	const reset = async () => await state.update(key, {});
	const getPrefill = (settingId: string) => lookup()[settingId];
	const addPrefill = async (
		settingId: string,
		itemValue: string,
		fieldValue: string,
	) =>
		await state.update(key, {
			...lookup(),
			[settingId]: [itemValue, fieldValue],
		});
	return {
		reset,
		getPrefill,
		addPrefill,
	};
};

let permittedExtensions: PermittedExtensions = [];

export class Extensible {
	private = [];

	public constructor(private core: InstanceType<typeof Core>) {
		permittedExtensions = core.context.globalState.get<PermittedExtensions>(
			STATE.PERMITTED_EXTENSIONS,
			[],
		);

		core.context.subscriptions.push(
			commands.registerCommand(
				COMMANDS.RESET_EXTENSIONS,
				async () => await this.resetExtensions(),
			),
		);
	}

	public async register(extensionId: string): Promise<void> {
		validateExtensions();

		const name = getExtensionName(extensionId);
		const state = blockState(this.core.context.globalState, extensionId);

		if (state.blocked) {
			throw new Error(`User has blocked "${name}" from accessing 1Password`);
		}

		if (permittedExtensions.includes(extensionId)) {
			return;
		}

		const accept = "Yes, allow it";
		const reject = "No, don't allow it";

		const response = await window.showInformationMessage(
			`The extension "${name}" would like to be able to use items from your 1Password. If you accept it can prompt you to specify vault items to retrieve values for. Would you like to allow it?`,
			accept,
			reject,
		);

		if (response === accept) {
			permittedExtensions.push(extensionId);

			await this.core.context.globalState.update(
				STATE.PERMITTED_EXTENSIONS,
				permittedExtensions,
			);

			await window.showInformationMessage(
				`"${name}" can now prompt you for vault items to retrieve values for. We'll remember which item and field you choose. You can reset access and mapped fields by running the "1Password: Reset extensions" command.`,
			);

			return;
		}

		await state.block();
		throw new Error(`User has blocked "${name}" from accessing 1Password`);
	}

	public async getValue(
		extensionId: string,
		settingId: string,
		label: string,
	): Promise<string | null> {
		validateExtensions();

		if (!permittedExtensions.includes(extensionId)) {
			throw new Error(
				"Invalid call to getValue. Please ensure you have called called `register` first to get user's permission to retrieve values.",
			);
		}

		const name = getExtensionName(extensionId);
		const storage = extensionStorage(
			this.core.context.globalState,
			extensionId,
		);
		const prefill = storage.getPrefill(settingId);

		const result = await commands.executeCommand<GetItemResult>(
			COMMANDS.GET_VALUE_FROM_ITEM,
			null,
			{
				itemValue: prefill ? prefill[0] : undefined,
				fieldValue: prefill ? prefill[1] : undefined,
			},
			{
				name,
				label,
			},
		);

		if (!result || !result.field.value) {
			return;
		}

		await storage.addPrefill(
			settingId,
			result.vaultItem.id,
			result.field.value,
		);

		return result.field.value;
	}

	private async resetExtensions(): Promise<void> {
		for (const extensionId of permittedExtensions) {
			await extensionStorage(
				this.core.context.globalState,
				extensionId,
			).reset();
		}
		permittedExtensions = [];
		await this.core.context.globalState.update(STATE.PERMITTED_EXTENSIONS, []);
		await window.showInformationMessage(
			"All extensions and mapped fields have been reset. Extensions may re-request access to 1Password.",
		);
	}
}
