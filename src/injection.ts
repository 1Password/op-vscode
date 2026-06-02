import type { TextDocument, Uri } from "vscode";
import { commands, ProgressLocation, window, workspace } from "vscode";
import { COMMANDS, EXTENSION_ID, REGEXP } from "./constants";
import type { Core } from "./core";

export class Injection {
	private activeDocument: TextDocument;

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

					return;
				}

				const preview = "Preview";
				const result = await window.showInformationMessage(
					`Please confirm you'd like to preview the real values in ${document.fileName
						.split("/")
						.pop()}`,
					{
						modal: true,
						detail: "1Password for VS Code",
					},
					preview,
				);

				if (result === preview) {
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
				}
			}),
			workspace.onDidChangeTextDocument(
				async (event) => await this.onDocumentChange(event.document),
			),
			window.onDidChangeActiveTextEditor(async (editor) => {
				this.activeDocument = editor?.document;
				await this.onDocumentChange(this.activeDocument);
			}),
		);

		this.activeDocument = window.activeTextEditor?.document;
		void this.onDocumentChange(this.activeDocument);
	}

	private async onDocumentChange(document: TextDocument) {
		if (!document || document !== this.activeDocument) {
			return;
		}

		const matcher = new RegExp(REGEXP.SECRET_REFERENCE, "gm");
		await commands.executeCommand(
			"setContext",
			`${EXTENSION_ID}.injectable`,
			matcher.test(document.getText()),
		);
	}

	private async injectSecrets(currentDocument: TextDocument) {
		const input = currentDocument.getText();

		// The SDK has no bulk text injection, so we find every secret reference
		// in the document, resolve them in one batch, and substitute the values
		// back into the text.
		const matcher = new RegExp(REGEXP.SECRET_REFERENCE.source, "gm");
		const references = [...new Set(input.match(matcher) ?? [])];

		if (references.length === 0) {
			return;
		}

		const resolved = await this.core.op.execute(async (client) =>
			client.secrets.resolveAll(references),
		);

		if (!resolved) {
			return;
		}

		let result = input;
		for (const reference of references) {
			const response = resolved.individualResponses[reference];
			if (response?.content) {
				result = result.split(reference).join(response.content.secret);
			}
		}

		const injectedDocument = await workspace.openTextDocument({
			language: currentDocument.languageId,
			content: result,
		});

		await window.showTextDocument(injectedDocument, { preview: true });
	}
}
