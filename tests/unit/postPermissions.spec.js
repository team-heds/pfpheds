import { describe, expect, it } from 'vitest'
import { canDeleteComment, canDeletePost, postAuthorId } from '@/service/postPermissions'

const post = { id: 'post-1', IdUser: 'author' }

describe('canDeletePost', () => {
  it('autorise seulement l’auteur de la publication', () => {
    expect(canDeletePost(post, 'author')).toBe(true)
    expect(canDeletePost(post, 'someone-else')).toBe(false)
  })

  it('refuse sans utilisateur, pour un invité ou sans publication enregistrée', () => {
    expect(canDeletePost(post, null)).toBe(false)
    expect(canDeletePost(post, undefined)).toBe(false)
    expect(canDeletePost({ id: 'post-1', IdUser: 'guest-user' }, 'guest-user')).toBe(false)
    expect(canDeletePost({ IdUser: 'author' }, 'author')).toBe(false)
    expect(canDeletePost(null, 'author')).toBe(false)
  })

  it('lit aussi l’auteur d’une ligne brute (user_id)', () => {
    expect(postAuthorId({ user_id: 'author' })).toBe('author')
    expect(canDeletePost({ id: 'post-1', user_id: 'author' }, 'author')).toBe(true)
  })
})

describe('canDeleteComment', () => {
  const comment = { id: 'c1', user_id: 'commenter' }

  it('autorise l’auteur du commentaire', () => {
    expect(canDeleteComment(comment, { userId: 'commenter', postAuthorId: 'author' })).toBe(true)
  })

  it('autorise l’auteur de la publication sur un commentaire reçu', () => {
    expect(canDeleteComment(comment, { userId: 'author', postAuthorId: 'author' })).toBe(true)
  })

  it('refuse toute autre personne', () => {
    expect(canDeleteComment(comment, { userId: 'stranger', postAuthorId: 'author' })).toBe(false)
    expect(canDeleteComment(comment, { userId: 'stranger' })).toBe(false)
  })

  it('refuse sans utilisateur et pour un commentaire encore en envoi', () => {
    expect(canDeleteComment(comment, { userId: null, postAuthorId: null })).toBe(false)
    expect(canDeleteComment({ ...comment, pending: true }, { userId: 'commenter', postAuthorId: 'author' })).toBe(false)
    expect(canDeleteComment({ user_id: 'commenter' }, { userId: 'commenter' })).toBe(false)
  })
})
