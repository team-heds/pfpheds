import fs from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import {execFileSync} from 'node:child_process'
const password=randomBytes(24).toString('base64url')
const hash=execFileSync('ssh',['-o','BatchMode=yes','heds-vps','sudo -n docker exec -i pfpheds-staging-gateway-1 caddy hash-password'],{input:password+'\n',encoding:'utf8'}).trim()
await fs.writeFile(new URL('studio-access.json',import.meta.url),JSON.stringify({url:'http://localhost:8181',username:'studio-test',password,note:'Administration de la base de TEST uniquement, tunnel SSH requis.'},null,2),{mode:0o600,flag:'wx'})
await fs.writeFile(new URL('studio-private.caddy',import.meta.url),`:8181 {\n    header X-Robots-Tag "noindex, nofollow"\n    basic_auth {\n        studio-test ${hash}\n    }\n    reverse_proxy studio:3000\n}\n`,{mode:0o600,flag:'wx'})
console.log('Private Studio access generated.')
