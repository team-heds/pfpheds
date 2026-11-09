import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'

const root = process.cwd()
const origin=process.env.STAGING_PUBLIC_ORIGIN || 'http://localhost:8180'
if(!['http://localhost:8180','https://test.hedsvs.ch'].includes(origin))throw new Error('Origine de test non autorisée')
const output = await fs.mkdtemp(path.join(os.tmpdir(),'heds-staging-'))
const ssh = command => execFileSync('ssh',['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','heds-vps',command],{maxBuffer:32*1024*1024})
const env = Object.fromEntries((await fs.readFile('deploy/staging/.env','utf8')).trim().split('\n').map(s=>{const i=s.indexOf('=');return [s.slice(0,i),s.slice(i+1)]}))
for (const name of ['compose.yml','Caddyfile','.env']) await fs.copyFile(`deploy/staging/${name}`,path.join(output,name))
await fs.chmod(path.join(output,'.env'),0o600)
const excluded = new Set(['node_modules','.git','.codex','.codex-tmp','.agents','dist','outputs','presentation','documentation','backend','deploy'])
const build = path.join(output,'build')
await fs.cp(root,build,{recursive:true,filter:source=>{
  const relative=path.relative(root,source)
  if (!relative) return true
  const parts=relative.split(path.sep)
  return !excluded.has(parts[0]) && !parts.some(p=>p.startsWith('.env'))
}})
// Shared domain module is needed by the frontend; no backend secrets copied.
await fs.cp(path.join(root,'backend/domain'),path.join(build,'backend/domain'),{recursive:true})
await fs.symlink(path.join(root,'node_modules'),path.join(build,'node_modules'))
const buildEnv=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('VITE_')))
Object.assign(buildEnv,{VITE_SUPABASE_URL:origin,VITE_SUPABASE_KEY:env.STAGING_ANON_KEY,VITE_API_URL:`${origin}/api`,VITE_BACKEND_URL:origin})
execFileSync('npm',['run','build'],{cwd:build,env:buildEnv,stdio:'inherit'})
await fs.rename(path.join(build,'dist'),path.join(output,'frontend-dist'))
await fs.cp(path.join(root,'backend'),path.join(output,'backend'),{recursive:true,filter:source=>!path.relative(path.join(root,'backend'),source).split(path.sep).some(p=>p==='node_modules'||p.startsWith('.env')||p==='firebasedata')})
await fs.writeFile(path.join(output,'schema.sql'),ssh('sudo -n docker exec supabase-db-1 pg_dump -U postgres -d postgres --schema-only --no-owner'),{mode:0o600})
await fs.writeFile(path.join(output,'migration-history.sql'),ssh('sudo -n docker exec supabase-db-1 pg_dump -U postgres -d postgres --data-only --no-owner -t auth.schema_migrations -t auth.schema_migration -t storage.migrations'),{mode:0o600})
// No personal rows, Auth credentials, storage objects or notification queues.
const archive=path.join(output,'staging.tar.gz')
execFileSync('tar',['-czf',archive,'compose.yml','Caddyfile','.env','backend','frontend-dist','schema.sql','migration-history.sql'],{cwd:output})
console.log(`STAGING_PACKAGE=${output}`)
