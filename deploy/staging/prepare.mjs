import { randomBytes, createHmac } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

// Creates fresh credentials locally, exclusively. Never reads production .env.
const directory = new URL('./', import.meta.url)
const secret = randomBytes(48).toString('hex')
const password = randomBytes(32).toString('hex')
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
function jwt(role) {
  const content = `${encode({alg:'HS256',typ:'JWT'})}.${encode({role,iss:'supabase',iat:now,exp:now+365*86400})}`
  return `${content}.${createHmac('sha256',secret).update(content).digest('base64url')}`
}
await writeFile(new URL('.env',directory), `STAGING_DB_PASSWORD=${password}\nSTAGING_JWT_SECRET=${secret}\nSTAGING_ANON_KEY=${jwt('anon')}\nSTAGING_SERVICE_ROLE_KEY=${jwt('service_role')}\n`, {flag:'wx',mode:0o600})
await writeFile(new URL('frontend.env',directory), `VITE_SUPABASE_URL=http://localhost:8180\nVITE_SUPABASE_KEY=${jwt('anon')}\nVITE_API_URL=http://localhost:8180\n`, {flag:'wx',mode:0o600})
console.log('Secrets de test créés localement. Aucun secret affiché. Aucun service démarré.')
