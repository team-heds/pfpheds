import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('FeedView Supabase', () => {
  it('ne conserve aucun chemin de rendu Firebase legacy', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/views/social/FeedView.vue'),
      'utf8'
    )

    expect(source).toContain('<MainFeedSupabase />')
    expect(source).not.toContain('import MainFeed from')
    expect(source).not.toContain('isSupabaseUser')
  })

  it('écoute les posts et leurs médias et utilise le conteneur central pour le scroll', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/social/library/MainFeedSupabase.vue'),
      'utf8'
    )

    expect(source).toContain("table: 'posts'")
    expect(source).toContain("table: 'post_media'")
    expect(source).toContain('ref="postsContainerRef"')
    expect(source).toContain("postsContainerRef.value?.addEventListener('scroll', handleScroll)")
    expect(source).toContain('scroll-target="window"')
  })
})
