import { BuildResult, context, Plugin, PluginBuild } from "esbuild";
import { existsSync, rmSync } from "fs";

const srcPath = "src";
const distPath = "dist";

const args = process.argv.slice(2);
const isProd = process.env.NODE_ENV === "production";
const watch = args.includes("--watch");

const createLoggerPlugin = (name: string): Plugin => {
	return {
		name,
		setup(build: PluginBuild): void {
			build.onEnd((result: BuildResult) => {
				if (result.errors.length) {
					console.error(
						`[${name}] build failed with ${result.errors.length} error(s)`,
					);
				} else {
					console.log(`[${name}] build succeeded`);
				}
			});
		},
	};
};

if (existsSync(distPath)) {
	rmSync(distPath, { recursive: true });
}

(async function () {
	const ctx = await context({
		entryPoints: [`${srcPath}/extension.ts`],
		bundle: true,
		platform: "node",
		external: ["vscode"],
		outfile: `${distPath}/extension.js`,
		minify: isProd,
		plugins: [createLoggerPlugin("extension")],
	});

	if (watch) {
		await ctx.watch();
		process.once("SIGINT", () => ctx.dispose());
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
})().catch(() => process.exit(1));
