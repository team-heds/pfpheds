import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const src = path.resolve(root, 'documentation', 'build');
const dest = path.resolve(root, 'dist', 'docs');

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = fs.readlinkSync(srcPath);
      fs.symlinkSync(link, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(src)) {
  console.error('[copy-docs-to-dist] Docusaurus build introuvable:', src);
  console.error('Astuce: exécutez d\'abord "npm run docs:build"');
  process.exit(1);
}

if (!fs.existsSync(path.resolve(root, 'dist'))) {
  fs.mkdirSync(path.resolve(root, 'dist'), { recursive: true });
}

console.log('[copy-docs-to-dist] Copie des docs vers dist/docs ...');
copyDir(src, dest);
console.log('[copy-docs-to-dist] Terminé:', dest);
