#!/usr/bin/env node
/**
 * Prépare les versions allégées (WebP) des photos de la page publique Alp'in Physio.
 *
 * Pour chaque photo citée dans le contenu par défaut, écrit `<photo>.webp` à côté
 * de l'original (1280 px de côté au maximum) et met à jour la liste
 * `src/data/alpinPhysioOptimizedImages.json` lue par l'application.
 * Les originaux ne sont jamais modifiés ni supprimés.
 *
 * Prérequis : l'outil `cwebp` (macOS : `brew install webp`).
 * Usage : node scripts/optimize-alpinphysio-images.mjs
 */
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const photoRoot = path.join(root, 'public/assets/images/heds/AlpinPhysioPhoto')
const manifestPath = path.join(root, 'src/data/alpinPhysioOptimizedImages.json')
const MAX_SIDE = 1280
const MIN_BYTES = 60 * 1024 // en dessous, le gain ne vaut pas un second fichier

const sources = ['src/data/alpinPhysioSiteContent.js', 'src/views/associations/AlpinPhysioView.vue']
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
const cited = [...new Set(sources.match(/JPhotos\/[^'"`]+?\.(?:jpe?g|png)/gi) || [])].sort((a, b) => a.localeCompare(b))

const dimensions = (file) => {
  const result = spawnSync('cwebp', ['-q', '1', '-m', '0', '-o', '/dev/null', file], { encoding: 'utf8' })
  const match = `${result.stderr}${result.stdout}`.match(/Dimension:\s*(\d+)\s*x\s*(\d+)/i)
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

const optimized = []
for (const relative of cited) {
  const source = path.join(photoRoot, relative)
  if (!fs.existsSync(source) || fs.statSync(source).size < MIN_BYTES) continue
  const target = `${source}.webp`
  const size = dimensions(source)
  const resize = size && Math.max(size.width, size.height) > MAX_SIDE
    ? (size.width >= size.height ? ['-resize', String(MAX_SIDE), '0'] : ['-resize', '0', String(MAX_SIDE)])
    : []
  execFileSync('cwebp', ['-quiet', '-q', '76', '-m', '6', ...resize, source, '-o', target])
  const before = fs.statSync(source).size
  const after = fs.statSync(target).size
  if (after >= before * 0.9) { fs.rmSync(target); continue }
  optimized.push(relative)
  console.log(`${String(Math.round(before / 1024)).padStart(5)} Ko → ${String(Math.round(after / 1024)).padStart(4)} Ko  ${relative}`)
}

fs.writeFileSync(manifestPath, `${JSON.stringify(optimized, null, 2)}\n`)
console.log(`${optimized.length} photos allégées, liste écrite dans ${path.relative(root, manifestPath)}`)
