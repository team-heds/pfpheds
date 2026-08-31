import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('dashboard admin gamification Supabase', () => {
  it('utilise les événements Supabase correspondant aux libellés affichés', () => {
    const backend = source('backend/dashboard/adminDashboardStatsService.js')

    expect(backend).toContain("'user_quest_progress'")
    expect(backend).toContain("'user_badges'")
    expect(backend).toContain("'xp_history'")
    expect(backend).toContain('countDistinct')
    expect(backend).not.toContain("'public.quests.completion_count'")
    expect(backend).not.toContain("'public.gamification_data.total_xp'")
  })

  it('ne charge plus Firebase ni les statistiques de démonstration', () => {
    const dashboard = source('src/components/admin/AdminDashboardGamification.vue')
    const routes = source('src/router/routes/admin.js')
    const dynamicRoutes = source('src/composables/useDynamicRoutes.js')

    expect(dashboard).toContain('fetchGamificationActivity')
    expect(dashboard).not.toContain("@/service/gamificationService'")
    expect(routes).toContain("path: '/admin/gamification/analytics', redirect: '/admin/dashboard-gamification'")
    expect(dynamicRoutes).toContain("'AnalyticsDashboardView'")
  })

  it('garde le dashboard réservé aux rôles acceptés par le backend', () => {
    const routes = source('src/router/routes/admin.js')
    const dashboardRoute = routes.match(/path: '\/admin\/dashboard-gamification'.*?\},/)?.[0] || ''

    expect(dashboardRoute).toContain("'AdminPhysio'")
    expect(dashboardRoute).not.toContain("'house_coach'")
    expect(dashboardRoute).not.toContain("'EnseignantPhysio'")
  })
})
