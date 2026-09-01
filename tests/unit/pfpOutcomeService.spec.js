import { describe, expect, it } from 'vitest'
import {
  PFP_OUTCOMES,
  buildPfpOutcomePayload,
  createPfpOutcomeDraft,
  getPfpOutcome,
  hasPfpOutcomeChanged,
  validatePfpOutcome
} from '@/service/pfpOutcomeService'

describe('pfpOutcomeService', () => {
  it.each([
    [{}, PFP_OUTCOMES.PENDING],
    [{ pfp_validee: true }, PFP_OUTCOMES.PASSED],
    [{ pfp_echec: true }, PFP_OUTCOMES.FAILED],
    [{ pfp_arret: true }, PFP_OUTCOMES.STOPPED]
  ])('normalise un résultat unique', (row, expected) => {
    expect(getPfpOutcome(row)).toBe(expected)
  })

  it('signale les données legacy contradictoires', () => {
    expect(getPfpOutcome({ pfp_validee: true, pfp_echec: true })).toBe(PFP_OUTCOMES.INVALID)
  })

  it('construit un payload exclusif', () => {
    expect(buildPfpOutcomePayload(PFP_OUTCOMES.FAILED, 'ignoré')).toEqual({
      pfp_validee: false,
      pfp_echec: true,
      pfp_arret: false,
      commentaire_arret: ''
    })
  })

  it('exige et normalise le motif d’un arrêt', () => {
    expect(validatePfpOutcome(PFP_OUTCOMES.STOPPED, '  ')).toEqual({
      valid: false,
      message: "Le motif de l'arrêt est obligatoire."
    })
    expect(buildPfpOutcomePayload(PFP_OUTCOMES.STOPPED, '  Accident  ')).toEqual({
      pfp_validee: false,
      pfp_echec: false,
      pfp_arret: true,
      commentaire_arret: 'Accident'
    })
  })

  it('refuse un état non supporté', () => {
    expect(() => buildPfpOutcomePayload('unknown')).toThrow('Résultat PFP invalide.')
  })

  it('crée un brouillon et détecte les changements utiles', () => {
    const row = { pfp_arret: true, commentaire_arret: 'Motif' }
    const draft = createPfpOutcomeDraft(row)
    expect(draft).toEqual({ outcome: PFP_OUTCOMES.STOPPED, comment: 'Motif' })
    expect(hasPfpOutcomeChanged(row, draft)).toBe(false)
    expect(hasPfpOutcomeChanged(row, { outcome: PFP_OUTCOMES.PASSED, comment: 'Motif' })).toBe(true)
  })
})
