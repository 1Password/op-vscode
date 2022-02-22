import { spawnSync } from "child_process";
import { DEBUG } from "./constants";
import { logger } from "./logger";

export const execute = (command: string[]): string | null => {
	const [cmd, ...args] = command;

	if (DEBUG) {
		logger.logDebug("Executing command:", `${cmd} ${args.join(" ")}`);
	}

	const result = spawnSync(cmd, args, {
		shell: true,
		stdio: ["inherit", "pipe", "pipe"],
	});

	if (result.error) {
		logger.logError("Could not execute command", result.error);
		throw new Error(result.error.message);
	}

	const stderr = result.stderr.toString();
	if (stderr.length > 0) {
		const error = new Error(stderr);
		logger.logError(`Command resulted in exit code ${result.status}`, error);
		throw error;
	}

	return result.stdout.toString().trim();
};

export const titleCase = (value: string): string =>
	value.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
	);

export const endWithPunctuation = (value: string): string =>
	/[!,.:?]/.test(value.charAt(value.length - 1)) ? value : `${value}.`;

export const combineRegexp = (...values: RegExp[]) => {
	// De-dupe flags
	let flags = values.map((regexp) => regexp.flags).join("");
	flags = [...new Set(flags)].join("");
	return new RegExp(values.map((regexp) => regexp.source).join("|"), flags);
};
