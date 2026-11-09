import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const outputDirectory = path.resolve('artifacts', 'votation-frontend')
const viewports = [
  { name: 'cards-mobile', width: 390, height: 1200 },
  { name: 'cards-tablet', width: 834, height: 900 },
]

await fs.mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:6006/iframe.html?id=formation-pratique-votation-cartes-de-places--mobile&viewMode=story')
    await page.locator('.place-card-list').waitFor({ timeout: 15000 })
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      smallTargets: [...document.querySelectorAll('button, a[href]')].flatMap((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44 ? [{ width: Math.round(rect.width), height: Math.round(rect.height), text: element.textContent.trim() }] : []
      })
    }))
    const screenshot = path.join(outputDirectory, `${viewport.name}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({ viewport, screenshot, errors, ...metrics })
    await page.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify(results, null, 2))
