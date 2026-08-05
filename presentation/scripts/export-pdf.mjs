import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const presentationRoot = path.resolve(import.meta.dirname, '..')
const viteBin = path.join(presentationRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const outputDir = path.join(presentationRoot, 'dist')
const slugIndex = process.argv.indexOf('--slug')
const slug = slugIndex === -1 ? '' : process.argv[slugIndex + 1] || ''
const deckPath = slug ? `${slug}/` : ''
const filename = slug ? `${slug}.pdf` : 'PFPHEdS-presentation.pdf'
const outputPath = path.join(outputDir, deckPath, filename)
const port = process.env.PRESENTATION_PDF_PORT || '5184'
const url = `http://127.0.0.1:${port}/presentation/${deckPath}?print-pdf`

await mkdir(path.dirname(outputPath), { recursive: true })

const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', port], {
  cwd: presentationRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})

let serverOutput = ''
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

try {
  await waitForServer(url)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.Reveal?.isReady?.())
  await page.emulateMedia({ media: 'print' })
  await page.pdf({
    path: outputPath,
    printBackground: true,
    preferCSSPageSize: true,
    landscape: true,
  })
  await browser.close()

  console.log(`[presentation:pdf] PDF généré: ${outputPath}`)
} finally {
  server.kill()
}

async function waitForServer(targetUrl) {
  const startedAt = Date.now()
  const timeoutMs = 30000

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(targetUrl)
      if (response.ok) return
    } catch {
      // serveur pas encore prêt
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
  }

  throw new Error(`Serveur Vite preview indisponible après ${timeoutMs}ms.\n${serverOutput}`)
}
