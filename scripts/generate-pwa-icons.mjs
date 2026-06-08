/**
 * Génère les icônes PNG PWA depuis public/favicon.svg
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
const svgPath = join(root, 'public', 'favicon.svg');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Installez sharp : npm install -D sharp');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const svg = readFileSync(svgPath);

  await sharp(svg).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'));
  await sharp(svg).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'));
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(join(outDir, 'icon-192-maskable.png'));

  console.log('Icônes PWA écrites dans public/icons/');
}

main();
