import {
	ConfigurationChangeEvent,
	ConfigurationScope,
	ConfigurationTarget,
	Event,
	EventEmitter,
	ExtensionContext,
	workspace,
} from "vscode";
import { EXTENSION_ID } from "./constants";

export enum ConfigKey {
	AccountId = "general.accountId",
	AccountUrl = "general.accountUrl",
	VaultId = "general.vaultId",
	ItemsCacheValues = "items.cacheValues",
	ItemsPasswordRecipe = "items.passwordRecipe",
	ItemsReplaceWithReference = "items.replaceWithReference",
	EditorSuggestStorage = "editor.suggestStorage",
	DebugEnabled = "debug.enabled",
}

interface ConfigItems {
	[ConfigKey.AccountId]: string;
	[ConfigKey.VaultId]: string;
	[ConfigKey.ItemsReplaceWithReference]: boolean;
	[ConfigKey.EditorSuggestStorage]: boolean;
	[ConfigKey.DebugEnabled]: boolean;
}

class Config {
	public configure(context: ExtensionContext): void {
		context.subscriptions.push(
			workspace.onDidChangeConfiguration(
				this.onConfigurationChanged.bind(this),
				config,
			),
		);
	}

	private _onDidChange = new EventEmitter<ConfigurationChangeEvent>();
	public get onDidChange(): Event<ConfigurationChangeEvent> {
		return this._onDidChange.event;
	}

	private onConfigurationChanged(e: ConfigurationChangeEvent): void {
		if (e.affectsConfiguration(EXTENSION_ID)) {
			this._onDidChange.fire(e);
		}
	}

	public get<T extends ConfigItems[keyof ConfigItems]>(
		section: ConfigKey,
		defaultValue?: T,
		scope?: ConfigurationScope | null,
	): T {
		return defaultValue === undefined
			? workspace.getConfiguration(EXTENSION_ID, scope).get<T>(section)
			: workspace
					.getConfiguration(EXTENSION_ID, scope)
					.get<T>(section, defaultValue);
	}

	public set(
		section: ConfigKey | string,
		value: any,
		target: ConfigurationTarget = ConfigurationTarget.Global,
	): Thenable<void> {
		return workspace
			.getConfiguration(EXTENSION_ID)
			.update(section, value, target);
	}
}

export const config = new Config();
