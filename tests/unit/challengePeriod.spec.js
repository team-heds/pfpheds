import { describe, expect, it } from 'vitest'
import { challengePeriod, formatChallengePeriod, formatTimeLeft } from '@/utils/challengePeriod'

const launch = [
  { startDate: '2026-11-16', endDate: '2026-12-13T23:59:59.999' },
  { startDate: '2026-11-16', endDate: '2026-12-13' },
]

describe('challengePeriod', () => {
  it('couvre du premier début à la dernière fin, pas la semaine civile', () => {
    const period = challengePeriod(launch)
    expect(period.start.getDate()).toBe(16)
    expect(period.end.getMonth()).toBe(11)
    expect(period.end.getDate()).toBe(13)
    expect(formatChallengePeriod(period)).toBe('16 nov. – 13 déc.')
  })

  it('compte le temps restant jusqu’à la fin du dernier jour', () => {
    const period = challengePeriod(launch)
    expect(formatTimeLeft(period, new Date('2026-11-16T10:00:00'))).toBe('27j 13h')
    expect(formatTimeLeft(period, new Date('2026-12-13T20:30:00'))).toBe('3h')
    expect(formatTimeLeft(period, new Date('2026-12-14T08:00:00'))).toBe('Terminé')
  })

  it('reste neutre sans défi daté', () => {
    expect(challengePeriod([])).toBeNull()
    expect(formatChallengePeriod(null)).toBe('Aucune date limite')
    expect(formatTimeLeft(null)).toBe('—')
  })
})
