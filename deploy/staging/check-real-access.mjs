import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const base='https://test.hedsvs.ch'
const creds=JSON.parse(await fs.readFile(new URL('real-test-access.json',import.meta.url)))
const gate=JSON.parse(await fs.readFile(new URL('web-access.json',import.meta.url)))
const env=Object.fromEntries((await fs.readFile(new URL('.env',import.meta.url),'utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)]}))
const browser=await chromium.launch({headless:true})
try {
  for(const account of creds.verificationAccounts){
    const response=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.STAGING_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:creds.password})})
    assert.equal(response.status,200,`Auth ${account.role}`)
    const session=await response.json()
    const headers={apikey:env.STAGING_ANON_KEY,Authorization:`Bearer ${session.access_token}`}
    const profile=await fetch(base+'/rest/v1/user_profiles?select=role&user_id=eq.'+session.user.id,{headers})
    assert.equal(profile.status,200)
    assert.equal((await profile.json())[0].role,account.role)
    const api=await fetch(base+'/api/resultat-votation/assignment-counts/PFP2/2027',{headers})
    assert.equal(api.status,account.role==='admin'?200:403)
    const context=await browser.newContext({httpCredentials:{username:gate.username,password:gate.password,origin:base}})
    const page=await context.newPage()
    await page.goto(base+'/home')
    await page.locator('input[type=email]').fill(account.email)
    await page.locator('input[type=password]').fill(creds.password)
    await page.getByRole('button',{name:'Se connecter',exact:true}).click()
    await page.waitForURL(url=>!url.pathname.endsWith('/home'),{timeout:20000})
    await page.goto(base+'/admin/formation-pratique/places')
    await page.waitForLoadState('networkidle')
    if(account.role==='admin'){
      assert.equal(new URL(page.url()).pathname,'/admin/formation-pratique/places')
      await page.getByText('Places totales',{exact:true}).waitFor()
    }else assert.equal(new URL(page.url()).pathname,'/access')
    console.log(JSON.stringify({role:account.role,login:200,profileRolePreserved:true,adminApi:api.status,browserAccessVerified:true}))
    await context.close()
  }
}finally{await browser.close()}
