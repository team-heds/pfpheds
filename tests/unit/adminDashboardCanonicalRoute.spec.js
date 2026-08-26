import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')

describe('admin dashboard canonical route', () => {
  it('redirige la route historique vers le dashboard canonique', () => {
    const routes = read('src/router/routes/admin.js')
    expect(routes).toContain("path: '/admin/dashboard-general', redirect: '/admin'")
    expect(routes).not.toContain("import('@/components/admin/AdminDashboardGeneral.vue')")
  })

  it('utilise une seule source de statistiques et aucune donnée aléatoire dans le chemin actif', () => {
    const dashboard = read('src/views/admin/DashboardView.vue')
    const comparison = read('src/components/admin/widgets/PeriodComparisonPanel.vue')
    expect(dashboard.match(/useAdminDashboardStats\(/g)).toHaveLength(1)
    expect(dashboard).not.toContain('dashboardQuickStatsService')
    expect(`${dashboard}\n${comparison}`).not.toContain('Math.random')
  })
})
