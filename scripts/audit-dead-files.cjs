/**
 * Audit: repere les fichiers .vue / composables / stores jamais references ailleurs.
 * Lecture seule - n'ecrit et ne supprime rien.
 * Usage: node scripts/audit-dead-files.cjs
 */
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'dev-dist']);

function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

const roots = ['src', 'backend', 'documentation/docs'];
const files = [];
for (const r of roots) files.push(...walk(r));

const codeFiles = files.filter((f) => /\.(vue|js|cjs|mjs|ts|json|md)$/.test(f));
const blobs = [];
for (const f of codeFiles) {
  try {
    blobs.push([f, fs.readFileSync(f, 'utf8')]);
  } catch {
    /* ignore */
  }
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function findUnreferenced(candidates) {
  const dead = [];
  for (const c of candidates) {
    const base = path.basename(c).replace(/\.(vue|js)$/, '');
    const re = new RegExp('\\b' + escape(base) + '\\b');
    let found = false;
    for (const [f, txt] of blobs) {
      if (path.resolve(f) === path.resolve(c)) continue;
      if (re.test(txt)) {
        found = true;
        break;
      }
    }
    if (!found) dead.push(c);
  }
  return dead;
}

const vues = files.filter((f) => f.endsWith('.vue'));
const composables = files.filter((f) => f.includes(path.join('src', 'composables')) && f.endsWith('.js'));
const stores = files.filter((f) => f.includes(path.join('src', 'stores')) && f.endsWith('.js'));
const services = files.filter(
  (f) => (f.includes(path.join('src', 'service')) || f.includes(path.join('src', 'services'))) && f.endsWith('.js')
);

function report(label, list) {
  const dead = findUnreferenced(list);
  console.log('\n=== ' + label + ' : ' + dead.length + ' non references / ' + list.length + ' ===');
  dead.sort().forEach((d) => console.log('  ' + d));
}

report('COMPOSANTS .vue', vues);
report('COMPOSABLES', composables);
report('STORES', stores);
report('SERVICES', services);
