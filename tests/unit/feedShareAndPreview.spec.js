import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { postShareUrl, sharePostLink } from '@/utils/postShare'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')

describe('partager une publication (recette du 16.11)', () => {
  it('donne un lien vers le fil, jamais vers /posts/<id> qui n’existe pas', () => {
    expect(postShareUrl('https://hedsvs.ch')).toBe('https://hedsvs.ch/feed')
    expect(postShareUrl('https://test.hedsvs.ch/')).toBe('https://test.hedsvs.ch/feed')
    const post = readSource('src/components/social/library/PostItem.vue')
    expect(post).not.toContain('/posts/${')
    expect(post).not.toContain('alert(')
    expect(post).toContain('sharePostLink(')
  })

  it('ouvre la feuille de partage du système quand elle existe', async () => {
    const nav = { share: vi.fn().mockResolvedValue(), clipboard: { writeText: vi.fn() } }
    await expect(sharePostLink({ title: 'T', text: 'T', url: 'https://hedsvs.ch/feed' }, nav)).resolves.toBe('shared')
    expect(nav.share).toHaveBeenCalledWith({ title: 'T', text: 'T', url: 'https://hedsvs.ch/feed' })
    expect(nav.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('ne signale rien quand la personne referme la feuille de partage', async () => {
    const nav = { share: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })), clipboard: { writeText: vi.fn() } }
    await expect(sharePostLink({ url: 'u' }, nav)).resolves.toBe('cancelled')
  })

  it('copie le texte et le lien sinon, et prévient si c’est impossible', async () => {
    const nav = { clipboard: { writeText: vi.fn().mockResolvedValue() } }
    await expect(sharePostLink({ text: 'Publication de A', url: 'https://hedsvs.ch/feed' }, nav)).resolves.toBe('copied')
    expect(nav.clipboard.writeText).toHaveBeenCalledWith('Publication de A\nhttps://hedsvs.ch/feed')
    await expect(sharePostLink({ url: 'u' }, {})).resolves.toBe('unavailable')
  })
})

describe('composer sur téléphone : aperçu des photos', () => {
  it('garde l’aperçu visible sous le texte au lieu de le pousser sous la barre d’outils', () => {
    const screen = readSource('src/mobile/home/CreateScreen.vue')
    expect(screen).toContain(":class=\"{ 'has-media': media.length }\"")
    expect(screen).toMatch(/\.m-create__post\.has-media \.m-create__text \{\s*flex-grow: 0;/)
    // La hauteur du champ est mesurée sans l'étirement flex, puis remesurée à chaque photo.
    expect(screen).toContain("el.style.flexGrow = '0'")
    expect(screen).toContain('watch(() => media.value.length, () => nextTick(autoGrow))')
  })
})
