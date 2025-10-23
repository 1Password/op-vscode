import { ExtensionContext } from "vscode";
import { startup, shutdown } from "~/shared";

// Register lightweight features that don’t need Node APIs
// e.g., a Markdown CodeLens or simple completions
export function activate(ctx: ExtensionContext) {
	startup(ctx);
}

export function deactivate() {
	shutdown();
}
