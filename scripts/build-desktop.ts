import { type BuildOptions, context } from "esbuild";

const isWatch = process.argv.includes("--watch");
const isProd = process.env.NODE_ENV === "production";

const config: BuildOptions = {
	entryPoints: ["src/desktop/extension.ts"],
	bundle: true,
	platform: "node",
	format: "cjs",
	outfile: "dist/desktop/extension.js",
	external: ["vscode"],
	sourcemap: !isProd,
	logLevel: "warning",
	alias: {
		"~/shared": "src/shared/index.ts",
	},
};

const run = async () => {
	const ctx = await context(config);
	if (isWatch) {
		console.log("Watching for file changes...");
		await ctx.watch();
	} else {
		await ctx.rebuild().then(() => ctx.dispose());
	}
};

void run();
