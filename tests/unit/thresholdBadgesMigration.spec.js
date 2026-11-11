import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8')
const functionBody = (sql, signature) => {
  const start = sql.indexOf(signature)
  const bodyStart = sql.indexOf('as $$', start) + 5
  return sql.slice(bodyStart, sql.indexOf('$$;', bodyStart))
}

describe('badges à seuil — contrat de la migration', () => {
  const sql = read('supabase/migrations/20261111180000_unlock_threshold_badges_on_any_award.sql')
  const award = functionBody(sql, 'create or replace function public.gamification_award_xp_internal(')
  const unlock = functionBody(sql, 'create or replace function gamification_private.unlock_threshold_badges(')

  it('vérifie les badges dans la fonction par où passent tous les gains', () => {
    expect(award).toContain('gamification_private.unlock_threshold_badges(')
    expect(award).toContain('p_user_id, v_old_total, v_new_total, v_old_level, v_new_level')
    // Après l'écriture du total et du journal, jamais avant.
    expect(award.indexOf('unlock_threshold_badges(')).toBeGreaterThan(award.indexOf('set total_xp_after = v_new_total'))
  })

  it('ne récompense qu’un franchissement de seuil, jamais un total déjà atteint', () => {
    expect(unlock).toContain('coalesce(p_old_total, 0) < v_threshold')
    expect(unlock).toContain('coalesce(p_new_total, 0) >= v_threshold')
    expect(unlock).toContain('coalesce(p_old_level, 1) < v_threshold')
    expect(unlock).toContain('coalesce(p_new_level, 1) >= v_threshold')
    expect(unlock).toContain('b.is_active = true')
    expect(unlock).toContain('on conflict (user_id, badge_id) do nothing')
  })

  it('reste réservée au public de la gamification et fermée aux comptes', () => {
    expect(unlock).toContain('gamification_private.is_rollout_member(p_user_id)')
    expect(sql).toContain('revoke all on function gamification_private.unlock_threshold_badges(uuid, integer, integer, integer, integer)\n  from public, anon, authenticated')
    expect(sql).toContain('revoke all on function public.gamification_award_xp_internal(uuid, text, integer, text, text, uuid, text)\n  from public, anon, authenticated')
    // La fonction centrale garde sa forme : pas de « security definer », même chemin de recherche.
    const header = sql.slice(sql.indexOf('create or replace function public.gamification_award_xp_internal('), sql.indexOf(award))
    expect(header).not.toContain('security definer')
    expect(header).toContain('set search_path = pg_catalog, public')
  })

  it('n’annule jamais un gain à cause des badges', () => {
    expect(award).toMatch(/exception when others then\s+raise warning 'threshold badges skipped/)
  })

  it('conserve le comportement existant de la fonction centrale', () => {
    const original = functionBody(
      read('supabase/migrations/20260831144042_secure_gamification_action_engine.sql'),
      'create or replace function public.gamification_award_xp_internal('
    )
    for (const fragment of [
      "raise exception 'Invalid gamification award'",
      'on conflict (user_id, event_key) where event_key is not null do nothing',
      'house_points = coalesce(house_points, 0) + p_amount',
      'v_new_level := public.calculate_level_from_xp(v_new_total)',
      "'duplicate', true",
    ]) {
      expect(original).toContain(fragment)
      expect(award).toContain(fragment)
    }
  })
})
