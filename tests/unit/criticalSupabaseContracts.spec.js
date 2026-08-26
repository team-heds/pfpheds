import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CRITICAL_SUPABASE_CONTRACTS,
  SUPABASE_SELECTS,
  getCriticalContractSelect
} from '@/service/supabaseContracts'

const readSource = (path) => readFileSync(join(process.cwd(), path), 'utf8')

describe('contrats Supabase critiques étudiants, dashboard et PFP', () => {
  it('respecte la casse validée du schéma places', () => {
    expect(CRITICAL_SUPABASE_CONTRACTS.places).toEqual(
      expect.arrayContaining(['PFP1A', 'PFP1B', 'fileurl', 'CreatedAt', 'UpdatedAt'])
    )
    expect(CRITICAL_SUPABASE_CONTRACTS.places).not.toEqual(
      expect.arrayContaining(['created_at', 'updated_at', 'fileURL'])
    )
  })

  it('expose un select en lecture seule pour chaque table critique', () => {
    for (const table of Object.keys(CRITICAL_SUPABASE_CONTRACTS)) {
      expect(getCriticalContractSelect(table)).toBe(CRITICAL_SUPABASE_CONTRACTS[table].join(','))
    }
  })

  it('déclare les colonnes exactes utilisées par les agrégats admin v1', () => {
    expect(CRITICAL_SUPABASE_CONTRACTS.dynamic_routes).toEqual(['id', 'is_active'])
    expect(CRITICAL_SUPABASE_CONTRACTS.permissions).toContain('slug')
    expect(CRITICAL_SUPABASE_CONTRACTS.challenges).toContain('is_active')
    expect(CRITICAL_SUPABASE_CONTRACTS.quests).toEqual(['completion_count'])
    expect(CRITICAL_SUPABASE_CONTRACTS.gamification_data).toContain('total_xp')
  })

  it('centralise les sélections des pages étudiants, dashboard et PFP', () => {
    const studentPage = readSource('src/views/admin/formation-pratique/EtudiantsViewPHYFP.vue')
    const dashboard = readSource('src/components/admin/AdminDashboardPFP.vue')
    const pfpService = readSource('src/service/pfpStatsService.js')

    expect(studentPage).toContain('.select(SUPABASE_SELECTS.studentPhysioCriteria)')
    expect(dashboard).toContain('.select(SUPABASE_SELECTS.dashboardPlaces)')
    expect(dashboard).toContain('.select(SUPABASE_SELECTS.dashboardVotes)')
    expect(pfpService).toContain('.select(SUPABASE_SELECTS.pfpStatsPlaces)')
    expect(SUPABASE_SELECTS.dashboardRecentPlaces).toBe('PlaceId,NomPlace,CreatedAt')
  })
})
