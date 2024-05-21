import type { ConfigurationChangeEvent, Event, ExtensionContext } from "vscode";
import { EventEmitter, workspace } from "vscode";
import { CONFIG_NAMESPACE } from "./constants";

export enum ConfigKey {
	ItemsCacheValues = "items.cacheValues",
	ItemsPasswordRecipe = "items.passwordRecipe",
	ItemsUseSecretReferences = "items.useSecretReferences",
	EditorSuggestStorage = "editor.suggestStorage",
	DebugEnabled = "debug.enabled",
}

interface ConfigItems {
	[ConfigKey.ItemsCacheValues]: boolean;
	[ConfigKey.ItemsPasswordRecipe]: string;
	[ConfigKey.ItemsUseSecretReferences]: boolean;
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

	/* eslint-disable-next-line @typescript-eslint/naming-convention */
	private _onDidChange = new EventEmitter<ConfigurationChangeEvent>();
	public get onDidChange(): Event<ConfigurationChangeEvent> {
		return this._onDidChange.event;
	}

	private onConfigurationChanged(e: ConfigurationChangeEvent): void {
		if (e.affectsConfiguration(CONFIG_NAMESPACE)) {
			this._onDidChange.fire(e);
		}
	}

	public get<T extends ConfigItems[keyof ConfigItems]>(section: ConfigKey): T {
		return workspace.getConfiguration(CONFIG_NAMESPACE).get<T>(section);
	}

	public set(section: ConfigKey | string, value: any): Thenable<void> {
		return workspace.getConfiguration(CONFIG_NAMESPACE).update(section, value);
	}
}

export const config = new Config();
