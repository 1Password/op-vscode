#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface ChangelogFile {
	path: string;
	content: string;
	hasPublicTrue: boolean;
	publicLine?: string;
}

/**
 * Validates changelog files in the changelogs/ directory
 * Checks that all changelog files have 'public: true'
 */
class ChangelogValidator {
	private readonly changelogsDir = "changelogs";
	private readonly validExtensions = [".yml", ".yaml"];
	private validationFailed = false;

	/**
	 * Main validation method
	 */
	validate(): void {
		console.log("Validating changelog files...");

		// Check if changelogs directory exists
		if (!this.directoryExists(this.changelogsDir)) {
			console.error("Error: changelogs directory does not exist");
			process.exit(1);
		}

		// Find all changelog files
		const changelogFiles = this.findChangelogFiles();

		if (changelogFiles.length === 0) {
			console.error("No changelog files found in changelogs/ directory");
			console.error(
				"Please add at least one changelog file in the /changelogs directory",
			);
			console.error("Each changelog file must have 'public: true' set");
			process.exit(1);
		}

		console.log("Found changelog files:");
		changelogFiles.forEach((file) => console.log(file.path));
		console.log("");

		// Validate each changelog file
		for (const file of changelogFiles) {
			this.validateFile(file);
		}

		if (this.validationFailed) {
			console.error("Changelog validation failed");
			process.exit(1);
		} else {
			console.log("All changelog files are valid");
		}
	}

	/**
	 * Check if a directory exists
	 */
	private directoryExists(path: string): boolean {
		try {
			const stats = statSync(path);
			return stats.isDirectory();
		} catch {
			return false;
		}
	}

	/**
	 * Find all changelog files in the changelogs directory
	 */
	private findChangelogFiles(): ChangelogFile[] {
		const files: ChangelogFile[] = [];

		try {
			const entries = readdirSync(this.changelogsDir);

			for (const entry of entries) {
				const fullPath = join(this.changelogsDir, entry);
				const stats = statSync(fullPath);

				if (stats.isFile() && this.isChangelogFile(entry)) {
					try {
						const content = readFileSync(fullPath, "utf-8");
						const hasPublicTrue = this.hasPublicTrue(content);
						const publicLine = this.extractPublicLine(content);

						files.push({
							path: fullPath,
							content,
							hasPublicTrue,
							publicLine,
						});
					} catch (error) {
						console.error(`Error reading file ${fullPath}:`, error);
						this.validationFailed = true;
					}
				}
			}
		} catch (error) {
			console.error(`Error reading changelogs directory:`, error);
			this.validationFailed = true;
		}

		return files.sort((a, b) => a.path.localeCompare(b.path));
	}

	/**
	 * Check if a file is a changelog file based on extension
	 */
	private isChangelogFile(filename: string): boolean {
		return this.validExtensions.some((ext) =>
			filename.toLowerCase().endsWith(ext),
		);
	}

	/**
	 * Check if content has 'public: true' (case sensitive, exact match)
	 */
	private hasPublicTrue(content: string): boolean {
		return content.includes("public: true");
	}

	/**
	 * Extract the public line from content
	 */
	private extractPublicLine(content: string): string | undefined {
		const lines = content.split("\n");
		const publicLine = lines.find((line) => line.trim().startsWith("public:"));
		return publicLine?.trim();
	}

	/**
	 * Validate a single changelog file
	 */
	private validateFile(file: ChangelogFile): void {
		console.log(`Checking file: ${file.path}`);

		if (!file.hasPublicTrue) {
			console.error(`Error: File ${file.path} does not have public: true`);
			if (file.publicLine) {
				console.error(`Current public line: ${file.publicLine}`);
			} else {
				console.error("Current public line: not found");
			}
			this.validationFailed = true;
		} else {
			console.log(`File ${file.path} is valid (public: true)`);
		}
		console.log("");
	}
}

if (require.main === module) {
	const validator = new ChangelogValidator();
	validator.validate();
}
