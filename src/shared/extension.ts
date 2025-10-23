import pckg from "../../package.json";
import { ExtensionContext } from "vscode";

export const EXTENSION_NAMESPACE = pckg.publisher;
export const EXTENSION_ID = pckg.name;
export const EXTENSION_QUALIFIED_ID = `${EXTENSION_NAMESPACE}.${EXTENSION_ID}`;
export const EXTENSION_VERSION = pckg.version;
export const EXTENSION_DISPLAY_NAME = pckg.displayName;

export function startup(_ctx: ExtensionContext) {
	console.info(
		"=".repeat(20),
		`${EXTENSION_DISPLAY_NAME} v${EXTENSION_VERSION}`,
		"=".repeat(20),
	);
}

export function shutdown() {
	console.info(`Shutting down - ${EXTENSION_DISPLAY_NAME}`);
}
