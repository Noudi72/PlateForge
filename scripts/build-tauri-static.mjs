import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');

const entries = [
  'index.html',
  'styles.css',
  'app.js',
  'sw.js',
  'manifest.json',
  'favicon-32.png',
  'apple-touch-icon.png',
  'app-icon-192.png',
  'app-icon-512.png',
  'Plate Forge Appicon.png',
  'vendor',
  'Fonts',
  'Vorlagen json',
  'Vorlagen Garderobenschilder',
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const entry of entries) {
  const src = path.join(root, entry);
  if (!existsSync(src)) continue;
  await cp(src, path.join(out, entry), {
    recursive: true,
    force: true,
    verbatimSymlinks: true,
  });
}

console.log(`PlateForge static assets copied to ${path.relative(root, out)}/`);
