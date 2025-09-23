import { Item, item } from "@1password/op-js";
import { default as open } from "open";
import {
	commands,
	env,
	Uri,
	UriHandler,
	workspace,
	window,
	WorkspaceFolder,
} from "vscode";
import { COMMANDS, QUALIFIED_EXTENSION_ID } from "./constants";
import { Core } from "./core";
import { logger } from "./logger";
import { promises as fs } from "fs";
import * as path from "path";

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
				const path = await getWorkspaceEnvironmentFile();
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

const getWorkspaceEnvironmentFile = async (): Promise<string | undefined> => {
	const workspaceFolders = workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return undefined; // No workspace open
	}

	let folder: WorkspaceFolder;

	// get the workspace folder
	if (workspaceFolders.length === 1) {
		folder = workspaceFolders[0];
	} else {
		const selected = await window.showQuickPick(
			workspaceFolders.map((f) => ({
				label: f.name,
				description: f.uri.fsPath,
				folder: f,
			})),
			{
				placeHolder: "Select a workspace folder",
				matchOnDescription: true,
			},
		);
		if (!selected) {
			return undefined;
		}
		folder = selected.folder;
	}

	const folderPath = folder.uri.fsPath;

	// get the environment file
	let envFiles: string[] = [];
	try {
		const files = await fs.readdir(folderPath);
		envFiles = files.filter(
			(file) => file === ".env" || file.startsWith(".env."),
		);
		if (files.includes(".env")) {
			envFiles.unshift(".env"); // Ensure .env is first if present
			envFiles = Array.from(new Set(envFiles)); // Remove duplicates
		}
	} catch {
		// ignore errors, treat as no env files
	}

	if (envFiles.length === 0) {
		return undefined;
	}

	if (envFiles.length === 1) {
		return path.join(folderPath, envFiles[0]);
	}

	const selectedEnv = await window.showQuickPick(
		envFiles.map((file) => ({
			label: file,
			description: path.join(folderPath, file),
			file,
		})),
		{
			placeHolder: "Select an environment file",
			matchOnDescription: true,
		},
	);

	return selectedEnv ? path.join(folderPath, selectedEnv.file) : undefined;
};
