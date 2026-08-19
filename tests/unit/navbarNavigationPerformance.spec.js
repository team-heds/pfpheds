import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const navbarSource = readFileSync(
  join(process.cwd(), 'src/components/common/utils/Navbar.vue'),
  'utf8',
)

describe('Navbar navigation performance', () => {
  it('réutilise le bootstrap auth au montage', () => {
    expect(navbarSource).toContain('await authStore.initializeAuth()')
    expect(navbarSource).not.toContain('await authStore.checkAuthState()')
  })

  it('ne recharge pas le profil Supabase à chaque changement de route', () => {
    expect(navbarSource).not.toContain('watch(() => route.path')
    expect(navbarSource).not.toContain('await userStore.fetchProfile()')
  })
})
