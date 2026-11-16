import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('page FAQ retirée (décision du 16.11)', () => {
  it('n’a plus ni vue ni adresse : /faq mène à la page « introuvable »', () => {
    // La page s'incluait elle-même (page blanche), n'était reliée à aucun menu et
    // ne contenait presque que du texte de démonstration.
    expect(existsSync(join(process.cwd(), 'src/views/home/FaqView.vue'))).toBe(false)
    expect(readFileSync(join(process.cwd(), 'src/router/routes/pages.js'), 'utf8')).not.toContain("'/faq'")
  })
})
