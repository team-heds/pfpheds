// Limite le précache de la PWA à la coque de démarrage. Les autres écrans sont mis en cache
// à leur première visite par le service worker (src/sw.js).

export const PRECACHE_BUDGET_BYTES = 6 * 1024 * 1024

const ALWAYS_PRECACHED = ['index.html', 'layout/styles/preloading/preloading.css']
const FONT_FILE = /\.woff2$/i
const HTML_ASSET = /(?:href|src)=["']\.?\/?(assets\/[^"']+\.(?:js|css))["']/g

const cleanPath = (file) => String(file).replace(/^\.?\//, '')

/** Fichiers nécessaires au démarrage : index.html et les imports statiques de son point d'entrée. */
export function collectShellFiles(bundle) {
  const files = new Set(ALWAYS_PRECACHED)
  const pending = Object.values(bundle)
    .filter((item) => item.type === 'chunk' && item.isEntry)
    .map((item) => item.fileName)

  while (pending.length) {
    const fileName = pending.pop()
    if (files.has(fileName)) continue
    const chunk = bundle[fileName]
    if (!chunk || chunk.type !== 'chunk') continue
    files.add(fileName)
    for (const css of chunk.viteMetadata?.importedCss || []) files.add(cleanPath(css))
    pending.push(...chunk.imports)
  }

  const html = bundle['index.html']?.source
  if (html) {
    for (const [, file] of String(html).matchAll(HTML_ASSET)) files.add(file)
  }
  return files
}

export function selectShellEntries(entries, shellFiles) {
  if (!shellFiles.size) throw new Error('Précache PWA : coque de démarrage introuvable.')
  const manifest = entries.filter(({ url }) => shellFiles.has(cleanPath(url)) || FONT_FILE.test(url))
  const size = manifest.reduce((total, entry) => total + (entry.size || 0), 0)
  const warnings = size > PRECACHE_BUDGET_BYTES
    ? [`Précache PWA de ${(size / 1048576).toFixed(1)} Mo, au-dessus du budget de 6 Mo.`]
    : []
  return { manifest, warnings }
}

export function createShellPrecache() {
  let shellFiles = new Set()
  return {
    plugin: {
      name: 'heds-shell-precache',
      apply: 'build',
      writeBundle(_options, bundle) {
        shellFiles = collectShellFiles(bundle)
      },
    },
    transform: async (entries) => selectShellEntries(entries, shellFiles),
  }
}
