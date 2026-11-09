import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const screens = [
  'src/views/admin/soins-infirmiers/DashboardSecretariatSI.vue',
  'src/views/admin/soins-infirmiers/DailyPlanningView.vue',
  'src/views/admin/soins-infirmiers/WorkloadView.vue',
  'src/views/admin/soins-infirmiers/PlanningRemediationView.vue',
  'src/views/admin/soins-infirmiers/SIPostulationCoursesView.vue',
  'src/views/admin/DashboardRMView.vue',
  'src/views/admin/DashboardEnseignantView.vue'
]

const source = file => readFileSync(file, 'utf8')

describe('SI administration visual foundation', () => {
  it.each(screens)('%s opts into the shared SI screen and header language', file => {
    const contents = source(file)

    expect(contents).toContain('class="si-page-header"')
    expect(contents).toContain('subtitle=')
    expect(contents).toContain('icon="pi pi-')
    expect(contents).toContain('si-admin-screen')
  })

  it('loads the SI stylesheet after the platform foundations', () => {
    const main = source('src/main.js')
    const foundationsIndex = main.indexOf("@/assets/styles/platform-foundations.scss")
    const siSystemIndex = main.indexOf("@/assets/styles/si-admin-system.scss")

    expect(foundationsIndex).toBeGreaterThan(-1)
    expect(siSystemIndex).toBeGreaterThan(foundationsIndex)
  })

  it('keeps the shared layer scoped and responsive', () => {
    const styles = source('src/assets/styles/si-admin-system.scss')

    expect(styles).toContain('.si-admin-screen')
    expect(styles).toContain('.si-page-header')
    expect(styles).toContain('@media (max-width: 640px)')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('uses semantic icon accents instead of inline gradients in the secretariat KPIs', () => {
    const secretariat = source('src/views/admin/soins-infirmiers/DashboardSecretariatSI.vue')
    const template = secretariat.slice(0, secretariat.indexOf('<script setup>'))

    expect(template).not.toMatch(/kpi-icon[^>]+linear-gradient/)
  })
})
