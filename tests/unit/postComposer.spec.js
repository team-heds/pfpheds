import { describe, expect, it } from 'vitest'
import {
  MAX_MEDIA_BYTES,
  MAX_POST_MEDIA,
  canPublishPost,
  describePublishError,
  extractPostTags,
  plainTextFromHtml,
  previewKind,
  safeStorageFileName,
  validateComposerFiles
} from '@/service/postComposer'

const file = (name, type, size = 1000) => ({ name, type, size })

describe('texte de la publication', () => {
  it('lit le texte visible du contenu de l’éditeur', () => {
    expect(plainTextFromHtml('<p>Bonjour</p><p>à&nbsp;tous</p>')).toBe('Bonjour à tous')
    expect(plainTextFromHtml('<p></p>')).toBe('')
  })

  it('détecte hashtags et mentions, accents compris', () => {
    expect(extractPostTags('<p>Stage #santé avec @lea_m et #PFP2</p>')).toEqual({
      hashtags: { santé: true, PFP2: true },
      mentions: { lea_m: true }
    })
  })

  it('publie avec du texte ou au moins un média', () => {
    expect(canPublishPost('<p> </p>', 0)).toBe(false)
    expect(canPublishPost('<p></p>', 1)).toBe(true)
    expect(canPublishPost('<p>Salut</p>', 0)).toBe(true)
  })
})

describe('médias joints', () => {
  it('accepte photos, vidéos MP4 et PDF ; refuse le reste avec un message', () => {
    const { accepted, errors } = validateComposerFiles([
      file('photo.jpg', 'image/jpeg'),
      file('clip.mov', 'video/quicktime'),
      file('doc.pdf', 'application/pdf')
    ])
    expect(accepted.map((f) => f.name)).toEqual(['photo.jpg', 'doc.pdf'])
    expect(errors).toEqual([expect.stringMatching(/clip\.mov.*format/)])
  })

  it('refuse un fichier trop lourd', () => {
    const { accepted, errors } = validateComposerFiles([file('lourd.png', 'image/png', MAX_MEDIA_BYTES + 1)])
    expect(accepted).toEqual([])
    expect(errors[0]).toMatch(/lourd\.png.*10 Mo/)
  })

  it(`limite à ${MAX_POST_MEDIA} médias, en comptant ceux déjà joints`, () => {
    const files = Array.from({ length: 3 }, (_, i) => file(`p${i}.png`, 'image/png'))
    const { accepted, errors } = validateComposerFiles(files, MAX_POST_MEDIA - 1)
    expect(accepted).toHaveLength(1)
    expect(errors).toEqual([`${MAX_POST_MEDIA} médias au maximum par publication.`])
  })

  it('nettoie les noms de fichiers pour le stockage', () => {
    expect(safeStorageFileName('Photo été 2026 (1).JPG')).toBe('Photo-ete-2026-1.JPG')
    expect(safeStorageFileName('../../etc/passwd')).toBe('etc-passwd')
    expect(safeStorageFileName('')).toBe('media')
  })

  it('choisit le type d’aperçu', () => {
    expect(previewKind('image/png')).toBe('image')
    expect(previewKind('video/mp4')).toBe('video')
    expect(previewKind('application/pdf')).toBe('file')
  })
})

describe('messages d’erreur', () => {
  it('traduit les erreurs courantes en français', () => {
    expect(describePublishError(new Error('new row violates row-level security policy'))).toMatch(/Reconnectez-vous/)
    expect(describePublishError(new TypeError('Failed to fetch'))).toMatch(/réseau/)
    expect(describePublishError(new Error('Payload too large'))).toMatch(/trop lourd/)
    expect(describePublishError(new Error('???'))).toMatch(/Réessayez/)
  })
})
