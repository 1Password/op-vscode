import { Disposable, languages } from "vscode";
import { config } from "./configuration";
import type { Core } from "./core";
import { provideCodeLenses } from "./language-providers/code-lens";
import { provideDocumentLinks } from "./language-providers/document-link";
import { provideHover } from "./language-providers/hover";

export class Editor {
	private subscriptions: Disposable[] = [];

	public constructor(private core: Core) {
		this.configure();

		config.onDidChange(this.configure.bind(this));
	}

	private configure(): void {
		for (const subscription of this.subscriptions) {
			subscription.dispose();
		}

		this.subscriptions = [
			languages.registerCodeLensProvider(
				{ scheme: "file" },
				{
					provideCodeLenses,
				},
			),
			languages.registerDocumentLinkProvider(
				{ scheme: "file" },
				{
					provideDocumentLinks,
				},
			),
			languages.registerHoverProvider(
				{ scheme: "file" },
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					provideHover: provideHover.bind(this.core),
				},
			),
		];

		this.core.context.subscriptions.push(...this.subscriptions);
	}
}
