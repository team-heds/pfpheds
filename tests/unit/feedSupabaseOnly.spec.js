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
    // Sur téléphone, c'est le bloc principal de la page qui défile, pas la fenêtre.
    expect(source).toContain('scroll-target="page"')
  })

  it('publie depuis le bureau et le mobile par le même service, qui appelle la gamification POST', () => {
    const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    const service = read('src/service/postPublishService.js')
    expect(service).toContain("import gamificationIntegration from '@/service/gamificationIntegration'")
    expect(service).toContain("action: 'post'")
    expect(service).toContain('targetId: inserted.id')

    for (const file of [
      'src/components/social/library/CreateContentMobile.vue',
      'src/components/social/library/MainFeedSupabase.vue'
    ]) {
      const source = read(file)
      expect(source).toContain("import { publishPost } from '@/service/postPublishService'")
      expect(source).not.toMatch(/firebase/i)
    }
  })

  it('le composer n’affiche plus de bouton anglais « Choose »', () => {
    const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    for (const file of [
      'src/components/social/library/CreatePostDialog.vue',
      'src/components/social/library/PostComposer.vue'
    ]) {
      const source = read(file)
      expect(source).not.toContain('FileUpload')
      expect(source).not.toMatch(/\bChoose\b/)
    }
  })

  it('les commentaires ne rapportent aucun XP', () => {
    const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
    for (const file of [
      'src/components/social/library/PostItem.vue',
      'src/components/social/library/PostComments.vue',
      'src/composables/usePostComments.js',
      'src/service/postCommentsService.js'
    ]) {
      expect(read(file)).not.toMatch(/gamification/i)
    }
  })
})
