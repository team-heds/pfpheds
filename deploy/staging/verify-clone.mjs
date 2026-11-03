import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
function sql(container,db,query){return execFileSync('ssh',['-o','BatchMode=yes','heds-vps',`sudo -n docker exec -i ${container} psql -X -v ON_ERROR_STOP=1 -U postgres -d ${db} -At`],{input:query,encoding:'utf8',maxBuffer:10*1024*1024}).trim()}
const tables=sql('supabase-db-1','postgres',"SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname IN ('public','gamification_private') AND tablename NOT IN ('push_subscriptions','push_outbox') ORDER BY 1").split('\n')
const query=tables.map(t=>{const name=t.split('.').map(s=>'"'+s.replaceAll('"','""')+'"').join('.'); return `SELECT '${t}',count(*),md5(coalesce(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),'')) FROM ${name} t;`}).join('\n')
const source=sql('supabase-db-1','postgres',query).split('\n')
const copy=sql('pfpheds-staging-db-1','staging_real_20260915',query).split('\n')
const differences=source.filter((s,i)=>s!==copy[i]).map(s=>s.split('|')[0])
await fs.writeFile(new URL('clone-verification.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),source,copy,differences},null,2),{mode:0o600})
console.log(JSON.stringify({tablesCompared:tables.length,differences}))
if(differences.length)process.exit(1)
const accountQuery="SELECT json_build_object('email',email,'role',role) FROM public.user_profiles WHERE role='admin' AND email IS NOT NULL ORDER BY CASE WHEN email ILIKE '%antoine%' THEN 0 ELSE 1 END,email LIMIT 1; SELECT json_build_object('email',email,'role',role) FROM public.user_profiles WHERE role='EtudiantPhysio' AND email IS NOT NULL ORDER BY email LIMIT 1;"
const accounts=sql('pfpheds-staging-db-1','staging_real_20260915',accountQuery).split('\n').map(JSON.parse)
const path=new URL('real-test-access.json',import.meta.url)
const credentials=JSON.parse(await fs.readFile(path))
await fs.writeFile(path,JSON.stringify({...credentials,verificationAccounts:accounts},null,2),{mode:0o600})
console.log('Private account references saved; original role data unchanged.')
