import fs from 'node:fs/promises'
import {chromium} from 'playwright'
const access=JSON.parse(await fs.readFile(new URL('studio-access.json',import.meta.url)))
const browser=await chromium.launch({headless:true})
try{
 const context=await browser.newContext({viewport:{width:1600,height:1000},httpCredentials:{username:access.username,password:access.password,origin:access.url}})
 const page=await context.newPage()
 const failures=[]
 page.on('response',async r=>{if(r.status()>=400)failures.push({status:r.status(),path:new URL(r.url()).pathname,error:(await r.text()).slice(0,600)})})
 await page.goto(access.url+'/project/default')
 await page.getByRole('link',{name:'Table Editor',exact:true}).waitFor({timeout:20000})
 console.log(JSON.stringify({url:page.url(),links:await page.getByRole('link').allTextContents(),failures}))
 await page.getByRole('link',{name:'Table Editor',exact:true}).click()
 await page.mouse.move(1200,500)
 await page.waitForLoadState('networkidle')
 console.log(JSON.stringify({url:page.url(),tablesVisible:await page.getByText('StudentsPhysio',{exact:true}).count(),failures}))
 await page.getByText('StudentsPhysio',{exact:true}).click()
 await page.waitForLoadState('networkidle')
 console.log(JSON.stringify({url:page.url(),gridRows:await page.getByRole('row').count(),failures}))
}finally{await browser.close()}
