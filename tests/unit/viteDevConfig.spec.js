import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Vite development cache contract', () => {
  it('isolates worktree caches and scans lazy page dependencies up front', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf8')

    expect(config).toContain("cacheDir: '.vite-cache'")
    expect(config).toContain("'primevue/card'")
    expect(config).toContain("'primevue/calendar'")
    expect(config).toContain("'@tiptap/vue-3'")
  })
})
