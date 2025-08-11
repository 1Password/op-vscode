import { Item, item } from "@1password/op-js";
import { default as open } from "open";
import { commands, env, Uri, UriHandler, workspace, window } from "vscode";
import { COMMANDS, QUALIFIED_EXTENSION_ID } from "./constants";
import { Core } from "./core";
import { logger } from "./logger";

export enum UriAction {
	OpenItem = "open-item",
}

export enum AppAction {
	ViewItem = "view-item",
	ImportProject = "import-environment-project",
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
	async ({ action, ...args }: { action: AppAction | "" } = { action: "" }) => {
		const url = new URL(`onepassword://${action}`);

		switch (action) {
			case AppAction.ViewItem:
				const { vaultValue, itemValue } = args as {
					vaultValue: string;
					itemValue: string;
				};

				const vaultItem = await core.cli.execute<Item>(
					() => item.get(itemValue, { vault: vaultValue }) as Item,
				);

				url.searchParams.append("a", core.accountUuid);
				url.searchParams.append("v", vaultItem.vault.id);
				url.searchParams.append("i", vaultItem.id);
				break;
			case AppAction.ImportProject:
				const path = await getWorkspaceFolder();
				url.searchParams.append("path", path);
				break;
		}

		logger.logDebug(`Opening 1Password URL: ${url.href}`);

		await open(url.href);
	};

export class OpvsUriHandler implements UriHandler {
	public async handleUri(uri: Uri): Promise<void> {
		const params = new URLSearchParams(uri.query);

		switch (params.get("action")) {
			case UriAction.OpenItem:
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD, {
					action: AppAction.ViewItem,
					vaultValue: params.get("vaultValue"),
					itemValue: params.get("itemValue"),
				});
				break;
		}
	}
}

const getWorkspaceFolder = async (): Promise<string | undefined> => {
	const workspaceFolders = workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return undefined; // No workspace open
	}

	if (workspaceFolders.length === 1) {
		return workspaceFolders[0].uri.fsPath; // Single workspace
	}

	const selected = await window.showQuickPick(
		workspaceFolders.map((folder) => ({
			label: folder.name,
			description: folder.uri.fsPath,
			folder,
		})),
		{
			placeHolder: "Select a workspace folder",
			matchOnDescription: true,
		},
	);

	return selected?.folder.uri.fsPath;
};
