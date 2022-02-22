import path from "path";
import {
	commands,
	Position,
	ProgressLocation,
	TextDocument,
	Uri,
	window,
	workspace,
	WorkspaceEdit,
} from "vscode";
import { COMMANDS, EXTENSION_ID } from "../constants";
import { execute } from "../utils";
import { FieldInputType, Vault, VaultFile, VaultItem } from "./cli";
import { Core } from "./core";
import { createSecretReference, safeReferenceValue } from "./items";

type EditableKind = "document" | "attachment" | "note";

export class Editable {
	activeDocument: TextDocument;

	public constructor(private core: Core) {
		this.core.context.subscriptions.push(
			commands.registerCommand(
				COMMANDS.GET_EDITABLE,
				async () => await this.launchEditable(),
			),
			commands.registerCommand(COMMANDS.SAVE_EDITABLE, async (uri?: Uri) => {
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
						progress.report({ message: "Saving file..." });
						return await this.saveEditable(document);
					},
				);
			}),
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

		const params = new URLSearchParams(document.uri.query);
		await commands.executeCommand(
			"setContext",
			`${EXTENSION_ID}.vaultFile`,
			params.has("editableKind"),
		);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private async launchEditable(): Promise<void> {
		if (!this.core.cli.valid) {
			return;
		}

		const vaultId = this.core.vaultId;
		if (!vaultId) {
			await window.showErrorMessage(
				'You must choose a vault before looking up editable items. When you want to choose an account run the "1Password: Choose vault" command.',
			);
			return;
		}

		const activeWorkspace = workspace.workspaceFolders?.[0];
		if (!activeWorkspace) {
			await window.showErrorMessage(
				"You must open a workspace before you can edit files",
			);
			return;
		}

		const itemValue = await window.showInputBox({
			title:
				"Enter the name or ID of a document, secure note, or item with attachment:",
			ignoreFocusOut: true,
		});
		if (!itemValue) {
			return;
		}

		const vaultItem = await this.core.cli.execute<VaultItem>("GetItem", {
			args: [itemValue],
		});
		if (!vaultItem) {
			return;
		}

		const itemCategory = vaultItem.category.toLowerCase();
		let editableKind: EditableKind;
		let content: string;
		let fileName: string;

		if (itemCategory === "secure_note") {
			editableKind = "note";
			fileName = vaultItem.title;
			content = vaultItem.fields.find(
				(field) => field.label === "notesPlain",
			)?.value;
		} else {
			if (!vaultItem.files || vaultItem.files.length === 0) {
				await window.showErrorMessage(`No files found for ${vaultItem.title}`);
				return;
			}

			let fileId: string;
			if (vaultItem.files.length === 1) {
				fileId = vaultItem.files[0].id;
			} else {
				const selected = await window.showQuickPick(
					vaultItem.files.map((file) => ({
						label: file.name,
						description: file.id,
					})),
					{
						title:
							"This item has multiple files. Which one do you want to open?",
					},
				);

				if (!selected) {
					return;
				}

				fileId = selected.description;
			}

			if (!fileId) {
				return;
			}

			const index = vaultItem.files.findIndex((file) => file.id === fileId);
			fileName = vaultItem.files[index].name;
			editableKind =
				vaultItem.category.toLowerCase() === "document" && index === 0
					? "document"
					: "attachment";

			if (editableKind === "document") {
				content = await this.core.cli.execute<VaultFile>("GetDocument", {
					args: [vaultItem.id],
					format: false,
				});
			} else {
				const vault = await this.core.cli.execute<Vault>("GetVault", {
					args: [this.core.vaultId],
				});
				const vaultValue = safeReferenceValue(vault.name, vault.id);

				const file = vaultItem.files.find((f) => f.id === fileId);
				content = await this.core.cli.execute<VaultFile>("GetSecret", {
					args: [createSecretReference(vaultValue, vaultItem, file)],
					format: false,
				});
			}
		}

		if (!content || content.length === 0) {
			await window.showErrorMessage(
				"Couldn't find the editable content of this vault item",
			);
			return;
		}

		const documentUri = Uri.from({
			scheme: "untitled",
			path: path.join(activeWorkspace.uri.fsPath, fileName),
			query: new URLSearchParams({
				editableKind,
				itemId: vaultItem.id,
				fileName,
			}).toString(),
		});
		const document = await workspace.openTextDocument(documentUri);

		const edit = new WorkspaceEdit();
		edit.insert(documentUri, new Position(0, 0), content);
		await workspace.applyEdit(edit);

		await window.showTextDocument(document, { preview: false });

		await window.showInformationMessage(
			"You can edit this file and save it to your workspace, or click the Save icon in the top right to save it back to your vault.",
		);
	}

	private async saveEditable(document: TextDocument): Promise<void> {
		const content = document.getText().replace(/"/gm, '\\"');
		const params = new URLSearchParams(document.uri.query);
		const editable = params.get("editableKind") as EditableKind;

		switch (editable) {
			case "document":
				const command = await this.core.cli.execute<string>("EditDocument", {
					args: [params.get("itemId"), "-"],
					options: {
						"file-name": params.get("fileName"),
					},
					asString: true,
				});
				execute([`echo "${content}" | ${command}`]);
				break;
			case "attachment":
				throw new Error("Not implemented");
				break;
			case "note":
				await this.core.cli.execute<VaultItem>("EditItem", {
					args: [
						params.get("itemId"),
						["notesPlain", FieldInputType.Text, content],
					],
				});
				break;
		}

		await Promise.resolve();
	}
}
