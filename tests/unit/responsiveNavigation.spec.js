import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')

describe('responsive navigation contract', () => {
  it('keeps desktop controls centered in the shared shell and adapts the tablet layout', () => {
    const navbar = readSource('src/components/common/utils/Navbar.vue')
    const button = readSource('src/components/ui/buttons/ButtonNavbar.vue')
    const search = readSource('src/components/common/utils/GlobalSearch.vue')

    expect(navbar).toContain('--navbar-control-size: 44px')
    expect(navbar).toContain('padding-inline: clamp(2rem, 8vw, 10rem)')
    expect(navbar).toContain('transform: translateX(-50%)')
    expect(navbar).toContain('@media (min-width: 769px) and (max-width: 900px)')
    expect(navbar).toContain('grid-template-columns: 1fr auto')
    expect(navbar).toContain('grid-column: 1 / -1')
    expect(button).toContain('var(--navbar-control-size, 44px)')
    expect(search).toContain('width: 44px')
    expect(search).toContain('height: 44px')
  })

  it('provides active states and accessible names for icon-only controls', () => {
    const navbar = readSource('src/components/common/utils/Navbar.vue')
    const button = readSource('src/components/ui/buttons/ButtonNavbar.vue')
    const mobile = readSource('src/components/common/utils/MobileBottomNav.vue')

    expect(navbar).toContain(':active="isMenuItemActive(item)"')
    expect(button).toContain(':aria-label="ariaLabel || title"')
    expect(button).toContain(':aria-current="active ? \'page\' : undefined"')
    expect(mobile).toContain(':aria-current="isActive(item) ? \'page\' : undefined"')
    expect(mobile).toContain('min-height: 48px')
  })

  it('uses the global mobile navigation once and resolves profiles from the auth store', () => {
    const app = readSource('src/App.vue')
    const mobile = readSource('src/components/common/utils/MobileBottomNav.vue')
    const socialViews = [
      'src/views/social/FeedView.vue',
      'src/views/social/CommunityInfoView.vue',
      'src/views/social/CommunitiesView.vue',
    ].map(readSource)

    expect(app.match(/<MobileBottomNav/g)).toHaveLength(1)
    expect(mobile).toContain("import { useAuthStore } from '@/stores/authStore'")
    expect(mobile).not.toContain("from 'firebase/auth'")
    for (const view of socialViews) {
      expect(view).not.toContain('<MobileBottomNav')
    }
  })
})
