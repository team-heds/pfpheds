import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', import.meta.url)))
const accounts = JSON.parse(await fs.readFile(new URL('test-accounts.json', import.meta.url)))
const browser = await chromium.launch({ headless: true })
try {
  for (const account of accounts.slice(0, 2)) {
    const context = await browser.newContext({ httpCredentials: { username: gate.username, password: gate.password, origin: base } })
    const page = await context.newPage()
    const failures = []
    page.on('response', r => { if (r.status() >= 400) failures.push({ status: r.status(), path: new URL(r.url()).pathname }) })
    page.on('pageerror', e => failures.push({ error: e.message }))
    await page.goto(`${base}/home`)
    console.log('LOGIN FIELDS', await page.locator('input').evaluateAll(xs => xs.map(x => ({type:x.type, placeholder:x.placeholder}))))
    await page.locator('input[type=email]').fill(account.email)
    await page.locator('input[type=password]').fill(account.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => !url.pathname.endsWith('/home'), { timeout: 15000 }).catch(() => {})
    console.log(JSON.stringify({ account: account.email, url: page.url(), text: (await page.locator('body').innerText()).slice(0, 9000), failures }))
    if (account.email.startsWith('admin.')) {
      for (const path of ['/admin/formation-pratique/votation-pfp']) {
        await page.goto(base + path)
        await page.waitForLoadState('networkidle').catch(() => {})
        console.log('CONTROLS', await page.getByRole('combobox').evaluateAll(xs => xs.map(x => ({text:x.textContent, label:x.getAttribute('aria-label')}))))
        await page.getByRole('combobox', {name:'Classe',exact:true}).click()
        console.log('CLASSES', await page.getByRole('option').allTextContents())
        await page.getByRole('option', {name:/BA25/}).click()
        await page.getByRole('combobox').nth(1).click()
        console.log('PFPS', await page.getByRole('option').allTextContents())
        await page.getByRole('option', {name:'PFP2',exact:true}).click()
        await page.waitForLoadState('networkidle')
        console.log(JSON.stringify({ path, url: page.url(), text: (await page.locator('body').innerText()).slice(0, 10000), failures }))
      }
    } else {
      for (const path of ['/votation/PFP2', '/admin/formation-pratique/places']) {
        await page.goto(base + path)
        await page.waitForLoadState('networkidle').catch(() => {})
        console.log(JSON.stringify({ path, url: page.url(), text: (await page.locator('body').innerText()).slice(0, 12000), failures }))
      }
    }
    await context.close()
  }
} finally { await browser.close() }
