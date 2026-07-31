import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const source = path.join(root, 'presentation', 'dist')
const target = path.join(root, 'dist', 'presentation')

if (!fs.existsSync(source)) {
  console.error('[copy-presentation-to-dist] presentation/dist introuvable. Lancez npm run presentation:build avant la copie.')
  process.exit(1)
}

fs.rmSync(target, { recursive: true, force: true })
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.cpSync(source, target, { recursive: true })

console.log(`[copy-presentation-to-dist] Présentation copiée vers ${path.relative(root, target)}`)
