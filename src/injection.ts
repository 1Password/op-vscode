import { inject } from "@1password/1password-js";
import type { TextDocument, Uri } from "vscode";
import { commands, ProgressLocation, window, workspace } from "vscode";
import { COMMANDS, EXTENSION_ID, REGEXP } from "./constants";
import type { Core } from "./core";

export class Injection {
	activeDocument: TextDocument;

	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(COMMANDS.INJECT_SECRETS, async (uri?: Uri) => {
				const document = uri
					? await workspace.openTextDocument(uri)
					: window.activeTextEditor?.document;

				if (!document) {
					await window.showWarningMessage(
						"Couldn't find an active file to inject secrets into.",
					);
				}

				await window.withProgress(
					{
						location: ProgressLocation.Notification,
						cancellable: false,
					},
					async (progress) => {
						progress.report({ message: "Injecting secrets..." });
						return await this.injectSecrets(document);
					},
				);
			}),
		);

		workspace.onDidChangeTextDocument(
			async (event) => await this.onDocumentChange(event.document),
		);

		this.activeDocument = window.activeTextEditor?.document;
		void this.onDocumentChange(this.activeDocument);

		window.onDidChangeActiveTextEditor(async (editor) => {
			this.activeDocument = editor?.document;
			await this.onDocumentChange(this.activeDocument);
		});
	}

	private async onDocumentChange(document: TextDocument) {
		if (!document || document !== this.activeDocument) {
			return;
		}

		const matcher = new RegExp(REGEXP.REFERENCE, "gm");
		await commands.executeCommand(
			"setContext",
			`${EXTENSION_ID}.injectable`,
			matcher.test(document.getText()),
		);
	}

	private async injectSecrets(currentDocument: TextDocument) {
		const input = currentDocument.getText().replace(/"/gm, '\\"');
		const result = await this.core.cli.execute<string>(() => inject(input));

		const injectedDocument = await workspace.openTextDocument({
			language: currentDocument.languageId,
			content: result,
		});

		await window.showTextDocument(injectedDocument, { preview: true });
	}
}
