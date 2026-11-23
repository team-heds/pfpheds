import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const script = fs.readFileSync(path.resolve(__dirname, '../../scripts/deployment/remote.sh'), 'utf8')
// La fonction seule, sans les vérifications du serveur qui l'entourent.
const prune = script.match(/prune_releases\(\) \{[\s\S]*?\n\}\n/)[0]

let dir
afterEach(() => {
  if (dir) fs.rmSync(dir, { recursive: true, force: true })
})

function releasesDir(names) {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'releases-'))
  const now = Date.now() / 1000
  names.forEach((name, index) => {
    const full = path.join(dir, name)
    fs.mkdirSync(full)
    // Du plus ancien au plus récent.
    fs.utimesSync(full, now - (names.length - index) * 600, now - (names.length - index) * 600)
  })
  return dir
}

// Sur macOS, CLICOLOR_FORCE colore la sortie de ls même dans un pipe. Le serveur (GNU ls) l'ignore.
const run = (target, keep) => execFileSync('bash', ['-c', `sudo() { "$@"; }\n${prune}\nprune_releases "$1" "$2"`, 'test', target, String(keep)], { encoding: 'utf8', env: { ...process.env, CLICOLOR_FORCE: undefined } })

describe('déploiement : sauvegardes gardées sur le serveur', () => {
  it('ne garde que les 4 sauvegardes les plus récentes', () => {
    const target = releasesDir(['pfpheds-deploy-a1', 'pfpheds-deploy-b2', 'pfpheds-deploy-c3', 'pfpheds-deploy-d4', 'pfpheds-deploy-e5', 'pfpheds-deploy-f6'])
    expect(run(target, 4)).toMatch(/Anciennes sauvegardes retirées : 2 \(les 4 plus récentes sont gardées\)/)
    expect(fs.readdirSync(target).sort()).toEqual(['pfpheds-deploy-c3', 'pfpheds-deploy-d4', 'pfpheds-deploy-e5', 'pfpheds-deploy-f6'])
  })

  it('ne touche à rien quand il y en a 4 ou moins, ni aux autres dossiers', () => {
    const target = releasesDir(['autre-dossier', 'pfpheds-deploy-a1', 'pfpheds-deploy-b2'])
    expect(run(target, 4)).toBe('')
    expect(fs.readdirSync(target).sort()).toEqual(['autre-dossier', 'pfpheds-deploy-a1', 'pfpheds-deploy-b2'])
  })

  it('au déploiement, la place est faite avant la vérification d’espace (jamais en simple vérification)', () => {
    const early = script.indexOf('prune_releases "$releases" "$((keep_releases - 1))"')
    expect(early).toBeGreaterThan(0)
    expect(early).toBeLessThan(script.indexOf('Espace libre insuffisant'))
    expect(script.slice(script.lastIndexOf('\n', early - 40), early)).toMatch(/if \[\[ "\$mode" == deploy \]\]; then/)
  })

  it('le script réglé à 4, et le ménage seulement après une publication réussie', () => {
    expect(script).toMatch(/^keep_releases=4$/m)
    const prunedAt = script.indexOf('prune_releases "$releases" "$keep_releases"')
    expect(prunedAt).toBeGreaterThan(script.indexOf('caddy reload'))
    expect(prunedAt).toBeLessThan(script.indexOf('Publication effectuée'))
  })
})
