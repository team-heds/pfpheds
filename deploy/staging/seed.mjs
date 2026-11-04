import fs from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
const env=Object.fromEntries((await fs.readFile(new URL('.env',import.meta.url),'utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)]}))
const url='http://localhost:8180'
const client=createClient(url,env.STAGING_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const check = ({data,error})=>{if(error)throw new Error(error.message);return data}
const accounts=check(await client.auth.admin.listUsers({perPage:1000})).users
if(accounts.some(u=>!u.email?.endsWith('@example.invalid')))throw new Error('Arrêt : compte non fictif détecté')
const credentials=new URL('test-accounts.json',import.meta.url)
let saved=[]
try {saved=JSON.parse(await fs.readFile(credentials,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
for(let i=0;i<=63;i++){
  const email=i===0?'admin.test@example.invalid':`ba25.test.${String(i).padStart(2,'0')}@example.invalid`
  let user=accounts.find(u=>u.email===email)
  if(!user){
    const password=randomBytes(18).toString('base64url')
    user=check(await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{forname:i===0?'Admin':'Étudiant test',family_name:String(i)}})).user
    saved.push({email,password,userId:user.id})
    await fs.writeFile(credentials,JSON.stringify(saved,null,2),{mode:0o600})
  }
  check(await client.from('user_profiles').upsert({user_id:user.id,email,forname:i===0?'Admin test':'Étudiant test',family_name:String(i),display_name:`TEST ${i}`,role:i===0?'admin':'etudiant',is_active:true,classe:i===0?null:'BA25',permissions:i===0?['admin','page1.access']:['student']}))
  if(i>0)check(await client.from('StudentsPhysio').upsert({user_id:user.id,year:'2027',class:'BA25',sae:i===1?1:0,cas_particulier:i===2,lese:i===3,pfp_valided:[],repondant_hes:'Répondant fictif'},{onConflict:'user_id,year'}))
}
const login=createClient(url,env.STAGING_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const admin=saved.find(x=>x.email==='admin.test@example.invalid')
if(!admin)throw new Error('Mot de passe admin local absent')
check(await login.auth.signInWithPassword(admin))
const profiles=check(await login.from('user_profiles').select('user_id'))
check(await login.auth.resetPasswordForEmail(admin.email,{redirectTo:`${url}/reset-password`}))
const health=await fetch(`${url}/api/health`)
console.log(JSON.stringify({accounts:64,adminLogin:true,visibleProfiles:profiles.length,recoveryRequested:true,backendHealthStatus:health.status,credentials:'deploy/staging/test-accounts.json'}))
