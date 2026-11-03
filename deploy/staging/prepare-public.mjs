import fs from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {randomBytes} from 'node:crypto'
const run=(command,input)=>execFileSync('ssh',['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','heds-vps',command],{input,encoding:'utf8'})
const existing=run('sudo -n docker exec supabase-caddy-1 cat /etc/caddy/Caddyfile')
if(existing.includes('test.hedsvs.ch'))throw new Error('Le domaine existe déjà dans Caddy : revue nécessaire')
const password=randomBytes(24).toString('base64url')
const hash=run('sudo -n docker exec -i supabase-caddy-1 caddy hash-password',password+'\n').trim()
// HTTP Basic protects the frontend. API routes use the application's bearer
// authentication; Basic cannot share the Authorization header with Supabase.
const block=`\n# HEdS staging — isolated upstream\ntest.hedsvs.ch {\n    header X-Robots-Tag "noindex, nofollow"\n    @frontend {\n        not path /auth/v1/* /rest/v1/* /api/* /storage/v1/* /realtime/v1/*\n    }\n    basic_auth @frontend {\n        equipe ${hash}\n    }\n    reverse_proxy pfpheds-staging-gateway-1:8080\n}\n`
await fs.writeFile(new URL('Caddyfile.public.candidate',import.meta.url),existing+block,{mode:0o600})
await fs.writeFile(new URL('web-access.json',import.meta.url),JSON.stringify({username:'equipe',password,scope:'Accès au frontend de test uniquement'},null,2),{mode:0o600,flag:'wx'})
console.log('Routage public candidat et accès équipe préparés. Aucun rechargement effectué.')
