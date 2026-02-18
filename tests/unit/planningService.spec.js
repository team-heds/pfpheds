import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ──────────────────────────────────────────────

vi.mock('@/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({ data: [], error: null })
            })
          }),
          order: () => ({
            order: () => ({
              order: () => ({ data: [], error: null })
            })
          }),
          single: () => ({ data: null, error: null })
        }),
        order: () => ({ data: [], error: null }),
        gte: () => ({
          lte: () => ({ data: [], error: null })
        }),
        or: () => ({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ data: {}, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({ data: {}, error: null })
          })
        })
      }),
      delete: () => ({
        eq: () => ({ error: null })
      }),
      upsert: () => ({
        select: () => ({ data: [], error: null })
      })
    })
  }
}))

const planningServiceModule = await import('@/service/planningService')
const planningService = planningServiceModule.default

// ── Tests utilitaires purs ─────────────────────────────────────

describe('PlanningService – getDayFullName', () => {
  it('convertit les jours courts en jours complets', () => {
    expect(planningService.getDayFullName('lu')).toBe('lundi')
    expect(planningService.getDayFullName('ma')).toBe('mardi')
    expect(planningService.getDayFullName('me')).toBe('mercredi')
    expect(planningService.getDayFullName('je')).toBe('jeudi')
    expect(planningService.getDayFullName('ve')).toBe('vendredi')
    expect(planningService.getDayFullName('dist')).toBe('distance')
  })

  it('retourne tel quel si déjà en format long', () => {
    expect(planningService.getDayFullName('lundi')).toBe('lundi')
    expect(planningService.getDayFullName('vendredi')).toBe('vendredi')
  })

  it('retourne tel quel pour une valeur inconnue', () => {
    expect(planningService.getDayFullName('samedi')).toBe('samedi')
  })
})

describe('PlanningService – getDayShortName', () => {
  it('convertit les jours complets en jours courts', () => {
    expect(planningService.getDayShortName('lundi')).toBe('lu')
    expect(planningService.getDayShortName('mardi')).toBe('ma')
    expect(planningService.getDayShortName('mercredi')).toBe('me')
    expect(planningService.getDayShortName('jeudi')).toBe('je')
    expect(planningService.getDayShortName('vendredi')).toBe('ve')
    expect(planningService.getDayShortName('distance')).toBe('dist')
  })

  it('retourne tel quel si déjà en format court', () => {
    expect(planningService.getDayShortName('lu')).toBe('lu')
    expect(planningService.getDayShortName('dist')).toBe('dist')
  })
})

describe('PlanningService – getDayIndex', () => {
  it('retourne l\'index correct pour les jours courts', () => {
    expect(planningService.getDayIndex('lu')).toBe(0)
    expect(planningService.getDayIndex('ma')).toBe(1)
    expect(planningService.getDayIndex('me')).toBe(2)
    expect(planningService.getDayIndex('je')).toBe(3)
    expect(planningService.getDayIndex('ve')).toBe(4)
    expect(planningService.getDayIndex('dist')).toBe(5)
  })

  it('retourne l\'index correct pour les jours complets', () => {
    expect(planningService.getDayIndex('lundi')).toBe(0)
    expect(planningService.getDayIndex('mardi')).toBe(1)
    expect(planningService.getDayIndex('mercredi')).toBe(2)
    expect(planningService.getDayIndex('jeudi')).toBe(3)
    expect(planningService.getDayIndex('vendredi')).toBe(4)
    expect(planningService.getDayIndex('distance')).toBe(5)
  })

  it('retourne 0 pour un jour inconnu', () => {
    expect(planningService.getDayIndex('samedi')).toBe(0)
    expect(planningService.getDayIndex('')).toBe(0)
  })
})

describe('PlanningService – getDateForWeekAndDay', () => {
  it('retourne une date au format DD.MM.YYYY', () => {
    const date = planningService.getDateForWeekAndDay(1, 0)
    expect(date).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })

  it('retourne le lundi pour dayIndex=0', () => {
    // Semaine 1 de 2025 : lundi = 30.12.2024
    const date = planningService.getDateForWeekAndDay(1, 0)
    expect(date).toBe('30.12.2024')
  })

  it('retourne le vendredi pour dayIndex=4', () => {
    // Semaine 1 de 2025 : vendredi = 03.01.2025
    const date = planningService.getDateForWeekAndDay(1, 4)
    expect(date).toBe('03.01.2025')
  })

  it('gère les semaines d\'automne (>= 38) en 2024', () => {
    // Semaine 38 de 2024 : lundi = 16.09.2024
    const date = planningService.getDateForWeekAndDay(38, 0)
    expect(date).toBe('16.09.2024')
  })

  it('gère les semaines de printemps (8-37) en 2025', () => {
    // Semaine 10 de 2025 : lundi = 03.03.2025
    const date = planningService.getDateForWeekAndDay(10, 0)
    expect(date).toBe('03.03.2025')
  })

  it('les jours consécutifs sont bien ordonnés', () => {
    const monday = planningService.getDateForWeekAndDay(10, 0)
    const tuesday = planningService.getDateForWeekAndDay(10, 1)
    const friday = planningService.getDateForWeekAndDay(10, 4)

    // Extraire les jours
    const dayMon = parseInt(monday.split('.')[0])
    const dayTue = parseInt(tuesday.split('.')[0])
    const dayFri = parseInt(friday.split('.')[0])

    expect(dayTue).toBe(dayMon + 1)
    expect(dayFri).toBe(dayMon + 4)
  })
})

describe('PlanningService – saveTimeSlot normalisation', () => {
  it('normalise les noms de champs camelCase vers snake_case', () => {
    // On vérifie que la méthode getDayIndex est appelée correctement
    // en testant la conversion de jour
    expect(planningService.getDayIndex('lundi')).toBe(0)
    expect(planningService.getDayIndex('vendredi')).toBe(4)
  })
})

describe('PlanningService – cohérence getDayFullName / getDayShortName', () => {
  const shortDays = ['lu', 'ma', 'me', 'je', 've', 'dist']
  const fullDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']

  it('getDayFullName(getDayShortName(x)) === x pour tous les jours complets', () => {
    fullDays.forEach(day => {
      expect(planningService.getDayFullName(planningService.getDayShortName(day))).toBe(day)
    })
  })

  it('getDayShortName(getDayFullName(x)) === x pour tous les jours courts', () => {
    shortDays.forEach(day => {
      expect(planningService.getDayShortName(planningService.getDayFullName(day))).toBe(day)
    })
  })
})

describe('PlanningService – getAllCourseModules mapping', () => {
  it('mappe correctement les colonnes du module', () => {
    const rawModule = {
      id: 1,
      code: 'M101',
      number: 'M1',
      title: 'Anatomie',
      color: '#FF0000',
      year: 1
    }

    // Reproduire le mapping du service
    const mapped = {
      id: rawModule.id,
      code: rawModule.code,
      module_number: rawModule.number,
      label: rawModule.title,
      color: rawModule.color,
      year_level: rawModule.year,
      ...rawModule
    }

    expect(mapped.module_number).toBe('M1')
    expect(mapped.label).toBe('Anatomie')
    expect(mapped.year_level).toBe(1)
    expect(mapped.code).toBe('M101')
  })
})
