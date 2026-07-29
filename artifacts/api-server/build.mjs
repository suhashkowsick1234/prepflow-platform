import fs from 'node:fs';
import * as esbuild from 'esbuild';

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


