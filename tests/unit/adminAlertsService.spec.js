import { describe, expect, it } from 'vitest'
import { evaluateKpiAlert, toCsv } from '@/service/adminAlertsService'

describe('evaluateKpiAlert', () => {
  const kpi = { status: 'ok', value: 12, comparisonData: { percentChange: -40, absoluteChange: -8 } }

  it('évalue un seuil sur la valeur réelle', () => {
    expect(evaluateKpiAlert({ enabled: true, type: 'value', condition: 'above', threshold: 10 }, kpi)).toBe(true)
    expect(evaluateKpiAlert({ enabled: true, type: 'value', condition: 'below', threshold: 10 }, kpi)).toBe(false)
  })

  it('évalue une variation en pourcentage', () => {
    expect(evaluateKpiAlert({ enabled: true, type: 'percentage', condition: 'below', threshold: -30 }, kpi)).toBe(true)
  })

  it('ne conclut pas sans donnée comparable', () => {
    const noHistory = { status: 'ok', value: 12, comparisonData: { percentChange: null } }
    expect(evaluateKpiAlert({ enabled: true, type: 'percentage', condition: 'below', threshold: 0 }, noHistory)).toBeNull()
    expect(evaluateKpiAlert({ enabled: true, type: 'value', condition: 'above', threshold: 1 }, { status: 'error' })).toBeNull()
  })
})

describe('toCsv', () => {
  it('échappe les guillemets et neutralise les formules', () => {
    expect(toCsv(['A'], [['=1+1'], ['dit "oui"']])).toBe('"A"\r\n"\'=1+1"\r\n"dit ""oui"""')
  })
})
