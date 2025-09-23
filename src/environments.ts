import os from "os";
import {
	commands,
	Disposable,
	StatusBarAlignment,
	ThemeColor,
	window,
	workspace,
} from "vscode";
import type { Core } from "./core";
import { AppAction, createOpenOPHandler } from "./url-utils";
import { COMMANDS } from "./constants";
import { existsSync } from "fs";
import path from "path";
import { execFile } from "child_process";

export class Environments {
	private disposables: Disposable[] = [];
	private item = window.createStatusBarItem(
		"op.mounted",
		StatusBarAlignment.Left,
		1000,
	);
	private refreshPending = false;
	private intervalHandle?: NodeJS.Timeout;

	public constructor(private core: Core) {
		commands.registerCommand(COMMANDS.IMPORT_PROJECT, async () =>
			createOpenOPHandler(this.core)({
				action: AppAction.ImportProject,
			}),
		);

		const isWindows = os.platform() === "win32";
		if (isWindows) {
			return;
		}

		this.item.name = "1Password: Mount Status";
		core.context.subscriptions.push(this);

		// Start polling every 500ms
		this.intervalHandle = setInterval(() => {
			void this.refresh();
		}, 500);
		this.disposables.push({
			dispose: () => this.intervalHandle && clearInterval(this.intervalHandle),
		});

		void this.refresh();
	}

	public dispose(): void {
		for (const d of this.disposables) {
			d.dispose();
		}
		this.item.dispose();
	}

	private async refresh(): Promise<void> {
		if (this.refreshPending) {
			return;
		}
		this.refreshPending = true;

		try {
			const firstFolder = workspace.workspaceFolders?.[0];
			const firstFsPath = firstFolder?.uri.fsPath;

			if (!firstFsPath) {
				this.setNoEnvironment();
				return;
			}

			const dbPath = path.join(
				os.homedir(),
				"Library",
				"Group Containers",
				"2BUA8C4S2C.com.1password",
				"Library",
				"Application Support",
				"1Password",
				"Data",
				"debug",
				"1password.sqlite",
			);

			if (!existsSync(dbPath)) {
				this.setNoEnvironment();
				return;
			}

			const mounts = await this.getEnvironmentMounts(dbPath);
			const matching = mounts.find((m) => {
				const mountPath = m.mountPath.split("/").slice(0, -1).join("/");
				return mountPath === firstFsPath;
			});

			if (!matching) {
				this.setNoEnvironment();
				return;
			}

			if (!matching.isEnabled) {
				this.item.text = "$(close) Environment Disabled";
				this.item.tooltip = `Mount to ${matching.environmentName} is disabled`;
				this.item.backgroundColor = new ThemeColor(
					"statusBarItem.warningBackground",
				);
				this.item.show();
				return;
			}

			this.item.text = `$(check) Environment: ${matching.environmentName}`;
			this.item.tooltip = `Mounted to ${matching.environmentName}`;
			this.item.backgroundColor = undefined;
			this.item.show();
		} catch {
			this.setNoEnvironment();
		} finally {
			this.refreshPending = false;
		}
	}

	private setNoEnvironment(): void {
		this.item.text = "$(close) No Environment";
		this.item.tooltip =
			"No 1Password environments were found for this workspace. Click to import.";
		this.item.backgroundColor = new ThemeColor(
			"statusBarItem.warningBackground",
		);
		this.item.command = COMMANDS.IMPORT_PROJECT;
		this.item.show();
	}

	private async getEnvironmentMounts(dbPath: string): Promise<
		{
			mountPath: string;
			environmentName: string;
			isEnabled: boolean;
		}[]
	> {
		const sqliteBin = "/usr/bin/sqlite3";
		const sql =
			"SELECT key_name, hex(data) FROM objects WHERE key_name LIKE 'dev-environment-mount/%';";

		const stdout = await new Promise<string>((resolve, reject) => {
			const args = ["-batch", "-noheader", "-cmd", ".mode tabs", dbPath, sql];
			execFile(
				sqliteBin,
				args,
				{ encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
				(err, out, stderr) => {
					void stderr;
					if (err) {
						reject(err);
						return;
					}
					resolve(out);
				},
			);
		});

		const mounts: {
			mountPath: string;
			environmentName: string;
			isEnabled: boolean;
		}[] = [];
		const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0);
		for (const line of lines) {
			const [keyName, dataHex] = line.split("\t");
			if (!keyName || !dataHex) {
				continue;
			}

			try {
				const jsonStr = Buffer.from(dataHex.trim(), "hex").toString("utf8");
				const parsed = JSON.parse(jsonStr) as {
					mountPath?: string;
					environmentName?: string;
					isEnabled?: boolean;
				};
				if (
					typeof parsed.mountPath === "string" &&
					typeof parsed.environmentName === "string" &&
					typeof parsed.isEnabled === "boolean"
				) {
					mounts.push({
						mountPath: parsed.mountPath,
						environmentName: parsed.environmentName,
						isEnabled: parsed.isEnabled,
					});
				}
			} catch {
				// ignore malformed rows
			}
		}
		return mounts;
	}
}
