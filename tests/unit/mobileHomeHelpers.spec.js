import { describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/gamificationHistoryService', () => ({ getGamificationHistory: vi.fn() }))

import { buildFeedFilters, collectHashtags, filterScope, FOR_YOU_FILTER } from '@/mobile/home/feedFilters'
import { buildNotifications } from '@/mobile/home/notificationsService'
import { extractEmbeds, initialsOf, mediaKind, plainTextExcerpt, plainTextToPostHtml, splitPostMedia } from '@/mobile/home/postMedia'

describe('filtres du fil mobile', () => {
  it('propose « Pour toi », puis les communautés, puis les hashtags', () => {
    const filters = buildFeedFilters({ communities: [{ id: 'c1', name: 'BA26' }], hashtags: ['physio'] })
    expect(filters.map((filter) => filter.label)).toEqual(['Pour toi', 'BA26', '#physio'])
    expect(filterScope(filters[0])).toEqual({ communityId: null, filter: { type: null, value: null } })
    expect(filterScope(filters[1]).filter).toEqual({ type: 'community', value: 'c1' })
    expect(filterScope(filters[2]).filter).toEqual({ type: 'hashtag', value: 'physio' })
    expect(FOR_YOU_FILTER.key).toBe('all')
  })

  it('retient les hashtags les plus utilisés', () => {
    const posts = [{ Hashtags: { a: true, b: true } }, { Hashtags: { b: true } }, { Hashtags: null }, {}]
    expect(collectHashtags(posts)).toEqual(['b', 'a'])
    expect(collectHashtags(posts, 1)).toEqual(['b'])
    expect(collectHashtags(null)).toEqual([])
  })
})

describe('médias d’une publication', () => {
  it('reconnaît photos, vidéos, PDF et autres fichiers', () => {
    expect(mediaKind('https://x/photo.JPG?token=1')).toBe('image')
    expect(mediaKind('https://x/clip.mp4')).toBe('video')
    expect(mediaKind('https://x/guide.pdf')).toBe('pdf')
    expect(mediaKind('https://x/notes.docx')).toBe('file')
  })

  it('sépare les visuels des fichiers à ouvrir', () => {
    const { visuals, files } = splitPostMedia(['https://x/a.png', { url: 'https://x/b.mp4' }, 'https://x/mon%20guide.docx', null, 'https://x/c.pdf'])
    expect(visuals.map((item) => item.kind)).toEqual(['image', 'video'])
    expect(files.map((item) => item.name)).toEqual(['mon guide.docx', 'Document PDF'])
  })

  it('repère les liens à intégrer, sans doublon', () => {
    const embeds = extractEmbeds('Voir https://youtu.be/abcdefghijk et https://www.youtube.com/watch?v=abcdefghijk puis https://open.spotify.com/track/xyz')
    expect(embeds).toEqual([
      { kind: 'youtube', src: 'https://www.youtube.com/embed/abcdefghijk' },
      { kind: 'spotify', src: 'https://open.spotify.com/embed/track/xyz' },
    ])
    expect(extractEmbeds('')).toEqual([])
  })

  it('prépare un extrait de texte et des initiales', () => {
    expect(plainTextExcerpt('<p>Bonjour&nbsp;<b>à tous</b></p>')).toBe('Bonjour à tous')
    expect(plainTextExcerpt('a'.repeat(200), 20)).toHaveLength(20)
    expect(initialsOf('eden.mahiet')).toBe('EM')
    expect(initialsOf('Antoine Quarroz')).toBe('AQ')
    expect(initialsOf('')).toBe('?')
  })
})

describe('texte saisi au téléphone', () => {
  it('devient des paragraphes, sans laisser passer de balise', () => {
    expect(plainTextToPostHtml('Bonjour\nà tous\n\n\nSuite <b>ici</b> & là  ')).toBe('<p>Bonjour<br>à tous</p><p>Suite &lt;b&gt;ici&lt;/b&gt; &amp; là</p>')
    expect(plainTextToPostHtml('   ')).toBe('')
    expect(plainTextToPostHtml(null)).toBe('')
  })
})

describe('notifications de l’accueil mobile', () => {
  it('rassemble j’aime, commentaires et points, du plus récent au plus ancien', () => {
    const items = buildNotifications({
      posts: [{ id: 'p1', content: '<p>Atelier de taping</p>' }],
      profiles: [{ user_id: 'u2', display_name: 'Eden Mahiet', avatar_url: 'a.png' }, { user_id: 'u3', forname: 'Liam', family_name: 'Laurier' }],
      likes: [{ post_id: 'p1', user_id: 'u2', created_at: '2026-11-11T10:00:00Z' }],
      comments: [{ id: 'c1', post_id: 'p1', user_id: 'u3', content: 'Super atelier', created_at: '2026-11-11T12:00:00Z' }],
      xp: [{ id: 'x1', label: 'Connexion quotidienne', detail: 'Bravo', points: 5, occurredAt: '2026-11-11T08:00:00Z' }, { id: 'x2', label: 'Sans date', occurredAt: null }],
    })
    expect(items.map((item) => item.kind)).toEqual(['comment', 'like', 'xp'])
    expect(items[0]).toMatchObject({ title: 'Liam Laurier a commenté ta publication', detail: 'Super atelier', postId: 'p1' })
    expect(items[1]).toMatchObject({ title: 'Eden Mahiet a aimé ta publication', detail: 'Atelier de taping', avatarUrl: 'a.png' })
    expect(items[2]).toMatchObject({ title: 'Connexion quotidienne', badge: '+5 XP', postId: null })
  })

  it('reste lisible quand le profil de la personne est inconnu', () => {
    const [item] = buildNotifications({ likes: [{ post_id: 'p1', user_id: 'inconnu', created_at: '2026-11-11T10:00:00Z' }] })
    expect(item.title).toBe('Quelqu’un a aimé ta publication')
  })
})
