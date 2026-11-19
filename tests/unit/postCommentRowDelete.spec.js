import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PostCommentRow from '@/components/social/library/PostCommentRow.vue'

const comment = {
  id: 'c1',
  user_id: 'commenter',
  display_name: 'Anthony Exemple',
  content: 'Bravo',
  created_at: '2026-11-19T10:00:00Z'
}

function mountRow(props) {
  return mount(PostCommentRow, {
    props: { comment, now: Date.parse('2026-11-19T10:05:00Z'), ...props },
    global: { stubs: { 'router-link': { template: '<a><slot /></a>' } } }
  })
}

const deleteButton = (wrapper) => wrapper.findAll('.comment-action').find((b) => b.text().startsWith('Supprimer'))

describe('PostCommentRow : suppression', () => {
  it('ne propose « Supprimer » que si le commentaire est supprimable', () => {
    expect(deleteButton(mountRow({ deletable: false }))).toBeUndefined()
    // Ancien usage (own seul) : plus suffisant, la règle passe par deletable.
    expect(deleteButton(mountRow({ own: true }))).toBeUndefined()
    expect(deleteButton(mountRow({ deletable: true }))).toBeDefined()
  })

  it('nomme le commentaire visé pour les lecteurs d’écran', () => {
    expect(deleteButton(mountRow({ deletable: true, own: true })).text()).toBe('Supprimer mon commentaire')
    expect(deleteButton(mountRow({ deletable: true })).text()).toBe('Supprimer le commentaire écrit par Anthony Exemple')
  })

  it('annonce les réponses qui partent avec le commentaire', () => {
    expect(mountRow({ deletable: true, confirming: true }).find('.comment-confirm').text()).toContain('Supprimer ?')
    expect(mountRow({ deletable: true, confirming: true, replyCount: 2 }).find('.comment-confirm').text()).toContain(
      'Supprimer avec 2 réponses ?'
    )
  })
})
