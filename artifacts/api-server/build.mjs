import { execSync } from 'node:child_process';
import fs from 'node:fs';
import * as esbuild from 'esbuild';

// Build referenced composite projects (lib/api-zod, lib/db) first.
// Their tsconfig.json has composite: true and emitDeclarationOnly: true,
// so tsc -b emits the .d.ts files into each lib's dist/ directory.
// Without this step, esbuild cannot resolve @workspace/* imports.
execSync('tsc -b tsconfig.json', { stdio: 'inherit' });

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
const external = Object.keys(pkg.dependencies || {}).filter(dep => !dep.startsWith('@workspace/'));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  outdir: 'dist',
  external,
  sourcemap: true,
});
