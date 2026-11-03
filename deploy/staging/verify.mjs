import fs from 'node:fs/promises'
import {createClient} from '@supabase/supabase-js'
const env=Object.fromEntries((await fs.readFile(new URL('.env',import.meta.url),'utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)]}))
const url='http://localhost:8180'
const c=createClient(url,env.STAGING_SERVICE_ROLE_KEY,{auth:{persistSession:false}})
const check=({data,error})=>{if(error)throw new Error(error.message);return data}
const institutions=Array.from({length:10},(_,i)=>({InstitutionId:`staging-institution-${i}`,Name:`TEST — Institution ${i+1}`,is_hidden:false}))
check(await c.from('institutions').upsert(institutions,{onConflict:'InstitutionId'}))
const places=Array.from({length:70},(_,i)=>({PlaceId:`staging-place-${i}`,NomPlace:`TEST — Stage ${i+1}`,InstitutionId:institutions[i%10].InstitutionId,PFP2:{2027:1},pfp2_proposition:{2027:1},MSQ:i%3===0,SYSINT:i%3===1,NEUROGER:i%3===2,AIGU:i%3===0,REHAB:i%3===1,AMBU:i%3===2,FR:i%2===0,DE:i%2===1}))
check(await c.from('places').upsert(places,{onConflict:'PlaceId'}))
const creds=JSON.parse(await fs.readFile(new URL('test-accounts.json',import.meta.url),'utf8'))
const admin=createClient(url,env.STAGING_ANON_KEY,{auth:{persistSession:false}})
const session=check(await admin.auth.signInWithPassword(creds[0])).session
const response=await fetch(`${url}/api/resultat-votation/results/PFP2/2027`,{headers:{Authorization:`Bearer ${session.access_token}`}})
const resultReadStatus=response.status
const resultReadError=response.ok?null:(await response.json()).error
const counts=await fetch(`${url}/api/resultat-votation/assignment-counts/PFP2/2027`,{headers:{Authorization:`Bearer ${session.access_token}`}})
if(!counts.ok)throw new Error(`API compte affectations: ${counts.status}`)
const student=createClient(url,env.STAGING_ANON_KEY,{auth:{persistSession:false}})
check(await student.auth.signInWithPassword(creds[1]))
check(await student.from('user_profiles').select('user_id').eq('user_id',creds[1].userId))
const mail=await (await fetch('http://localhost:8025/api/v1/messages')).json()
if(mail.total<1)throw new Error('Email de récupération non capturé')
console.log(JSON.stringify({adminApi:counts.status,resultReadStatus,resultReadError,studentLogin:true,syntheticPlaces:70,syntheticInstitutions:10,capturedEmails:mail.total}))
