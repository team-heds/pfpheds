import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const env=Object.fromEntries((await fs.readFile(new URL('.env',import.meta.url),'utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]}))
const text=execFileSync('ssh',['heds-vps','sudo -n docker exec -i pfpheds-staging-db-1 psql -X -U postgres -d staging -At'],{input:"SELECT json_build_object('bucket',bucket_id,'name',name) FROM storage.objects;",encoding:'utf8'})
const files=text.trim().split('\n').filter(Boolean).map(JSON.parse)
let verified=0
for(const file of files){
  const path=[file.bucket,...file.name.split('/')].map(encodeURIComponent).join('/')
  const r=await fetch('https://test.hedsvs.ch/storage/v1/object/authenticated/'+path,{headers:{apikey:env.STAGING_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.STAGING_SERVICE_ROLE_KEY}})
  assert.equal(r.status,200,'Copied storage object must be readable')
  await r.arrayBuffer()
  verified++
}
console.log(JSON.stringify({storageObjects:files.length,readableCopies:verified}))
