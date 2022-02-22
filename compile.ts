import { build, BuildOptions } from 'esbuild';
import { existsSync, rmSync } from 'fs';

const srcPath = 'src';
const distPath = 'dist';

const args = process.argv.slice(2);
const isProd = process.env.NODE_ENV === 'production';
const watch = args.includes('--watch');

const createWatcher = (name: string): BuildOptions['watch'] => {
  if (!watch) return false;
  return {
    onRebuild(error: Error): void {
      if (error) {
        console.error(`[${name}] failed to build:`, error);
      } else {
        console.log(`[${name}] watch build succeeded`);
      }
    },
  };
};

if (existsSync(distPath)) {
  rmSync(distPath, { recursive: true });
}

build({
  entryPoints: [`${srcPath}/extension.ts`],
  bundle: true,
  platform: 'node',
  external: ['vscode'],
  outfile: `${distPath}/extension.js`,
  minify: isProd,
  watch: createWatcher('extension'),
}).catch(() => process.exit(1));
