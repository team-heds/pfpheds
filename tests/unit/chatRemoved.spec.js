import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import appRoutes from '@/router/routes/apps'

describe('retrait du chat', () => {
  it('renvoie l’ancienne adresse vers le feed', () => {
    expect(appRoutes.find((route) => route.path === '/chat').redirect).toBe('/feed')
  })

  it('ne garde plus les écrans du chat', () => {
    expect(existsSync(resolve(process.cwd(), 'src/views/apps/chat'))).toBe(false)
  })
})
