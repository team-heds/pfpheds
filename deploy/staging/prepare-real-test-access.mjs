import fs from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import {execFileSync} from 'node:child_process'

// Fixed OFFLINE target. Never accepts a production DB target.
const target='staging_real_20260915'
const runSql = sql => execFileSync('ssh',['-o','BatchMode=yes','heds-vps',`sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d ${target} -At`],{input:sql,encoding:'utf8',stdio:['pipe','pipe','pipe']})
const file=new URL('real-test-access.json',import.meta.url)
const password=randomBytes(24).toString('base64url')
await fs.writeFile(file,JSON.stringify({url:'https://test.hedsvs.ch',password,note:'Mot de passe commun uniquement pour les comptes copies dans le test. Utiliser leur email habituel. Acces limite au reseau autorise.'},null,2),{mode:0o600,flag:'wx'})
try {
  runSql(`BEGIN;
    SET LOCAL session_replication_role = replica;
    UPDATE auth.users SET encrypted_password = crypt('${password}', gen_salt('bf')),
      confirmation_token='', recovery_token='', email_change_token_new='',
      email_change_token_current='', reauthentication_token='', phone_change_token='',
      email_change='',phone_change='', email_confirmed_at=coalesce(email_confirmed_at,now()),
      is_sso_user=false, aud=coalesce(nullif(aud,''),'authenticated');
    UPDATE public.votation_sessions SET status='closed' WHERE status <> 'closed';
    COMMIT;`)
  const checks=runSql(`SELECT json_build_object('accounts',count(*),'shared_password_matches',count(*) FILTER (WHERE encrypted_password=crypt('${password}',encrypted_password))) FROM auth.users;
    SELECT json_build_object('sessions',(SELECT count(*) FROM auth.sessions),'refresh_tokens',(SELECT count(*) FROM auth.refresh_tokens),'mfa',(SELECT count(*) FROM auth.mfa_factors),'push_subscriptions',(SELECT count(*) FROM public.push_subscriptions),'push_outbox',(SELECT count(*) FROM public.push_outbox),'open_votations',(SELECT count(*) FROM public.votation_sessions WHERE status <> 'closed'));`)
  console.log(checks)
} catch {
  console.error('Preparation failed. Offline candidate must not be published. Credentials file retained privately for diagnosis.')
  process.exit(1)
}
