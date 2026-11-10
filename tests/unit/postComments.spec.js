import { describe, expect, it } from 'vitest'
import {
  MAX_COMMENT_LENGTH,
  buildCommentThreads,
  formatRelativeTime,
  formatRepliesLabel,
  formatViewCommentsLabel,
  normalizeCommentText,
  removeCommentTree,
  resolveReplyTarget,
  upsertComments,
  validateCommentText
} from '@/service/postComments'

const NOW = Date.parse('2026-11-10T12:00:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()
const MIN = 60 * 1000

describe('formatRelativeTime', () => {
  it('écrit une date relative courte, façon Instagram', () => {
    expect(formatRelativeTime(ago(10 * 1000), NOW)).toBe('à l’instant')
    expect(formatRelativeTime(ago(5 * MIN), NOW)).toBe('il y a 5 min')
    expect(formatRelativeTime(ago(3 * 60 * MIN), NOW)).toBe('il y a 3 h')
    expect(formatRelativeTime(ago(2 * 24 * 60 * MIN), NOW)).toBe('il y a 2 j')
    expect(formatRelativeTime(ago(15 * 24 * 60 * MIN), NOW)).toBe('il y a 2 sem')
  })

  it('passe à la date au-delà de 5 semaines, avec l’année si elle diffère', () => {
    expect(formatRelativeTime('2026-08-01T10:00:00Z', NOW)).toMatch(/^1(er)? août$/)
    expect(formatRelativeTime('2025-03-12T10:00:00Z', NOW)).toMatch(/12 mars 2025/)
  })

  it('accepte un horodatage numérique, ignore les dates futures et invalides', () => {
    expect(formatRelativeTime(NOW - 2 * MIN, NOW)).toBe('il y a 2 min')
    expect(formatRelativeTime(NOW + 10 * MIN, NOW)).toBe('à l’instant')
    expect(formatRelativeTime('pas une date', NOW)).toBe('')
    expect(formatRelativeTime(null, NOW)).toBe('')
  })
})

describe('libellés', () => {
  it('« Voir les N commentaires »', () => {
    expect(formatViewCommentsLabel(1)).toBe('Voir le commentaire')
    expect(formatViewCommentsLabel(2)).toBe('Voir les 2 commentaires')
    expect(formatViewCommentsLabel(1234)).toMatch(/^Voir les 1['’\s]234 commentaires$/)
  })

  it('réponses au singulier et au pluriel', () => {
    expect(formatRepliesLabel(1)).toBe('1 réponse')
    expect(formatRepliesLabel(3)).toBe('3 réponses')
  })
})

describe('validation du texte', () => {
  it('refuse un commentaire vide ou trop long', () => {
    expect(normalizeCommentText('  Bravo  ')).toBe('Bravo')
    expect(validateCommentText('   ')).toMatch(/Écrivez/)
    expect(validateCommentText('x'.repeat(MAX_COMMENT_LENGTH + 1))).toMatch(/dépasse/)
    expect(validateCommentText(' Bravo ')).toBeNull()
  })
})

describe('fils de discussion', () => {
  const rows = [
    { id: 'r1', parent_id: 'c1', created_at: ago(1 * MIN) },
    { id: 'c2', parent_id: null, created_at: ago(2 * MIN) },
    { id: 'c1', parent_id: null, created_at: ago(10 * MIN) },
    { id: 'r0', parent_id: 'c1', created_at: ago(5 * MIN) },
    { id: 'orphan', parent_id: 'disparu', created_at: ago(3 * MIN) }
  ]

  it('range les commentaires du plus ancien au plus récent, réponses sous leur parent', () => {
    const threads = buildCommentThreads(rows)
    expect(threads.map((t) => t.id)).toEqual(['c1', 'orphan', 'c2'])
    expect(threads[0].replies.map((r) => r.id)).toEqual(['r0', 'r1'])
  })

  it('répond toujours au commentaire de premier niveau', () => {
    expect(resolveReplyTarget({ id: 'c1', parent_id: null, display_name: 'Léa' })).toEqual({ parentId: 'c1', mention: 'Léa' })
    expect(resolveReplyTarget({ id: 'r1', parent_id: 'c1', display_name: 'Tom' })).toEqual({ parentId: 'c1', mention: 'Tom' })
  })

  it('retire un commentaire avec ses réponses et sait les remettre', () => {
    const { list, removed } = removeCommentTree(rows, 'c1')
    expect(removed.map((c) => c.id).sort()).toEqual(['c1', 'r0', 'r1'])
    expect(list.map((c) => c.id).sort()).toEqual(['c2', 'orphan'])
    expect(upsertComments(list, removed)).toHaveLength(rows.length)
  })

  it('remplace la version optimiste par celle du serveur sans doublon', () => {
    const list = upsertComments([], [{ id: 'x', content: 'Salut', pending: true, created_at: ago(0) }])
    const next = upsertComments(list, [{ id: 'x', content: 'Salut', pending: false, created_at: ago(0) }])
    expect(next).toHaveLength(1)
    expect(next[0].pending).toBe(false)
  })
})
