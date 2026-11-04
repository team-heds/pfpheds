import fs from 'node:fs/promises'
import {chromium} from 'playwright'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const access=JSON.parse(await fs.readFile(new URL('real-test-access.json',import.meta.url)))
const gate=JSON.parse(await fs.readFile(new URL('web-access.json',import.meta.url)))
const base='https://test.hedsvs.ch'
const env=Object.fromEntries((await fs.readFile(new URL('.env',import.meta.url),'utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]}))
const sql=q=>execFileSync('ssh',['-o','BatchMode=yes','heds-vps','sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At'],{input:q,encoding:'utf8'}).trim()
const execute=process.argv.includes('--execute')
let sessionId
const report={label:'TEST — PFP2 BA25 — 2026-2027',votes:0,closed:false}
const browser=await chromium.launch({headless:true})
try {
 const context=await browser.newContext({viewport:{width:1500,height:1000},httpCredentials:{username:gate.username,password:gate.password,origin:base}})
 const page=await context.newPage()
 const failures=[]
 page.on('response',r=>{if(r.status()>=400)failures.push({status:r.status(),path:new URL(r.url()).pathname})})
 await page.goto(base+'/home')
 await page.locator('input[type=email]').fill(access.verificationAccounts.find(a=>a.role==='admin').email)
 await page.locator('input[type=password]').fill(access.password)
 await page.getByRole('button',{name:'Se connecter',exact:true}).click()
 await page.waitForURL(u=>u.pathname!='/home')
 await page.goto(base+'/admin/formation-pratique/votation-pfp')
 await page.getByRole('combobox',{name:'Classe',exact:true}).click()
 await page.getByRole('option',{name:/BA25/}).click()
 await page.getByRole('combobox').nth(1).click()
 await page.getByRole('option',{name:'PFP2',exact:true}).click()
 await page.waitForLoadState('networkidle')
 console.log(JSON.stringify({phase:'preflight',summary:(await page.locator('body').innerText()).split('Vue par Étudiants')[0],failures}))
 if(execute){
  assert.equal(sql("SELECT count(*) FROM student_votes WHERE pfp_type='PFP2' AND year IN ('2027','2026-2027');"),'0','Existing votes must not be overwritten')
  const students=JSON.parse(sql("SELECT json_agg(t) FROM (SELECT u.email,p.user_id FROM user_profiles p JOIN auth.users u ON p.user_id=u.id WHERE p.classe='BA25' AND p.role='EtudiantPhysio' ORDER BY p.user_id LIMIT 3) t;"))
  assert.equal(students.length,3)
  await page.getByRole('button',{name:'Lancer la votation',exact:true}).click()
  const inserted=page.waitForResponse(r=>r.url().includes('/rest/v1/votation_sessions')&&r.request().method()==='POST')
  await page.getByRole('dialog').getByRole('button',{name:'Lancer la votation',exact:true}).click()
  const created=await inserted
  assert.equal(created.status(),201)
  const record=await created.json()
  sessionId=Array.isArray(record)?record[0].id:record.id
  assert.ok(sessionId)
  report.sessionId=sessionId
  await fs.writeFile(new URL('votation-test-private.json',import.meta.url),JSON.stringify({sessionId,students},null,2),{mode:0o600})
  console.log(JSON.stringify({phase:'opened',sessionId}))
  for(const student of students){
   const ctx=await browser.newContext({viewport:{width:1800,height:1100},httpCredentials:{username:gate.username,password:gate.password,origin:base}})
   const p=await ctx.newPage()
   p.on('pageerror',e=>console.log(JSON.stringify({phase:'studentPageError',message:e.message})))
   p.on('response',r=>{if(r.status()>=400)console.log(JSON.stringify({phase:'studentHttpError',status:r.status(),path:new URL(r.url()).pathname}))})
   p.on('response',async r=>{if(r.url().includes('/rest/v1/votation_sessions')){const b=await r.json().catch(()=>null);console.log(JSON.stringify({phase:'studentSessionRead',status:r.status(),count:Array.isArray(b)?b.length:null}))}})
   await p.goto(base+'/home')
   await p.locator('input[type=email]').fill(student.email)
   await p.locator('input[type=password]').fill(access.password)
   await p.getByRole('button',{name:'Se connecter',exact:true}).click()
   await p.waitForURL(u=>u.pathname!='/home')
   await p.goto(base+'/votation/PFP2')
   await p.waitForLoadState('networkidle')
   console.log(JSON.stringify({phase:'studentState',state:await p.evaluate(()=>{
    for(const el of document.querySelectorAll('*')){let c=el.__vueParentComponent;while(c){if(c.type?.name==='VotationGenericView'){const v=c.proxy;return {pfp:v.targetPFP,year:v.selectedYear,loading:v.loading,sessionLoading:v.sessionLoading,places:v.places?.length,expanded:v.expandedPFPData?.length,storePlaces:v.placesStore?.places?.length}}c=c.parent}}
    return null
   })}))
   const rows=p.getByRole('row').filter({has:p.getByRole('radio')})
   console.log(JSON.stringify({phase:'studentForm',studentIndex:report.votes+1,url:p.url(),choiceRows:await rows.count(),headings:await p.getByRole('heading').allTextContents(),buttons:await p.getByRole('button').allTextContents()}))
   assert.ok(await rows.count()>=5,'At least five choices must be available')
   for(let rank=0;rank<5;rank++)await rows.nth(rank).getByRole('radio').nth(rank).check()
   const saved=p.waitForResponse(r=>r.url().includes('/rpc/upsert_student_vote')&&r.request().method()==='POST')
   await p.getByRole('button',{name:'Envoyer mon vote',exact:true}).click()
   const response=await saved
   console.log(JSON.stringify({phase:'saveVote',status:response.status()}))
   assert.equal(response.status(),200,'Vote submission must succeed')
   report.votes++
   await ctx.close()
  }
  page.on('dialog',d=>d.accept())
  await page.getByRole('button',{name:/Fermer la votation/}).click()
  await page.waitForLoadState('networkidle')
  await page.reload()
  await page.getByRole('combobox',{name:'Classe',exact:true}).click()
  await page.getByRole('option',{name:/BA25/}).click()
  await page.getByRole('combobox').nth(1).click()
  await page.getByRole('option',{name:'PFP2',exact:true}).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button',{name:'Démarrer',exact:true}).click()
  await page.waitForLoadState('networkidle')
  report.algorithmPreview=await page.getByText('Aperçu non validé',{exact:true}).count()>0
  report.failures=failures
  console.log(JSON.stringify({phase:'algorithm',...report}))
 }
}finally{
 if(sessionId){
  const closed=await fetch(base+'/rest/v1/votation_sessions?id=eq.'+sessionId,{method:'PATCH',headers:{apikey:env.STAGING_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.STAGING_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({status:'closed',closed_at:new Date().toISOString()})})
  report.closed=closed.ok
  console.log(JSON.stringify({phase:'finalSafetyClosure',...report}))
 }
 await browser.close()
}
