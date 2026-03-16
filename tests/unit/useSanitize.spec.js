import { describe, it, expect } from 'vitest'
import { sanitizeHtml, useSanitize } from '@/composables/useSanitize'

describe('useSanitize', () => {
  // ─── sanitizeHtml ───
  describe('sanitizeHtml', () => {
    it('retourne chaîne vide pour null/undefined/vide', () => {
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
      expect(sanitizeHtml('')).toBe('')
    })

    it('conserve les balises de formatage autorisées', () => {
      expect(sanitizeHtml('<b>bold</b>')).toContain('<b>')
      expect(sanitizeHtml('<i>italic</i>')).toContain('<i>')
      expect(sanitizeHtml('<strong>strong</strong>')).toContain('<strong>')
      expect(sanitizeHtml('<em>emphasis</em>')).toContain('<em>')
      expect(sanitizeHtml('<u>underline</u>')).toContain('<u>')
    })

    it('conserve les liens avec href', () => {
      const result = sanitizeHtml('<a href="https://example.com">lien</a>')
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('lien')
    })

    it('conserve les images avec src et alt', () => {
      const result = sanitizeHtml('<img src="photo.jpg" alt="photo">')
      expect(result).toContain('src="photo.jpg"')
      expect(result).toContain('alt="photo"')
    })

    it('conserve les listes', () => {
      const html = '<ul><li>item 1</li><li>item 2</li></ul>'
      const result = sanitizeHtml(html)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
    })

    it('conserve les tableaux', () => {
      const html = '<table><tr><td>cell</td></tr></table>'
      const result = sanitizeHtml(html)
      expect(result).toContain('<table>')
      expect(result).toContain('<td>')
    })

    it('conserve les titres h1-h6', () => {
      expect(sanitizeHtml('<h1>titre</h1>')).toContain('<h1>')
      expect(sanitizeHtml('<h3>titre</h3>')).toContain('<h3>')
    })

    it('supprime les balises script (XSS)', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('supprime les événements onclick (XSS)', () => {
      const result = sanitizeHtml('<div onclick="alert(1)">click</div>')
      expect(result).not.toContain('onclick')
    })

    it('supprime les événements onerror sur img (XSS)', () => {
      const result = sanitizeHtml('<img src="x" onerror="alert(1)">')
      expect(result).not.toContain('onerror')
    })

    it('supprime les balises iframe', () => {
      const result = sanitizeHtml('<iframe src="https://evil.com"></iframe>')
      expect(result).not.toContain('<iframe')
    })

    it('supprime les attributs data-*', () => {
      const result = sanitizeHtml('<div data-custom="value">text</div>')
      expect(result).not.toContain('data-custom')
    })

    it('conserve l\'attribut class', () => {
      const result = sanitizeHtml('<span class="highlight">text</span>')
      expect(result).toContain('class="highlight"')
    })

    it('conserve l\'attribut style', () => {
      const result = sanitizeHtml('<span style="color:red">text</span>')
      expect(result).toContain('style="color:red"')
    })

    it('supprime les balises form', () => {
      const result = sanitizeHtml('<form action="/steal"><input type="text"></form>')
      expect(result).not.toContain('<form')
      expect(result).not.toContain('<input')
    })
  })

  // ─── useSanitize composable ───
  describe('useSanitize composable', () => {
    it('retourne sanitizeHtml', () => {
      const { sanitizeHtml: fn } = useSanitize()
      expect(typeof fn).toBe('function')
    })

    it('sanitizeHtml fonctionne via le composable', () => {
      const { sanitizeHtml: fn } = useSanitize()
      expect(fn('<script>alert(1)</script>')).not.toContain('<script>')
      expect(fn('<b>ok</b>')).toContain('<b>')
    })
  })
})
