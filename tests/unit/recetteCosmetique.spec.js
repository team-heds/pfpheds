import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { primevueLocaleFr } from '@/config/primevueLocaleFr'
import { defaultOptions } from 'primevue/config'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')

describe('finitions relevées à la recette du 16.11', () => {
  it('écrit « Événements » avec ses accents', () => {
    expect(readSource('src/views/apps/events/EventManagementView.vue')).toContain('<h1 class="title">Événements</h1>')
  })

  it('titre le quiz des maisons dans l’en-tête de l’application mobile', () => {
    const routes = readSource('src/router/routes/profiles.js')
    expect(routes).toMatch(/path: '\/hes-house-quiz'.*meta: \{ requiresAuth: true, title: 'Quiz des maisons' \}/)
  })

  it('ne dessine plus de cadre autour du titre qui reçoit le focus à l’arrivée', () => {
    const css = readSource('src/assets/styles/platform-foundations.scss')
    expect(css).toMatch(/:is\(h1, h2\)\[tabindex="-1"\]:focus-visible \{\s*outline: none !important;/)
  })

  it('affiche les calendriers en français sans changer le format de date', () => {
    expect(primevueLocaleFr.chooseDate).toBe('Choisir la date')
    expect(primevueLocaleFr.monthNames[10]).toBe('novembre')
    expect(primevueLocaleFr.firstDayOfWeek).toBe(1)
    expect(primevueLocaleFr.dateFormat).toBe(defaultOptions.locale.dateFormat)
    // Les clés non traduites restent présentes (PrimeVue remplace l'objet en entier).
    expect(Object.keys(primevueLocaleFr)).toEqual(expect.arrayContaining(Object.keys(defaultOptions.locale)))
    expect(readSource('src/main.js')).toContain('locale: primevueLocaleFr')
  })

  it('propose les réponses du quiz des maisons comme de vrais boutons', () => {
    const quiz = readSource('src/components/user/profile/HESHouseQuiz.vue')
    expect(quiz).toMatch(/<button\s+v-for="\(answer, index\) in currentQuestion\.answers"/)
    expect(quiz).toContain(':aria-pressed="selectedAnswer === answer')
    expect(quiz).not.toMatch(/<div\s+v-for="\(answer, index\) in currentQuestion\.answers"/)
  })

  it.each([
    'src/components/social/library/LeftSidebar.vue',
    'src/components/user/library/CardNameProfile.vue',
    'src/components/user/details/ProfileInfo.vue',
  ])('%s charge l’avatar par défaut au lieu d’une image cassée', (file) => {
    const source = readSource(file)
    expect(source).toContain("import defaultAvatar from '@/assets/images/avatar/01.jpg'")
    expect(source).not.toContain("const defaultAvatar = '@/assets")
  })
})
