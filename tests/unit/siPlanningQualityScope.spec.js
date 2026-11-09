import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('SI planning quality academic-year scope', () => {
  it('loads one planning snapshot scoped by active class aliases in both SI dashboards', () => {
    const secretariat = readFileSync('src/views/admin/soins-infirmiers/DashboardSecretariatSI.vue', 'utf8')
    const rm = readFileSync('src/views/admin/DashboardRMView.vue', 'utf8')

    expect(secretariat).toContain('fetchPlanningSlotsPaginated({ classCodes: activeClassCodes.value })')
    expect(secretariat).toContain('planningSlotsSnapshot.value = planningSlots')
    expect(rm).toContain('classCodes: activeYearClassCodes.value')
    expect(rm).toContain('planningSlotsSnapshot.value = await fetchPlanningSlotsPaginated')
    expect(rm).toContain('analyzePlanningDataQuality(scopedSlots')
  })

  it('refuses an unscoped fallback when academic_year_id is unavailable', () => {
    const service = readFileSync('src/service/dataQualityService.js', 'utf8')
    expect(service).toContain('Impossible de limiter le diagnostic à l’année active')
  })

  it('paginates beyond the Supabase 1000-row response cap', () => {
    const service = readFileSync('src/service/dataQualityService.js', 'utf8')
    expect(service).toContain('const maxPageSize = 1000')
    expect(service).toContain('.range(offset, offset + pageSize - 1)')
    expect(service).toContain('pagesFetched++')
  })

  it('uses case-insensitive B/BA/BAC aliases for historical class codes', () => {
    const service = readFileSync('src/service/dataQualityService.js', 'utf8')
    expect(service).toContain('expandPlanningClassCodeAliases(classCodes)')
    expect(service).toContain('class_code.ilike.${code}')
  })
})
