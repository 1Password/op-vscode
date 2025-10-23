#!/usr/bin/env tsx

import {
	readFileSync,
	writeFileSync,
	readdirSync,
	statSync,
	unlinkSync,
} from "fs";
import { join, basename } from "path";

interface ChangelogEntry {
	date: string;
	type: string;
	description: string;
}

interface ParsedYml {
	type: string;
	description: string;
	tags: string[];
}

interface ChangelogFile {
	filename: string;
	date: string;
	parsed: ParsedYml;
}

/**
 * Updates CHANGELOG.md from YML files in ./changelogs
 */
class ChangelogUpdater {
	private readonly changelogDir = "./changelogs";
	private readonly changelogFile = "./CHANGELOG.md";
	private readonly validTypes = [
		"Added",
		"Changed",
		"Removed",
		"Fixed",
		"Security",
		"Deprecated",
	];

	/**
	 * Main update method
	 */
	update(cleanFlag = false): void {
		// Check if changelogs directory exists
		if (!this.directoryExists(this.changelogDir)) {
			console.error(`Error: ${this.changelogDir} directory not found`);
			process.exit(1);
		}

		// Check if CHANGELOG.md exists
		if (!this.fileExists(this.changelogFile)) {
			console.error(`Error: ${this.changelogFile} not found`);
			process.exit(1);
		}

		console.log("Processing changelog files...");

		// Process YML files
		const changelogFiles = this.processYmlFiles();

		if (changelogFiles.length === 0) {
			console.log(`No changelog files found in ${this.changelogDir}`);
			return;
		}

		// Group entries by date
		const entriesByDate = this.groupEntriesByDate(changelogFiles);

		// Generate new changelog content
		const newContent = this.generateChangelogContent(entriesByDate);

		// Write the new content
		writeFileSync(this.changelogFile, newContent);

		console.log("CHANGELOG.md updated successfully!");

		// Show summary
		this.showSummary(entriesByDate);

		// Clean up YML files if --clean flag was provided
		if (cleanFlag) {
			this.cleanYmlFiles();
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
	 * Check if a file exists
	 */
	private fileExists(path: string): boolean {
		try {
			const stats = statSync(path);
			return stats.isFile();
		} catch {
			return false;
		}
	}

	/**
	 * Extract date from filename (format: YYYY-MM-DD-HHMMSS.yml)
	 */
	private extractDate(filename: string): string {
		const baseName = basename(filename, ".yml");
		const parts = baseName.split("-");
		return parts.slice(0, 3).join("-");
	}

	/**
	 * Parse YML file and extract type, description, and tags
	 */
	private parseYml(filePath: string): ParsedYml {
		const content = readFileSync(filePath, "utf-8");
		const lines = content.split("\n");

		let type = "";
		let description = "";
		const tags: string[] = [];
		let inTags = false;

		for (const line of lines) {
			const trimmedLine = line.trim();

			if (trimmedLine.startsWith("type:")) {
				type = trimmedLine.substring(5).trim();
			} else if (trimmedLine.startsWith("description:")) {
				description = trimmedLine.substring(12).trim();
			} else if (trimmedLine === "tags:") {
				inTags = true;
			} else if (inTags && trimmedLine.startsWith("- ")) {
				const tag = trimmedLine.substring(2).trim();
				if (tag !== "None" && tag.length > 0) {
					tags.push(tag);
				}
			} else if (
				inTags &&
				!trimmedLine.startsWith("- ") &&
				trimmedLine.length > 0
			) {
				// End of tags section
				break;
			}
		}

		return { type, description, tags };
	}

	/**
	 * Process all YML files in the changelogs directory
	 */
	private processYmlFiles(): ChangelogFile[] {
		const files: ChangelogFile[] = [];

		try {
			const entries = readdirSync(this.changelogDir);

			for (const entry of entries) {
				if (entry.endsWith(".yml")) {
					const fullPath = join(this.changelogDir, entry);
					const stats = statSync(fullPath);

					if (stats.isFile()) {
						const date = this.extractDate(entry);
						const parsed = this.parseYml(fullPath);

						files.push({
							filename: entry,
							date,
							parsed,
						});
					}
				}
			}
		} catch (error) {
			console.error(`Error reading changelogs directory:`, error);
			process.exit(1);
		}

		return files;
	}

	/**
	 * Group entries by date
	 */
	private groupEntriesByDate(
		files: ChangelogFile[],
	): Map<string, ChangelogEntry[]> {
		const entriesByDate = new Map<string, ChangelogEntry[]>();

		for (const file of files) {
			const { date, parsed } = file;
			const { type, description, tags } = parsed;

			// Format tags with brackets if they exist
			const tagsString = tags.length > 0 ? `[${tags.join(",")}] ` : "";
			const fullDescription = `${tagsString}${description}`;

			const entry: ChangelogEntry = {
				date,
				type,
				description: fullDescription,
			};

			if (!entriesByDate.has(date)) {
				entriesByDate.set(date, []);
			}
			entriesByDate.get(date)!.push(entry);
		}

		return entriesByDate;
	}

	/**
	 * Generate the new changelog content
	 */
	private generateChangelogContent(
		entriesByDate: Map<string, ChangelogEntry[]>,
	): string {
		// Read the existing CHANGELOG.md and preserve the title
		const existingContent = readFileSync(this.changelogFile, "utf-8");
		const lines = existingContent.split("\n");
		const title = lines[0];

		let newContent = `${title}\n\n`;

		// Get unique dates and sort them in reverse order
		const dates = Array.from(entriesByDate.keys()).sort().reverse();

		// Process each date
		for (const date of dates) {
			newContent += `## ${date}\n\n`;

			const entries = entriesByDate.get(date)!;

			// Group by type for this date
			for (const type of this.validTypes) {
				const typeEntries = entries.filter((entry) => entry.type === type);

				if (typeEntries.length > 0) {
					newContent += `### ${type}\n`;

					for (const entry of typeEntries) {
						if (entry.description.trim()) {
							newContent += `- ${entry.description}\n`;
						}
					}
					newContent += "\n";
				}
			}
		}

		return newContent;
	}

	/**
	 * Show summary of changes
	 */
	private showSummary(entriesByDate: Map<string, ChangelogEntry[]>): void {
		console.log("");
		console.log("Summary:");

		const dates = Array.from(entriesByDate.keys()).sort().reverse();
		for (const date of dates) {
			const count = entriesByDate.get(date)!.length;
			console.log(`  ${date}: ${count} changes`);
		}
	}

	/**
	 * Clean up YML files
	 */
	private cleanYmlFiles(): void {
		console.log(`Cleaning up changelog files in ${this.changelogDir}...`);

		try {
			const entries = readdirSync(this.changelogDir);

			for (const entry of entries) {
				if (entry.endsWith(".yml")) {
					const fullPath = join(this.changelogDir, entry);
					unlinkSync(fullPath);
				}
			}

			console.log("Changelog files cleaned up.");
		} catch (error) {
			console.error("Error cleaning up files:", error);
		}
	}
}

if (require.main === module) {
	const args = process.argv.slice(2);
	const cleanFlag = args.includes("--clean");

	const updater = new ChangelogUpdater();
	updater.update(cleanFlag);
}
