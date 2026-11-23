import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activeAnnouncement,
  hideAnnouncement,
  holdForToast,
  installToastAnnouncements,
  resetAnnouncements,
  showAnnouncement,
} from '@/utils/announcementQueue'

describe('file d’annonces', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetAnnouncements()
  })
  afterEach(() => {
    resetAnnouncements()
    vi.useRealTimers()
  })

  it('n’affiche qu’une annonce, la plus importante', () => {
    showAnnouncement('install')
    showAnnouncement('update')
    expect(activeAnnouncement.value).toBe('update')
    showAnnouncement('offline')
    expect(activeAnnouncement.value).toBe('offline')
  })

  it('passe à la suivante quand la première disparaît', () => {
    showAnnouncement('install')
    showAnnouncement('update')
    hideAnnouncement('update')
    expect(activeAnnouncement.value).toBe('install')
  })

  it('laisse passer un message éphémère puis reprend', () => {
    showAnnouncement('update')
    holdForToast(3000)
    expect(activeAnnouncement.value).toBe('toast')
    vi.advanceTimersByTime(3000)
    expect(activeAnnouncement.value).toBe('update')
  })

  it('ne bloque jamais les annonces avec un message sans durée', () => {
    showAnnouncement('offline')
    holdForToast(undefined)
    vi.advanceTimersByTime(10000)
    expect(activeAnnouncement.value).toBe('offline')
  })

  it('écoute les messages et se débranche proprement', () => {
    const handlers = new Map()
    const bus = {
      on: (name, handler) => handlers.set(name, handler),
      off: (name) => handlers.delete(name),
    }
    const stop = installToastAnnouncements(bus)
    handlers.get('add')({ life: 2000 })
    expect(activeAnnouncement.value).toBe('toast')
    stop()
    expect(handlers.size).toBe(0)
    expect(activeAnnouncement.value).toBeNull()
  })
})

describe('manifest', () => {
  const config = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8')

  it('a un identifiant stable et des raccourcis', () => {
    expect(config).toContain("id: '/'")
    for (const url of ['/feed', '/institution', '/mobile-search']) expect(config).toContain(`url: '${url}'`)
  })
})
